import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSubmission, handleUploadError } from '../middleware/uploadSubmission';
import {
  getAllSubmissions,
  getSubmissionById,
  submitAssignment,
  gradeSubmission,
  deleteSubmission,
} from '../controllers/submissionController';

const router = Router();

/**
 * Submission Routes
 * Base path: /api/submissions
 */

// GET /api/submissions - Get all submissions (with filters)
router.get('/', authenticate, getAllSubmissions);

// GET /api/submissions/:id - Get single submission by ID
router.get('/:id', authenticate, getSubmissionById);

// POST /api/assignments/:assignmentId/submit - Submit assignment (Students only)
// Note: This route is nested under assignments for semantic clarity
// Actual route will be: POST /api/assignments/:assignmentId/submit
router.post(
  '/assignments/:assignmentId/submit',
  authenticate,
  authorize('STUDENT', 'ADMIN'),
  uploadSubmission,
  handleUploadError,
  submitAssignment
);

// PUT /api/submissions/:id/grade - Grade a submission (Teachers only)
router.put(
  '/:id/grade',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  gradeSubmission
);

// DELETE /api/submissions/:id - Delete submission
router.delete('/:id', authenticate, deleteSubmission);

export default router;
