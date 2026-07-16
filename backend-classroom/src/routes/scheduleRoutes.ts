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
