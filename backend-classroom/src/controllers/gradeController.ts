/**
 * ============================================================================
 * TÊN FILE: gradeController.ts
 * ĐƯỜNG DẪN: backend-classroom/src/controllers/gradeController.ts
 * MỤC ĐÍCH:
 *   Quản lý Sổ điểm (Gradebook) của các lớp học, lưu điểm số, lời phê cá nhân,
 *   tự động gửi thông báo chấm điểm cho học sinh và hỗ trợ xuất/nhập Sổ điểm từ Excel.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Nhận yêu cầu từ Giáo viên/Học sinh qua router `/api/v1/grades`.
 *   - Cập nhật điểm vào `GradeModel` và `SubmissionModel`.
 *   - Khi Giáo viên lưu điểm: Gọi `createUserNotification` để đẩy thông báo chuông về tài khoản Học sinh.
 *   - Phát tín hiệu WebSockets (`notifySubmissionUpdate`) để cập nhật Sổ điểm thời gian thực.
 *
 * THÀNH PHẦN & API CHÍNH:
 *   - `getClassroomGrades`: Lấy toàn bộ danh sách điểm số, bài tập và học sinh trong lớp.
 *   - `saveGrades`: Lưu điểm hàng loạt kèm lời phê cho học sinh của 1 bài tập.
 *   - `getStudentGrades`: Học sinh xem tổng hợp điểm số các môn của bản thân.
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { GradeModel } from '../models/Grade';
import { ClassActivityModel } from '../models/ClassActivity';
import { ClassModel } from '../models/Class';
import { UserModel } from '../models/User';
import { SubmissionModel } from '../models/Submission';
import { QuizResultModel } from '../models/QuizResult';
import { SubmissionStatus, UserRole, NotificationType } from '../constants/enums';
import { createUserNotification } from '../services/notificationService';
import { notifyAdminStatsUpdate, notifySubmissionUpdate, notifyTeacherClassroomsUpdate } from '../socket';

// Lấy danh sách bảng điểm của một lớp
export const getClassroomGrades = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId } = req.query;
        const teacherId = (req as any).user?.id;

        if (!classId) {
            return res.status(400).json({ message: 'Thiếu classId' });
        }

        // Lấy lớp học và các học sinh
        const classroom = await ClassModel.findOne({ _id: classId as string, teacherId }).populate('students', 'name email');
        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc không có quyền truy cập' });
        }

        // Lấy toàn bộ bài tập của lớp
        const assignments = await ClassActivityModel.find({ classId: classId as string }).lean();
        const assignmentIds = assignments.map(a => a._id);

        // Lấy toàn bộ điểm số hiện tại của các bài tập trong lớp này
        const grades = await GradeModel.find({ assignmentId: { $in: assignmentIds } }).lean();

        const enrichedAssignments = await Promise.all(
            assignments.map(async (a: any) => {
                if (a.type === 'quiz') {
                    const subCount = await QuizResultModel.countDocuments({ quizId: a._id });
                    return { ...a, submissionCount: subCount, gradedCount: subCount, pendingGradeCount: 0 };
                } else {
                    const subCount = await SubmissionModel.countDocuments({
                        assignmentId: a._id,
                        status: { $in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE, 'submitted', 'late', 'graded'] as any[] }
                    });
                    const gradeCount = grades.filter(g => g.assignmentId.toString() === a._id.toString()).length;
                    return {
                        ...a,
                        submissionCount: subCount,
                        gradedCount: gradeCount,
                        pendingGradeCount: Math.max(0, subCount - gradeCount)
                    };
                }
            })
        );

        // Lấy toàn bộ bài nộp (submissions) thực tế của các bài tập trong lớp này
        const submissions = await SubmissionModel.find({ assignmentId: { $in: assignmentIds } })
            .populate('studentId', 'name email avatar')
            .lean();

        res.status(200).json({
            message: 'Lấy bảng điểm thành công',
            data: {
                students: classroom.students,
                assignments: enrichedAssignments,
                grades,
                submissions
            }
        });
    } catch (error) {
        next(error);
    }
};

// Nhập / Cập nhật điểm cho học sinh
export const saveGrades = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { assignmentId, grades } = req.body; // grades: [{ studentId, score, feedback }]
        const teacherId = (req as any).user?.id;

        if (!assignmentId || !grades || !Array.isArray(grades)) {
            return res.status(400).json({ message: 'Thiếu assignmentId hoặc danh sách điểm số' });
        }

        const assignment = await ClassActivityModel.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }

        // Kiểm tra quyền của giáo viên đối với lớp
        const classroom = await ClassModel.findOne({ _id: assignment.classId, teacherId });
        if (!classroom) {
            return res.status(403).json({ message: 'Bạn không có quyền quản lý điểm của bài tập này' });
        }

        // Lưu / Cập nhật từng điểm số (dùng bulkWrite hoặc vòng lặp do số lượng học sinh lớp nhỏ)
        const bulkOperations = grades.map(g => ({
            updateOne: {
                filter: { assignmentId, studentId: g.studentId },
                update: {
                    assignmentId,
                    studentId: g.studentId,
                    score: Number(g.score),
                    feedback: g.feedback || '',
                    gradedAt: new Date()
                },
                upsert: true
            }
        }));

        await GradeModel.bulkWrite(bulkOperations);

        // Cập nhật trạng thái bài nộp thành 'graded' cho các học sinh được chấm
        const studentIds = grades.map(g => g.studentId);
        if (studentIds.length > 0) {
            await SubmissionModel.updateMany(
                { assignmentId, studentId: { $in: studentIds } },
                { $set: { status: 'graded' } }
            );
        }

        // Tạo thông báo cho từng học sinh được chấm điểm
        for (const g of grades) {
            if (g.studentId && g.score !== undefined && g.score !== null) {
                const feedbackText = g.feedback ? ` Lời phê: "${g.feedback}"` : '';
                await createUserNotification(
                    g.studentId,
                    UserRole.STUDENT,
                    teacherId,
                    `Bài tập "${assignment.title}" đã được chấm điểm!`,
                    `Giáo viên đã chấm bài tập "${assignment.title}" của bạn: ${g.score}/10 điểm.${feedbackText}`,
                    NotificationType.ASSIGNMENT
                );
            }
        }

        // Phát tín hiệu Real-time cho Admin Dashboard & Giáo viên/Học sinh
        notifyAdminStatsUpdate();
        notifySubmissionUpdate({ assignmentId, classId: assignment.classId.toString() });
        notifyTeacherClassroomsUpdate(teacherId);

        res.status(200).json({
            message: 'Cập nhật điểm số thành công'
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách điểm số của một học sinh trong một lớp cụ thể
export const getStudentGrades = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const studentId = (req as any).user?.id;
        const { classId } = req.query;

        if (!classId) {
            return res.status(400).json({ message: 'Thiếu classId' });
        }

        // Kiểm tra xem học sinh có học lớp này không
        const classroom = await ClassModel.findOne({ _id: classId as string, students: studentId })
            .populate('teacherId', 'name avatar');

        if (!classroom) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc bạn không tham gia lớp này' });
        }

        // Lấy tất cả bài tập của lớp
        const assignments = await ClassActivityModel.find({ classId: classId as string });
        const assignmentIds = assignments.map(a => a._id);

        // Lấy điểm số của học sinh này cho các bài tập đó
        const grades = await GradeModel.find({ 
            studentId, 
            assignmentId: { $in: assignmentIds } 
        });

        res.status(200).json({
            message: 'Lấy bảng điểm học sinh thành công',
            data: {
                classroom: {
                    _id: classroom._id,
                    name: classroom.name,
                    subject: classroom.subject,
                    teacher: classroom.teacherId
                },
                assignments,
                grades
            }
        });
    } catch (error) {
        next(error);
    }
};

