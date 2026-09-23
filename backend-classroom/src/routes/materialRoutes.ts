/**
 * ============================================================================
 * TÊN FILE: materialRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/materialRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Kho Tài liệu Tham khảo (`/api/v1/materials/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `GET /`: Lấy danh sách tài liệu công khai cho học sinh/giáo viên.
 *   - `POST /` & `DELETE /:id`: Admin tạo hoặc xóa tài liệu học tập.
 * ============================================================================
 */

import { Router } from 'express';
import { getPublicMaterials, getMaterialById, downloadMaterial, createMaterial, deleteMaterial, clearAllMaterials } from '../controllers/materialController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/v1/materials -> accessible to all authenticated users
router.get('/', protect, getPublicMaterials);

// DELETE /api/v1/materials/clear-all -> Dọn sạch tài liệu mẫu
router.delete('/clear-all', protect, clearAllMaterials);

// GET /api/v1/materials/:id -> accessible to all authenticated users
router.get('/:id', protect, getMaterialById);

// GET /api/v1/materials/:id/download -> accessible to all authenticated users
router.get('/:id/download', protect, downloadMaterial);

// POST /api/v1/materials -> Admin only
router.post('/', protect, authorize('admin'), createMaterial);

// DELETE /api/v1/materials/:id -> Admin only
router.delete('/:id', protect, authorize('admin'), deleteMaterial);

export default router;
