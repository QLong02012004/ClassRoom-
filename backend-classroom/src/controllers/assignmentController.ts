import { Request, Response, NextFunction } from 'express';
import { AssignmentModel } from '../models/Assignment';
import { ClassModel } from '../models/Class';
import { SubmissionModel } from '../models/Submission';
import { GradeModel } from '../models/Grade';
import { createAdminNotification } from '../services/notificationService';

// Lấy danh sách bài tập của một lớp
export const getAssignments = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId } = req.query;
        if (!classId) {
            return res.status(400).json({ message: 'Thiếu classId' });
        }

        const assignments = await AssignmentModel.find({ classId: classId as string })
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách bài tập thành công',
            data: assignments
        });
    } catch (error) {
        next(error);
    }
};

// Tạo bài tập mới
export const createAssignment = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId, title, description, dueDate, maxScore, category } = req.body || {};
        const teacherId = (req as any).user?.id;

        if (!classId || !title || !dueDate) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (classId, title, dueDate)' });
        }

        // Kiểm tra xem lớp học có thuộc về giáo viên này không
        const classroom = await ClassModel.findOne({ _id: classId, teacherId });
        if (!classroom) {
            return res.status(403).json({ message: 'Bạn không có quyền giao bài tập cho lớp học này' });
        }

        const assignment = await AssignmentModel.create({
            classId,
            title,
            description,
            dueDate: new Date(dueDate),
            maxScore: maxScore || 10,
            category: category || '15phut'
        });

        // Kích hoạt thông báo cho Admin
        const teacherName = (req as any).user?.name || 'Giáo viên';
        await createAdminNotification(
            teacherId,
            'Giao bài tập mới',
            `Giáo viên ${teacherName} đã giao bài tập tự luận mới: "${title}" trong lớp "${classroom.name}".`,
            'assignment'
        );

        res.status(201).json({
            message: 'Tạo bài tập thành công',
            data: assignment
        });
    } catch (error) {
        next(error);
    }
};

// Lấy chi tiết một bài tập
export const getAssignmentById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const assignment = await AssignmentModel.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }
        res.status(200).json({
            message: 'Lấy chi tiết bài tập thành công',
            data: assignment
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách bài tập dành cho Học sinh (kèm trạng thái nộp bài và điểm số)
export const getStudentAssignments = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const studentId = (req as any).user?.id;
        // Tìm các lớp học mà học sinh này đang tham gia
        const classrooms = await ClassModel.find({ students: studentId });
        const classIds = classrooms.map(c => c._id);

        // Lấy toàn bộ bài tập của những lớp này
        const assignments = await AssignmentModel.find({ classId: { $in: classIds } })
            .sort({ dueDate: 1 });

        const assignmentIds = assignments.map(a => a._id);

        // Lấy các bài nộp của học sinh này
        const submissions = await SubmissionModel.find({
            studentId,
            assignmentId: { $in: assignmentIds }
        });

        // Lấy điểm số của học sinh này
        const grades = await GradeModel.find({
            studentId,
            assignmentId: { $in: assignmentIds }
        });

        // Kết hợp dữ liệu tương thích với mockDb ở Frontend
        const data = assignments.map(assign => {
            const sub = submissions.find(s => s.assignmentId.toString() === assign._id.toString());
            const grade = grades.find(g => g.assignmentId.toString() === assign._id.toString());
            const cls = classrooms.find(c => c._id.toString() === assign.classId.toString());

            let formattedSubmission = null;
            if (sub) {
                formattedSubmission = {
                    _id: sub._id,
                    assignmentId: sub.assignmentId,
                    studentId: sub.studentId,
                    submissionText: sub.submissionText,
                    attachments: sub.attachments,
                    submittedAt: sub.submittedAt,
                    status: grade ? 'graded' : sub.status,
                    grade: grade ? grade.score : null,
                    feedback: grade ? grade.feedback : null
                };
            } else if (grade) {
                formattedSubmission = {
                    status: 'graded',
                    grade: grade.score,
                    feedback: grade.feedback,
                    submittedAt: grade.gradedAt,
                    attachments: []
                };
            }

            return {
                ...assign.toObject(),
                className: cls ? cls.name : 'Lớp học',
                subject: cls ? cls.subject : '',
                submission: formattedSubmission
            };
        });

        res.status(200).json({
            message: 'Lấy danh sách bài tập của học sinh thành công',
            data
        });
    } catch (error) {
        next(error);
    }
};

// Học sinh nộp bài tập
export const submitAssignment = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params; // assignmentId
        const studentId = (req as any).user?.id;
        const { submissionText, attachments } = req.body || {};

        const assignment = await AssignmentModel.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }

        // Kiểm tra xem học sinh có tham gia lớp này không
        const classroom = await ClassModel.findOne({ _id: assignment.classId, students: studentId });
        if (!classroom) {
            return res.status(403).json({ message: 'Bạn không có quyền nộp bài tập cho lớp học này' });
        }

        // Tính toán xem nộp muộn hay không
        const isLate = new Date().getTime() > new Date(assignment.dueDate).getTime();
        const status = isLate ? 'late' : 'submitted';

        // Cập nhật hoặc tạo mới bài nộp
        const submission = await SubmissionModel.findOneAndUpdate(
            { assignmentId: id as any, studentId: studentId as any },
            {
                submissionText: submissionText || '',
                attachments: attachments || [],
                status,
                submittedAt: new Date()
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: 'Nộp bài tập thành công',
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

// Học sinh lấy bài nộp của bản thân
export const getMySubmission = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params; // assignmentId
        const studentId = (req as any).user?.id;

        const submission = await SubmissionModel.findOne({ assignmentId: id as any, studentId: studentId as any });
        const grade = await GradeModel.findOne({ assignmentId: id as any, studentId: studentId as any });

        let data = null;
        if (submission) {
            data = {
                ...submission.toObject(),
                grade: grade ? grade.score : null,
                feedback: grade ? grade.feedback : null,
                status: grade ? 'graded' : submission.status
            };
        } else if (grade) {
            data = {
                assignmentId: id,
                studentId,
                status: 'graded',
                grade: grade.score,
                feedback: grade.feedback,
                submittedAt: grade.gradedAt,
                attachments: []
            };
        }

        res.status(200).json({
            message: 'Lấy bài nộp thành công',
            data
        });
    } catch (error) {
        next(error);
    }
};

// Giáo viên lấy toàn bộ bài nộp của lớp cho bài tập này
export const getAssignmentSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params; // assignmentId
        const teacherId = (req as any).user?.id;

        const assignment = await AssignmentModel.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }

        // Kiểm tra xem lớp học có thuộc về giáo viên này không
        const classroom = await ClassModel.findOne({ _id: assignment.classId, teacherId });
        if (!classroom) {
            return res.status(403).json({ message: 'Bạn không có quyền xem danh sách bài nộp của bài tập này' });
        }

        // Lấy toàn bộ bài nộp của học sinh trong bài tập này
        const submissions = await SubmissionModel.find({ assignmentId: id as any })
            .populate('studentId', 'name email avatar');

        res.status(200).json({
            message: 'Lấy danh sách bài nộp thành công',
            data: submissions
        });
    } catch (error) {
        next(error);
    }
};
