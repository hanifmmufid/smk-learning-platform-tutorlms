import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  startQuizAttempt,
  submitQuizAttempt,
  getAttemptResults,
  getQuizAttempts,
  gradeEssayAnswer,
  getMyAttempts,
} from '../controllers/attemptController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Quiz Attempt routes
 */

// Get my attempts (Students only)
router.get('/my-attempts', authorize('STUDENT', 'ADMIN'), getMyAttempts);

// Start a quiz attempt (Students only)
router.post('/quizzes/:id/start', authorize('STUDENT', 'ADMIN'), startQuizAttempt);

// Submit quiz attempt (Students only)
router.post('/:id/submit', authorize('STUDENT', 'ADMIN'), submitQuizAttempt);

// Get attempt results (Students see their own, Teachers see all)
router.get('/:id/results', getAttemptResults);

// Get all attempts for a quiz (Teachers and Admins only)
router.get('/quizzes/:id/attempts', authorize('TEACHER', 'ADMIN'), getQuizAttempts);

/**
 * Grading routes (Teachers only)
 */

// Grade essay answer (Teachers and Admins only)
router.put('/answers/:id/grade', authorize('TEACHER', 'ADMIN'), gradeEssayAnswer);

export default router;
