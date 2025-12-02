import { Router } from 'express';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} from '../controllers/classController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/classes - Get all classes (all authenticated users)
router.get('/', getAllClasses);

// GET /api/classes/:id - Get single class (all authenticated users)
router.get('/:id', getClassById);

// POST /api/classes - Create class (admin only)
router.post('/', authorize('ADMIN'), createClass);

// PUT /api/classes/:id - Update class (admin only)
router.put('/:id', authorize('ADMIN'), updateClass);

// DELETE /api/classes/:id - Delete class (admin only)
router.delete('/:id', authorize('ADMIN'), deleteClass);

export default router;
