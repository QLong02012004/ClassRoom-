import { Router } from 'express';
import { getAttendance, saveAttendance } from '../controllers/attendanceController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Lấy điểm danh theo lớp + ngày: GET /api/v1/attendance?classId=&date=
router.get('/', protect, authorize('teacher'), getAttendance);

// Lưu / cập nhật điểm danh: POST /api/v1/attendance
router.post('/', protect, authorize('teacher'), saveAttendance);

export default router;
