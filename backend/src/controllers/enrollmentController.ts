import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import {
  createEnrollmentSchema,
  bulkEnrollmentSchema,
  CreateEnrollmentInput,
  BulkEnrollmentInput,
} from '../validations/enrollment';

// GET /api/enrollments - Get all enrollments
export const getAllEnrollments = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId, studentId } = req.query;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        ...(classId && { classId: classId as string }),
        ...(subjectId && { subjectId: subjectId as string }),
        ...(studentId && { studentId: studentId as string }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academicYear: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengambil data enrollment',
    });
  }
};

// GET /api/enrollments/:id - Get single enrollment
export const getEnrollmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academicYear: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment tidak ditemukan',
      });
    }

    return res.json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat mengambil data enrollment',
    });
  }
};

// POST /api/enrollments - Create single enrollment
export const createEnrollment = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData: CreateEnrollmentInput = createEnrollmentSchema.parse(req.body);

    // Check if student exists and has STUDENT role
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Siswa tidak ditemukan',
      });
    }

    if (student.role !== 'STUDENT') {
      return res.status(400).json({
        success: false,
        error: 'User yang dipilih bukan seorang siswa',
      });
    }

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

    // Check if subject exists and belongs to the class
    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Mata pelajaran tidak ditemukan',
      });
    }

    if (subject.classId !== validatedData.classId) {
      return res.status(400).json({
        success: false,
        error: 'Mata pelajaran tidak tersedia di kelas ini',
      });
    }

    // Check if enrollment already exists (handled by unique constraint, but we check first)
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: validatedData.studentId,
        subjectId: validatedData.subjectId,
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'Siswa sudah terdaftar di mata pelajaran ini',
      });
    }

    // Create enrollment
    const newEnrollment = await prisma.enrollment.create({
      data: validatedData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            academicYear: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Enrollment berhasil dibuat',
      data: newEnrollment,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create enrollment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat membuat enrollment',
    });
  }
};

// POST /api/enrollments/bulk - Bulk enrollment
export const bulkEnrollment = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData: BulkEnrollmentInput = bulkEnrollmentSchema.parse(req.body);

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

    // Check if subject exists and belongs to the class
    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Mata pelajaran tidak ditemukan',
      });
    }

    if (subject.classId !== validatedData.classId) {
      return res.status(400).json({
        success: false,
        error: 'Mata pelajaran tidak tersedia di kelas ini',
      });
    }

    // Validate all students exist and have STUDENT role
    const students = await prisma.user.findMany({
      where: {
        id: { in: validatedData.studentIds },
      },
    });

    if (students.length !== validatedData.studentIds.length) {
      return res.status(404).json({
        success: false,
        error: 'Beberapa siswa tidak ditemukan',
      });
    }

    const nonStudents = students.filter(s => s.role !== 'STUDENT');
    if (nonStudents.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Beberapa user yang dipilih bukan siswa',
        details: nonStudents.map(s => ({ id: s.id, name: s.name, role: s.role })),
      });
    }

    // Get existing enrollments to avoid duplicates
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: validatedData.studentIds },
        subjectId: validatedData.subjectId,
      },
    });

    const existingStudentIds = existingEnrollments.map(e => e.studentId);
    const newStudentIds = validatedData.studentIds.filter(
      id => !existingStudentIds.includes(id)
    );

    if (newStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Semua siswa sudah terdaftar di mata pelajaran ini',
      });
    }

    // Create bulk enrollments
    const enrollments = await prisma.enrollment.createMany({
      data: newStudentIds.map(studentId => ({
        studentId,
        classId: validatedData.classId,
        subjectId: validatedData.subjectId,
      })),
    });

    return res.status(201).json({
      success: true,
      message: `Berhasil mendaftarkan ${enrollments.count} siswa`,
      data: {
        created: enrollments.count,
        skipped: existingStudentIds.length,
        total: validatedData.studentIds.length,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Bulk enrollment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat membuat bulk enrollment',
    });
  }
};

// DELETE /api/enrollments/:id - Delete enrollment
export const deleteEnrollment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if enrollment exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!existingEnrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment tidak ditemukan',
      });
    }

    // Delete enrollment
    await prisma.enrollment.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Enrollment berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete enrollment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat menghapus enrollment',
    });
  }
};
