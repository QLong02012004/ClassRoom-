import { Request, Response, NextFunction } from 'express';
import { QuizModel } from '../models/Quiz';
import { ClassModel } from '../models/Class';
import { QuizResultModel } from '../models/QuizResult';
import { createAdminNotification } from '../services/notificationService';

// 1. Tạo đề trắc nghiệm mới (Giáo viên)
export const createQuiz = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId, title, durationMinutes, questions } = req.body || {};
        const teacherId = (req as any).user?.id;

        if (!classId || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (classId, title, questions)' });
        }

        // Kiểm tra quyền của giáo viên
        const classroom = await ClassModel.findOne({ _id: classId, teacherId });
        if (!classroom) {
            return res.status(403).json({ message: 'Bạn không có quyền tạo đề trắc nghiệm cho lớp học này' });
        }

        const quiz = await QuizModel.create({
            classId,
            title,
            durationMinutes: durationMinutes || 15,
            questions
        });

        // Kích hoạt thông báo cho Admin
        const teacherName = (req as any).user?.name || 'Giáo viên';
        await createAdminNotification(
            teacherId,
            'Tạo đề trắc nghiệm mới',
            `Giáo viên ${teacherName} đã tạo đề trắc nghiệm mới: "${title}" trong lớp "${classroom.name}".`,
            'quiz'
        );

        res.status(201).json({
            message: 'Tạo đề trắc nghiệm thành công',
            data: quiz
        });
    } catch (error) {
        next(error);
    }
};

// 2. Lấy danh sách đề trắc nghiệm trong một lớp
export const getQuizzesByClass = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId } = req.query;
        const userId = (req as any).user?.id;
        const userRole = (req as any).user?.role;

        if (!classId) {
            return res.status(400).json({ message: 'Thiếu classId' });
        }

        // Fetch all quizzes in this class
        const quizzes = await QuizModel.find({ classId: classId as any }).sort({ createdAt: -1 });

        // If requester is a student, attach their result
        if (userRole === 'student') {
            const results = await QuizResultModel.find({
                studentId: userId as any,
                quizId: { $in: quizzes.map(q => q._id) }
            });

            const data = quizzes.map(q => {
                const result = results.find(r => r.quizId.toString() === q._id.toString());
                
                // Hide correct answers from the list
                const quizObj = q.toObject();
                quizObj.questions = quizObj.questions.map((question: any) => {
                    const { correctOptionIndex, ...rest } = question;
                    return result ? question : rest;
                });

                return {
                    ...quizObj,
                    result: result ? {
                        score: result.score,
                        submittedAt: result.submittedAt,
                        totalQuestions: result.totalQuestions
                    } : null
                };
            });

            return res.status(200).json({
                message: 'Lấy danh sách đề trắc nghiệm thành công',
                data
            });
        }

        // For teachers/admins, return full quizzes
        res.status(200).json({
            message: 'Lấy danh sách đề trắc nghiệm thành công',
            data: quizzes
        });
    } catch (error) {
        next(error);
    }
};

// 3. Lấy chi tiết đề trắc nghiệm (ẩn đáp án nếu học sinh chưa làm)
export const getQuizById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;
        const userRole = (req as any).user?.role;

        const quiz = await QuizModel.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: 'Không tìm thấy đề trắc nghiệm' });
        }

        // Check if student has a result
        const result = await QuizResultModel.findOne({ quizId: id as any, studentId: userId as any });

        const quizObj = quiz.toObject();

        // Security: If requester is a student and hasn't submitted yet, hide the correct option index
        if (userRole === 'student' && !result) {
            quizObj.questions = quizObj.questions.map((q: any) => {
                const { correctOptionIndex, ...rest } = q;
                return rest;
            });
        }

        res.status(200).json({
            message: 'Lấy chi tiết đề trắc nghiệm thành công',
            data: {
                quiz: quizObj,
                result: result || null
            }
        });
    } catch (error) {
        next(error);
    }
};

// 4. Học sinh nộp bài trắc nghiệm (tự động chấm điểm)
export const submitQuiz = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params; // quizId
        const studentId = (req as any).user?.id;
        const { answers } = req.body || {}; // answers: array of selected option indices e.g., [0, 2, 1]

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: 'Thiếu câu trả lời' });
        }

        const quiz = await QuizModel.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: 'Không tìm thấy đề trắc nghiệm' });
        }

        // Kiểm tra xem học sinh đã nộp bài này trước đó chưa
        const existingResult = await QuizResultModel.findOne({ quizId: id as any, studentId: studentId as any });
        if (existingResult) {
            return res.status(400).json({ message: 'Bạn đã làm bài thi trắc nghiệm này rồi!' });
        }

        // Tự động chấm điểm tại Backend
        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        for (let i = 0; i < totalQuestions; i++) {
            const question = quiz.questions[i];
            if (question && answers[i] !== undefined && answers[i] === question.correctOptionIndex) {
                correctCount++;
            }
        }

        // Tính điểm trên hệ số 10
        const score = totalQuestions > 0 
            ? Math.round((correctCount / totalQuestions) * 10 * 10) / 10 
            : 0;

        const result = await QuizResultModel.create({
            quizId: id as any,
            studentId: studentId as any,
            answers,
            score,
            totalQuestions
        });

        res.status(201).json({
            message: 'Nộp bài thi trắc nghiệm thành công! 🎉',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// 5. Học sinh xem kết quả bài thi cá nhân
export const getMyQuizResult = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params; // quizId
        const studentId = (req as any).user?.id;

        const result = await QuizResultModel.findOne({ quizId: id as any, studentId: studentId as any });
        if (!result) {
            return res.status(404).json({ message: 'Bạn chưa làm bài thi này' });
        }

        res.status(200).json({
            message: 'Lấy kết quả bài thi thành công',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// 6. Giáo viên xem kết quả làm bài trắc nghiệm của lớp
export const getQuizResults = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params; // quizId
        const teacherId = (req as any).user?.id;

        const quiz = await QuizModel.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: 'Không tìm thấy đề trắc nghiệm' });
        }

        // Kiểm tra quyền sở hữu lớp
        const classroom = await ClassModel.findOne({ _id: quiz.classId, teacherId });
        if (!classroom) {
            return res.status(403).json({ message: 'Bạn không có quyền xem kết quả bài thi này' });
        }

        const results = await QuizResultModel.find({ quizId: id as any })
            .populate('studentId', 'name email avatar');

        res.status(200).json({
            message: 'Lấy danh sách kết quả bài thi thành công',
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// 7. Cập nhật đề thi trắc nghiệm (Giáo viên)
export const updateQuiz = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { title, durationMinutes, questions } = req.body || {};
        const teacherId = (req as any).user?.id;

        if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (title, questions)' });
        }

        const quiz = await QuizModel.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: 'Không tìm thấy đề trắc nghiệm' });
        }

        // Kiểm tra quyền của giáo viên
        const classroom = await ClassModel.findOne({ _id: quiz.classId, teacherId });
        if (!classroom) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa đề trắc nghiệm của lớp học này' });
        }

        // Ràng buộc bảo mật: Kiểm tra xem đã có học sinh nào nộp bài chưa
        const hasSubmissions = await QuizResultModel.exists({ quizId: id as any });
        if (hasSubmissions) {
            return res.status(400).json({ message: 'Không thể chỉnh sửa đề thi trắc nghiệm đã có học sinh làm bài!' });
        }

        // Thực hiện cập nhật
        quiz.title = title;
        quiz.durationMinutes = durationMinutes || 15;
        quiz.questions = questions;
        await quiz.save();

        res.status(200).json({
            message: 'Cập nhật đề trắc nghiệm thành công',
            data: quiz
        });
    } catch (error) {
        next(error);
    }
};
