import { z } from 'zod';

// Create subject validation schema
export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama mata pelajaran minimal 2 karakter')
    .max(100, 'Nama mata pelajaran maksimal 100 karakter'),
  classId: z
    .string()
    .min(1, 'Class ID harus diisi'),
  teacherId: z
    .string()
    .min(1, 'Teacher ID harus diisi'),
});

// Update subject validation schema
export const updateSubjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama mata pelajaran minimal 2 karakter')
    .max(100, 'Nama mata pelajaran maksimal 100 karakter')
    .optional(),
  classId: z
    .string()
    .min(1, 'Class ID harus diisi')
    .optional(),
  teacherId: z
    .string()
    .min(1, 'Teacher ID harus diisi')
    .optional(),
});

// Type exports
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
