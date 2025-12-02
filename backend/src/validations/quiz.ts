import { z } from 'zod';
import { QuizStatus, QuestionType } from '@prisma/client';

// Create Quiz Schema
export const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  subjectId: z.string().cuid('Invalid subject ID'),
  timeLimit: z.number().int().min(1).max(480).nullable().optional(), // Max 8 hours
  passingScore: z.number().int().min(0).max(100).default(60),
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(false),
  showResults: z.boolean().default(true),
  status: z.nativeEnum(QuizStatus).default(QuizStatus.DRAFT),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

// Update Quiz Schema
export const updateQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  subjectId: z.string().cuid().optional(),
  timeLimit: z.number().int().min(1).max(480).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleAnswers: z.boolean().optional(),
  showResults: z.boolean().optional(),
  status: z.nativeEnum(QuizStatus).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

// Create Question Schema
export const createQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  question: z.string().min(1, 'Question text is required'),
  points: z.number().int().min(1).max(100).default(1),
  order: z.number().int().min(0),
  explanation: z.string().optional(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })).nullable().optional(),
  maxWords: z.number().int().min(1).nullable().optional(),
});

// Update Question Schema
export const updateQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType).optional(),
  question: z.string().min(1).optional(),
  points: z.number().int().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
  explanation: z.string().optional(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })).nullable().optional(),
  maxWords: z.number().int().min(1).nullable().optional(),
});

// Submit Answer Schema
export const submitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  answer: z.union([
    z.object({ selectedOption: z.string() }), // MCQ
    z.object({ value: z.boolean() }),         // True/False
    z.object({ text: z.string() }),           // Essay
  ]),
});

// Submit Quiz Attempt Schema
export const submitQuizAttemptSchema = z.object({
  answers: z.array(submitAnswerSchema),
  timeSpent: z.number().int().min(0).optional(),
});

// Grade Essay Answer Schema
export const gradeEssayAnswerSchema = z.object({
  pointsAwarded: z.number().int().min(0),
  feedback: z.string().optional(),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>;
export type GradeEssayAnswerInput = z.infer<typeof gradeEssayAnswerSchema>;
