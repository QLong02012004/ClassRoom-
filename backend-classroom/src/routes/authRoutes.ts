import { Router } from 'express';
import { login, getMe, createTeacherAccount, createStudentAccount, logout, refreshToken } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middlewares/validateMiddleware';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// [Admin] Tạo tài khoản giáo viên
router.post('/create-teacher', protect, authorize('admin'), validateRegister, createTeacherAccount);

// [Teacher] Tạo tài khoản học sinh
router.post('/create-student', protect, authorize('teacher'), validateRegister, createStudentAccount);

// route login
router.post('/login', validateLogin, login);

// route lấy thông tin cá nhân (yêu cầu access token)
router.get('/me', protect, getMe);

// route làm mới access token bằng refresh token cookie (không cần protect)
router.post('/refresh-token', refreshToken);

// route đăng xuất — xóa cookie refresh_token (yêu cầu access token hợp lệ)
router.post('/logout', protect, logout);

export default router;