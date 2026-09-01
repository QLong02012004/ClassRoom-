/**
 * ============================================================================
 * TÊN FILE: attendanceRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/attendanceRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Điểm danh (`/api/v1/attendance/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Route Teacher: Lấy trạng thái điểm danh theo ngày (`GET /`), lưu điểm danh (`POST /`), xem lịch sử điểm danh (`GET /history/:classId`).
 * ============================================================================
 */

import { Router } from 'express';
import { getAttendance, saveAttendance, getAttendanceHistory } from '../controllers/attendanceController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Lấy điểm danh theo lớp + ngày: GET /api/v1/attendance?classId=&date=
router.get('/', protect, authorize('teacher'), getAttendance);

// Lưu / cập nhật điểm danh: POST /api/v1/attendance
router.post('/', protect, authorize('teacher'), saveAttendance);

// Lấy lịch sử 5 buổi gần nhất: GET /api/v1/attendance/history/:classId
router.get('/history/:classId', protect, authorize('teacher'), getAttendanceHistory);

export default router;
