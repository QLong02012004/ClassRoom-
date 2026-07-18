import { Router } from 'express';
import { getAdminStats, getTeacherDashboardStats, getStudentDashboardStats } from '../controllers/dashboardController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Lấy thống kê tổng quan (Chỉ admin mới được xem)
router.get('/admin', protect, authorize('admin'), getAdminStats);

// Lấy thống kê teacher dashboard
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherDashboardStats);

// Lấy thống kê student dashboard
router.get('/student', protect, authorize('student'), getStudentDashboardStats);

export default router;
