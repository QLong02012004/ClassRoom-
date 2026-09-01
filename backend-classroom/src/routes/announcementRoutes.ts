/**
 * ============================================================================
 * TÊN FILE: announcementRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/announcementRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Bảng tin Lớp học (`/api/v1/announcements/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Định tuyến các thao tác: Đăng bài, bình luận, xóa bình luận, ghim bài viết, thích bài đăng/bình luận tới `announcementController.ts`.
 *   - Tất cả đều được bảo mật qua Middleware `protect`.
 * ============================================================================
 */

import { Router } from 'express';
import { getAnnouncements, createAnnouncement, addComment, deleteAnnouncement, togglePin, likeComment, likeAnnouncement, deleteComment } from '../controllers/announcementController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Lấy danh sách thông báo của lớp
router.get('/', protect, getAnnouncements);

// Tạo thông báo mới
router.post('/', protect, createAnnouncement);

// Thêm bình luận vào thông báo
router.post('/:id/comments', protect, addComment);

// Xóa bình luận khỏi thông báo
router.delete('/:id/comments/:commentId', protect, deleteComment);

// Xóa thông báo
router.delete('/:id', protect, deleteAnnouncement);

// Ghim/bỏ ghim thông báo
router.patch('/:id/pin', protect, togglePin);

// Thích/bỏ thích bài đăng
router.put('/:id/like', protect, likeAnnouncement);

// Thích/bỏ thích bình luận
router.put('/:id/comments/:commentId/like', protect, likeComment);

export default router;
