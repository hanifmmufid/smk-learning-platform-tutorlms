import { z } from 'zod';

// Create enrollment validation schema
export const createEnrollmentSchema = z.object({
  studentId: z
    .string()
    .min(1, 'Student ID harus diisi'),
  classId: z
    .string()
    .min(1, 'Class ID harus diisi'),
  subjectId: z
    .string()
    .min(1, 'Subject ID harus diisi'),
});

// Bulk enrollment validation schema
export const bulkEnrollmentSchema = z.object({
  studentIds: z
    .array(z.string().min(1, 'Student ID tidak valid'))
    .min(1, 'Minimal 1 siswa harus dipilih'),
  classId: z
    .string()
    .min(1, 'Class ID harus diisi'),
  subjectId: z
    .string()
    .min(1, 'Subject ID harus diisi'),
});

// Type exports
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type BulkEnrollmentInput = z.infer<typeof bulkEnrollmentSchema>;
