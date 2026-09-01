/**
 * ============================================================================
 * TÊN FILE: settingsRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/settingsRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Cấu hình Hệ thống (`/api/v1/settings/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `GET /`: Lấy cấu hình hệ thống & kiểm tra Chế độ bảo trì.
 *   - `PUT /`: Admin cập nhật tên hệ thống, múi giờ, định dạng ngày và bật/tắt bảo trì.
 * ============================================================================
 */

import { Router } from 'express';
import { getSystemSettings, updateSystemSettings } from '../controllers/settingsController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Lấy cài đặt hệ thống (Công khai / cho FE gọi)
router.get('/', getSystemSettings);

// Cập nhật cài đặt hệ thống (Chỉ Admin)
router.put('/', protect, authorize('admin'), updateSystemSettings);

export default router;
