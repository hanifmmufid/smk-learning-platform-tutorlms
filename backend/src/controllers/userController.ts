import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

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
        updatedAt: true,
        _count: {
          select: {
            taughtSubjects: true,
            enrollments: true,
          },
        },
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
        _count: {
          select: {
            taughtSubjects: true,
            enrollments: true,
          },
        },
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

/**
 * Create new user (Admin only)
 */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, and role are required',
      });
    }

    // Validate role
    if (!['TEACHER', 'STUDENT'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be TEACHER or STUDENT',
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`✅ User created: ${user.email} (${user.role})`);

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Validate role if provided
    if (role && !['TEACHER', 'STUDENT'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be TEACHER or STUDENT',
      });
    }

    // Check if email is taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
        });
      }
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role as Role;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`✅ User updated: ${user.email}`);

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (user.id === req.user?.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    // Prevent deleting admin users
    if (user.role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete admin users',
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    console.log(`✅ User deleted: ${user.email}`);

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
};
