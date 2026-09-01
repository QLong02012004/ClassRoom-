/**
 * ============================================================================
 * TÊN FILE: activityRoutes.ts
 * ĐƯỜNG DẪN: backend-classroom/src/routes/activityRoutes.ts
 * MỤC ĐÍCH:
 *   Định nghĩa các Endpoints API Quản lý Bài tập & Đề thi (`/api/v1/activities/*`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Phân tuyến giao bài (`/assign`), nộp bài (`/:id/submit`), chấm bài trắc nghiệm (`/:id/submit-quiz`), lấy bài nộp (`/:id/submissions`).
 * ============================================================================
 */

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
    getQuizResults,
    getStudentActivities,
    addComment
} from '../controllers/activityController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

// Các endpoint này liên quan tới classId (giao việc và lấy danh sách của lớp)
// Nên chúng ta sẽ mount vào dạng /classes/:classId/activities
router.post('/classes/:classId/activities', assignActivity);
router.get('/classes/:classId/activities', getClassActivities);

// Lấy toàn bộ bài tập của học sinh
router.get('/activities/student', getStudentActivities);

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
router.post('/activities/:id/my-submission/comments', addComment);

export default router;
