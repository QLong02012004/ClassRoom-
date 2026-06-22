import { Router } from 'express';
import { getUsers, updateUserStatus, updateUserRole, resetUserPassword, deleteUser, updateProfile, changePassword } from '../controllers/userController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Lấy danh sách người dùng (Chỉ admin hoặc teacher mới được xem)
router.get('/', protect, authorize('admin', 'teacher'), getUsers);

// Cập nhật trạng thái khóa / mở khóa (Admin hoặc Teacher)
router.put('/:id/status', protect, authorize('admin', 'teacher'), updateUserStatus);

// Đổi vai trò (Chỉ Admin)
router.put('/:id/role', protect, authorize('admin'), updateUserRole);

// Cập nhật hồ sơ cá nhân
router.put('/profile', protect, updateProfile);

// Tự đổi mật khẩu
router.put('/change-password', protect, changePassword);

// Reset mật khẩu (Admin hoặc Teacher)
router.put('/:id/reset-password', protect, authorize('admin', 'teacher'), resetUserPassword);

// Xóa tài khoản (Chỉ Admin)
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;
