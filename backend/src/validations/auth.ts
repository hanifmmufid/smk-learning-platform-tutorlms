import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email harus diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password harus diisi'),
});

// Register validation schema
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string()
    .min(1, 'Email harus diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
    .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT'], {
    errorMap: () => ({ message: 'Role harus ADMIN, TEACHER, atau STUDENT' }),
  }),
});

// Update profile validation schema
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .optional(),
  avatar: z
    .string()
    .url('Avatar harus berupa URL valid')
    .optional(),
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini harus diisi'),
  newPassword: z
    .string()
    .min(6, 'Password baru minimal 6 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
    .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
