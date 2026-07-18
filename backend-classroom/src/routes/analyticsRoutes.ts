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
