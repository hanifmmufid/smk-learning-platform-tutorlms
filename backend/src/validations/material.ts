import { z } from 'zod';

export const MaterialType = z.enum(['FILE', 'VIDEO', 'LINK']);

export const createMaterialFileSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  subjectId: z.string().cuid('Invalid subject ID'),
});

export const createMaterialLinkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  type: z.literal('LINK'),
  url: z.string().url('Invalid URL'),
  subjectId: z.string().cuid('Invalid subject ID'),
});

export const updateMaterialSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  url: z.string().url('Invalid URL').optional(),
});

export type CreateMaterialFileInput = z.infer<typeof createMaterialFileSchema>;
export type CreateMaterialLinkInput = z.infer<typeof createMaterialLinkSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
