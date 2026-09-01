/**
 * ============================================================================
 * TÊN FILE: dashboardController.ts
 * ĐƯỜNG DẪN: backend-classroom/src/controllers/dashboardController.ts
 * MỤC ĐÍCH:
 *   Cung cấp API số liệu thống kê tổng quan (Dashboard Analytics), tỷ lệ chuyên cần,
 *   phổ điểm, tiến độ học tập, cảnh báo học sinh nguy cơ và hệ thống Gamification (XP/Level/Streak/Leaderboard).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Tiếp nhận request từ các vai trò Admin, Giáo viên, Học sinh (`/api/v1/dashboard/*`).
 *   - Truy vấn song song dữ liệu từ nhiều Mongoose Models (`ClassModel`, `UserModel`, `SubmissionModel`, `GradeModel`, `AttendanceModel`, `ScheduleModel`).
 *   - Xử lý thuật toán Gamification (`calculateLevelAndProgress`): Quy đổi điểm số, bài nộp đúng hạn, điểm danh thành điểm kinh nghiệm (XP), tính Level & Chuỗi ngày học liên tục (Streak).
 *
 * THÀNH PHẦN & API CHÍNH:
 *   - `getAdminStats`: Thống kê tổng quan Admin (Tỷ lệ tương tác, tăng trưởng người dùng 12 tháng, lịch sử hoạt động hệ thống).
 *   - `getTeacherDashboardStats`: Thống kê Giáo viên (Phổ điểm, tỷ lệ điểm danh, học sinh cần lưu ý At-Risk).
 *   - `getStudentDashboardStats`: Thống kê Học sinh (Điểm XP, Level, Chuỗi Streak, Lịch học hôm nay, Việc cần làm).
 *   - `getLeaderboard`: Bảng xếp hạng vinh danh Học sinh theo điểm XP (Lớp học hoặc Toàn hệ thống).
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ClassModel } from '../models/Class';
import { UserModel } from '../models/User';
import { NotificationModel } from '../models/Notification';
import { SubmissionModel } from '../models/Submission';
import { QuizResultModel } from '../models/QuizResult';
import { ClassActivityModel } from '../models/ClassActivity';
import { GradeModel } from '../models/Grade';
import { AnnouncementModel } from '../models/Announcement';
import { AttendanceModel } from '../models/Attendance';
import { ScheduleModel } from '../models/Schedule';
import { AttendanceStatus, ClassStatus, UserRole, UserStatus } from '../constants/enums';

const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
};

const getFallback = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return lastWord ? lastWord.charAt(0).toUpperCase() : 'U';
};

const getBadgeAndColor = (type: string) => {
    switch (type) {
        case 'classroom':
            return { badge: 'Lớp học', badgeColor: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-transparent' };
        case 'quiz':
            return { badge: 'Trắc nghiệm', badgeColor: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-transparent' };
        case 'assignment':
            return { badge: 'Bài tập', badgeColor: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-transparent' };
        case 'announcement':
            return { badge: 'Thông báo', badgeColor: 'bg-green-50 text-green-700 hover:bg-green-100 border-transparent' };
        default:
            return { badge: 'Hệ thống', badgeColor: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent' };
    }
};

export const getAdminStats = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        // Đếm tổng số học sinh và giáo viên thật từ DB
        const totalStudents = await UserModel.countDocuments({ role: UserRole.STUDENT, isEmailVerified: { $ne: false } });
        const totalTeachers = await UserModel.countDocuments({ role: UserRole.TEACHER, isEmailVerified: { $ne: false } });
        const pendingTeachers = await UserModel.countDocuments({ role: UserRole.TEACHER, status: UserStatus.PENDING, isEmailVerified: { $ne: false } });

        // Đếm số lớp học đang hoạt động từ DB
        const activeClasses = await ClassModel.countDocuments({ status: ClassStatus.ACTIVE });
        const pendingClasses = await ClassModel.countDocuments({ status: ClassStatus.PENDING });

        // Tính tỷ lệ tương tác và trafficData trong 7 ngày qua
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // 1. Tỷ lệ tương tác: Số HS nộp bài / Tổng HS
        const activeSubmissions = await SubmissionModel.find({ submittedAt: { $gte: sevenDaysAgo } }, 'studentId submittedAt');
        const activeQuizzes = await QuizResultModel.find({ submittedAt: { $gte: sevenDaysAgo } }, 'studentId submittedAt');

        const activeStudentIds = new Set([
            ...activeSubmissions.map(s => s.studentId.toString()),
            ...activeQuizzes.map(q => q.studentId.toString())
        ]);

        const engagementRate = totalStudents === 0 ? 0 : Math.round((activeStudentIds.size / totalStudents) * 1000) / 10;

        // 2. Tỷ lệ Điểm danh hôm nay từ AttendanceModel
        let attendanceRate = 0;
        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);

            const todayAttendances = await AttendanceModel.find({
                date: { $gte: startOfToday, $lte: endOfToday }
            });

            let totalAttendanceRecords = 0;
            let presentCount = 0;

            todayAttendances.forEach((att: any) => {
                (att.records || []).forEach((rec: any) => {
                    totalAttendanceRecords++;
                    if (rec?.status === 'present' || rec?.status === 'late' || rec?.status === AttendanceStatus.PRESENT || rec?.status === AttendanceStatus.LATE) {
                        presentCount++;
                    }
                });
            });

            if (totalAttendanceRecords > 0) {
                attendanceRate = Math.round((presentCount / totalAttendanceRecords) * 1000) / 10;
            }
        } catch (attErr) {
            console.error("Lỗi khi tính tỷ lệ điểm danh hệ thống hôm nay:", attErr);
        }

        // 3. Biểu đồ tăng trưởng người dùng (User Growth) theo 12 tháng của năm (T1 -> T12)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-indexed (ví dụ: Tháng 8 = 8)
        const userGrowthData = [];
        const allTeachersList = await UserModel.find({ role: UserRole.TEACHER }).sort({ createdAt: 1 });
        const allStudentsList = await UserModel.find({ role: UserRole.STUDENT }).sort({ createdAt: 1 });

        for (let m = 1; m <= 12; m++) {
            const monthLabel = `T${m}`;

            // Nếu tháng lớn hơn tháng hiện tại thì chưa diễn ra -> gán 0
            if (m > currentMonth) {
                userGrowthData.push({
                    month: monthLabel,
                    teachers: 0,
                    students: 0
                });
            } else {
                const dateOffset = new Date(currentYear, m, 0, 23, 59, 59);
                const teacherCount = allTeachersList.filter(u => new Date(u.createdAt) <= dateOffset).length;
                const studentCount = allStudentsList.filter(u => new Date(u.createdAt) <= dateOffset).length;

                userGrowthData.push({
                    month: monthLabel,
                    teachers: teacherCount,
                    students: studentCount
                });
            }
        }

        // Lấy danh sách hoạt động gần đây đồng bộ chuẩn từ bảng Notification dành cho Admin
        const notifications = await NotificationModel.find({ recipientRole: UserRole.ADMIN })
            .populate('sender', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(10);

        let recentActions = notifications.map((notif: any) => {
            const sender = notif.sender;
            const isSystem = !sender;
            const userName = isSystem ? "Hệ thống" : (sender.name || "Giáo viên");
            const rawMsg = notif.message || '';
            const lowerMsg = rawMsg.toLowerCase();

            let actionType = 'create_class';
            let badge = 'Thêm Lớp';
            let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
            let actionText = notif.title || 'vừa tạo lớp học mới';

            // Extract quoted class name from notif.message if available
            let className = '';
            const matchQuote = rawMsg.match(/["“]([^"”]+)["”]/);
            if (matchQuote && matchQuote[1]) {
                className = matchQuote[1].trim();
            }

            if (lowerMsg.includes('chờ duyệt') || lowerMsg.includes('phê duyệt') || lowerMsg.includes('đăng ký')) {
                actionType = 'pending_teacher';
                badge = 'Yêu cầu Duyệt';
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                actionText = 'vừa đăng ký tài khoản và đang chờ phê duyệt';
            } else if (lowerMsg.includes('thêm học sinh') || lowerMsg.includes('học sinh vào lớp')) {
                actionType = 'add_student';
                badge = 'Thêm Học Sinh';
                badgeColor = 'bg-cyan-50 text-cyan-700 border-cyan-200';
                actionText = 'vừa thêm học sinh vào lớp';
            } else if (lowerMsg.includes('tạo lớp') || lowerMsg.includes('lớp học mới')) {
                actionType = 'create_class';
                badge = 'Tạo Lớp Mới';
                badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                actionText = 'vừa tạo lớp học mới';
            }

            return {
                id: notif._id.toString(),
                user: userName,
                teacherName: userName,
                className: className,
                actionText: actionText,
                actionType: actionType,
                action: rawMsg || `${userName} ${actionText}`,
                time: formatTimeAgo(notif.createdAt),
                avatar: isSystem ? "" : (sender.avatar || ""),
                badge,
                badgeColor,
                fallback: isSystem ? "HT" : getFallback(userName),
                isSystem
            };
        });

        // Nếu DB chưa có thông báo thật, chỉ cung cấp 2 hoạt động mẫu: Giáo viên tạo lớp và Giáo viên thêm học sinh
        if (recentActions.length === 0) {
            recentActions = [
                {
                    id: 'act-1',
                    user: 'Nguyễn Quang Long',
                    teacherName: 'Nguyễn Quang Long',
                    className: 'Toán 12A1',
                    actionText: 'vừa tạo lớp học mới',
                    actionType: 'create_class',
                    action: 'Giáo viên Nguyễn Quang Long đã tạo lớp học mới: "Toán 12A1" - Môn học: Toán.',
                    time: '10 phút trước',
                    avatar: '',
                    badge: 'Tạo Lớp Mới',
                    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
                    fallback: 'LONG',
                    isSystem: false
                },
                {
                    id: 'act-2',
                    user: 'Nguyễn Quang Long',
                    teacherName: 'Nguyễn Quang Long',
                    className: 'Toán 12A1',
                    actionText: 'vừa thêm học sinh vào lớp',
                    actionType: 'add_student',
                    action: 'Giáo viên Nguyễn Quang Long vừa thêm học sinh vào lớp học "Toán 12A1".',
                    time: '5 phút trước',
                    avatar: '',
                    badge: 'Thêm Học Sinh',
                    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                    fallback: 'LONG',
                    isSystem: false
                }
            ];
        }
        // Lấy dữ liệu thống kê giáo viên và học sinh từ DB
        const classesWithTeacher = await ClassModel.find({ status: { $ne: ClassStatus.ARCHIVED } }).populate('teacherId', 'name');

        const teacherMap = new Map();

        classesWithTeacher.forEach((c: any) => {
            let rawName = 'Giáo viên';
            if (c.teacherId && typeof c.teacherId === 'object' && c.teacherId.name) {
                rawName = c.teacherId.name;
            }

            const teacherName = rawName
                .trim()
                .split(' ')
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');

            if (!teacherMap.has(teacherName)) {
                teacherMap.set(teacherName, {
                    teacher: teacherName,
                    subject: c.subject || 'Môn học',
                    classes: []
                });
            }
            teacherMap.get(teacherName).classes.push({
                className: c.name || 'Lớp học',
                students: Array.isArray(c.students) ? c.students.length : 0
            });
        });

        let teacherStudentStats = Array.from(teacherMap.values());

        // Nếu DB chưa có dữ liệu lớp học, tự động trả về dữ liệu mẫu chuẩn sắc nét
        if (teacherStudentStats.length === 0) {
            teacherStudentStats = [
                {
                    teacher: 'Nguyễn Quang Long',
                    subject: 'Toán',
                    classes: [
                        { className: 'Toán 12A1', students: 5 },
                        { className: 'Toán 11B2', students: 3 },
                        { className: 'Toán 10A3', students: 5 }
                    ]
                },
                {
                    teacher: 'Lê Minh Gia Mẩn',
                    subject: 'Tiếng Anh',
                    classes: [
                        { className: 'Toeic', students: 0 },
                        { className: 'Tiếng Anh Giao tiếp', students: 0 },
                        { className: 'Đại học', students: 0 }
                    ]
                }
            ];
        }

        res.status(200).json({
            message: 'Lấy dữ liệu thống kê thành công',
            data: {
                totalStudents: totalStudents,
                totalTeachers: totalTeachers,
                pendingTeachers: pendingTeachers,
                activeClasses: activeClasses,
                pendingClasses: pendingClasses,
                engagementRate: engagementRate,
                attendanceRate: attendanceRate,
                userGrowthData: userGrowthData,
                teacherPerformanceData: userGrowthData.map(g => ({ name: g.month, assignments: g.students, averageScore: g.teachers })),
                recentActions: recentActions,
                teacherStudentStats: teacherStudentStats
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getTeacherDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const teacherId = (req as any).user?.id;
        if (!teacherId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin giáo viên" });
        }

        // 1. Số lượng lớp học
        const classes = await ClassModel.find({ teacherId }).populate('students', 'name avatar');
        const classIds = classes.map(c => c._id);
        const totalClasses = classIds.length;

        // 2. Tổng số học sinh
        const studentMap = new Map<string, any>();
        classes.forEach(c => {
            if (c.students && c.students.length > 0) {
                c.students.forEach((s: any) => {
                    studentMap.set(s._id.toString(), {
                        _id: s._id,
                        name: s.name,
                        avatar: s.avatar,
                        className: c.name,
                        totalAttendanceRecords: 0,
                        absentCount: 0,
                        totalGrades: 0,
                        scoreSum: 0
                    });
                });
            }
        });
        const totalStudents = studentMap.size;

        // 3. Tỷ lệ chuyên cần hiện tại (overall)
        const attendances = await AttendanceModel.find({ classId: { $in: classIds } });
        let totalRecords = 0;
        let presentCount = 0;

        attendances.forEach(att => {
            if (att.records) {
                att.records.forEach(r => {
                    totalRecords++;
                    if (r.status === 'present') {
                        presentCount++;
                    }

                    // Cập nhật cho từng học sinh
                    const sId = r.studentId.toString();
                    if (studentMap.has(sId)) {
                        const sData = studentMap.get(sId);
                        sData.totalAttendanceRecords++;
                        if (r.status === 'absent') {
                            sData.absentCount++;
                        }
                    }
                });
            }
        });

        const attendanceRate = totalRecords === 0 ? 0 : Math.round((presentCount / totalRecords) * 100);

        const targetClassId = req.query.classId as string;
        const targetClassIds = (targetClassId && targetClassId !== 'all') ? [targetClassId] : classIds;

        // 4 & 5. Phổ điểm và Bài tập cần chấm
        const assignments = await ClassActivityModel.find({ classId: { $in: classIds } });
        const assignmentIds = assignments.map(a => a._id);
        const grades = await GradeModel.find({ assignmentId: { $in: assignmentIds } });
        const allSubmissions = await SubmissionModel.find({ assignmentId: { $in: assignmentIds } });

        let pendingGrades = 0;
        allSubmissions.forEach(sub => {
            const hasGrade = grades.some(g => g.assignmentId.toString() === sub.assignmentId.toString() && g.studentId.toString() === sub.studentId.toString());
            if (!hasGrade) pendingGrades++;
        });

        let totalExpectedSubmissions = 0;
        assignments.forEach(a => {
            const cls = classes.find((c: any) => c._id.toString() === a.classId.toString());
            if (cls && cls.students) {
                totalExpectedSubmissions += cls.students.length;
            }
        });
        const totalSubmitted = allSubmissions.length;

        // TÍNH PHỔ ĐIỂM THEO LỚP ĐƯỢC LỌC (Target Class hoặc Tất cả)
        const targetAssignments = (targetClassId && targetClassId !== 'all')
            ? assignments.filter(a => a.classId.toString() === targetClassId)
            : assignments;
        const targetAssignmentIds = targetAssignments.map(a => a._id.toString());
        const targetGrades = grades.filter(g => targetAssignmentIds.includes(g.assignmentId.toString()));

        let gioi = 0, kha = 0, trungBinh = 0, yeuKem = 0;
        if (targetGrades.length > 0) {
            targetGrades.forEach(g => {
                if (g.score >= 8) gioi++;
                else if (g.score >= 6.5) kha++;
                else if (g.score >= 5.0) trungBinh++;
                else yeuKem++;

                // Cập nhật điểm cho từng học sinh
                const sId = g.studentId.toString();
                if (studentMap.has(sId)) {
                    const sData = studentMap.get(sId);
                    sData.totalGrades++;
                    sData.scoreSum += g.score;
                }
            });
        }

        // 6. Trend data real
        const trendData = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = `Tháng ${d.getMonth() + 1}`;

            // Calculate currentYear rate
            const startMonth = new Date(d.getFullYear(), d.getMonth(), 1);
            const endMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

            const monthAttendances = attendances.filter(a => {
                const aDate = new Date(a.date);
                return aDate >= startMonth && aDate <= endMonth;
            });

            let mTotal = 0;
            let mPresent = 0;
            monthAttendances.forEach(att => {
                if (att.records) {
                    att.records.forEach(r => {
                        mTotal++;
                        if (r.status === 'present') mPresent++;
                    });
                }
            });

            const currentYear = mTotal === 0 ? 0 : Math.round((mPresent / mTotal) * 100);
            const lastYear = 0; // We don't have last year data in DB easily

            trendData.push({ month: monthStr, currentYear, lastYear });
        }

        // 7. Recent activities real (from submissions)
        const recentSubmissions = await SubmissionModel.find({ assignmentId: { $in: assignmentIds } })
            .populate('studentId', 'name avatar')
            .sort({ submittedAt: -1 })
            .limit(5);

        const recentActivities = recentSubmissions.map((sub: any) => {
            const assignment = assignments.find(a => a._id.toString() === sub.assignmentId.toString());
            return {
                id: sub._id.toString(),
                user: sub.studentId?.name || "Học sinh",
                action: `đã nộp bài tập ${assignment?.title || ''}`,
                time: formatTimeAgo(sub.submittedAt || new Date()),
                avatar: sub.studentId?.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(sub.studentId?.name || "HS")
            };
        });

        // 8. Tính toán học sinh có nguy cơ (At-risk Students)
        const atRiskStudents: any[] = [];
        studentMap.forEach((data, sId) => {
            let issue = '';
            let severity = 'medium';
            let isAtRisk = false;

            const absentRate = data.totalAttendanceRecords > 0 ? (data.absentCount / data.totalAttendanceRecords) * 100 : 0;
            const avgScore = data.totalGrades > 0 ? (data.scoreSum / data.totalGrades) : null;

            if (absentRate > 20) {
                isAtRisk = true;
                issue = `Vắng ${Math.round(absentRate)}%`;
                severity = absentRate > 40 ? 'high' : 'medium';
            } else if (avgScore !== null && avgScore < 5.0) {
                isAtRisk = true;
                issue = `Điểm TB ${avgScore.toFixed(1)}`;
                severity = avgScore < 3.5 ? 'high' : 'medium';
            }

            if (isAtRisk) {
                atRiskStudents.push({
                    id: sId,
                    name: data.name,
                    avatar: data.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(data.name || "HS"),
                    className: data.className,
                    issue,
                    severity
                });
            }
        });

        // Sắp xếp ưu tiên cảnh báo mức cao trước, sau đó lấy tối đa 5 học sinh
        atRiskStudents.sort((a, b) => {
            if (a.severity === 'high' && b.severity !== 'high') return -1;
            if (a.severity !== 'high' && b.severity === 'high') return 1;
            return 0;
        });
        const topAtRiskStudents = atRiskStudents.slice(0, 5);

        res.status(200).json({
            message: 'Lấy dữ liệu thống kê giáo viên thành công',
            data: {
                stats: {
                    totalClasses,
                    totalStudents,
                    attendanceRate,
                    pendingGrades,
                    totalSubmitted,
                    totalExpectedSubmissions
                },
                scoreDistribution: {
                    gioi,
                    kha,
                    trungBinh,
                    yeuKem
                },
                trendData,
                recentActivities,
                atRiskStudents: topAtRiskStudents,
                classes: classes.map((c: any) => ({
                    _id: c._id,
                    className: c.name,
                    subject: c.subject || 'Môn học chung'
                }))
            }
        });
    } catch (error: any) {
        next(error);
    }
};

export const calculateLevelAndProgress = (totalXP: number) => {
    let level = 1;
    let currentLevelXP = Math.max(0, Math.round(totalXP));
    let requiredForCurrentLevel = 100 + (level - 1) * 50;

    while (currentLevelXP >= requiredForCurrentLevel) {
        currentLevelXP -= requiredForCurrentLevel;
        level++;
        requiredForCurrentLevel = 100 + (level - 1) * 50;
    }

    const xpInLevel = currentLevelXP;
    const xpRequiredForNext = requiredForCurrentLevel;
    const progressPercent = Math.min(100, Math.round((xpInLevel / xpRequiredForNext) * 100));

    return {
        level,
        xpInLevel,
        xpRequiredForNext,
        progressPercent
    };
};

export const getStudentDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const studentId = (req as any).user?.id;
        if (!studentId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin học sinh" });
        }

        const user = await UserModel.findById(studentId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }



        const classes = await ClassModel.find({ students: studentId, status: ClassStatus.ACTIVE }).populate('teacherId', 'name avatar');
        const classIds = classes.map(c => c._id);

        const recentAnnouncements = await AnnouncementModel.find({ classId: { $in: classIds } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('authorId', 'name avatar')
            .populate('classId', 'name');

        const announcements = recentAnnouncements.map((ann: any) => ({
            id: ann._id,
            content: ann.content,
            authorName: ann.authorId?.name || 'Giáo viên',
            authorAvatar: ann.authorId?.avatar || '',
            className: ann.classId?.name || 'Lớp học',
            time: formatTimeAgo(ann.createdAt)
        }));

        const attendances = await AttendanceModel.find({ classId: { $in: classIds } });
        let totalRecords = 0;
        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;
        attendances.forEach(att => {
            if (att.records) {
                att.records.forEach(r => {
                    if (r.studentId.toString() === studentId.toString()) {
                        totalRecords++;
                        if (r.status === 'present') presentCount++;
                        if (r.status === 'late') lateCount++;
                        if (r.status === 'absent') absentCount++;
                    }
                });
            }
        });
        const attendanceRate = totalRecords === 0 ? 100 : Math.round((presentCount / totalRecords) * 100);

        const assignments = await ClassActivityModel.find({ classId: { $in: classIds } });
        const assignmentIds = assignments.map(a => a._id);
        const submissions = await SubmissionModel.find({ studentId, assignmentId: { $in: assignmentIds } });

        let pendingAssignmentsCount = 0;
        const todoList: any[] = [];

        assignments.forEach(a => {
            const hasSub = submissions.some(s => s.assignmentId.toString() === a._id.toString());
            const cls: any = classes.find((c: any) => c._id.toString() === a.classId.toString());

            if (!hasSub && a.dueDate && new Date(a.dueDate) >= new Date()) {
                pendingAssignmentsCount++;
                todoList.push({
                    _id: a._id.toString(),
                    title: a.title,
                    type: a.type,
                    dueDate: a.dueDate,
                    className: cls ? cls.name : 'Lớp học'
                });
            }
        });

        todoList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        const grades = await GradeModel.find({ studentId, assignmentId: { $in: assignmentIds } });
        let sumGPA = 0;
        grades.forEach(g => {
            sumGPA += g.score;
        });
        const overallGPA = grades.length > 0 ? (sumGPA / grades.length).toFixed(1) : null;

        // Lấy lịch học hôm nay của học sinh từ ScheduleModel thật
        // dayOfWeek: 0=CN, 1=T2, ..., 6=T7 (JS) -> cần map sang 1=T2..7=CN (schema)
        const jsDay = new Date().getDay(); // 0 = Chủ nhật
        const schemaDayOfWeek = jsDay === 0 ? 7 : jsDay; // 0 -> 7, 1->1, 2->2, ...

        const todayScheduleRaw = await ScheduleModel.find({
            classId: { $in: classIds },
            dayOfWeek: schemaDayOfWeek
        })
            .populate('classId', 'name subject')
            .sort({ startTime: 1 });

        const todaySchedule = todayScheduleRaw.map((s: any) => ({
            _id: s._id.toString(),
            className: s.classId?.name || 'Lớp học',
            subject: s.classId?.subject || s.subject || 'Môn học',
            teacherName: (classes.find((c: any) => c._id.toString() === s.classId?._id?.toString())
                ?.teacherId as any)?.name || 'Giáo viên',
            startTime: s.startTime,
            endTime: s.endTime,
            status: 'upcoming'
        }));
        const now = new Date();
        const last6Months: { year: number; month: number; label: string; desktop: number; mobile: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last6Months.push({
                year: d.getFullYear(),
                month: d.getMonth(),
                label: `Tháng ${d.getMonth() + 1}`,
                desktop: 0,
                mobile: 0
            });
        }

        assignments.forEach(a => {
            if (!a.dueDate) return;
            const aDate = new Date(a.dueDate);
            const targetMonth = last6Months.find(m => m.year === aDate.getFullYear() && m.month === aDate.getMonth());
            if (targetMonth) {
                const hasSub = submissions.some(s => s.assignmentId.toString() === a._id.toString());
                if (hasSub) {
                    targetMonth.desktop += 1;
                } else {
                    targetMonth.mobile += 1;
                }
            }
        });

        const learningProgress = last6Months.map(m => ({
            month: m.label,
            desktop: m.desktop,
            mobile: m.mobile
        }));

        const recentActivities = [
            ...grades.map(g => {
                const a = assignments.find(x => x._id.toString() === g.assignmentId.toString());
                return {
                    id: g._id.toString(),
                    type: 'grade',
                    action: `Đã nhận điểm ${g.score} bài tập ${a?.title || ''}`,
                    time: formatTimeAgo(g.gradedAt || new Date())
                };
            })
        ].slice(0, 5);

        if (recentActivities.length === 0) {
            recentActivities.push({ id: 'sys1', type: 'system', action: 'Bạn vừa đăng nhập', time: 'Vừa xong' });
        }

        const weeklyGoals = [
            { id: 'g1', title: 'Đi học đầy đủ 100%', target: 100, current: attendanceRate, unit: '%' },
            { id: 'g2', title: 'Hoàn thành bài tập', target: 5, current: Math.min(5, submissions.length), unit: 'bài' }
        ];

        let onTimeCount = 0;
        let streak = 0;
        const sortedSubmissions = [...submissions].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

        submissions.forEach(sub => {
            const assignment = assignments.find(a => a._id.toString() === sub.assignmentId.toString());
            const isLate = (assignment && assignment.dueDate) ? new Date(sub.submittedAt).getTime() > new Date(assignment.dueDate).getTime() : false;
            if (!isLate) {
                onTimeCount++;
            }
        });

        for (const sub of sortedSubmissions) {
            const assignment = assignments.find(a => a._id.toString() === sub.assignmentId.toString());
            const isLate = (assignment && assignment.dueDate) ? new Date(sub.submittedAt).getTime() > new Date(assignment.dueDate).getTime() : false;
            if (!isLate) {
                streak++;
            } else {
                break;
            }
        }

        const onTimeSubmissionRate = submissions.length === 0 ? 100 : Math.round((onTimeCount / submissions.length) * 100);

        let sumGrades = 0;
        grades.forEach(g => {
            sumGrades += g.score;
        });

        let totalXP = Math.max(0, Math.round((sumGrades * 3) + (onTimeCount * 15) + (presentCount * 5) + (lateCount * 2) - (absentCount * 5)));
        const levelInfo = calculateLevelAndProgress(totalXP);

        const gamification = {
            xp: totalXP,
            level: levelInfo.level,
            xpInLevel: levelInfo.xpInLevel,
            xpRequiredForNext: levelInfo.xpRequiredForNext,
            progressPercent: levelInfo.progressPercent,
            streak: streak
        };

        // Tính tiến độ nộp bài theo từng lớp (dùng cho card "Tiến độ học tập" ở Dashboard)
        const learningStats = (classes as any[]).map(cls => {
            const classAssignments = assignments.filter(a => a.classId.toString() === cls._id.toString());
            const classSubmissions = submissions.filter(s =>
                classAssignments.some(a => a._id.toString() === s.assignmentId.toString())
            );
            const total = classAssignments.length;
            const submitted = classSubmissions.length;
            const progressPercent = total > 0 ? Math.round((submitted / total) * 100) : 0;
            return {
                classId: cls._id.toString(),
                className: cls.name,
                subject: cls.subject || 'Môn học',
                totalAssignments: total,
                submittedCount: submitted,
                progressPercent
            };
            // Sắp xếp: lớp có nhiều bài tập nhất lên đầu
        }).sort((a, b) => b.totalAssignments - a.totalAssignments);

        res.status(200).json({
            message: 'Lấy dữ liệu thống kê học sinh thành công',
            data: {
                gamification,
                stats: {
                    totalClasses: classes.length,
                    attendanceRate,
                    pendingAssignmentsCount,
                    totalXP,
                    onTimeSubmissionRate
                },
                todoList,
                todaySchedule,
                learningProgress,
                announcements,
                weeklyGoals,
                learningStats,
                classes: classes.map((c: any) => ({ _id: c._id, name: c.name }))
            }
        });
    } catch (error: any) {
        next(error);
    }
};

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const classIdQuery = req.query.classId;
        if (!classIdQuery) {
            return res.status(400).json({ message: "Thiếu classId" });
        }

        const classId = classIdQuery as string;

        const classObj = await ClassModel.findById(classId).populate('students', 'name avatar');
        if (!classObj) {
            return res.status(404).json({ message: "Không tìm thấy lớp học" });
        }

        const students = classObj.students as any[];

        const assignments = await ClassActivityModel.find({ classId });
        const assignmentIds = assignments.map(a => a._id);

        const submissions = await SubmissionModel.find({ assignmentId: { $in: assignmentIds } });
        const grades = await GradeModel.find({ assignmentId: { $in: assignmentIds } });
        const attendances = await AttendanceModel.find({ classId });

        const leaderboardData = students.map(student => {
            const studentId = student._id.toString();

            // Grades XP
            const studentGrades = grades.filter(g => g.studentId.toString() === studentId);
            const sumGrades = studentGrades.reduce((sum, g) => sum + g.score, 0);

            // Submissions XP
            const studentSubmissions = submissions.filter(s => s.studentId.toString() === studentId);
            const onTimeCount = studentSubmissions.filter(s => {
                const assignment = assignments.find(a => a._id.toString() === s.assignmentId.toString());
                const isLate = (assignment && assignment.dueDate) ? new Date(s.submittedAt).getTime() > new Date(assignment.dueDate).getTime() : false;
                return !isLate;
            }).length;

            // Attendance XP
            let presentCount = 0;
            let lateCount = 0;
            let absentCount = 0;
            attendances.forEach(att => {
                if (att.records) {
                    const record = att.records.find(r => r.studentId.toString() === studentId);
                    if (record) {
                        if (record.status === 'present') presentCount++;
                        if (record.status === 'late') lateCount++;
                        if (record.status === 'absent') absentCount++;
                    }
                }
            });

            const totalXP = Math.max(0, Math.round((sumGrades * 3) + (onTimeCount * 15) + (presentCount * 5) + (lateCount * 2) - (absentCount * 5)));

            return {
                id: studentId,
                name: student.name,
                avatar: student.avatar,
                xp: totalXP
            };
        });

        // Sort descending
        leaderboardData.sort((a, b) => b.xp - a.xp);

        res.status(200).json({
            message: 'Lấy bảng xếp hạng thành công',
            data: leaderboardData
        });
    } catch (error) {
        next(error);
    }
};
