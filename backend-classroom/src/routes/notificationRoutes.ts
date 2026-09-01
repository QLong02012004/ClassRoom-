/**
 * ============================================================================
 * TÊN FILE: notificationRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/notificationRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Thông báo Quả Chuông (`/api/v1/notifications/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lấy danh sách thông báo (`GET /`), đánh dấu đã đọc (`POST /:id/read`, `POST /read-all`), gửi cảnh báo cho học sinh (`POST /warn`).
 * ============================================================================
 */

import { Router } from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    sendWarningToStudent
} from '../controllers/notificationController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Lấy danh sách thông báo của người dùng hiện tại (lọc theo vai trò)
router.get('/', protect, getNotifications);

// Đánh dấu đọc một thông báo cụ thể
router.post('/:id/read', protect, markAsRead);

// Đánh dấu đọc tất cả thông báo
router.post('/read-all', protect, markAllAsRead);

// Giáo viên gửi cảnh báo tới học sinh cụ thể
router.post('/warn', protect, sendWarningToStudent);

export default router;

