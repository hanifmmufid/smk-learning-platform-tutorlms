import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';

/**
 * Get all users with optional role filter
 * Query params: ?role=TEACHER|STUDENT|ADMIN
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.query;

    const where: any = {};
    if (role && Object.values(Role).includes(role as Role)) {
      where.role = role as Role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

/**
 * Get single user by ID
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('❌ Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
};
