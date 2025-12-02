import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import {
  createClassSchema,
  updateClassSchema,
  CreateClassInput,
  UpdateClassInput,
} from '../validations/class';

// GET /api/classes - Get all classes
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        subjects: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            subjects: true,
          },
        },
      },
      orderBy: [
        { grade: 'asc' },
        { name: 'asc' },
      ],
    });

    return res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    console.error('Get classes error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengambil data kelas',
    });
  }
};

// GET /api/classes/:id - Get single class
export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            subjects: true,
          },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Kelas tidak ditemukan',
      });
    }

    return res.json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error('Get class error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengambil data kelas',
    });
  }
};

// POST /api/classes - Create new class
export const createClass = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData: CreateClassInput = createClassSchema.parse(req.body);

    // Check if class with same name and academic year already exists
    const existingClass = await prisma.class.findFirst({
      where: {
        name: validatedData.name,
        academicYear: validatedData.academicYear,
      },
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        error: 'Kelas dengan nama dan tahun ajaran yang sama sudah ada',
      });
    }

    // Create class
    const newClass = await prisma.class.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            enrollments: true,
            subjects: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Kelas berhasil dibuat',
      data: newClass,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create class error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat membuat kelas',
    });
  }
};

// PUT /api/classes/:id - Update class
export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate input
    const validatedData: UpdateClassInput = updateClassSchema.parse(req.body);

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Kelas tidak ditemukan',
      });
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            enrollments: true,
            subjects: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: 'Kelas berhasil diupdate',
      data: updatedClass,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update class error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate kelas',
    });
  }
};

// DELETE /api/classes/:id - Delete class
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
            subjects: true,
          },
        },
      },
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'Kelas tidak ditemukan',
      });
    }

    // Check if class has enrollments or subjects
    if (existingClass._count.enrollments > 0 || existingClass._count.subjects > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat menghapus kelas yang masih memiliki siswa atau mata pelajaran',
        details: {
          enrollments: existingClass._count.enrollments,
          subjects: existingClass._count.subjects,
        },
      });
    }

    // Delete class
    await prisma.class.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Kelas berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete class error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat menghapus kelas',
    });
  }
};
