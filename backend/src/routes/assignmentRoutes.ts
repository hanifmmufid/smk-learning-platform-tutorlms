import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignmentController';

const router = Router();

/**
 * Assignment Routes
 * Base path: /api/assignments
 */

// GET /api/assignments - Get all assignments (with filters)
router.get('/', authenticate, getAllAssignments);

// GET /api/assignments/:id - Get single assignment by ID
router.get('/:id', authenticate, getAssignmentById);

// POST /api/assignments - Create new assignment (Teachers & Admin only)
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), createAssignment);

// PUT /api/assignments/:id - Update assignment (Teachers & Admin only)
router.put('/:id', authenticate, authorize('TEACHER', 'ADMIN'), updateAssignment);

// DELETE /api/assignments/:id - Delete assignment (Teachers & Admin only)
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN'), deleteAssignment);

export default router;
