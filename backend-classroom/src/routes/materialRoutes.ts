import { Router } from 'express';
import { getPublicMaterials, createMaterial, deleteMaterial } from '../controllers/materialController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/v1/materials -> accessible to all authenticated users
router.get('/', protect, getPublicMaterials);

// POST /api/v1/materials -> Admin only
router.post('/', protect, authorize('admin'), createMaterial);

// DELETE /api/v1/materials/:id -> Admin only
router.delete('/:id', protect, authorize('admin'), deleteMaterial);

export default router;
