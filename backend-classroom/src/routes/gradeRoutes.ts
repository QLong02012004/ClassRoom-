/**
 * ============================================================================
 * TÊN FILE: gradeRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/gradeRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Sổ điểm (`/api/v1/grades/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Route Teacher: Lấy Sổ điểm (`GET /`), lưu điểm hàng loạt (`POST /`).
 *   - Route Student: Xem tổng hợp điểm cá nhân (`GET /student`).
 * ============================================================================
 */

import { Router } from 'express';
import { getClassroomGrades, saveGrades, getStudentGrades } from '../controllers/gradeController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.get('/student', protect, authorize('student'), getStudentGrades);

// GET /api/v1/grades?classId=...
router.get('/', protect, authorize('teacher'), getClassroomGrades);

// POST /api/v1/grades
router.post('/', protect, authorize('teacher'), saveGrades);

export default router;
