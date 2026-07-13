import express from 'express';
import {
    assignActivity,
    getClassActivities,
    getActivityById,
    updateActivity,
    deleteActivity,
    submitActivity,
    getMySubmission,
    getAssignmentSubmissions,
    getMyQuizResult,
    getQuizResults
} from '../controllers/activityController';
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

// Các endpoint nộp bài tập & trắc nghiệm
router.post('/activities/:id/submit', submitActivity);
router.get('/activities/:id/my-submission', getMySubmission);
router.get('/activities/:id/submissions', getAssignmentSubmissions);
router.get('/activities/:id/my-result', getMyQuizResult);
router.get('/activities/:id/results', getQuizResults);

export default router;
