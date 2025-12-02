import { Request } from 'express';

// User type (from Prisma)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

// Authenticated Request (extends Express Request with user)
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string | null;
  };
}
