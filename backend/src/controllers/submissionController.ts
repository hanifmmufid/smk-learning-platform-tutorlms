import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../utils/prisma';
import {
  submitAssignmentSchema,
  gradeSubmissionSchema,
  GradeSubmissionInput,
} from '../validations/submission';
import { SubmissionStatus, AssignmentStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/submissions
 * Get all submissions (with optional filters)
 */
export const getAllSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId, studentId, status } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const where: any = {};

    if (assignmentId) {
      where.assignmentId = assignmentId as string;
    }

    if (studentId) {
      where.studentId = studentId as string;
    }

    if (status) {
      where.status = status as SubmissionStatus;
    }

    // Students can only see their own submissions
    if (userRole === 'STUDENT') {
      where.studentId = userId;
    }

    // Teachers can only see submissions from their assignments
    if (userRole === 'TEACHER') {
      const teacherAssignments = await prisma.assignment.findMany({
        where: { teacherId: userId },
        select: { id: true },
      });
      const assignmentIds = teacherAssignments.map((a) => a.id);

      if (assignmentId && !assignmentIds.includes(assignmentId as string)) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view these submissions',
        });
      }

      if (!assignmentId) {
        where.assignmentId = { in: assignmentIds };
      }
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        assignment: {
          include: {
            subject: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        grader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error('❌ Get submissions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
    });
  }
};

/**
 * GET /api/submissions/:id
 * Get single submission by ID
 */
export const getSubmissionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            subject: {
              include: {
                class: true,
              },
            },
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        grader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    // Authorization check
    if (userRole === 'STUDENT' && submission.studentId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this submission',
      });
    }

    if (userRole === 'TEACHER' && submission.assignment.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this submission',
      });
    }

    return res.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('❌ Get submission by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submission',
    });
  }
};

/**
 * POST /api/assignments/:assignmentId/submit
 * Submit an assignment (Students only)
 */
export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user?.userId!;

    // Validate input
    const validationResult = submitAssignmentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const { content } = validationResult.data;

    // Check if assignment exists and is published
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { subject: true },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    if (assignment.status !== AssignmentStatus.PUBLISHED) {
      return res.status(400).json({
        success: false,
        error: 'Assignment is not published yet',
      });
    }

    // Check if student is enrolled in the subject
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: userId,
        subjectId: assignment.subjectId,
      },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'You are not enrolled in this subject',
      });
    }

    // Check if already submitted
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: userId,
        },
      },
    });

    if (existingSubmission && existingSubmission.submittedAt) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted this assignment',
      });
    }

    // Check if past due date
    const now = new Date();
    const isLate = now > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        error: 'Assignment deadline has passed and late submissions are not allowed',
      });
    }

    // Get file upload (if any)
    const file = (req as any).file;
    const attachmentUrl = file ? `/uploads/submissions/${file.filename}` : null;

    // Determine status
    const status = isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED;

    // Create or update submission
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: userId,
        },
      },
      create: {
        assignmentId,
        studentId: userId,
        content,
        attachmentUrl,
        submittedAt: now,
        status,
      },
      update: {
        content,
        attachmentUrl,
        submittedAt: now,
        status,
      },
      include: {
        assignment: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ Assignment submitted: ${assignment.title} by ${submission.student.name} (${status})`);

    return res.status(201).json({
      success: true,
      data: submission,
      message: isLate ? 'Assignment submitted late' : 'Assignment submitted successfully',
    });
  } catch (error) {
    console.error('❌ Submit assignment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit assignment',
    });
  }
};

/**
 * PUT /api/submissions/:id/grade
 * Grade a submission (Teachers only)
 */
export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId!;

    // Validate input
    const validationResult = gradeSubmissionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const { score, feedback }: GradeSubmissionInput = validationResult.data;

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            subject: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    // Check if teacher owns this assignment
    if (submission.assignment.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only grade submissions for your own assignments',
      });
    }

    // Validate score is within range
    if (score > submission.assignment.maxScore) {
      return res.status(400).json({
        success: false,
        error: `Score cannot exceed maximum score of ${submission.assignment.maxScore}`,
      });
    }

    // Update submission with grade
    const gradedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        score,
        feedback,
        status: SubmissionStatus.GRADED,
        gradedAt: new Date(),
        gradedBy: userId,
      },
      include: {
        assignment: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        grader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ Submission graded: ${submission.assignment.title} - ${submission.student.name} (Score: ${score}/${submission.assignment.maxScore})`);

    return res.json({
      success: true,
      data: gradedSubmission,
      message: 'Submission graded successfully',
    });
  } catch (error) {
    console.error('❌ Grade submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to grade submission',
    });
  }
};

/**
 * DELETE /api/submissions/:id
 * Delete a submission (Students can delete their own ungraded submissions)
 */
export const deleteSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId!;
    const userRole = req.user?.role;

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    // Students can only delete their own ungraded submissions
    if (userRole === 'STUDENT') {
      if (submission.studentId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own submissions',
        });
      }

      if (submission.status === SubmissionStatus.GRADED) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete graded submissions',
        });
      }
    }

    // Delete uploaded file if exists
    if (submission.attachmentUrl) {
      const filePath = path.join(__dirname, '../../', submission.attachmentUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete submission
    await prisma.submission.delete({
      where: { id },
    });

    console.log(`✅ Submission deleted: ${id}`);

    return res.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete submission',
    });
  }
};
