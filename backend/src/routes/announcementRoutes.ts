import { Router } from 'express';
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
  getUnreadCount
} from '../controllers/announcementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * Phase 7: Announcement Routes
 *
 * All routes require authentication
 */

// ============================================
// Public Announcement Routes (All authenticated users)
// ============================================

// GET /api/announcements
// Get all announcements (filtered based on user role and enrollments)
router.get(
  '/',
  authenticate,
  getAllAnnouncements
);

// GET /api/announcements/unread-count
// Get unread announcement count for current user
router.get(
  '/unread-count',
  authenticate,
  getUnreadCount
);

// GET /api/announcements/:id
// Get single announcement by ID
router.get(
  '/:id',
  authenticate,
  getAnnouncementById
);

// POST /api/announcements/:id/read
// Mark announcement as read
router.post(
  '/:id/read',
  authenticate,
  markAsRead
);

// ============================================
// Admin/Teacher Routes
// ============================================

// POST /api/announcements
// Create new announcement (Teachers and Admins)
router.post(
  '/',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  createAnnouncement
);

// PUT /api/announcements/:id
// Update announcement (Creator or Admin only)
router.put(
  '/:id',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  updateAnnouncement
);

// DELETE /api/announcements/:id
// Delete announcement (Creator or Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  deleteAnnouncement
);

export default router;
