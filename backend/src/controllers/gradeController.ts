import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * Phase 6: Gradebook & Progress Tracking Controller
 *
 * This controller aggregates grades from:
 * - Assignment Submissions (score, maxScore)
 * - Quiz Attempts (score, percentage, isPassed)
 */

// ============================================
// Get Student Grades (All Subjects)
// ============================================
export const getStudentGrades = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Authorization: Students can only view their own grades, Teachers/Admins can view any
    if (userRole === 'STUDENT' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own grades'
      });
    }

    // Get all enrolled subjects for the student
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        subject: {
          include: {
            teacher: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Get grades for each subject
    const gradesPromises = enrollments.map(async (enrollment) => {
      const subjectId = enrollment.subjectId;

      // Get assignment grades
      const submissions = await prisma.submission.findMany({
        where: {
          studentId,
          assignment: { subjectId },
          status: 'GRADED'
        },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              dueDate: true
            }
          }
        }
      });

      // Get quiz grades
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          studentId,
          quiz: { subjectId },
          status: 'GRADED'
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              passingScore: true
            }
          }
        }
      });

      // Calculate assignment average
      const assignmentScores = submissions.map(s => ({
        score: s.score || 0,
        maxScore: s.assignment.maxScore
      }));
      const assignmentAverage = assignmentScores.length > 0
        ? assignmentScores.reduce((sum, item) => sum + (item.score / item.maxScore) * 100, 0) / assignmentScores.length
        : null;

      // Calculate quiz average
      const quizScores = quizAttempts.map(a => ({
        score: a.score || 0,
        maxScore: a.quiz.maxScore,
        percentage: a.percentage || 0
      }));
      const quizAverage = quizScores.length > 0
        ? quizScores.reduce((sum, item) => sum + item.percentage, 0) / quizScores.length
        : null;

      // Calculate overall grade (weighted average: 60% assignments, 40% quizzes)
      let overallGrade = null;
      if (assignmentAverage !== null && quizAverage !== null) {
        overallGrade = (assignmentAverage * 0.6) + (quizAverage * 0.4);
      } else if (assignmentAverage !== null) {
        overallGrade = assignmentAverage;
      } else if (quizAverage !== null) {
        overallGrade = quizAverage;
      }

      return {
        subject: {
          id: enrollment.subject.id,
          name: enrollment.subject.name,
          teacher: enrollment.subject.teacher.name,
          class: enrollment.subject.class.name
        },
        assignments: {
          count: submissions.length,
          average: assignmentAverage ? Math.round(assignmentAverage * 10) / 10 : null,
          details: submissions.map(s => ({
            id: s.id,
            title: s.assignment.title,
            score: s.score,
            maxScore: s.assignment.maxScore,
            percentage: Math.round((s.score! / s.assignment.maxScore) * 100 * 10) / 10,
            submittedAt: s.submittedAt,
            gradedAt: s.gradedAt,
            feedback: s.feedback
          }))
        },
        quizzes: {
          count: quizAttempts.length,
          average: quizAverage ? Math.round(quizAverage * 10) / 10 : null,
          passed: quizAttempts.filter(a => a.isPassed).length,
          details: quizAttempts.map(a => ({
            id: a.id,
            title: a.quiz.title,
            score: a.score,
            maxScore: a.quiz.maxScore,
            percentage: Math.round(a.percentage! * 10) / 10,
            isPassed: a.isPassed,
            submittedAt: a.submittedAt,
            timeSpent: a.timeSpent
          }))
        },
        overallGrade: overallGrade ? Math.round(overallGrade * 10) / 10 : null,
        letterGrade: overallGrade ? getLetterGrade(overallGrade) : null
      };
    });

    const grades = await Promise.all(gradesPromises);

    // Calculate overall statistics
    const allGrades = grades.map(g => g.overallGrade).filter(g => g !== null) as number[];
    const overallAverage = allGrades.length > 0
      ? Math.round(allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length * 10) / 10
      : null;

    res.json({
      success: true,
      data: {
        student: {
          id: studentId,
          // You can add student name/email here if needed
        },
        subjects: grades,
        statistics: {
          totalSubjects: enrollments.length,
          overallAverage,
          letterGrade: overallAverage ? getLetterGrade(overallAverage) : null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student grades'
    });
  }
};

// ============================================
// Get Subject Gradebook (Teacher View)
// ============================================
export const getSubjectGradebook = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Get subject to verify teacher ownership
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        class: { select: { name: true } },
        teacher: { select: { name: true } }
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Authorization: Teachers can only view their own subject gradebook
    if (userRole === 'TEACHER' && subject.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view gradebook for your own subjects'
      });
    }

    // Get all enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { subjectId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        student: { name: 'asc' }
      }
    });

    // Get assignments and quizzes for this subject
    const assignments = await prisma.assignment.findMany({
      where: { subjectId, status: { not: 'DRAFT' } },
      select: { id: true, title: true, maxScore: true },
      orderBy: { createdAt: 'asc' }
    });

    const quizzes = await prisma.quiz.findMany({
      where: { subjectId, status: { not: 'DRAFT' } },
      select: { id: true, title: true, maxScore: true, passingScore: true },
      orderBy: { createdAt: 'asc' }
    });

    // Get grades for each student
    const gradebookPromises = enrollments.map(async (enrollment) => {
      const studentId = enrollment.studentId;

      // Get assignment submissions
      const submissions = await prisma.submission.findMany({
        where: {
          studentId,
          assignment: { subjectId }
        },
        include: {
          assignment: {
            select: { id: true, maxScore: true }
          }
        }
      });

      // Get quiz attempts
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          studentId,
          quiz: { subjectId }
        },
        include: {
          quiz: {
            select: { id: true, maxScore: true }
          }
        }
      });

      // Map assignment grades
      const assignmentGrades = assignments.map(assignment => {
        const submission = submissions.find(s => s.assignment.id === assignment.id);
        return {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          score: submission?.score || null,
          maxScore: assignment.maxScore,
          status: submission?.status || 'PENDING',
          percentage: submission?.score
            ? Math.round((submission.score / assignment.maxScore) * 100 * 10) / 10
            : null
        };
      });

      // Map quiz grades
      const quizGrades = quizzes.map(quiz => {
        const attempt = quizAttempts.find(a => a.quiz.id === quiz.id);
        return {
          quizId: quiz.id,
          quizTitle: quiz.title,
          score: attempt?.score || null,
          maxScore: quiz.maxScore,
          percentage: attempt?.percentage
            ? Math.round(attempt.percentage * 10) / 10
            : null,
          status: attempt?.status || 'NOT_TAKEN',
          isPassed: attempt?.isPassed || null
        };
      });

      // Calculate averages
      const gradedAssignments = assignmentGrades.filter(a => a.score !== null);
      const assignmentAverage = gradedAssignments.length > 0
        ? gradedAssignments.reduce((sum, a) => sum + a.percentage!, 0) / gradedAssignments.length
        : null;

      const completedQuizzes = quizGrades.filter(q => q.percentage !== null);
      const quizAverage = completedQuizzes.length > 0
        ? completedQuizzes.reduce((sum, q) => sum + q.percentage!, 0) / completedQuizzes.length
        : null;

      // Calculate overall grade (60% assignments, 40% quizzes)
      let overallGrade = null;
      if (assignmentAverage !== null && quizAverage !== null) {
        overallGrade = (assignmentAverage * 0.6) + (quizAverage * 0.4);
      } else if (assignmentAverage !== null) {
        overallGrade = assignmentAverage;
      } else if (quizAverage !== null) {
        overallGrade = quizAverage;
      }

      return {
        student: enrollment.student,
        assignments: assignmentGrades,
        quizzes: quizGrades,
        averages: {
          assignments: assignmentAverage ? Math.round(assignmentAverage * 10) / 10 : null,
          quizzes: quizAverage ? Math.round(quizAverage * 10) / 10 : null,
          overall: overallGrade ? Math.round(overallGrade * 10) / 10 : null,
          letterGrade: overallGrade ? getLetterGrade(overallGrade) : null
        }
      };
    });

    const gradebook = await Promise.all(gradebookPromises);

    res.json({
      success: true,
      data: {
        subject: {
          id: subject.id,
          name: subject.name,
          class: subject.class.name,
          teacher: subject.teacher.name
        },
        assignments,
        quizzes,
        students: gradebook
      }
    });
  } catch (error) {
    console.error('Error fetching subject gradebook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject gradebook'
    });
  }
};

// ============================================
// Get Student Progress (Over Time)
// ============================================
export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Authorization
    if (userRole === 'STUDENT' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own progress'
      });
    }

    // Get all submissions sorted by date
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        status: 'GRADED',
        gradedAt: { not: null }
      },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true,
            subject: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { gradedAt: 'asc' }
    });

    // Get all quiz attempts sorted by date
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        studentId,
        status: 'GRADED',
        submittedAt: { not: null }
      },
      include: {
        quiz: {
          select: {
            title: true,
            maxScore: true,
            subject: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    });

    // Combine and format timeline
    const timeline = [
      ...submissions.map(s => ({
        type: 'assignment' as const,
        date: s.gradedAt!,
        title: s.assignment.title,
        subject: s.assignment.subject.name,
        subjectId: s.assignment.subject.id,
        score: s.score!,
        maxScore: s.assignment.maxScore,
        percentage: Math.round((s.score! / s.assignment.maxScore) * 100 * 10) / 10
      })),
      ...quizAttempts.map(a => ({
        type: 'quiz' as const,
        date: a.submittedAt!,
        title: a.quiz.title,
        subject: a.quiz.subject.name,
        subjectId: a.quiz.subject.id,
        score: a.score!,
        maxScore: a.quiz.maxScore,
        percentage: Math.round(a.percentage! * 10) / 10,
        isPassed: a.isPassed
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate progress statistics
    const statistics = {
      totalAssignments: submissions.length,
      totalQuizzes: quizAttempts.length,
      assignmentAverage: submissions.length > 0
        ? Math.round(submissions.reduce((sum, s) =>
            sum + (s.score! / s.assignment.maxScore) * 100, 0
          ) / submissions.length * 10) / 10
        : null,
      quizAverage: quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, a) =>
            sum + a.percentage!, 0
          ) / quizAttempts.length * 10) / 10
        : null,
      quizzesPassed: quizAttempts.filter(a => a.isPassed).length,
      quizzesFailed: quizAttempts.filter(a => !a.isPassed).length
    };

    res.json({
      success: true,
      data: {
        timeline,
        statistics
      }
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress'
    });
  }
};

// ============================================
// Export Gradebook to CSV
// ============================================
export const exportGradebookCSV = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Get subject to verify teacher ownership
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        class: { select: { name: true } },
        teacher: { select: { name: true } }
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Authorization
    if (userRole === 'TEACHER' && subject.teacherId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only export your own subject gradebook'
      });
    }

    // Get gradebook data (reuse logic from getSubjectGradebook)
    const enrollments = await prisma.enrollment.findMany({
      where: { subjectId },
      include: {
        student: {
          select: { name: true, email: true }
        }
      },
      orderBy: { student: { name: 'asc' } }
    });

    const assignments = await prisma.assignment.findMany({
      where: { subjectId, status: { not: 'DRAFT' } },
      select: { id: true, title: true, maxScore: true },
      orderBy: { createdAt: 'asc' }
    });

    const quizzes = await prisma.quiz.findMany({
      where: { subjectId, status: { not: 'DRAFT' } },
      select: { id: true, title: true, maxScore: true },
      orderBy: { createdAt: 'asc' }
    });

    // Build CSV header
    const headers = [
      'Student Name',
      'Email',
      ...assignments.map(a => `Assignment: ${a.title}`),
      ...quizzes.map(q => `Quiz: ${q.title}`),
      'Assignment Average',
      'Quiz Average',
      'Overall Grade',
      'Letter Grade'
    ];

    // Build CSV rows
    const rows = await Promise.all(
      enrollments.map(async (enrollment) => {
        const studentId = enrollment.student.id as any; // Type assertion needed

        // Get submissions
        const submissions = await prisma.submission.findMany({
          where: { studentId, assignment: { subjectId } },
          include: { assignment: { select: { id: true, maxScore: true } } }
        });

        // Get quiz attempts
        const quizAttempts = await prisma.quizAttempt.findMany({
          where: { studentId, quiz: { subjectId } },
          include: { quiz: { select: { id: true } } }
        });

        // Map scores
        const assignmentScores = assignments.map(assignment => {
          const submission = submissions.find(s => s.assignment.id === assignment.id);
          return submission?.score !== undefined && submission?.score !== null
            ? `${submission.score}/${assignment.maxScore}`
            : 'N/A';
        });

        const quizScores = quizzes.map(quiz => {
          const attempt = quizAttempts.find(a => a.quiz.id === quiz.id);
          return attempt?.score !== undefined && attempt?.score !== null
            ? `${attempt.score}/${quiz.maxScore}`
            : 'N/A';
        });

        // Calculate averages
        const gradedSubmissions = submissions.filter(s => s.score !== null);
        const assignmentAvg = gradedSubmissions.length > 0
          ? Math.round(gradedSubmissions.reduce((sum, s) =>
              sum + (s.score! / s.assignment.maxScore) * 100, 0
            ) / gradedSubmissions.length * 10) / 10
          : null;

        const completedQuizzes = quizAttempts.filter(a => a.percentage !== null);
        const quizAvg = completedQuizzes.length > 0
          ? Math.round(completedQuizzes.reduce((sum, a) =>
              sum + a.percentage!, 0
            ) / completedQuizzes.length * 10) / 10
          : null;

        let overall = null;
        if (assignmentAvg !== null && quizAvg !== null) {
          overall = (assignmentAvg * 0.6) + (quizAvg * 0.4);
        } else if (assignmentAvg !== null) {
          overall = assignmentAvg;
        } else if (quizAvg !== null) {
          overall = quizAvg;
        }

        return [
          enrollment.student.name,
          enrollment.student.email,
          ...assignmentScores,
          ...quizScores,
          assignmentAvg !== null ? assignmentAvg.toString() : 'N/A',
          quizAvg !== null ? quizAvg.toString() : 'N/A',
          overall !== null ? Math.round(overall * 10) / 10 : 'N/A',
          overall !== null ? getLetterGrade(overall) : 'N/A'
        ];
      })
    );

    // Generate CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Set headers for CSV download
    const filename = `${subject.name.replace(/\s+/g, '_')}_Gradebook_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting gradebook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export gradebook'
    });
  }
};

// ============================================
// Helper Functions
// ============================================
function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}
