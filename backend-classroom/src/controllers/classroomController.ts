import { Request, Response, NextFunction } from 'express';
import { ClassModel } from '../models/Class';
import { AssignmentModel } from '../models/Assignment';
import { SubmissionModel } from '../models/Submission';
import { createAdminNotification } from '../services/notificationService';

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

        if (!['Active', 'Locked'].includes(status)) {
            res.status(400);
            return next(new Error('Trạng thái không hợp lệ'));
        }

        const updatedClass = await ClassModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedClass) {
            res.status(404);
            return next(new Error('Không tìm thấy lớp học'));
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

        const deletedClass = await ClassModel.findByIdAndDelete(id);

        if (!deletedClass) {
            res.status(404);
            return next(new Error('Không tìm thấy lớp học để xóa'));
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
        const classes = await ClassModel.find({ teacherId, status: { $ne: 'Archived' } }).sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách lớp học thành công',
            data: classes
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
        const { className, subject } = req.body;

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
            teacherId
        });

        await newClass.save();

        // Kích hoạt thông báo cho Admin
        const teacherName = (req as any).user?.name || 'Giáo viên';
        await createAdminNotification(
            teacherId,
            'Tạo lớp học mới',
            `Giáo viên ${teacherName} đã tạo lớp học mới: "${className}" - Môn học: ${subject || 'Chưa phân loại'}.`,
            'classroom'
        );

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
        const { className, subject } = req.body;

        const updatedClass = await ClassModel.findOneAndUpdate(
            { _id: id as any, teacherId: teacherId as any },
            { name: className, subject },
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
            { status: 'Archived' },
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
        const classes = await ClassModel.find({ students: studentId, status: { $ne: 'Archived' } })
            .populate('teacherId', 'name avatar')
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
        const latestAssignment = await AssignmentModel.findOne({ classId: id as any })
            .sort({ createdAt: -1 })
            .select('title dueDate');
        
        let currentTopic = latestAssignment ? latestAssignment.title : 'Chưa có bài tập nào';

        // 3. Lấy hoạt động mới nhất:
        // - Tạo bài tập
        const recentAssignments = await AssignmentModel.find({ classId: id as any })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('title createdAt');
            
        // - Lịch sử nộp bài
        const assignmentDocs = await AssignmentModel.find({ classId: id as any }).select('_id');
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
