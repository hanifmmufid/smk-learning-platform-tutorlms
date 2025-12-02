import { Router } from 'express';
import { login, register, me, logout, getUsers } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);
router.get('/users', authenticate, getUsers);

export default router;
