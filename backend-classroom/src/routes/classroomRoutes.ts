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
    getAdminClassroomActivities,
    addStudentToClassroom,
    joinClassroomByCode,
    generateClassroomGoogleSheet,
    linkClassroomGoogleSheet,
    getPendingJoinRequests,
    getTeacherTotalPendingRequestsCount,
    approveJoinRequest,
    rejectJoinRequest,
    approveAllJoinRequests,
    getStudentPendingClasses,
    toggleCloseClassroom
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
// Học sinh tham gia lớp bằng mã
router.post('/join', protect, authorize('student'), joinClassroomByCode);

// Lấy danh sách các lớp đang chờ duyệt của học sinh
router.get('/student/pending', protect, authorize('student'), getStudentPendingClasses);

// Lấy danh sách lớp học của học sinh
router.get('/student', protect, authorize('student'), getStudentClassrooms);

// --- TEACHER ROUTES ---
// Lấy danh sách lớp học của giáo viên
router.get('/teacher', protect, authorize('teacher'), getTeacherClassrooms);

// Lấy tổng số lượng yêu cầu chờ duyệt trên tất cả các lớp của giáo viên
router.get('/teacher/pending-requests-count', protect, authorize('teacher'), getTeacherTotalPendingRequestsCount);

// Lấy danh sách yêu cầu chờ duyệt của 1 lớp
router.get('/:id/join-requests', protect, authorize('teacher'), getPendingJoinRequests);

// Duyệt tất cả học sinh đang chờ vào lớp
router.post('/:id/join-requests/approve-all', protect, authorize('teacher'), approveAllJoinRequests);

// Duyệt 1 học sinh vào lớp
router.post('/:id/join-requests/:requestId/approve', protect, authorize('teacher'), approveJoinRequest);

// Từ chối 1 học sinh gia nhập lớp
router.post('/:id/join-requests/:requestId/reject', protect, authorize('teacher'), rejectJoinRequest);

// Lấy danh sách học sinh của một lớp (dùng cho điểm danh)
router.get('/:id/students', protect, authorize('teacher'), getClassroomStudents);

// Thêm học sinh có sẵn vào lớp
router.post('/:id/students/add', protect, authorize('teacher'), addStudentToClassroom);

// Tạo lớp học mới
router.post('/', protect, authorize('teacher'), createClassroom);

// Cập nhật thông tin lớp học
router.put('/:id', protect, authorize('teacher'), updateClassroom);

// Tạo / cấp Google Sheet cho lớp học
router.post('/:id/google-sheet', protect, authorize('teacher'), generateClassroomGoogleSheet);

// Liên kết Google Sheet cá nhân cho lớp học
router.post('/:id/link-google-sheet', protect, authorize('teacher'), linkClassroomGoogleSheet);

// Đóng / Mở lại lớp học
router.put('/:id/close', protect, authorize('teacher'), toggleCloseClassroom);

// Xóa mềm lớp học (Lưu trữ)
router.delete('/:id/soft', protect, authorize('teacher'), softDeleteClassroom);

// Xóa cứng lớp học (Xóa vĩnh viễn)
router.delete('/:id/hard', protect, authorize('teacher'), hardDeleteClassroom);

// Lấy chi tiết một lớp học (để dưới cùng tránh đè các route tĩnh khác)
router.get('/:id', protect, getClassroomDetail);

export default router;
