import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createAnnouncementSchema, updateAnnouncementSchema } from '../validations/announcement';

/**
 * Phase 7: Announcements & Communication Controller
 */

// ============================================
// Get All Announcements (with filtering)
// ============================================
export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { targetType, classId, subjectId, priority, unreadOnly } = req.query;

    // Build filter based on user role and query params
    const where: any = {};

    // Filter by target type
    if (targetType && targetType !== 'ALL') {
      where.targetType = targetType;
    }

    // Filter by class or subject
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (priority) where.priority = priority;

    // For students, filter announcements they should see based on enrollment
    if (userRole === 'STUDENT') {
      // Get student's enrolled subjects and classes
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { classId: true, subjectId: true }
      });

      const enrolledClassIds = [...new Set(enrollments.map(e => e.classId))];
      const enrolledSubjectIds = [...new Set(enrollments.map(e => e.subjectId))];

      // Student can see:
      // 1. ALL announcements
      // 2. CLASS announcements for their enrolled classes
      // 3. SUBJECT announcements for their enrolled subjects
      where.OR = [
        { targetType: 'ALL' },
        { targetType: 'CLASS', classId: { in: enrolledClassIds } },
        { targetType: 'SUBJECT', subjectId: { in: enrolledSubjectIds } }
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        reads: {
          where: { userId },
          select: { id: true, readAt: true }
        },
        _count: {
          select: { reads: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // If unreadOnly, filter out read announcements
    let filteredAnnouncements = announcements;
    if (unreadOnly === 'true' || unreadOnly === true) {
      filteredAnnouncements = announcements.filter(a => a.reads.length === 0);
    }

    // Format response
    const formattedAnnouncements = filteredAnnouncements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetType: announcement.targetType,
      isPinned: announcement.isPinned,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      creator: announcement.creator,
      class: announcement.class,
      subject: announcement.subject,
      isRead: announcement.reads.length > 0,
      readAt: announcement.reads[0]?.readAt || null,
      totalReads: announcement._count.reads
    }));

    res.json({
      success: true,
      data: formattedAnnouncements
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements'
    });
  }
};

// ============================================
// Get Single Announcement
// ============================================
export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        reads: {
          where: { userId },
          select: { id: true, readAt: true }
        },
        _count: {
          select: { reads: true }
        }
      }
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...announcement,
        isRead: announcement.reads.length > 0,
        readAt: announcement.reads[0]?.readAt || null,
        totalReads: announcement._count.reads
      }
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement'
    });
  }
};

// ============================================
// Create Announcement
// ============================================
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Validate input
    const validationResult = createAnnouncementSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }

    const { title, content, priority, targetType, classId, subjectId, isPinned } = validationResult.data;

    // Additional authorization checks
    if (userRole === 'TEACHER') {
      // Teachers can only create announcements for their subjects
      if (targetType === 'SUBJECT' && subjectId) {
        const subject = await prisma.subject.findUnique({
          where: { id: subjectId }
        });

        if (!subject || subject.teacherId !== userId) {
          return res.status(403).json({
            success: false,
            message: 'You can only create announcements for your own subjects'
          });
        }
      }
    }

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        targetType,
        classId,
        subjectId,
        isPinned,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ Announcement created: ${title} (${targetType})`);

    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully'
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
};

// ============================================
// Update Announcement
// ============================================
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Validate input
    const validationResult = updateAnnouncementSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
    }

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Authorization: Only creator or admin can update
    if (userRole !== 'ADMIN' && existingAnnouncement.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own announcements'
      });
    }

    // Update announcement
    const announcement = await prisma.announcement.update({
      where: { id },
      data: validationResult.data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ Announcement updated: ${announcement.title}`);

    res.json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully'
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement'
    });
  }
};

// ============================================
// Delete Announcement
// ============================================
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Check if announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Authorization: Only creator or admin can delete
    if (userRole !== 'ADMIN' && announcement.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own announcements'
      });
    }

    await prisma.announcement.delete({
      where: { id }
    });

    console.log(`✅ Announcement deleted: ${announcement.title}`);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement'
    });
  }
};

// ============================================
// Mark Announcement as Read
// ============================================
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Check if announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if already read
    const existingRead = await prisma.announcementRead.findUnique({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId
        }
      }
    });

    if (existingRead) {
      return res.json({
        success: true,
        message: 'Announcement already marked as read'
      });
    }

    // Mark as read
    await prisma.announcementRead.create({
      data: {
        announcementId: id,
        userId
      }
    });

    res.json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark announcement as read'
    });
  }
};

// ============================================
// Get Unread Count
// ============================================
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Build filter based on user role
    const where: any = {};

    // For students, only count announcements they should see
    if (userRole === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { classId: true, subjectId: true }
      });

      const enrolledClassIds = [...new Set(enrollments.map(e => e.classId))];
      const enrolledSubjectIds = [...new Set(enrollments.map(e => e.subjectId))];

      where.OR = [
        { targetType: 'ALL' },
        { targetType: 'CLASS', classId: { in: enrolledClassIds } },
        { targetType: 'SUBJECT', subjectId: { in: enrolledSubjectIds } }
      ];
    }

    // Get all announcements user can see
    const announcements = await prisma.announcement.findMany({
      where,
      select: { id: true }
    });

    const announcementIds = announcements.map(a => a.id);

    // Get read announcement IDs
    const readAnnouncements = await prisma.announcementRead.findMany({
      where: {
        userId,
        announcementId: { in: announcementIds }
      },
      select: { announcementId: true }
    });

    const readIds = new Set(readAnnouncements.map(r => r.announcementId));
    const unreadCount = announcementIds.length - readIds.size;

    res.json({
      success: true,
      data: {
        total: announcementIds.length,
        read: readIds.size,
        unread: unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};
