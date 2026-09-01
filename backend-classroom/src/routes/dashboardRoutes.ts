/**
 * ============================================================================
 * TÊN FILE: dashboardRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/dashboardRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Thống kê Dashboard (`/api/v1/dashboard/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `/admin`: API số liệu tổng quan hệ thống dành cho Admin.
 *   - `/teacher`: API thống kê phổ điểm & học sinh nguy cơ dành cho Giáo viên.
 *   - `/student`: API thống kê tiến độ học tập & điểm XP dành cho Học sinh.
 *   - `/student/leaderboard`: API Bảng xếp hạng vinh danh Học sinh theo XP.
 * ============================================================================
 */

import { Router } from 'express';
import { getAdminStats, getTeacherDashboardStats, getStudentDashboardStats, getLeaderboard } from '../controllers/dashboardController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Lấy thống kê tổng quan (Chỉ admin mới được xem)
router.get('/admin', protect, authorize('admin'), getAdminStats);

// Lấy thống kê teacher dashboard
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherDashboardStats);

// Lấy thống kê student dashboard
router.get('/student', protect, authorize('student'), getStudentDashboardStats);

// Lấy leaderboard theo classId
router.get('/student/leaderboard', protect, authorize('student'), getLeaderboard);

export default router;
