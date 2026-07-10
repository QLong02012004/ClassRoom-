import express from 'express';
import { assignActivity, getClassActivities, getActivityById, updateActivity, deleteActivity } from '../controllers/activityController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

// Các endpoint này liên quan tới classId (giao việc và lấy danh sách của lớp)
// Nên chúng ta sẽ mount vào dạng /classes/:classId/activities
router.post('/classes/:classId/activities', assignActivity);
router.get('/classes/:classId/activities', getClassActivities);

// Các endpoint thao tác trực tiếp trên 1 activity
router.get('/activities/:id', getActivityById);
router.put('/activities/:id', updateActivity);
router.delete('/activities/:id', deleteActivity);

export default router;
