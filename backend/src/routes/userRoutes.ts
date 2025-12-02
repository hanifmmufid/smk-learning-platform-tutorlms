import { Router } from 'express';
import { getUsers, getUserById } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (with optional role filter) - Admin only
router.get('/', authorize('ADMIN'), getUsers);

// Get user by ID - Admin only
router.get('/:id', authorize('ADMIN'), getUserById);

export default router;
