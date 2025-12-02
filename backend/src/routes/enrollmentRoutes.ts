import { Router } from 'express';
import {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  bulkEnrollment,
  deleteEnrollment,
} from '../controllers/enrollmentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/enrollments - Get all enrollments (all authenticated users)
// Query params: ?classId=xxx&subjectId=xxx&studentId=xxx (optional filters)
router.get('/', getAllEnrollments);

// GET /api/enrollments/:id - Get single enrollment (all authenticated users)
router.get('/:id', getEnrollmentById);

// POST /api/enrollments/bulk - Bulk enrollment (admin only)
router.post('/bulk', authorize('ADMIN'), bulkEnrollment);

// POST /api/enrollments - Create enrollment (admin only)
router.post('/', authorize('ADMIN'), createEnrollment);

// DELETE /api/enrollments/:id - Delete enrollment (admin only)
router.delete('/:id', authorize('ADMIN'), deleteEnrollment);

export default router;
