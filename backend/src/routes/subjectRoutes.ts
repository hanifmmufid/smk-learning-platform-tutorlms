import { Router } from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/subjects - Get all subjects (all authenticated users)
// Query params: ?classId=xxx (optional filter)
router.get('/', getAllSubjects);

// GET /api/subjects/:id - Get single subject (all authenticated users)
router.get('/:id', getSubjectById);

// POST /api/subjects - Create subject (admin only)
router.post('/', authorize('ADMIN'), createSubject);

// PUT /api/subjects/:id - Update subject (admin only)
router.put('/:id', authorize('ADMIN'), updateSubject);

// DELETE /api/subjects/:id - Delete subject (admin only)
router.delete('/:id', authorize('ADMIN'), deleteSubject);

export default router;
