import { z } from 'zod';

// Create class validation schema
export const createClassSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama kelas minimal 2 karakter')
    .max(50, 'Nama kelas maksimal 50 karakter'),
  grade: z
    .number()
    .int('Grade harus berupa angka bulat')
    .min(10, 'Grade minimal 10')
    .max(12, 'Grade maksimal 12'),
  academicYear: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran harus YYYY/YYYY (contoh: 2024/2025)'),
});

// Update class validation schema
export const updateClassSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama kelas minimal 2 karakter')
    .max(50, 'Nama kelas maksimal 50 karakter')
    .optional(),
  grade: z
    .number()
    .int('Grade harus berupa angka bulat')
    .min(10, 'Grade minimal 10')
    .max(12, 'Grade maksimal 12')
    .optional(),
  academicYear: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran harus YYYY/YYYY (contoh: 2024/2025)')
    .optional(),
});

// Type exports
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
