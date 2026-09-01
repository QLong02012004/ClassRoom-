/**
 * ============================================================================
 * TÊN FILE: activityController.ts
 * ĐƯỜNG DẪN: backend-classroom/src/controllers/activityController.ts
 * MỤC ĐÍCH:
 *   Quản lý toàn bộ vòng đời của Hoạt động học tập (Bài tập về nhà, Bài tập tự luận,
 *   Bài thi trắc nghiệm) trong các lớp học thuộc hệ thống ClassRoom.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Tiếp nhận request từ Client (Giáo viên / Học sinh) thông qua express router (`/api/v1/activities`).
 *   - Truy vấn và thao tác dữ liệu trên các Mongoose Models: `ClassActivityModel`, `BankItemModel`,
 *     `SubmissionModel`, `GradeModel`, `QuizResultModel`, `ClassModel`.
 *   - Phát thông báo thời gian thực qua WebSockets (`socket.ts`): `notifySubmissionUpdate`,
 *     `notifyAdminStatsUpdate`, `notifyTeacherClassroomsUpdate` khi có hoạt động mới hoặc bài nộp mới.
 *
 * THÀNH PHẦN & API CHÍNH:
 *   - `assignActivity`: Giao bài tập/đề thi mới cho lớp từ ngân hàng câu hỏi.
 *   - `getClassActivities`: Lấy danh sách bài tập của 1 lớp (kèm số lượng bài đã nộp/đã chấm/chờ chấm).
 *   - `getStudentActivities`: Học sinh lấy danh sách tất cả bài tập thuộc các lớp đang tham gia.
 *   - `submitActivity` & `submitActivityQuiz`: Xử lý nộp bài tự luận/file hoặc chấm tự động bài trắc nghiệm.
 *   - `getAssignmentSubmissions`: Giáo viên lấy danh sách bài nộp của tất cả học sinh trong lớp.
 *   - `updateActivity` & `deleteActivity`: Cập nhật hạn nộp/trạng thái (đóng/mở) hoặc xóa bài tập.
 *   - `addComment`: Gửi bình luận/trao đổi trực tiếp vào bài nộp cá nhân.
 * ============================================================================
 */

import { Request, Response } from 'express';
import { ClassActivityModel } from '../models/ClassActivity';
import { BankItemModel } from '../models/BankItem';
import { QuizResultModel } from '../models/QuizResult';
import { SubmissionModel } from '../models/Submission';
import { GradeModel } from '../models/Grade';
import { ClassModel } from '../models/Class';
import { SubmissionStatus, UserRole, NotificationType } from '../constants/enums';
import { createUserNotification } from '../services/notificationService';
import { notifyAdminStatsUpdate, notifySubmissionUpdate, notifyTeacherClassroomsUpdate, notifyClassroomFeedUpdate, notifyStudentClassroomsUpdate } from '../socket';

// Lấy toàn bộ bài tập của học sinh
export const getStudentActivities = async (req: Request, res: Response): Promise<any> => {
    try {
        const studentId = (req as any).user?.id;
        if (!studentId) return res.status(401).json({ message: 'Chưa đăng nhập' });

        // Tìm các lớp mà học sinh này đang tham gia
        const classes = await ClassModel.find({ students: studentId }).lean();
        const classIds = classes.map(c => c._id);

        // Lấy tất cả bài tập thuộc các lớp đó (học sinh chỉ thấy bài đã đến/qua thời gian bắt đầu)
        const now = new Date();
        const activities = await ClassActivityModel.find({
            classId: { $in: classIds },
            $or: [
                { startDate: { $exists: false } },
                { startDate: null },
                { startDate: { $lte: now } }
            ]
        }).lean();

        // Lấy tất cả bài nộp và điểm của học sinh này
        const submissions = await SubmissionModel.find({ studentId }).lean();
        const grades = await GradeModel.find({ studentId }).lean();
        const quizResults = await QuizResultModel.find({ studentId }).lean();

        // Ghép dữ liệu
        const enrichedActivities = activities.map(activity => {
            const classInfo = classes.find(c => c._id.toString() === activity.classId.toString());
            const submission = submissions.find(s => s.assignmentId.toString() === activity._id.toString());
            const grade = grades.find(g => g.assignmentId.toString() === activity._id.toString());
            const quiz = quizResults.find(q => q.quizId.toString() === activity._id.toString());

            let finalSubmission = null;
            if (activity.type === 'quiz' && quiz) {
                finalSubmission = {
                    status: 'graded',
                    grade: quiz.score
                };
            } else if (submission) {
                finalSubmission = {
                    ...submission,
                    status: grade ? 'graded' : submission.status,
                    grade: grade ? grade.score : null,
                    feedback: grade ? grade.feedback : null,
                    gradedAt: grade ? grade.gradedAt : null
                };
            }

            return {
                ...activity,
                className: classInfo ? classInfo.name : 'Không xác định',
                subject: classInfo ? classInfo.subject : '',
                submission: finalSubmission
            };
        });

        res.status(200).json({ data: enrichedActivities });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách bài tập học sinh', error });
    }
};

// Giao một hoạt động mới từ ngân hàng cho lớp
export const assignActivity = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { bankItemId, startDate, dueDate, category, title, maxScore, description, durationMinutes, status, allowMultipleSubmissions } = req.body;

        if (dueDate) {
            const dueTime = new Date(dueDate).getTime();
            if (!isNaN(dueTime) && dueTime < Date.now() - 60000) {
                return res.status(400).json({ message: 'Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.' });
            }
        }

        const bankItem = await BankItemModel.findById(bankItemId);
        if (!bankItem) return res.status(404).json({ message: 'Không tìm thấy đề trong ngân hàng' });

        const newActivity = new ClassActivityModel({
            classId,
            bankItemId,
            type: bankItem.type,
            title: title || bankItem.title,
            description: description !== undefined ? description : bankItem.description,
            startDate: startDate ? new Date(startDate) : new Date(),
            dueDate,
            category,
            maxScore: maxScore || bankItem.maxScore,
            durationMinutes: durationMinutes || bankItem.durationMinutes,
            status: status || 'open',
            allowMultipleSubmissions: allowMultipleSubmissions !== undefined ? allowMultipleSubmissions : true
        });

        await newActivity.save();

        // Gửi thông báo chuông tới tất cả Học sinh thuộc lớp này
        try {
            const cls = await ClassModel.findById(classId).lean();
            if (cls && cls.students && cls.students.length > 0) {
                const isQuiz = newActivity.type === 'quiz';
                const notifType = isQuiz ? NotificationType.QUIZ : NotificationType.ASSIGNMENT;
                const notifTitle = isQuiz ? 'Đề thi trắc nghiệm mới' : 'Bài tập mới trong lớp học';
                const notifMsg = `Giáo viên vừa giao bài "${newActivity.title}" trong lớp ${cls.name}`;

                for (const stId of cls.students) {
                    await createUserNotification(
                        stId.toString(),
                        UserRole.STUDENT,
                        (req as any).user?.id || '',
                        notifTitle,
                        notifMsg,
                        notifType
                    );
                }
            }
        } catch (errNotif) {
            console.error('❌ Lỗi khi gửi thông báo cho học sinh:', errNotif);
        }

        notifyAdminStatsUpdate();
        notifyClassroomFeedUpdate(classId);
        notifyStudentClassroomsUpdate();
        res.status(201).json(newActivity);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi giao hoạt động', error });
    }
};

// Lấy danh sách hoạt động của 1 lớp
export const getClassActivities = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const userRole = (req as any).user?.role;
        const filterQuery: any = { classId };

        if (userRole === 'student') {
            filterQuery.$or = [
                { startDate: { $exists: false } },
                { startDate: null },
                { startDate: { $lte: new Date() } }
            ];
        }

        const activities = await ClassActivityModel.find(filterQuery)
            .populate('bankItemId')
            .sort({ createdAt: -1 })
            .lean();

        const enrichedActivities = await Promise.all(
            activities.map(async (act: any) => {
                let submissionCount = 0;
                let gradedCount = 0;
                let pendingGradeCount = 0;

                if (act.type === 'quiz') {
                    submissionCount = await QuizResultModel.countDocuments({ quizId: act._id });
                    gradedCount = submissionCount;
                    pendingGradeCount = 0;
                } else {
                    const submissions = await SubmissionModel.find({
                        assignmentId: act._id,
                        status: { $in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE, 'submitted', 'late', 'graded'] as any[] }
                    }).select('studentId status').lean();

                    submissionCount = submissions.length;

                    const grades = await GradeModel.find({ assignmentId: act._id }).select('studentId').lean();
                    gradedCount = grades.length;

                    pendingGradeCount = Math.max(0, submissionCount - gradedCount);
                }

                return {
                    ...act,
                    submissionCount,
                    gradedCount,
                    pendingGradeCount
                };
            })
        );

        res.json(enrichedActivities);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách hoạt động', error });
    }
};

// Xem chi tiết một hoạt động
export const getActivityById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activity = await ClassActivityModel.findById(id).populate('bankItemId');
        if (!activity) return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
        res.json(activity);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi', error });
    }
};

export const updateActivity = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.dueDate) {
            const dueTime = new Date(updateData.dueDate).getTime();
            if (!isNaN(dueTime) && dueTime < Date.now() - 60000) {
                return res.status(400).json({ message: 'Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.' });
            }
            // Nếu gia hạn sang mốc thời gian tương lai mới, tự động mở lại bài tập (status = 'open')
            if (!updateData.status) {
                updateData.status = 'open';
            }
        }

        const updated = await ClassActivityModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

        notifyAdminStatsUpdate();
        notifyTeacherClassroomsUpdate();
        notifyClassroomFeedUpdate(updated.classId?.toString());
        notifyStudentClassroomsUpdate();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật bài tập', error });
    }
};

export const deleteActivity = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await ClassActivityModel.findByIdAndDelete(id);
        if (deleted) {
            notifyClassroomFeedUpdate(deleted.classId?.toString());
            notifyStudentClassroomsUpdate();
        }
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa', error });
    }
};

export const submitActivityQuiz = async (req: Request, res: Response): Promise<any> => {
    try {
        const activityId = req.params.id as string;
        const studentId = (req as any).user?.id;
        const { answers } = req.body;

        if (!activityId) return res.status(400).json({ message: 'Thiếu ID hoạt động' });

        if (!studentId) return res.status(401).json({ message: 'Chưa đăng nhập' });

        const activity = await ClassActivityModel.findById(activityId).populate('bankItemId');
        if (!activity) return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
        if (activity.status === 'closed' || (activity.dueDate && new Date(activity.dueDate).getTime() < Date.now())) {
            return res.status(403).json({ message: 'Bài thi đã quá hạn nộp và đã bị đóng, không thể tiếp tục nộp bài!' });
        }
        if (activity.startDate && new Date(activity.startDate).getTime() > Date.now()) {
            const formattedStart = new Date(activity.startDate).toLocaleString('vi-VN');
            return res.status(403).json({ message: `Bài thi chưa đến thời gian mở! Vui lòng quay lại lúc ${formattedStart}` });
        }
        if (activity.type !== 'quiz') return res.status(400).json({ message: 'Hoạt động này không phải bài trắc nghiệm' });

        const bankItem: any = activity.bankItemId;
        if (!bankItem || !bankItem.quizQuestions) return res.status(400).json({ message: 'Đề thi không hợp lệ' });

        const questions = bankItem.quizQuestions;
        let score = 0;
        let totalScore = 0;

        questions.forEach((q: any, index: number) => {
            const maxPoints = q.points || 1;
            totalScore += maxPoints;
            if (answers[index] === q.correctOptionIndex) {
                score += maxPoints;
            }
        });

        // Convert score to a 10-point scale if needed, but usually we just save the raw score 
        // or calculate percentage and multiply by maxScore.
        const normalizedScore = (score / (totalScore || 1)) * (activity.maxScore || 10);

        const quizResult = await QuizResultModel.findOneAndUpdate(
            { quizId: activityId, studentId },
            {
                answers,
                score: normalizedScore,
                totalQuestions: questions.length,
                submittedAt: new Date()
            },
            { upsert: true, new: true }
        );

        notifyAdminStatsUpdate();
        notifySubmissionUpdate({ assignmentId: activityId, classId: activity.classId.toString() });
        notifyTeacherClassroomsUpdate();

        res.status(200).json({ message: 'Nộp bài thành công', data: quizResult });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi nộp bài', error });
    }
};

export const getMyQuizResult = async (req: Request, res: Response): Promise<any> => {
    try {
        const activityId = req.params.id as string;
        const studentId = (req as any).user?.id;

        if (!activityId) return res.status(400).json({ message: 'Thiếu ID hoạt động' });
        if (!studentId) return res.status(401).json({ message: 'Chưa đăng nhập' });

        const result = await QuizResultModel.findOne({ quizId: activityId, studentId });
        if (!result) return res.status(404).json({ message: 'Chưa có kết quả' });

        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy kết quả', error });
    }
};

export const getQuizResults = async (req: Request, res: Response): Promise<any> => {
    try {
        const activityId = req.params.id as string;
        if (!activityId) return res.status(400).json({ message: 'Thiếu ID hoạt động' });
        // Should verify teacher access here if strict, for now just fetch
        const results = await QuizResultModel.find({ quizId: activityId }).populate('studentId', 'name email avatar');

        res.status(200).json({ data: results });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách kết quả', error });
    }
};

// Đăng ký nộp bài tập (tự luận hoặc trắc nghiệm)
export const submitActivity = async (req: Request, res: Response): Promise<any> => {
    try {
        const activityId = req.params.id as string;
        const studentId = (req as any).user?.id;

        if (!activityId) return res.status(400).json({ message: 'Thiếu ID hoạt động' });
        if (!studentId) return res.status(401).json({ message: 'Chưa đăng nhập' });

        const activity = await ClassActivityModel.findById(activityId);
        if (!activity) return res.status(404).json({ message: 'Không tìm thấy hoạt động' });

        if (activity.status === 'closed' || (activity.dueDate && new Date(activity.dueDate).getTime() < Date.now())) {
            return res.status(403).json({ message: 'Bài tập đã quá hạn nộp và đã bị đóng, không thể tiếp tục nộp bài!' });
        }
        if (activity.startDate && new Date(activity.startDate).getTime() > Date.now()) {
            const formattedStart = new Date(activity.startDate).toLocaleString('vi-VN');
            return res.status(403).json({ message: `Bài tập chưa đến thời gian mở! Vui lòng quay lại lúc ${formattedStart}` });
        }

        // Nếu là bài trắc nghiệm thì chuyển sang hàm chấm trắc nghiệm
        if (activity.type === 'quiz') {
            return await submitActivityQuiz(req, res);
        }

        // Nếu là bài tập tự luận (homework, periodic, etc.)
        const { submissionText, attachments } = req.body;

        const isLate = new Date(activity.dueDate).getTime() < Date.now();
        const status = isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED;

        const existingSubmission = await SubmissionModel.findOne({ assignmentId: activityId, studentId });

        if (existingSubmission && (existingSubmission.submissionText || existingSubmission.attachments?.length > 0)) {
            // Check if multiple submissions are allowed
            if (activity.allowMultipleSubmissions === false) {
                return res.status(403).json({ message: 'Bài tập này chỉ cho phép nộp một lần duy nhất' });
            }
        }

        let history = existingSubmission ? existingSubmission.history || [] : [];
        if (existingSubmission && (existingSubmission.submissionText || existingSubmission.attachments?.length > 0)) {
            history.push({
                submissionText: existingSubmission.submissionText || '',
                attachments: existingSubmission.attachments,
                submittedAt: existingSubmission.submittedAt
            });
        }

        const submission = await SubmissionModel.findOneAndUpdate(
            { assignmentId: activityId, studentId },
            {
                submissionText,
                attachments: attachments || [],
                status,
                submittedAt: new Date(),
                history
            },
            { upsert: true, new: true }
        );

        notifyAdminStatsUpdate();
        notifySubmissionUpdate({ assignmentId: activityId, classId: activity.classId.toString() });
        notifyTeacherClassroomsUpdate();

        res.status(200).json({ message: 'Nộp bài tập thành công', data: submission });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi nộp bài tập', error });
    }
};

// Lấy bài nộp cá nhân của học sinh
export const getMySubmission = async (req: Request, res: Response): Promise<any> => {
    try {
        const activityId = req.params.id as string;
        const studentId = (req as any).user?.id;

        if (!activityId) return res.status(400).json({ message: 'Thiếu ID hoạt động' });
        if (!studentId) return res.status(401).json({ message: 'Chưa đăng nhập' });

        const submission = await SubmissionModel.findOne({ assignmentId: activityId, studentId }).lean();
        if (!submission) {
            return res.status(200).json({ data: null });
        }

        // Kiểm tra xem đã được chấm điểm chưa
        const gradeInfo = await GradeModel.findOne({ assignmentId: activityId, studentId });
        if (gradeInfo) {
            return res.status(200).json({
                data: {
                    ...submission,
                    status: 'graded',
                    grade: gradeInfo.score,
                    feedback: gradeInfo.feedback
                }
            });
        }

        res.status(200).json({ data: submission });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy bài nộp cá nhân', error });
    }
};

// Giáo viên lấy danh sách bài nộp của cả lớp
export const getAssignmentSubmissions = async (req: Request, res: Response): Promise<any> => {
    try {
        const activityId = req.params.id as string;

        if (!activityId) return res.status(400).json({ message: 'Thiếu ID hoạt động' });

        const submissions = await SubmissionModel.find({ assignmentId: activityId })
            .populate('studentId', 'name email avatar')
            .lean();

        // Lấy tất cả điểm số cho hoạt động này
        const grades = await GradeModel.find({ assignmentId: activityId });

        // Ghép điểm và feedback vào bài nộp tương ứng
        const mappedSubmissions = submissions.map(sub => {
            const gradeInfo = grades.find(g => g.studentId.toString() === (sub.studentId as any)._id.toString());
            return {
                ...sub,
                status: gradeInfo ? 'graded' : sub.status,
                grade: gradeInfo ? gradeInfo.score : null,
                feedback: gradeInfo ? gradeInfo.feedback : null
            };
        });

        res.status(200).json({ data: mappedSubmissions });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách bài nộp lớp học', error });
    }
};

// Gửi bình luận vào bài nộp
export const addComment = async (req: Request, res: Response): Promise<any> => {
    try {
        const activityId = req.params.id as string;
        const user = (req as any).user;
        const { text } = req.body;

        if (!activityId) return res.status(400).json({ message: 'Thiếu ID hoạt động' });
        if (!user) return res.status(401).json({ message: 'Chưa đăng nhập' });
        if (!text) return res.status(400).json({ message: 'Thiếu nội dung bình luận' });

        const isTeacher = user.role === 'teacher' || user.role === 'admin';
        // Đối với học sinh, thêm vào my-submission
        // Lưu ý: Nếu giáo viên bình luận, họ cũng cần có endpoint tương tự nhưng truyền `studentId`.
        // Tạm thời để đơn giản, endpoint này phục vụ học sinh gửi bình luận vào bài nộp của mình.
        const studentId = user.id;

        const newComment = {
            userId: user.id,
            name: user.name || 'Người dùng', // name should ideally come from User
            isTeacher,
            text,
            createdAt: new Date()
        };

        // Tìm kiếm User để lấy tên thật
        const { UserModel } = await import('../models/User.js');
        const userInfo = await UserModel.findById(user.id);
        if (userInfo) {
            newComment.name = userInfo.name;
        }

        const submission = await SubmissionModel.findOneAndUpdate(
            { assignmentId: activityId, studentId },
            {
                $push: { comments: newComment },
                // Nếu chưa nộp, cập nhật trạng thái
                $setOnInsert: {
                    status: SubmissionStatus.PENDING,
                    attachments: [],
                    submissionText: '',
                    submittedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: 'Bình luận thành công', data: submission });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi gửi bình luận', error });
    }
};
