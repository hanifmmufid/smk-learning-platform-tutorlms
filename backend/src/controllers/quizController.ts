import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import {
  createQuizSchema,
  updateQuizSchema,
  createQuestionSchema,
  updateQuestionSchema,
} from '../validations/quiz';
import { z } from 'zod';

/**
 * Get all quizzes with optional filters
 * Query params: subjectId, teacherId, status
 */
export const getAllQuizzes = async (req: Request, res: Response) => {
  try {
    const { subjectId, teacherId, status } = req.query;

    const quizzes = await prisma.quiz.findMany({
      where: {
        ...(subjectId && { subjectId: subjectId as string }),
        ...(teacherId && { teacherId: teacherId as string }),
        ...(status && { status: status as any }),
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
        questions: {
          orderBy: {
            order: 'asc',
          },
          select: {
            id: true,
            type: true,
            points: true,
            order: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total points for each quiz
    const quizzesWithStats = quizzes.map((quiz) => ({
      ...quiz,
      totalQuestions: quiz.questions.length,
      totalAttempts: quiz._count.attempts,
      calculatedMaxScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
    }));

    res.json(quizzesWithStats);
  } catch (error) {
    console.error('Get all quizzes error:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
};

/**
 * Get single quiz by ID with all questions
 * Students only see published quizzes
 */
export const getQuizById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const quiz = await prisma.quiz.findUnique({
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
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Students can only view published quizzes
    if (user.role === 'STUDENT' && quiz.status !== 'PUBLISHED') {
      return res.status(403).json({ message: 'Quiz is not available yet' });
    }

    // Check if quiz is within available dates
    const now = new Date();
    if (user.role === 'STUDENT') {
      if (quiz.startDate && now < new Date(quiz.startDate)) {
        return res.status(403).json({ message: 'Quiz has not started yet' });
      }
      if (quiz.endDate && now > new Date(quiz.endDate)) {
        return res.status(403).json({ message: 'Quiz has ended' });
      }
    }

    // For students, hide correct answers
    if (user.role === 'STUDENT') {
      const questionsWithoutAnswers = quiz.questions.map((q) => {
        if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
          const options = q.options as any[];
          return {
            ...q,
            options: options?.map(({ id, text }) => ({ id, text })), // Remove isCorrect
          };
        }
        return q;
      });

      return res.json({
        ...quiz,
        questions: questionsWithoutAnswers,
        totalQuestions: quiz.questions.length,
        totalAttempts: quiz._count.attempts,
        calculatedMaxScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
      });
    }

    // Teachers see everything
    res.json({
      ...quiz,
      totalQuestions: quiz.questions.length,
      totalAttempts: quiz._count.attempts,
      calculatedMaxScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
    });
  } catch (error) {
    console.error('Get quiz by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
};

/**
 * Create new quiz (Teachers only)
 */
export const createQuiz = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Validate request body
    const validatedData = createQuizSchema.parse(req.body);

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Verify teacher teaches this subject (unless admin)
    if (user.role === 'TEACHER' && subject.teacherId !== user.userId) {
      return res.status(403).json({ message: 'You can only create quizzes for subjects you teach' });
    }

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        ...validatedData,
        teacherId: user.userId,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
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

    res.status(201).json(quiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Failed to create quiz' });
  }
};

/**
 * Update quiz (Teachers only - must be creator)
 */
export const updateQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Validate request body
    const validatedData = updateQuizSchema.parse(req.body);

    // Find quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check authorization (only creator can update, unless admin)
    if (user.role === 'TEACHER' && quiz.teacherId !== user.userId) {
      return res.status(403).json({ message: 'You can only update your own quizzes' });
    }

    // If updating subjectId, verify the new subject exists
    if (validatedData.subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: validatedData.subjectId },
      });

      if (!subject) {
        return res.status(404).json({ message: 'Subject not found' });
      }

      // Verify teacher teaches the new subject
      if (user.role === 'TEACHER' && subject.teacherId !== user.userId) {
        return res.status(403).json({ message: 'You can only assign quizzes to subjects you teach' });
      }
    }

    // Update quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
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
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    res.json(updatedQuiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Failed to update quiz' });
  }
};

/**
 * Delete quiz (Teachers only - must be creator)
 */
export const deleteQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Find quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check authorization
    if (user.role === 'TEACHER' && quiz.teacherId !== user.userId) {
      return res.status(403).json({ message: 'You can only delete your own quizzes' });
    }

    // Warn if quiz has attempts
    if (quiz._count.attempts > 0) {
      return res.status(400).json({
        message: `Cannot delete quiz with ${quiz._count.attempts} student attempts. Please archive it instead.`,
      });
    }

    // Delete quiz (cascade will delete questions and attempts)
    await prisma.quiz.delete({
      where: { id },
    });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Failed to delete quiz' });
  }
};

/**
 * Add question to quiz (Teachers only)
 */
export const addQuestion = async (req: Request, res: Response) => {
  try {
    const { id: quizId } = req.params;
    const user = (req as any).user;

    // Validate request body
    const validatedData = createQuestionSchema.parse(req.body);

    // Find quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check authorization
    if (user.role === 'TEACHER' && quiz.teacherId !== user.userId) {
      return res.status(403).json({ message: 'You can only add questions to your own quizzes' });
    }

    // Validate question type specific data
    if (validatedData.type === 'MCQ' || validatedData.type === 'TRUE_FALSE') {
      if (!validatedData.options || validatedData.options.length === 0) {
        return res.status(400).json({ message: 'MCQ and True/False questions must have options' });
      }

      // Check if at least one option is correct
      const hasCorrectAnswer = validatedData.options.some((opt) => opt.isCorrect);
      if (!hasCorrectAnswer) {
        return res.status(400).json({ message: 'At least one option must be marked as correct' });
      }

      // For TRUE_FALSE, ensure exactly 2 options
      if (validatedData.type === 'TRUE_FALSE' && validatedData.options.length !== 2) {
        return res.status(400).json({ message: 'True/False questions must have exactly 2 options' });
      }
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        quizId,
        type: validatedData.type,
        question: validatedData.question,
        points: validatedData.points,
        order: validatedData.order,
        explanation: validatedData.explanation,
        options: validatedData.options || null,
        maxWords: validatedData.maxWords,
      },
    });

    res.status(201).json(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Add question error:', error);
    res.status(500).json({ message: 'Failed to add question' });
  }
};

/**
 * Update question (Teachers only)
 */
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Validate request body
    const validatedData = updateQuestionSchema.parse(req.body);

    // Find question with quiz
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: true,
      },
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check authorization
    if (user.role === 'TEACHER' && question.quiz.teacherId !== user.userId) {
      return res.status(403).json({ message: 'You can only update questions in your own quizzes' });
    }

    // Update question
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: validatedData,
    });

    res.json(updatedQuestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Failed to update question' });
  }
};

/**
 * Delete question (Teachers only)
 */
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Find question with quiz
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            _count: {
              select: {
                attempts: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check authorization
    if (user.role === 'TEACHER' && question.quiz.teacherId !== user.userId) {
      return res.status(403).json({ message: 'You can only delete questions from your own quizzes' });
    }

    // Warn if quiz has attempts
    if (question.quiz._count.attempts > 0) {
      return res.status(400).json({
        message: 'Cannot delete question from a quiz that has student attempts',
      });
    }

    // Delete question
    await prisma.question.delete({
      where: { id },
    });

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
};
