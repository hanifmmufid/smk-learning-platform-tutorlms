import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/quizController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Quiz CRUD routes
 */

// Get all quizzes (with filters)
// Teachers see their quizzes, Students see published quizzes from enrolled subjects
router.get('/', getAllQuizzes);

// Get single quiz by ID
router.get('/:id', getQuizById);

// Create new quiz (Teachers and Admins only)
router.post('/', authorize('TEACHER', 'ADMIN'), createQuiz);

// Update quiz (Teachers and Admins only)
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateQuiz);

// Delete quiz (Teachers and Admins only)
router.delete('/:id', authorize('TEACHER', 'ADMIN'), deleteQuiz);

/**
 * Question management routes
 */

// Add question to quiz (Teachers and Admins only)
router.post('/:id/questions', authorize('TEACHER', 'ADMIN'), addQuestion);

// Update question (Teachers and Admins only)
router.put('/questions/:id', authorize('TEACHER', 'ADMIN'), updateQuestion);

// Delete question (Teachers and Admins only)
router.delete('/questions/:id', authorize('TEACHER', 'ADMIN'), deleteQuestion);

export default router;
