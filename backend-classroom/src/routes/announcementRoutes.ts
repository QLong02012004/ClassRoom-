import { Router } from 'express';
import { getAnnouncements, createAnnouncement, addComment, deleteAnnouncement } from '../controllers/announcementController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Lấy danh sách thông báo của lớp
router.get('/', protect, getAnnouncements);

// Tạo thông báo mới
router.post('/', protect, createAnnouncement);

// Thêm bình luận vào thông báo
router.post('/:id/comments', protect, addComment);

// Xóa thông báo
router.delete('/:id', protect, deleteAnnouncement);

export default router;
