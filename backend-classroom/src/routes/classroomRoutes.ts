import { Router } from 'express';
import { 
    getAdminClassrooms, 
    updateClassroomStatus, 
    deleteClassroom,
    getTeacherClassrooms,
    getClassroomStudents,
    createClassroom,
    updateClassroom,
    softDeleteClassroom,
    hardDeleteClassroom,
    getStudentClassrooms,
    getClassroomDetail,
    getAdminClassroomActivities
} from '../controllers/classroomController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// --- ADMIN ROUTES ---
// Lấy danh sách toàn bộ lớp học (Chỉ admin)
router.get('/admin', protect, authorize('admin'), getAdminClassrooms);

// Cập nhật trạng thái lớp học (Chỉ admin)
router.put('/:id/status', protect, authorize('admin'), updateClassroomStatus);

// Lấy lịch sử hoạt động lớp học (Chỉ admin)
router.get('/admin/:id/activities', protect, authorize('admin'), getAdminClassroomActivities);

// Xóa lớp học vĩnh viễn (Chỉ admin)
router.delete('/:id', protect, authorize('admin'), deleteClassroom);

// --- STUDENT ROUTES ---
// Lấy danh sách lớp học của học sinh
router.get('/student', protect, authorize('student'), getStudentClassrooms);

// --- TEACHER ROUTES ---
// Lấy danh sách lớp học của giáo viên
router.get('/teacher', protect, authorize('teacher'), getTeacherClassrooms);

// Lấy danh sách học sinh của một lớp (dùng cho điểm danh)
router.get('/:id/students', protect, authorize('teacher'), getClassroomStudents);

// Tạo lớp học mới
router.post('/', protect, authorize('teacher'), createClassroom);

// Cập nhật thông tin lớp học
router.put('/:id', protect, authorize('teacher'), updateClassroom);

// Xóa mềm lớp học (Lưu trữ)
router.delete('/:id/soft', protect, authorize('teacher'), softDeleteClassroom);

// Xóa cứng lớp học (Xóa vĩnh viễn)
router.delete('/:id/hard', protect, authorize('teacher'), hardDeleteClassroom);

// Lấy chi tiết một lớp học (để dưới cùng tránh đè các route tĩnh khác)
router.get('/:id', protect, getClassroomDetail);

export default router;
