import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../utils/prisma';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from '../validations/assignment';
import { AssignmentStatus } from '@prisma/client';

/**
 * GET /api/assignments
 * Get all assignments (with optional subject filter)
 */
export const getAllAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const where: any = {};

    // Filter by subject if provided
    if (subjectId) {
      where.subjectId = subjectId as string;
    }

    // Students only see PUBLISHED assignments from their enrolled subjects
    if (userRole === 'STUDENT') {
      where.status = AssignmentStatus.PUBLISHED;

      // Get student's enrolled subject IDs
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { subjectId: true },
      });
      const enrolledSubjectIds = enrollments.map((e) => e.subjectId);

      if (!subjectId) {
        where.subjectId = { in: enrolledSubjectIds };
      } else if (!enrolledSubjectIds.includes(subjectId as string)) {
        // Student trying to access assignment from non-enrolled subject
        return res.json({ success: true, data: [] });
      }
    }

    // Teachers only see their own assignments
    if (userRole === 'TEACHER') {
      where.teacherId = userId;
    }

    const assignments = await prisma.assignment.findMany({
      where,
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
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    return res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error('❌ Get assignments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch assignments',
    });
  }
};

/**
 * GET /api/assignments/:id
 * Get single assignment by ID
 */
export const getAssignmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
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
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    // Authorization: Students can only view PUBLISHED assignments from enrolled subjects
    if (userRole === 'STUDENT') {
      if (assignment.status !== AssignmentStatus.PUBLISHED) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view this assignment',
        });
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: userId,
          subjectId: assignment.subjectId,
        },
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view this assignment',
        });
      }
    }

    // Authorization: Teachers can only view their own assignments
    if (userRole === 'TEACHER' && assignment.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this assignment',
      });
    }

    return res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('❌ Get assignment by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch assignment',
    });
  }
};

/**
 * POST /api/assignments
 * Create new assignment (Teachers only)
 */
export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;

    // Validate input
    const validationResult = createAssignmentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const data: CreateAssignmentInput = validationResult.data;

    // Verify teacher teaches this subject
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found',
      });
    }

    if (subject.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only create assignments for subjects you teach',
      });
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        ...data,
        teacherId: userId,
        dueDate: new Date(data.dueDate),
      },
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
    });

    console.log(`✅ Assignment created: ${assignment.title} for subject ${subject.name}`);

    return res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully',
    });
  } catch (error) {
    console.error('❌ Create assignment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create assignment',
    });
  }
};

/**
 * PUT /api/assignments/:id
 * Update assignment (Teachers only - must be creator)
 */
export const updateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId!;

    // Validate input
    const validationResult = updateAssignmentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const data: UpdateAssignmentInput = validationResult.data;

    // Check if assignment exists and user is the creator
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    if (existingAssignment.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own assignments',
      });
    }

    // Update assignment
    const updateData: any = { ...data };
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
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
    });

    console.log(`✅ Assignment updated: ${assignment.title}`);

    return res.json({
      success: true,
      data: assignment,
      message: 'Assignment updated successfully',
    });
  } catch (error) {
    console.error('❌ Update assignment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update assignment',
    });
  }
};

/**
 * DELETE /api/assignments/:id
 * Delete assignment (Teachers only - must be creator)
 */
export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId!;

    // Check if assignment exists and user is the creator
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        submissions: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    if (assignment.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own assignments',
      });
    }

    // Delete assignment (will cascade delete submissions)
    await prisma.assignment.delete({
      where: { id },
    });

    console.log(`✅ Assignment deleted: ${assignment.title} (${assignment.submissions.length} submissions removed)`);

    return res.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete assignment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete assignment',
    });
  }
};
