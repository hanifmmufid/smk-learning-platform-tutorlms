import { z } from 'zod';
import { AssignmentStatus } from '@prisma/client';

/**
 * Schema for creating a new assignment
 */
export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  instructions: z.string().min(1, 'Instructions are required'),
  subjectId: z.string().cuid('Invalid subject ID'),
  dueDate: z.string().datetime('Invalid due date format'),
  maxScore: z.number().int().min(1).max(1000).default(100),
  allowLateSubmission: z.boolean().default(false),
  status: z.nativeEnum(AssignmentStatus).default(AssignmentStatus.DRAFT),
});

/**
 * Schema for updating an existing assignment
 */
export const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  instructions: z.string().min(1).optional(),
  dueDate: z.string().datetime('Invalid due date format').optional(),
  maxScore: z.number().int().min(1).max(1000).optional(),
  allowLateSubmission: z.boolean().optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
});

/**
 * Schema for publishing an assignment (change status from DRAFT to PUBLISHED)
 */
export const publishAssignmentSchema = z.object({
  status: z.literal(AssignmentStatus.PUBLISHED),
});

/**
 * TypeScript types derived from schemas
 */
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type PublishAssignmentInput = z.infer<typeof publishAssignmentSchema>;
