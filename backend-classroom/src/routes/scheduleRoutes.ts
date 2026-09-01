/**
 * ============================================================================
 * TÊN FILE: scheduleRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/scheduleRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Thời khóa biểu & Lịch dạy (`/api/v1/schedule/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Route Teacher: Lấy lịch dạy (`GET /`), tạo ca học (`POST /`), sửa tiến độ (`PUT /:id`), xóa ca học (`DELETE /:id`).
 * ============================================================================
 */

import { Router } from 'express';
import { getTeacherSchedule, createSchedule, deleteSchedule, updateSchedule } from '../controllers/scheduleController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/v1/schedule
router.get('/', protect, authorize('teacher'), getTeacherSchedule);

// POST /api/v1/schedule
router.post('/', protect, authorize('teacher'), createSchedule);

// PUT /api/v1/schedule/:id
router.put('/:id', protect, authorize('teacher'), updateSchedule);

// DELETE /api/v1/schedule/:id
router.delete('/:id', protect, authorize('teacher'), deleteSchedule);

export default router;
