import { z } from 'zod';
import { SubmissionStatus } from '@prisma/client';

/**
 * Schema for submitting an assignment (student)
 */
export const submitAssignmentSchema = z.object({
  content: z.string().optional(), // Text answer
  // File upload handled separately via multer
});

/**
 * Schema for grading a submission (teacher)
 */
export const gradeSubmissionSchema = z.object({
  score: z.number().int().min(0, 'Score cannot be negative'),
  feedback: z.string().optional(),
});

/**
 * Schema for updating submission status
 */
export const updateSubmissionStatusSchema = z.object({
  status: z.nativeEnum(SubmissionStatus),
});

/**
 * TypeScript types derived from schemas
 */
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;
