import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import {
  createSubjectSchema,
  updateSubjectSchema,
  CreateSubjectInput,
  UpdateSubjectInput,
} from '../validations/subject';

// GET /api/subjects - Get all subjects
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const { classId } = req.query;

    const subjects = await prisma.subject.findMany({
      where: classId ? { classId: classId as string } : undefined,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academicYear: true,
          },
        },
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
      orderBy: {
        name: 'asc',
      },
    });

    return res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengambil data mata pelajaran',
    });
  }
};

// GET /api/subjects/:id - Get single subject
export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academicYear: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Mata pelajaran tidak ditemukan',
      });
    }

    return res.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error('Get subject error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengambil data mata pelajaran',
    });
  }
};

// POST /api/subjects - Create new subject
export const createSubject = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData: CreateSubjectInput = createSubjectSchema.parse(req.body);

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: validatedData.classId },
    });

    if (!classExists) {
      return res.status(404).json({
        success: false,
        error: 'Kelas tidak ditemukan',
      });
    }

    // Check if teacher exists and has TEACHER role
    const teacher = await prisma.user.findUnique({
      where: { id: validatedData.teacherId },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Guru tidak ditemukan',
      });
    }

    if (teacher.role !== 'TEACHER') {
      return res.status(400).json({
        success: false,
        error: 'User yang dipilih bukan seorang guru',
      });
    }

    // Check if subject with same name already exists in this class
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: validatedData.name,
        classId: validatedData.classId,
      },
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        error: 'Mata pelajaran dengan nama yang sama sudah ada di kelas ini',
      });
    }

    // Create subject
    const newSubject = await prisma.subject.create({
      data: validatedData,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academicYear: true,
          },
        },
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
    });

    return res.status(201).json({
      success: true,
      message: 'Mata pelajaran berhasil dibuat',
      data: newSubject,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create subject error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat membuat mata pelajaran',
    });
  }
};

// PUT /api/subjects/:id - Update subject
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate input
    const validatedData: UpdateSubjectInput = updateSubjectSchema.parse(req.body);

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        error: 'Mata pelajaran tidak ditemukan',
      });
    }

    // If updating classId, check if class exists
    if (validatedData.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: validatedData.classId },
      });

      if (!classExists) {
        return res.status(404).json({
          success: false,
          error: 'Kelas tidak ditemukan',
        });
      }
    }

    // If updating teacherId, check if teacher exists and has TEACHER role
    if (validatedData.teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: validatedData.teacherId },
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          error: 'Guru tidak ditemukan',
        });
      }

      if (teacher.role !== 'TEACHER') {
        return res.status(400).json({
          success: false,
          error: 'User yang dipilih bukan seorang guru',
        });
      }
    }

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: validatedData,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academicYear: true,
          },
        },
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
    });

    return res.json({
      success: true,
      message: 'Mata pelajaran berhasil diupdate',
      data: updatedSubject,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update subject error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengupdate mata pelajaran',
    });
  }
};

// DELETE /api/subjects/:id - Delete subject
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        error: 'Mata pelajaran tidak ditemukan',
      });
    }

    // Check if subject has enrollments
    if (existingSubject._count.enrollments > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat menghapus mata pelajaran yang masih memiliki siswa terdaftar',
        details: {
          enrollments: existingSubject._count.enrollments,
        },
      });
    }

    // Delete subject
    await prisma.subject.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Mata pelajaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat menghapus mata pelajaran',
    });
  }
};
