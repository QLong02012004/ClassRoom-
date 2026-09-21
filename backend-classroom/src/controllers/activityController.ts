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
import { QuizDraftModel } from '../models/QuizDraft';
import { SubmissionModel } from '../models/Submission';
import { GradeModel } from '../models/Grade';
import { ClassModel } from '../models/Class';
import { UserModel } from '../models/User';
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
        }).populate('bankItemId').lean();

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

            const questionCount = (activity.bankItemId as any)?.quizQuestions?.length || ((activity as any).questions?.length) || 0;

            return {
                ...activity,
                questionCount,
                maxScore: Math.round((activity.maxScore || 10) * 100) / 100,
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

// Giao một hoạt động mới từ ngân hàng cho lớp hoặc tạo bài tập trực tiếp
export const assignActivity = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const { bankItemId, startDate, dueDate, category, title, maxScore, description, durationMinutes, status, allowMultipleSubmissions, attachments } = req.body;

        if (dueDate) {
            const dueTime = new Date(dueDate).getTime();
            if (!isNaN(dueTime) && dueTime < Date.now() - 60000) {
                return res.status(400).json({ message: 'Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.' });
            }
        }

        let bankItem: any = null;
        if (bankItemId) {
            bankItem = await BankItemModel.findById(bankItemId);
            if (!bankItem) return res.status(404).json({ message: 'Không tìm thấy đề trong ngân hàng' });
        }

        const effectiveTitle = String(title || bankItem?.title || '').trim();
        if (!effectiveTitle) {
            return res.status(400).json({ message: 'Vui lòng nhập tiêu đề bài tập!' });
        }

        // Không cho phép đặt tên bài tập trùng nhau trong cùng một lớp học
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingActivity = await ClassActivityModel.findOne({
            classId,
            title: { $regex: new RegExp(`^${escapeRegex(effectiveTitle)}$`, 'i') }
        });
        if (existingActivity) {
            return res.status(400).json({ message: `Tên bài tập "${effectiveTitle}" đã tồn tại trong lớp học này! Vui lòng chọn tên khác.` });
        }

        const isScheduledFuture = startDate && new Date(startDate).getTime() > Date.now();
        const activityType = bankItem ? bankItem.type : 'document';

        const newActivity = new ClassActivityModel({
            classId,
            bankItemId: bankItem ? bankItem._id : undefined,
            type: activityType,
            title: effectiveTitle,
            description: description !== undefined ? description : (bankItem?.description || ''),
            startDate: startDate ? new Date(startDate) : new Date(),
            dueDate,
            category: category || 'homework',
            maxScore: Math.round(Number(maxScore || bankItem?.maxScore || 10) * 100) / 100,
            durationMinutes: durationMinutes || bankItem?.durationMinutes,
            status: status || 'open',
            allowMultipleSubmissions: allowMultipleSubmissions !== undefined ? allowMultipleSubmissions : true,
            attachments: attachments || [],
            isNotified: !isScheduledFuture
        });

        await newActivity.save();

        // Chỉ gửi thông báo chuông và socket update tới Học sinh nếu bài tập mở NGAY (không phải bài hẹn giờ trong tương lai)
        if (!isScheduledFuture) {
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

            notifyClassroomFeedUpdate(classId);
            notifyStudentClassroomsUpdate();
        }

        notifySubmissionUpdate({ assignmentId: newActivity._id.toString(), classId });
        notifyAdminStatsUpdate();
        notifyTeacherClassroomsUpdate();
        res.status(201).json(newActivity);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi giao hoạt động', error });
    }
};

// Giao một hoạt động mới từ ngân hàng cho nhiều lớp cùng lúc
export const assignActivityToMultipleClasses = async (req: Request, res: Response) => {
    try {
        const { classIds, bankItemId, startDate, dueDate, category, title, maxScore, description, durationMinutes, status, allowMultipleSubmissions } = req.body;

        if (!Array.isArray(classIds) || classIds.length === 0) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất một lớp học để giao bài!' });
        }

        if (dueDate) {
            const dueTime = new Date(dueDate).getTime();
            if (!isNaN(dueTime) && dueTime < Date.now() - 60000) {
                return res.status(400).json({ message: 'Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.' });
            }
        }

        const bankItem = await BankItemModel.findById(bankItemId);
        if (!bankItem) return res.status(404).json({ message: 'Không tìm thấy đề trong ngân hàng' });

        const effectiveTitle = String(title || bankItem.title || '').trim();
        if (!effectiveTitle) {
            return res.status(400).json({ message: 'Vui lòng nhập tiêu đề bài tập!' });
        }

        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Kiểm tra xem tên bài tập có bị trùng trong bất kỳ lớp nào trong danh sách được chọn hay không
        for (const classId of classIds) {
            const existingInClass = await ClassActivityModel.findOne({
                classId,
                title: { $regex: new RegExp(`^${escapeRegex(effectiveTitle)}$`, 'i') }
            });
            if (existingInClass) {
                const cls = await ClassModel.findById(classId).lean();
                const className = cls ? cls.name : 'lớp đã chọn';
                return res.status(400).json({
                    message: `Tên bài tập "${effectiveTitle}" đã tồn tại trong lớp "${className}"! Vui lòng chọn tên khác.`
                });
            }
        }

        const isScheduledFuture = startDate && new Date(startDate).getTime() > Date.now();

        const createdActivities = [];

        for (const classId of classIds) {
            const newActivity = new ClassActivityModel({
                classId,
                bankItemId,
                type: bankItem.type,
                title: effectiveTitle,
                description: description !== undefined ? description : bankItem.description,
                startDate: startDate ? new Date(startDate) : new Date(),
                dueDate,
                category: category || 'homework',
                maxScore: Math.round(Number(maxScore || bankItem.maxScore || 10) * 100) / 100,
                durationMinutes: durationMinutes || bankItem.durationMinutes,
                status: status || 'open',
                allowMultipleSubmissions: allowMultipleSubmissions !== undefined ? allowMultipleSubmissions : true,
                isNotified: !isScheduledFuture
            });

            await newActivity.save();
            createdActivities.push(newActivity);

            // Chỉ gửi thông báo chuông tới Học sinh nếu bài tập mở NGAY
            if (!isScheduledFuture) {
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

                notifyClassroomFeedUpdate(classId);
            }
        }

        notifyAdminStatsUpdate();
        notifyTeacherClassroomsUpdate();
        for (const act of createdActivities) {
            notifySubmissionUpdate({ assignmentId: act._id.toString(), classId: act.classId?.toString() });
        }
        if (!isScheduledFuture) {
            notifyStudentClassroomsUpdate();
        }

        res.status(201).json({
            message: `Đã giao bài thành công cho ${createdActivities.length} lớp học!`,
            count: createdActivities.length,
            activities: createdActivities
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi giao hoạt động cho nhiều lớp', error });
    }
};

// Lấy danh sách hoạt động của một lớp
export const getClassActivities = async (req: Request, res: Response): Promise<any> => {
    try {
        const classId = req.params.classId as string;
        const { type } = req.query;

        if (!classId) return res.status(400).json({ message: 'Thiếu ID lớp học' });

        const filterQuery: any = { classId };
        if (type) filterQuery.type = type;

        const activities = await ClassActivityModel.find(filterQuery)
            .populate('bankItemId')
            .sort({ createdAt: -1 })
            .lean();

        // Đếm số lượng bài nộp cho từng hoạt động
        const activityIds = activities.map(a => a._id);
        const submissions = await SubmissionModel.find({ assignmentId: { $in: activityIds } }).lean();
        const grades = await GradeModel.find({ assignmentId: { $in: activityIds } }).lean();

        const enrichedActivities = activities.map((act: any) => {
            const actSubmissions = submissions.filter(s => s.assignmentId.toString() === act._id.toString());
            const actGrades = grades.filter(g => g.assignmentId.toString() === act._id.toString());
            const submissionCount = actSubmissions.length;
            const gradedCount = actGrades.length;
            const pendingGradeCount = Math.max(0, submissionCount - gradedCount);

            const questionCount = (act.bankItemId as any)?.quizQuestions?.length || act.questions?.length || 0;

            return {
                ...act,
                submissionCount,
                gradedCount,
                pendingGradeCount,
                questionCount,
                maxScore: Math.round((act.maxScore || 10) * 100) / 100
            };
        });

        res.status(200).json({ data: enrichedActivities });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách hoạt động của lớp', error });
    }
};

// Xem chi tiết một hoạt động
export const getActivityById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const userRole = (req as any).user?.role;
        const activity = await ClassActivityModel.findById(id).populate('bankItemId');
        if (!activity) return res.status(404).json({ message: 'Không tìm thấy hoạt động' });

        // Học sinh không thể truy cập bài tập khi chưa đến thời gian mở (hẹn giờ trong tương lai)
        if (userRole === 'student' && activity.startDate && new Date(activity.startDate).getTime() > Date.now()) {
            const formattedStart = new Date(activity.startDate).toLocaleString('vi-VN');
            return res.status(403).json({ message: `Bài tập/đề thi đang ở trạng thái hẹn giờ! Vui lòng quay lại lúc ${formattedStart}` });
        }

        res.json(activity);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi', error });
    }
};

export const updateActivity = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const currentActivity = await ClassActivityModel.findById(id);
        if (!currentActivity) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

        if (updateData.title !== undefined) {
            const newTitle = String(updateData.title).trim();
            if (!newTitle) {
                return res.status(400).json({ message: 'Tiêu đề không được để trống!' });
            }
            const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const duplicateActivity = await ClassActivityModel.findOne({
                _id: { $ne: id as any },
                classId: currentActivity.classId,
                title: { $regex: new RegExp(`^${escapeRegex(newTitle)}$`, 'i') }
            });
            if (duplicateActivity) {
                return res.status(400).json({ message: `Tên bài tập "${newTitle}" đã tồn tại trong lớp học này! Vui lòng chọn tên khác.` });
            }
            updateData.title = newTitle;
        }

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

        if (updateData.startDate) {
            const startTime = new Date(updateData.startDate).getTime();
            if (startTime > Date.now()) {
                updateData.isNotified = false;
            } else {
                updateData.isNotified = true;
            }
        }

        const updated = await ClassActivityModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

        notifyAdminStatsUpdate();
        notifyTeacherClassroomsUpdate();
        notifyClassroomFeedUpdate(updated.classId?.toString());
        notifyStudentClassroomsUpdate();
        notifySubmissionUpdate({ assignmentId: updated._id.toString(), classId: updated.classId?.toString() });
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
            notifySubmissionUpdate({ assignmentId: deleted._id.toString(), classId: deleted.classId?.toString() });
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

        // Gửi thông báo chuông Real-time tới Giáo viên phụ trách khi học sinh nộp bài thi trắc nghiệm
        try {
            const cls = await ClassModel.findById(activity.classId).lean();
            if (cls && cls.teacherId) {
                const studentName = (req as any).user?.name || 'Một học sinh';
                const notifTitle = 'Bài thi trắc nghiệm mới từ Học sinh';
                const notifMsg = `Học sinh <strong>${studentName}</strong> vừa hoàn thành đề thi <strong>"${activity.title}"</strong> trong lớp <strong>${cls.name}</strong> (Điểm: <strong>${normalizedScore.toFixed(1)}/${activity.maxScore || 10}</strong>).`;
                await createUserNotification(
                    cls.teacherId.toString(),
                    UserRole.TEACHER,
                    studentId,
                    notifTitle,
                    notifMsg,
                    NotificationType.QUIZ
                );
            }
        } catch (notifErr) {
            console.error('❌ Lỗi khi gửi thông báo nộp bài thi cho giáo viên:', notifErr);
        }

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

        if (activity.status === 'closed') {
            return res.status(403).json({ message: 'Bài tập đã bị đóng bởi giáo viên, không thể tiếp tục nộp bài!' });
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

        // Kiểm tra hạn nộp: từ chối nộp bài nếu đã quá deadline
        const isPastDeadline = activity.dueDate && new Date(activity.dueDate).getTime() < Date.now();
        if (isPastDeadline) {
            const formattedDeadline = new Date(activity.dueDate).toLocaleString('vi-VN');
            return res.status(403).json({
                message: `Đã quá hạn nộp bài! Thời hạn kết thúc lúc ${formattedDeadline}. Bạn không thể nộp bài nữa.`
            });
        }

        const isLate = false; // Nếu vượt qua check trên thì luôn là đúng hạn
        const status = SubmissionStatus.SUBMITTED;


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

        // Gửi thông báo chuông Real-time tới Giáo viên phụ trách lớp học này
        try {
            const cls = await ClassModel.findById(activity.classId).lean();
            if (cls && cls.teacherId) {
                const studentName = (req as any).user?.name || 'Một học sinh';
                const notifTitle = 'Bài nộp mới từ Học sinh';
                const notifMsg = `Học sinh <strong>${studentName}</strong> vừa nộp bài <strong>"${activity.title}"</strong> trong lớp <strong>${cls.name}</strong>.`;
                await createUserNotification(
                    cls.teacherId.toString(),
                    UserRole.TEACHER,
                    studentId,
                    notifTitle,
                    notifMsg,
                    NotificationType.ASSIGNMENT
                );
            }
        } catch (notifErr) {
            console.error('❌ Lỗi khi gửi thông báo nộp bài cho giáo viên:', notifErr);
        }

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

        // Lấy tất cả điểm số cho hoạt động này (tương thích cả ObjectId và chuỗi)
        const grades = await GradeModel.find({
            $or: [
                { assignmentId: activityId },
                { assignmentId: activityId.length === 24 ? new (await import('mongoose')).Types.ObjectId(activityId) : activityId }
            ]
        }).lean();

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
        const studentId = (isTeacher && req.body.studentId) ? req.body.studentId : user.id;

        const newComment = {
            userId: user.id,
            name: user.name || 'Người dùng', // name should ideally come from User
            isTeacher,
            text,
            createdAt: new Date()
        };

        // Tìm kiếm User để lấy tên thật
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

        if (isTeacher && req.body.studentId) {
            try {
                await createUserNotification(
                    studentId,
                    UserRole.STUDENT,
                    user.id,
                    'Phản hồi mới từ Giáo viên',
                    `Giáo viên đã gửi tin nhắn trao đổi trong bài tập: "${text}"`,
                    NotificationType.ASSIGNMENT
                );
            } catch (errNotif) {
                console.error('Lỗi gửi thông báo trao đổi cho học sinh:', errNotif);
            }
        }

        res.status(200).json({ message: 'Bình luận thành công', data: submission });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi gửi bình luận', error });
    }
};

// ============================================================================
// AUTOSAVE BẢN NHÁP BÀI THI TRẮC NGHIỆM
// ============================================================================
export const saveQuizDraft = async (req: Request, res: Response): Promise<any> => {
    try {
        const activityId = req.params.id as string;
        const studentId = (req as any).user?.id;
        const { answers, flagged, questionOrder, optionOrders, currentQIndex } = req.body;

        if (!activityId) return res.status(400).json({ message: 'Thiếu ID hoạt động' });
        if (!studentId) return res.status(401).json({ message: 'Chưa đăng nhập' });

        const updateData: any = {
            answers: answers || {},
            flagged: flagged || {},
            updatedAt: new Date()
        };
        if (Array.isArray(questionOrder) && questionOrder.length > 0) {
            updateData.questionOrder = questionOrder;
        }
        if (optionOrders && typeof optionOrders === 'object') {
            updateData.optionOrders = optionOrders;
        }
        if (typeof currentQIndex === 'number') {
            updateData.currentQIndex = currentQIndex;
        }

        const draft = await QuizDraftModel.findOneAndUpdate(
            { quizId: activityId, studentId },
            {
                $set: updateData,
                $setOnInsert: { startedAt: new Date() }
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            message: 'Đã lưu bản nháp',
            data: draft,
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi khi lưu bản nháp', error });
    }
};

export const getQuizDraft = async (req: Request, res: Response): Promise<any> => {
    try {
        const activityId = req.params.id as string;
        const studentId = (req as any).user?.id;

        if (!activityId) return res.status(400).json({ message: 'Thiếu ID hoạt động' });
        if (!studentId) return res.status(401).json({ message: 'Chưa đăng nhập' });

        let draft: any = await QuizDraftModel.findOne({ quizId: activityId, studentId });
        if (!draft) {
            draft = await QuizDraftModel.create({
                quizId: activityId,
                studentId,
                startedAt: new Date()
            });
        }

        return res.status(200).json({
            data: draft,
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi khi lấy bản nháp', error });
    }
};

