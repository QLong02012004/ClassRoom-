/**
 * ============================================================================
 * TÊN FILE: analyticsRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/analyticsRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API AI Learning Analytics (`/api/v1/analytics/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `/student/weakness`: Lấy dữ liệu biểu đồ Radar phân tích lỗ hổng kiến thức.
 *   - `/practice`: Sinh bộ câu hỏi trắc nghiệm tự luyện tập ôn bù khuyết thiếu theo tag.
 *   - `/class/:id/errors`: Phân tích thống kê các câu hỏi bị học sinh làm sai nhiều nhất.
 * ============================================================================
 */

import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../constants/enums';
import { getStudentWeaknessRadar, getActivityErrorInsights, getPracticeQuestions } from '../controllers/analyticsController';

const router = express.Router();

// Route cho học sinh xem vùng kiến thức yếu
router.get('/student/weakness', protect, authorize(UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER), getStudentWeaknessRadar);

// Route cho học sinh luyện tập trắc nghiệm dựa trên tag
router.get('/practice', protect, authorize(UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER), getPracticeQuestions);

// Route cho giáo viên xem phân tích lỗi sai của bài tập
router.get('/class/:id/errors', protect, authorize(UserRole.TEACHER, UserRole.ADMIN), getActivityErrorInsights);

export default router;
