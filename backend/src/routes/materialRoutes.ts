import express from 'express';
import {
  getAllMaterials,
  getMaterialById,
  uploadFileMaterial,
  createLinkMaterial,
  updateMaterial,
  deleteMaterial,
  downloadMaterial,
} from '../controllers/materialController';
import { authenticate, authorize } from '../middleware/auth';
import { upload, handleUploadError } from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all materials (with optional subject filter)
// Students can access materials from their enrolled subjects
router.get('/', getAllMaterials);

// Get single material
router.get('/:id', getMaterialById);

// Download material file
router.get('/:id/download', downloadMaterial);

// Upload file material (Teachers only)
router.post(
  '/upload',
  authorize('TEACHER', 'ADMIN'),
  upload.single('file'),
  handleUploadError,
  uploadFileMaterial
);

// Create link material (Teachers only)
router.post(
  '/link',
  authorize('TEACHER', 'ADMIN'),
  createLinkMaterial
);

// Update material (Teachers only - must be uploader)
router.put(
  '/:id',
  authorize('TEACHER', 'ADMIN'),
  updateMaterial
);

// Delete material (Teachers only - must be uploader)
router.delete(
  '/:id',
  authorize('TEACHER', 'ADMIN'),
  deleteMaterial
);

export default router;
