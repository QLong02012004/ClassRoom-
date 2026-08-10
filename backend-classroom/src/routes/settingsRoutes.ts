import { Router } from 'express';
import { getSystemSettings, updateSystemSettings } from '../controllers/settingsController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Lấy cài đặt hệ thống (Công khai / cho FE gọi)
router.get('/', getSystemSettings);

// Cập nhật cài đặt hệ thống (Chỉ Admin)
router.put('/', protect, authorize('admin'), updateSystemSettings);

export default router;
