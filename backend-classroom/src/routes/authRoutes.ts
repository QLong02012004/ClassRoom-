import { Router } from 'express';
import { login, getMe, createTeacherAccount, createStudentAccount, logout, refreshToken, registerStudentAccount, registerTeacherAccount, googleLogin, verifyEmail, resendOTP } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middlewares/validateMiddleware';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Đăng nhập / Đăng ký bằng Google OAuth 2.0
router.post('/google-login', googleLogin);

// Giáo viên tự đăng ký tài khoản (Trạng thái Pending)
router.post('/register-teacher', validateRegister, registerTeacherAccount);

// [Admin] Tạo tài khoản giáo viên
router.post('/create-teacher', protect, authorize('admin'), validateRegister, createTeacherAccount);

// [Teacher] Tạo tài khoản học sinh
router.post('/create-student', protect, authorize('teacher'), validateRegister, createStudentAccount);

// Học sinh tự đăng ký tài khoản
router.post('/register-student', validateRegister, registerStudentAccount);

// Xác thực Email bằng OTP
router.post('/verify-email', verifyEmail);

// Gửi lại mã OTP
router.post('/resend-otp', resendOTP);

// route login
router.post('/login', validateLogin, login);

// route lấy thông tin cá nhân (yêu cầu access token)
router.get('/me', protect, getMe);

// route làm mới access token bằng refresh token cookie (không cần protect)
router.post('/refresh-token', refreshToken);

// route đăng xuất — xóa cookie refresh_token (yêu cầu access token hợp lệ)
router.post('/logout', protect, logout);

export default router;
