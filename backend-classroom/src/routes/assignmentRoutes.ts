import { Router } from 'express';
import {
    getAssignments,
    createAssignment,
    getAssignmentById,
    getStudentAssignments,
    submitAssignment,
    getMySubmission,
    getAssignmentSubmissions
} from '../controllers/assignmentController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Lấy danh sách bài tập của học sinh (tất cả các lớp tham gia)
router.get('/student', protect, authorize('student'), getStudentAssignments);

// Lấy chi tiết bài tập
router.get('/:id', protect, authorize('teacher', 'student'), getAssignmentById);

// Học sinh nộp bài tập
router.post('/:id/submit', protect, authorize('student'), submitAssignment);

// Học sinh lấy bài nộp cá nhân
router.get('/:id/my-submission', protect, authorize('student'), getMySubmission);

// Giáo viên lấy toàn bộ bài nộp của học sinh
router.get('/:id/submissions', protect, authorize('teacher'), getAssignmentSubmissions);

// GET /api/v1/assignments?classId=...
router.get('/', protect, authorize('teacher', 'student'), getAssignments);

// POST /api/v1/assignments
router.post('/', protect, authorize('teacher'), createAssignment);

export default router;
