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
