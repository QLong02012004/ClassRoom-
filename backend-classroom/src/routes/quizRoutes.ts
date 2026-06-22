import { Router } from 'express';
import {
    createQuiz,
    getQuizzesByClass,
    getQuizById,
    submitQuiz,
    getMyQuizResult,
    getQuizResults,
    updateQuiz
} from '../controllers/quizController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Giáo viên tạo đề trắc nghiệm mới
router.post('/', protect, authorize('teacher'), createQuiz);

// Giáo viên chỉnh sửa đề trắc nghiệm
router.put('/:id', protect, authorize('teacher'), updateQuiz);

// Lấy danh sách đề trắc nghiệm (GET /api/v1/quizzes?classId=...)
router.get('/', protect, authorize('teacher', 'student'), getQuizzesByClass);

// Lấy chi tiết đề trắc nghiệm
router.get('/:id', protect, authorize('teacher', 'student'), getQuizById);

// Học sinh nộp bài trắc nghiệm
router.post('/:id/submit', protect, authorize('student'), submitQuiz);

// Học sinh lấy bài làm và kết quả cá nhân
router.get('/:id/my-result', protect, authorize('student'), getMyQuizResult);

// Giáo viên xem bảng điểm trắc nghiệm của lớp
router.get('/:id/results', protect, authorize('teacher'), getQuizResults);

export default router;
