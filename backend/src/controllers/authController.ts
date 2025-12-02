import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import {
  loginSchema,
  registerSchema,
  LoginInput,
  RegisterInput
} from '../validations/auth';
import { AuthRequest, LoginResponse } from '../types';

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData: LoginInput = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email atau password salah',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email atau password salah',
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return response
    const response: LoginResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    };

    return res.json({
      success: true,
      message: 'Login berhasil',
      data: response,
    });
  } catch (error: any) {
    // Zod validation error
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat login',
    });
  }
};

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData: RegisterInput = registerSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email sudah terdaftar',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return response
    const response: LoginResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    };

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: response,
    });
  } catch (error: any) {
    // Zod validation error
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat registrasi',
    });
  }
};

// GET /api/auth/me
export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengambil data user',
    });
  }
};

// POST /api/auth/logout
export const logout = async (req: AuthRequest, res: Response) => {
  // Since we're using JWT (stateless), logout is handled on client side
  // by removing the token from storage
  return res.json({
    success: true,
    message: 'Logout berhasil',
  });
};

// GET /api/auth/users?role=TEACHER
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.query;

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengambil data users',
    });
  }
};
