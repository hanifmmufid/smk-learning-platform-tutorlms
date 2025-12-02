import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createMaterialFileSchema,
  createMaterialLinkSchema,
  updateMaterialSchema,
} from '../validations/material';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

/**
 * Get all materials (with optional subject filter)
 */
export const getAllMaterials = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.query;

    const materials = await prisma.material.findMany({
      where: subjectId ? { subjectId: subjectId as string } : {},
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: materials,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch materials',
    });
  }
};

/**
 * Get single material by ID
 */
export const getMaterialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
      });
    }

    res.json({
      success: true,
      data: material,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch material',
    });
  }
};

/**
 * Upload file material (PDF, DOC, PPT, Video, etc)
 */
export const uploadFileMaterial = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Validate request body
    const validatedData = createMaterialFileSchema.parse(req.body);

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject) {
      // Delete uploaded file if subject doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Subject not found',
      });
    }

    // Verify user is the teacher of this subject (authorization)
    if (subject.teacherId !== (req as any).user.userId) {
      // Delete uploaded file if unauthorized
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to upload materials for this subject',
      });
    }

    // Determine material type based on MIME type
    let materialType: 'FILE' | 'VIDEO' = 'FILE';
    if (req.file.mimetype.startsWith('video/')) {
      materialType = 'VIDEO';
    }

    // Create material record
    const material = await prisma.material.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: materialType,
        fileUrl: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        subjectId: validatedData.subjectId,
        uploadedBy: (req as any).user.userId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      data: material,
    });
  } catch (error: any) {
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload material',
    });
  }
};

/**
 * Create link material (YouTube, Google Drive, etc)
 */
export const createLinkMaterial = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = createMaterialLinkSchema.parse(req.body);

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found',
      });
    }

    // Verify user is the teacher of this subject (authorization)
    if (subject.teacherId !== (req as any).user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to create materials for this subject',
      });
    }

    // Create material record
    const material = await prisma.material.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        url: validatedData.url,
        subjectId: validatedData.subjectId,
        uploadedBy: (req as any).user.userId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Link material created successfully',
      data: material,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create link material',
    });
  }
};

/**
 * Update material
 */
export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = updateMaterialSchema.parse(req.body);

    // Check if material exists
    const existingMaterial = await prisma.material.findUnique({
      where: { id },
      include: {
        subject: true,
      },
    });

    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
      });
    }

    // Verify user is the uploader (authorization)
    if (existingMaterial.uploadedBy !== (req as any).user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to update this material',
      });
    }

    // Update material
    const material = await prisma.material.update({
      where: { id },
      data: validatedData,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Material updated successfully',
      data: material,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update material',
    });
  }
};

/**
 * Delete material
 */
export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
      });
    }

    // Verify user is the uploader (authorization)
    if (material.uploadedBy !== (req as any).user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this material',
      });
    }

    // Delete file from disk if it exists
    if (material.fileUrl && fs.existsSync(material.fileUrl)) {
      fs.unlinkSync(material.fileUrl);
    }

    // Delete material record
    await prisma.material.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete material',
    });
  }
};

/**
 * Download material file
 */
export const downloadMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get material
    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found',
      });
    }

    if (material.type === 'LINK') {
      return res.status(400).json({
        success: false,
        error: 'Cannot download link material. Use the URL instead.',
      });
    }

    if (!material.fileUrl || !fs.existsSync(material.fileUrl)) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', material.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
    res.setHeader('Content-Length', material.fileSize || 0);

    // Stream file to response
    const fileStream = fs.createReadStream(material.fileUrl);
    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download material',
    });
  }
};
