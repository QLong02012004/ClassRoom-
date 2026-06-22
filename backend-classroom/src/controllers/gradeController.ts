import { Request, Response, NextFunction } from 'express';
import { GradeModel } from '../models/Grade';
import { AssignmentModel } from '../models/Assignment';
import { ClassModel } from '../models/Class';
import { UserModel } from '../models/User';

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
        const assignments = await AssignmentModel.find({ classId: classId as string });
        const assignmentIds = assignments.map(a => a._id);

        // Lấy toàn bộ điểm số hiện tại của các bài tập trong lớp này
        const grades = await GradeModel.find({ assignmentId: { $in: assignmentIds } });

        res.status(200).json({
            message: 'Lấy bảng điểm thành công',
            data: {
                students: classroom.students,
                assignments,
                grades
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

        const assignment = await AssignmentModel.findById(assignmentId);
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
        const assignments = await AssignmentModel.find({ classId: classId as string });
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

