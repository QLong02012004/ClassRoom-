import { Request, Response, NextFunction } from 'express';
import { ClassModel } from '../models/Class';
import { ClassJoinRequestModel } from '../models/ClassJoinRequest';
import { ClassActivityModel } from '../models/ClassActivity';
import { SubmissionModel } from '../models/Submission';
import { GradeModel } from '../models/Grade';
import { createAdminNotification, createUserNotification } from '../services/notificationService';
import { ClassStatus, NotificationType, UserRole } from '../constants/enums';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { notifyAdminStatsUpdate, notifyTeacherClassroomsUpdate, notifyNotificationUpdate } from '../socket';

// Lấy danh sách toàn bộ lớp học (dành cho Admin)
export const getAdminClassrooms = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        // Lấy danh sách lớp, kèm theo thông tin của giáo viên phụ trách
        const classes = await ClassModel.find()
            .populate('teacherId', 'name avatar') // Sẽ lấy name và avatar của giáo viên
            .sort({ createdAt: -1 });

        // Chuyển đổi định dạng để trả về cho Frontend
        const formattedClasses = classes.map((c) => {
            const cls = c.toObject();
            return {
                id: cls.code, // Trả về mã code làm ID trên FE
                _id: cls._id, // ID thực sự trong DB
                name: cls.name,
                subject: cls.subject || 'Khác',
                teacher: {
                    id: (cls.teacherId as any)?._id || '',
                    name: (cls.teacherId as any)?.name || 'Chưa rõ',
                    avatar: (cls.teacherId as any)?.avatar || ''
                },
                studentCount: cls.students?.length || 0,
                createdAt: cls.createdAt,
                status: cls.status
            };
        });

        res.status(200).json({
            message: 'Lấy danh sách lớp học thành công',
            data: formattedClasses
        });
    } catch (error) {
        next(error);
    }
};

// Cập nhật trạng thái lớp học (Khóa/Mở khóa/Lưu trữ)
export const updateClassroomStatus = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params; // Đây là ObjectId của lớp học trong DB (_id)
        const { status } = req.body;
        const adminId = (req as any).user?.id || 'admin';

        if (!['Active', 'Locked'].includes(status)) {
            res.status(400);
            return next(new Error('Trạng thái không hợp lệ'));
        }

        const existingClass = await ClassModel.findById(id);
        if (!existingClass) {
            res.status(404);
            return next(new Error('Không tìm thấy lớp học'));
        }

        const wasPending = existingClass.status === ClassStatus.PENDING;
        existingClass.status = status as ClassStatus;
        const updatedClass = await existingClass.save();

        // Nếu lớp học được duyệt từ trạng thái Pending -> Active
        if (wasPending && status === 'Active') {
            await createUserNotification(
                existingClass.teacherId as any,
                UserRole.TEACHER,
                adminId,
                'Lớp học đã được duyệt',
                `Lớp học "${existingClass.name}" của bạn đã được quản trị viên duyệt và đang hoạt động.`,
                NotificationType.CLASSROOM
            );
            notifyTeacherClassroomsUpdate(existingClass.teacherId.toString());
            notifyAdminStatsUpdate();
            notifyNotificationUpdate();
        } 
        // Khi Admin Khóa lớp học
        else if (status === 'Locked') {
            await createUserNotification(
                existingClass.teacherId as any,
                UserRole.TEACHER,
                adminId,
                'Lớp học đã bị khóa',
                `Lớp học "${existingClass.name}" của bạn đã bị Quản trị viên hệ thống khóa.`,
                NotificationType.CLASSROOM
            );
            notifyTeacherClassroomsUpdate(existingClass.teacherId.toString());
            notifyAdminStatsUpdate();
            notifyNotificationUpdate();
        }
        // Khi Admin Mở khóa lớp học (Locked -> Active)
        else if (!wasPending && status === 'Active') {
            await createUserNotification(
                existingClass.teacherId as any,
                UserRole.TEACHER,
                adminId,
                'Lớp học đã được mở khóa',
                `Lớp học "${existingClass.name}" của bạn đã được Quản trị viên hệ thống mở khóa.`,
                NotificationType.CLASSROOM
            );
            notifyTeacherClassroomsUpdate(existingClass.teacherId.toString());
            notifyAdminStatsUpdate();
            notifyNotificationUpdate();
        }

        res.status(200).json({
            message: 'Cập nhật trạng thái lớp học thành công',
            data: updatedClass
        });
    } catch (error) {
        next(error);
    }
};

// Xóa lớp học vĩnh viễn
export const deleteClassroom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const adminId = (req as any).user?.id || 'admin';

        const classToDelete = await ClassModel.findById(id);
        if (!classToDelete) {
            res.status(404);
            return next(new Error('Không tìm thấy lớp học để xóa'));
        }

        const isPending = classToDelete.status === ClassStatus.PENDING;

        await ClassModel.findByIdAndDelete(id);

        if (isPending) {
            await createUserNotification(
                classToDelete.teacherId as any,
                UserRole.TEACHER,
                adminId,
                'Lớp học bị từ chối',
                `Yêu cầu tạo lớp học "${classToDelete.name}" của bạn đã bị quản trị viên từ chối và bị xóa khỏi hệ thống.`,
                NotificationType.WARNING
            );
            notifyTeacherClassroomsUpdate(classToDelete.teacherId.toString());
        }

        res.status(200).json({
            message: 'Đã xóa lớp học thành công'
        });
    } catch (error) {
        next(error);
    }
};

// --- TEACHER METHODS ---

// Lấy danh sách lớp của giáo viên
export const getTeacherClassrooms = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const teacherId = (req as any).user?.id;
        const classes = await ClassModel.find({ teacherId, status: { $ne: ClassStatus.ARCHIVED } }).sort({ createdAt: -1 });

        // Bổ sung thông tin "nóng" cho từng lớp học
        const enrichedClasses = await Promise.all(classes.map(async (cls) => {
            const classObj = cls.toObject();

            // Lấy danh sách bài tập của lớp này
            const assignments = await ClassActivityModel.find({ classId: cls._id }).select('_id title dueDate');
            const assignmentIds = assignments.map(a => a._id);

            // Bài tập hết hạn gần nhất (để hiển thị "Bài tập mới nhất")
            const latestAssignment = assignments.sort((a, b) =>
                new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
            )[0];

            // Đếm số bài nộp chưa được chấm điểm
            let pendingGrades = 0;
            if (assignmentIds.length > 0) {
                const submissionCount = await SubmissionModel.countDocuments({ assignmentId: { $in: assignmentIds } });
                const gradeCount = await GradeModel.countDocuments({ assignmentId: { $in: assignmentIds } });
                pendingGrades = Math.max(0, submissionCount - gradeCount);
            }

            // Đếm số học sinh đang chờ duyệt gia nhập lớp
            const pendingRequestsCount = await ClassJoinRequestModel.countDocuments({ classId: cls._id, status: 'pending' });

            return {
                ...classObj,
                pendingGrades,
                pendingRequestsCount,
                latestAssignmentTitle: latestAssignment?.title || null,
                latestAssignmentDue: latestAssignment?.dueDate || null,
            };
        }));

        res.status(200).json({
            message: 'Lấy danh sách lớp học thành công',
            data: enrichedClasses
        });
    } catch (error) {
        next(error);
    }
};


// Lấy danh sách học sinh của một lớp (dùng cho điểm danh)
export const getClassroomStudents = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const teacherId = (req as any).user?.id;

        const classroom = await ClassModel.findOne({ _id: id as any, teacherId: teacherId as any })
            .populate('students', 'name avatar email parentPhone');

        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền truy cập' });
        }

        res.status(200).json({
            message: 'Lấy danh sách học sinh thành công',
            data: classroom.students
        });
    } catch (error) {
        next(error);
    }
};

// Thêm học sinh có sẵn vào lớp
export const addStudentToClassroom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id: classId } = req.params;
        const teacherId = (req as any).user?.id;
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({ message: 'Thiếu ID học sinh' });
        }

        const classroom = await ClassModel.findOne({ _id: classId as any, teacherId: teacherId as any });

        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền thao tác' });
        }

        // Kiểm tra xem học sinh đã có trong lớp chưa
        const isStudentExist = classroom.students.some(id => id.toString() === studentId);
        if (isStudentExist) {
            return res.status(400).json({ message: 'Học sinh này đã có trong lớp học rồi!' });
        }

        // Thêm học sinh vào mảng students
        classroom.students.push(studentId as any);
        await classroom.save();

        // Gửi thông báo cho Admin
        const teacherName = (req as any).user?.name || 'Giáo viên';
        await createAdminNotification(
            teacherId,
            'Thêm học sinh mới vào lớp',
            `Giáo viên ${teacherName} vừa thêm học sinh vào lớp học "${classroom.name}".`,
            NotificationType.CLASSROOM
        );

        notifyAdminStatsUpdate();

        res.status(200).json({
            message: 'Đã thêm học sinh vào lớp thành công',
            data: classroom
        });
    } catch (error) {
        next(error);
    }
};


// Hàm sinh mã ngẫu nhiên 6 ký tự
const generateClassCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Tạo lớp học mới
export const createClassroom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const teacherId = (req as any).user?.id;
        const { className, subject, requireApproval } = req.body;

        if (!className) {
            return res.status(400).json({ message: 'Tên lớp học là bắt buộc' });
        }

        let code = generateClassCode();
        let isCodeUnique = false;
        // Đảm bảo code là duy nhất
        while (!isCodeUnique) {
            const existingClass = await ClassModel.findOne({ code });
            if (!existingClass) {
                isCodeUnique = true;
            } else {
                code = generateClassCode();
            }
        }

        const newClass = new ClassModel({
            name: className,
            subject: subject || '',
            code,
            teacherId,
            status: ClassStatus.PENDING,
            requireApproval: requireApproval !== undefined ? Boolean(requireApproval) : true
        });

        try {
            const teacherEmail = (req as any).user?.email;
            const sheetResult = await GoogleSheetsService.createSheetForClassroom(className, teacherEmail);
            if (sheetResult) {
                newClass.googleSheetId = sheetResult.sheetId;
                newClass.googleSheetUrl = sheetResult.sheetUrl;
            }
        } catch (sheetErr: any) {
            console.error('[createClassroom GoogleSheet Non-blocking Error]:', sheetErr?.message || sheetErr);
        }

        await newClass.save();

        // Kích hoạt thông báo cho Admin
        const teacherName = (req as any).user?.name || 'Giáo viên';
        await createAdminNotification(
            teacherId,
            'Tạo lớp học mới',
            `Giáo viên ${teacherName} đã tạo lớp học mới: "${className}" - Môn học: ${subject || 'Chưa phân loại'}.`,
            NotificationType.CLASSROOM
        );

        notifyAdminStatsUpdate();

        res.status(201).json({
            message: 'Tạo lớp học thành công',
            data: newClass
        });
    } catch (error) {
        next(error);
    }
};

// Cập nhật thông tin lớp học
export const updateClassroom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const teacherId = (req as any).user?.id;
        const { className, subject, requireApproval } = req.body;

        const updatedClass = await ClassModel.findOneAndUpdate(
            { _id: id as any, teacherId: teacherId as any },
            { name: className, subject, requireApproval: Boolean(requireApproval) },
            { new: true }
        );

        if (!updatedClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền sửa' });
        }

        res.status(200).json({
            message: 'Cập nhật lớp học thành công',
            data: updatedClass
        });
    } catch (error) {
        next(error);
    }
};

// Xóa mềm lớp học (Archived)
export const softDeleteClassroom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const teacherId = (req as any).user?.id;

        const deletedClass = await ClassModel.findOneAndUpdate(
            { _id: id as any, teacherId: teacherId as any },
            { status: ClassStatus.ARCHIVED },
            { new: true }
        );

        if (!deletedClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền xóa' });
        }

        res.status(200).json({
            message: 'Đã lưu trữ lớp học thành công',
            data: deletedClass
        });
    } catch (error) {
        next(error);
    }
};

// Xóa cứng lớp học (Delete)
export const hardDeleteClassroom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const teacherId = (req as any).user?.id;

        const deletedClass = await ClassModel.findOneAndDelete({ _id: id as any, teacherId: teacherId as any });

        if (!deletedClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền xóa' });
        }

        res.status(200).json({
            message: 'Đã xóa lớp học vĩnh viễn',
            data: deletedClass
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách lớp học của học sinh
export const getStudentClassrooms = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const studentId = (req as any).user?.id;
        const classes = await ClassModel.find({ students: studentId, status: { $ne: ClassStatus.ARCHIVED } })
            .populate('teacherId', 'name avatar')
            .populate('students', 'name avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách lớp học thành công',
            data: classes
        });
    } catch (error) {
        next(error);
    }
};

// Lấy thông tin chi tiết một lớp học
export const getClassroomDetail = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const classroom = await ClassModel.findById(id).populate('teacherId', 'name avatar');
        if (!classroom) {
            return res.status(404).json({ message: 'Lớp học không tồn tại hoặc đã bị xóa!' });
        }

        const userRole = (req as any).user?.role;
        if (classroom.status === ClassStatus.LOCKED && userRole !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Lớp học này đã bị Quản trị viên hệ thống khóa và không thể truy cập.' });
        }

        res.status(200).json({
            message: 'Lấy chi tiết lớp học thành công',
            data: classroom
        });
    } catch (error) {
        next(error);
    }
};

// Lấy lịch sử hoạt động chi tiết của lớp học dành cho Admin
export const getAdminClassroomActivities = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;

        // 1. Kiểm tra lớp học
        const classroom = await ClassModel.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        // 2. Lấy chủ đề bài giảng hiện tại (Bài tập mới nhất)
        const latestAssignment = await ClassActivityModel.findOne({ classId: id as any })
            .sort({ createdAt: -1 })
            .select('title dueDate');

        let currentTopic = latestAssignment ? latestAssignment.title : 'Chưa có bài tập nào';

        // 3. Lấy hoạt động mới nhất:
        // - Tạo bài tập
        const recentAssignments = await ClassActivityModel.find({ classId: id as any })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('title createdAt');

        // - Lịch sử nộp bài
        const assignmentDocs = await ClassActivityModel.find({ classId: id as any }).select('_id');
        const assignmentIds = assignmentDocs.map(doc => doc._id);
        const recentSubmissions = await SubmissionModel.find({ assignmentId: { $in: assignmentIds } })
            .sort({ submittedAt: -1 })
            .limit(5)
            .populate('studentId', 'name')
            .populate('assignmentId', 'title');

        // Gộp chung 2 mảng này và format lại, sort theo thời gian mới nhất
        const activities: any[] = [];

        recentAssignments.forEach(a => {
            activities.push({
                type: 'assignment_created',
                content: `Giáo viên đã tạo bài tập "${a.title}"`,
                time: a.createdAt
            });
        });

        recentSubmissions.forEach((s: any) => {
            activities.push({
                type: 'submission',
                content: `Học sinh ${s.studentId?.name || 'Ẩn danh'} vừa nộp bài tập "${s.assignmentId?.title || ''}"`,
                time: s.submittedAt
            });
        });

        // Sắp xếp lại danh sách hoạt động theo thời gian giảm dần
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        res.status(200).json({
            message: 'Lấy hoạt động lớp học thành công',
            data: {
                currentTopic,
                recentActivities: activities.slice(0, 5) // Chỉ lấy 5 sự kiện mới nhất
            }
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/classrooms/join
// Học sinh tham gia lớp học bằng mã code
export const joinClassroomByCode = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const studentId = (req as any).user?.id;
        const { code } = req.body;

        if (!code) {
            res.status(400);
            return next(new Error('Vui lòng nhập mã lớp học'));
        }

        if (!studentId) {
            res.status(401);
            return next(new Error('Chưa đăng nhập'));
        }

        // Tìm lớp học theo mã
        const targetClass = await ClassModel.findOne({ code });

        if (!targetClass) {
            res.status(404);
            return next(new Error('Mã lớp học không tồn tại'));
        }

        if (targetClass.status === ClassStatus.LOCKED || targetClass.status === ClassStatus.ARCHIVED) {
            res.status(400);
            return next(new Error('Lớp học này đã bị khóa hoặc không còn hoạt động'));
        }

        // Kiểm tra xem học sinh đã có trong lớp chưa
        const isAlreadyEnrolled = targetClass.students.some(
            (sId) => sId.toString() === studentId.toString()
        );

        if (isAlreadyEnrolled) {
            res.status(400);
            return next(new Error('Bạn đã tham gia lớp học này rồi'));
        }

        // Nếu lớp học BẬT tùy chọn "Yêu cầu duyệt học sinh" (mặc định là true cho tất cả lớp tham gia bằng mã)
        if (targetClass.requireApproval !== false) {
            const existingReq = await ClassJoinRequestModel.findOne({
                classId: targetClass._id,
                studentId: studentId as any
            });

            if (existingReq) {
                if (existingReq.status === 'pending') {
                    return res.status(400).json({
                        message: `Đã gửi yêu cầu tham gia lớp "${targetClass.name}". Vui lòng chờ giáo viên duyệt!`
                    });
                } else if (existingReq.status === 'rejected') {
                    existingReq.status = 'pending';
                    await existingReq.save();
                    return res.status(200).json({
                        message: `Đã gửi lại yêu cầu tham gia lớp "${targetClass.name}". Vui lòng chờ giáo viên duyệt!`,
                        data: {
                            status: 'pending_approval',
                            className: targetClass.name
                        }
                    });
                }
            } else {
                await ClassJoinRequestModel.create({
                    classId: targetClass._id,
                    studentId,
                    status: 'pending'
                });
            }

            return res.status(200).json({
                message: `Đã gửi yêu cầu tham gia lớp "${targetClass.name}". Vui lòng chờ giáo viên duyệt!`,
                data: {
                    status: 'pending_approval',
                    className: targetClass.name
                }
            });
        }

        // Nếu lớp không yêu cầu duyệt: Thêm học sinh trực tiếp vào lớp
        targetClass.students.push(studentId);
        await targetClass.save();

        res.status(200).json({
            message: 'Tham gia lớp học thành công',
            data: {
                classId: targetClass._id,
                className: targetClass.name
            }
        });
    } catch (error) {
        next(error);
    }
};

// Cấp / Khởi tạo thủ công Google Sheet cho Lớp học hiện tại
export const generateClassroomGoogleSheet = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const teacherEmail = (req as any).user?.email;

        const classroom = await ClassModel.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        // Nếu đã có Google Sheet từ trước thì trả về luôn
        if (classroom.googleSheetId && classroom.googleSheetUrl) {
            return res.status(200).json({
                message: 'Lớp học đã có Google Sheet',
                data: classroom
            });
        }

        try {
            const sheetResult = await GoogleSheetsService.createSheetForClassroom(classroom.name, teacherEmail);
            classroom.googleSheetId = sheetResult.sheetId;
            classroom.googleSheetUrl = sheetResult.sheetUrl;
            await classroom.save();

            return res.status(200).json({
                message: 'Tạo Google Sheet thành công',
                data: classroom
            });
        } catch (sheetErr: any) {
            console.error('[generateClassroomGoogleSheet Lỗi]:', sheetErr);
            return res.status(500).json({
                message: sheetErr?.message || 'Khởi tạo Google Sheet thất bại'
            });
        }
    } catch (error) {
        next(error);
    }
};

// Liên kết Google Sheet cá nhân cho Lớp học
export const linkClassroomGoogleSheet = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { googleSheetUrl } = req.body;

        if (!googleSheetUrl) {
            return res.status(400).json({ message: 'Đường dẫn Google Sheet là bắt buộc' });
        }

        const classroom = await ClassModel.findById(id);
        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        // Extract Google Sheet ID từ URL bằng Regex
        const match = googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        const extractedSheetId = match ? match[1] : (googleSheetUrl.length > 20 ? googleSheetUrl.trim() : null);

        if (!extractedSheetId) {
            return res.status(400).json({ message: 'Đường dẫn Google Sheet không hợp lệ. Vui lòng dán link định dạng: https://docs.google.com/spreadsheets/d/...' });
        }

        classroom.googleSheetId = extractedSheetId;
        classroom.googleSheetUrl = `https://docs.google.com/spreadsheets/d/${extractedSheetId}`;
        await classroom.save();

        // Khởi tạo Tiêu đề tự động nếu Sheet còn trống
        GoogleSheetsService.initSheetHeaderIfEmpty(extractedSheetId).catch(err => {
            console.error('[linkClassroomGoogleSheet initHeader Error]:', err);
        });

        res.status(200).json({
            message: 'Liên kết Google Sheet thành công',
            data: classroom
        });
    } catch (error) {
        next(error);
    }
};

// --- JOIN REQUEST APPROVAL METHODS ---

// Lấy danh sách yêu cầu chờ duyệt của 1 lớp
export const getPendingJoinRequests = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id: classId } = req.params;
        const teacherId = (req as any).user?.id;

        const classroom = await ClassModel.findOne({ _id: classId as any, teacherId: teacherId as any });
        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền' });
        }

        const requests = await ClassJoinRequestModel.find({ classId: classId as any, status: 'pending' })
            .populate('studentId', 'name email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách yêu cầu chờ duyệt thành công',
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// Lấy tổng số lượng yêu cầu chờ duyệt trên tất cả các lớp của giáo viên
export const getTeacherTotalPendingRequestsCount = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const teacherId = (req as any).user?.id;
        const teacherClasses = await ClassModel.find({ teacherId: teacherId as any, status: { $ne: ClassStatus.ARCHIVED } }).select('_id');
        const classIds = teacherClasses.map(c => c._id);

        const totalPendingCount = await ClassJoinRequestModel.countDocuments({
            classId: { $in: classIds },
            status: 'pending'
        });

        res.status(200).json({
            message: 'Lấy tổng số yêu cầu chờ duyệt thành công',
            data: { totalPendingCount }
        });
    } catch (error) {
        next(error);
    }
};

// Duyệt 1 học sinh vào lớp
export const approveJoinRequest = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id: classId, requestId } = req.params;
        const teacherId = (req as any).user?.id;

        const classroom = await ClassModel.findOne({ _id: classId as any, teacherId: teacherId as any });
        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền' });
        }

        const joinReq = await ClassJoinRequestModel.findById(requestId);
        if (!joinReq || joinReq.classId.toString() !== classId) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu tham gia' });
        }

        // Thêm học sinh vào mảng students của lớp (nếu chưa có)
        const isExist = classroom.students.some(sId => sId.toString() === joinReq.studentId.toString());
        if (!isExist) {
            classroom.students.push(joinReq.studentId);
            await classroom.save();
        }

        joinReq.status = 'approved';
        await joinReq.save();

        res.status(200).json({
            message: 'Đã duyệt học sinh vào lớp thành công',
            data: joinReq
        });
    } catch (error) {
        next(error);
    }
};

// Từ chối 1 học sinh
export const rejectJoinRequest = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id: classId, requestId } = req.params;
        const teacherId = (req as any).user?.id;

        const classroom = await ClassModel.findOne({ _id: classId as any, teacherId: teacherId as any });
        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền' });
        }

        const joinReq = await ClassJoinRequestModel.findById(requestId);
        if (!joinReq || joinReq.classId.toString() !== classId) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu tham gia' });
        }

        joinReq.status = 'rejected';
        await joinReq.save();

        res.status(200).json({
            message: 'Đã từ chối yêu cầu tham gia của học sinh',
            data: joinReq
        });
    } catch (error) {
        next(error);
    }
};

// Duyệt tất cả học sinh đang chờ
export const approveAllJoinRequests = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id: classId } = req.params;
        const teacherId = (req as any).user?.id;

        const classroom = await ClassModel.findOne({ _id: classId as any, teacherId: teacherId as any });
        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền' });
        }

        const pendingRequests = await ClassJoinRequestModel.find({ classId: classId as any, status: 'pending' });
        if (pendingRequests.length === 0) {
            return res.status(200).json({ message: 'Không có yêu cầu nào cần duyệt', data: { approvedCount: 0 } });
        }

        const studentIdsToAdd = pendingRequests.map(r => r.studentId);
        studentIdsToAdd.forEach(sId => {
            if (!classroom.students.some(existingId => existingId.toString() === sId.toString())) {
                classroom.students.push(sId);
            }
        });
        await classroom.save();

        await ClassJoinRequestModel.updateMany(
            { classId: classId as any, status: 'pending' },
            { status: 'approved' }
        );

        res.status(200).json({
            message: `Đã duyệt thành công ${pendingRequests.length} học sinh vào lớp!`,
            data: { approvedCount: pendingRequests.length }
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách các lớp học sinh đang chờ duyệt
export const getStudentPendingClasses = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const studentId = (req as any).user?.id;
        const pendingReqs = await ClassJoinRequestModel.find({ studentId: studentId as any, status: 'pending' })
            .populate({
                path: 'classId',
                select: 'name subject code teacherId createdAt',
                populate: { path: 'teacherId', select: 'name avatar' }
            })
            .sort({ createdAt: -1 });

        const pendingClasses = pendingReqs
            .filter(r => r.classId)
            .map(r => ({
                requestId: r._id,
                requestedAt: r.createdAt,
                class: r.classId
            }));

        res.status(200).json({
            message: 'Lấy danh sách lớp đang chờ duyệt thành công',
            data: pendingClasses
        });
    } catch (error) {
        next(error);
    }
};

// Chuyển đổi trạng thái Đóng/Mở lớp học (Chỉ dành cho Giáo viên)
export const toggleCloseClassroom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const teacherId = (req as any).user?.id;

        const classroom = await ClassModel.findOne({ _id: id as string, teacherId });

        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền thao tác' });
        }

        if (classroom.status === ClassStatus.LOCKED || classroom.status === ClassStatus.PENDING || classroom.status === ClassStatus.ARCHIVED) {
            return res.status(400).json({ message: 'Không thể đóng/mở lớp học ở trạng thái này' });
        }

        classroom.status = classroom.status === ClassStatus.ACTIVE ? ClassStatus.CLOSED : ClassStatus.ACTIVE;
        await classroom.save();

        res.status(200).json({
            message: classroom.status === ClassStatus.CLOSED ? 'Đã đóng lớp học thành công' : 'Đã mở lại lớp học thành công',
            data: classroom
        });
    } catch (error) {
        next(error);
    }
};
