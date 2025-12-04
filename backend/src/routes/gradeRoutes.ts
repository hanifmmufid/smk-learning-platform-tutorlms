import { Router } from 'express';
import {
  getStudentGrades,
  getSubjectGradebook,
  getStudentProgress,
  exportGradebookCSV
} from '../controllers/gradeController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * Phase 6: Gradebook & Progress Tracking Routes
 *
 * All routes require authentication
 * Authorization varies by endpoint
 */

// ============================================
// Student Grades Routes
// ============================================

// GET /api/grades/students/:studentId
// Get all grades for a student (all subjects)
// Authorization: Student (self only), Teacher, Admin
router.get(
  '/students/:studentId',
  authenticate,
  authorize('STUDENT', 'TEACHER', 'ADMIN'),
  getStudentGrades
);

// GET /api/grades/students/:studentId/progress
// Get student progress over time (timeline of grades)
// Authorization: Student (self only), Teacher, Admin
router.get(
  '/students/:studentId/progress',
  authenticate,
  authorize('STUDENT', 'TEACHER', 'ADMIN'),
  getStudentProgress
);

// ============================================
// Subject Gradebook Routes (Teacher View)
// ============================================

// GET /api/grades/subjects/:subjectId
// Get gradebook for a subject (all students)
// Authorization: Teacher (own subject only), Admin
router.get(
  '/subjects/:subjectId',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  getSubjectGradebook
);

// GET /api/grades/subjects/:subjectId/export
// Export gradebook to CSV
// Authorization: Teacher (own subject only), Admin
router.get(
  '/subjects/:subjectId/export',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  exportGradebookCSV
);

export default router;
