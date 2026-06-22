import { Router } from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead
} from '../controllers/notificationController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Lấy danh sách thông báo của người dùng hiện tại (lọc theo vai trò)
router.get('/', protect, getNotifications);

// Đánh dấu đọc một thông báo cụ thể
router.post('/:id/read', protect, markAsRead);

// Đánh dấu đọc tất cả thông báo
router.post('/read-all', protect, markAllAsRead);

export default router;
