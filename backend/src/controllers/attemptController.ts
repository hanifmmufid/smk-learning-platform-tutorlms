import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import {
  submitQuizAttemptSchema,
  gradeEssayAnswerSchema,
} from '../validations/quiz';
import { z } from 'zod';

/**
 * Start a quiz attempt (Students only)
 * Creates a new quiz attempt record and returns the quiz with questions
 */
export const startQuizAttempt = async (req: Request, res: Response) => {
  try {
    const { id: quizId } = req.params;
    const user = (req as any).user;

    // Find quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        subject: true,
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if quiz is published
    if (quiz.status !== 'PUBLISHED') {
      return res.status(403).json({ message: 'Quiz is not available yet' });
    }

    // Check if quiz is within available dates
    const now = new Date();
    if (quiz.startDate && now < new Date(quiz.startDate)) {
      return res.status(403).json({ message: 'Quiz has not started yet' });
    }
    if (quiz.endDate && now > new Date(quiz.endDate)) {
      return res.status(403).json({ message: 'Quiz has ended' });
    }

    // Check if student is enrolled in the subject
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.userId,
        subjectId: quiz.subjectId,
      },
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this subject' });
    }

    // Check if student already has an attempt
    const existingAttempt = await prisma.quizAttempt.findUnique({
      where: {
        quizId_studentId: {
          quizId,
          studentId: user.userId,
        },
      },
    });

    if (existingAttempt) {
      // If attempt is IN_PROGRESS, return it (allow resume)
      if (existingAttempt.status === 'IN_PROGRESS') {
        const questions = quiz.questions.map((q) => {
          if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
            const options = q.options as any[];
            return {
              ...q,
              options: options?.map(({ id, text }) => ({ id, text })),
            };
          }
          return q;
        });

        return res.json({
          attempt: existingAttempt,
          quiz: {
            ...quiz,
            questions: quiz.shuffleQuestions ? shuffleArray(questions) : questions,
          },
        });
      }

      // If already submitted/graded, don't allow retake
      return res.status(400).json({
        message: 'You have already completed this quiz',
        attemptId: existingAttempt.id,
      });
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: user.userId,
        status: 'IN_PROGRESS',
      },
    });

    // Prepare questions (hide correct answers, apply shuffle)
    let questions = quiz.questions.map((q) => {
      if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
        const options = q.options as any[];
        const shuffledOptions = quiz.shuffleAnswers ? shuffleArray(options) : options;
        return {
          ...q,
          options: shuffledOptions?.map(({ id, text }) => ({ id, text })),
        };
      }
      return q;
    });

    // Shuffle questions if enabled
    if (quiz.shuffleQuestions) {
      questions = shuffleArray(questions);
    }

    res.status(201).json({
      attempt,
      quiz: {
        ...quiz,
        questions,
      },
    });
  } catch (error) {
    console.error('Start quiz attempt error:', error);
    res.status(500).json({ message: 'Failed to start quiz attempt' });
  }
};

/**
 * Submit quiz attempt (Students only)
 * Auto-grades MCQ and True/False questions
 * Marks essay questions for manual grading
 */
export const submitQuizAttempt = async (req: Request, res: Response) => {
  try {
    const { id: attemptId } = req.params;
    const user = (req as any).user;

    // Validate request body
    const validatedData = submitQuizAttemptSchema.parse(req.body);

    // Find attempt
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    // Check authorization
    if (attempt.studentId !== user.userId) {
      return res.status(403).json({ message: 'You can only submit your own attempts' });
    }

    // Check if already submitted
    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'Quiz attempt already submitted' });
    }

    // Validate time limit (if enabled)
    if (attempt.quiz.timeLimit) {
      const timeElapsed = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000); // seconds
      const timeLimitSeconds = attempt.quiz.timeLimit * 60;

      if (timeElapsed > timeLimitSeconds + 60) {
        // 1 minute grace period
        return res.status(400).json({ message: 'Time limit exceeded' });
      }
    }

    // Process each answer and calculate score
    let totalScore = 0;
    let hasEssayQuestions = false;
    const answersToCreate = [];

    for (const answerData of validatedData.answers) {
      const question = attempt.quiz.questions.find((q) => q.id === answerData.questionId);

      if (!question) {
        return res.status(400).json({ message: `Invalid question ID: ${answerData.questionId}` });
      }

      let isCorrect: boolean | null = null;
      let pointsAwarded = 0;

      // Auto-grade MCQ and True/False
      if (question.type === 'MCQ' || question.type === 'TRUE_FALSE') {
        const options = question.options as any[];
        const selectedOption = (answerData.answer as any).selectedOption;
        const correctOption = options.find((opt) => opt.isCorrect);

        isCorrect = selectedOption === correctOption?.id;
        pointsAwarded = isCorrect ? question.points : 0;
        totalScore += pointsAwarded;
      } else if (question.type === 'ESSAY') {
        // Essay questions require manual grading
        isCorrect = null;
        pointsAwarded = 0;
        hasEssayQuestions = true;
      }

      answersToCreate.push({
        attemptId: attempt.id,
        questionId: question.id,
        answer: answerData.answer,
        isCorrect,
        pointsAwarded,
      });
    }

    // Create all answers
    await prisma.answer.createMany({
      data: answersToCreate,
    });

    // Calculate percentage and pass status
    const maxScore = attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = percentage >= attempt.quiz.passingScore;

    // Update attempt status
    const status = hasEssayQuestions ? 'SUBMITTED' : 'GRADED';
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        score: totalScore,
        percentage,
        isPassed: hasEssayQuestions ? null : isPassed, // Only set if fully graded
        status,
        timeSpent: validatedData.timeSpent,
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    res.json({
      message: hasEssayQuestions
        ? 'Quiz submitted successfully. Waiting for essay grading.'
        : 'Quiz submitted and graded successfully',
      attempt: updatedAttempt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Submit quiz attempt error:', error);
    res.status(500).json({ message: 'Failed to submit quiz attempt' });
  }
};

/**
 * Get attempt results (Students see their own, Teachers see all for their quizzes)
 */
export const getAttemptResults = async (req: Request, res: Response) => {
  try {
    const { id: attemptId } = req.params;
    const user = (req as any).user;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
            questions: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    // Authorization check
    const isStudent = user.role === 'STUDENT' && attempt.studentId === user.userId;
    const isTeacher = user.role === 'TEACHER' && attempt.quiz.teacherId === user.userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isStudent && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Students can only see results if showResults is enabled or quiz is fully graded
    if (user.role === 'STUDENT' && !attempt.quiz.showResults && attempt.status !== 'GRADED') {
      return res.status(403).json({ message: 'Results are not available yet' });
    }

    res.json(attempt);
  } catch (error) {
    console.error('Get attempt results error:', error);
    res.status(500).json({ message: 'Failed to fetch attempt results' });
  }
};

/**
 * Get all attempts for a quiz (Teachers only)
 */
export const getQuizAttempts = async (req: Request, res: Response) => {
  try {
    const { id: quizId } = req.params;
    const user = (req as any).user;

    // Find quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check authorization
    if (user.role === 'TEACHER' && quiz.teacherId !== user.userId) {
      return res.status(403).json({ message: 'You can only view attempts for your own quizzes' });
    }

    // Get all attempts
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    res.json(attempts);
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({ message: 'Failed to fetch quiz attempts' });
  }
};

/**
 * Grade essay answer (Teachers only)
 */
export const gradeEssayAnswer = async (req: Request, res: Response) => {
  try {
    const { id: answerId } = req.params;
    const user = (req as any).user;

    // Validate request body
    const validatedData = gradeEssayAnswerSchema.parse(req.body);

    // Find answer
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        attempt: {
          include: {
            quiz: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check authorization
    if (user.role === 'TEACHER' && answer.attempt.quiz.teacherId !== user.userId) {
      return res.status(403).json({ message: 'You can only grade answers for your own quizzes' });
    }

    // Validate points awarded
    if (validatedData.pointsAwarded > answer.question.points) {
      return res.status(400).json({
        message: `Points awarded cannot exceed maximum points (${answer.question.points})`,
      });
    }

    // Update answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        pointsAwarded: validatedData.pointsAwarded,
        feedback: validatedData.feedback,
        isCorrect: validatedData.pointsAwarded === answer.question.points,
      },
    });

    // Recalculate attempt score
    const allAnswers = await prisma.answer.findMany({
      where: { attemptId: answer.attemptId },
    });

    // Check if all essays are graded
    const allGraded = allAnswers.every((ans) => ans.pointsAwarded !== null);

    if (allGraded) {
      const totalScore = allAnswers.reduce((sum, ans) => sum + (ans.pointsAwarded || 0), 0);
      const maxScore = answer.attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const isPassed = percentage >= answer.attempt.quiz.passingScore;

      await prisma.quizAttempt.update({
        where: { id: answer.attemptId },
        data: {
          score: totalScore,
          percentage,
          isPassed,
          status: 'GRADED',
        },
      });
    }

    res.json({
      message: 'Essay answer graded successfully',
      answer: updatedAnswer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Grade essay answer error:', error);
    res.status(500).json({ message: 'Failed to grade essay answer' });
  }
};

/**
 * Get student's own quiz attempts
 */
export const getMyAttempts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { subjectId } = req.query;

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        studentId: user.userId,
        ...(subjectId && {
          quiz: {
            subjectId: subjectId as string,
          },
        }),
      },
      include: {
        quiz: {
          include: {
            subject: {
              include: {
                class: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    res.json(attempts);
  } catch (error) {
    console.error('Get my attempts error:', error);
    res.status(500).json({ message: 'Failed to fetch attempts' });
  }
};

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
