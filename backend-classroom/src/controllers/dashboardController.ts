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
import { ClassStatus, UserRole } from '../constants/enums';

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
        const totalStudents = await UserModel.countDocuments({ role: UserRole.STUDENT });
        const totalTeachers = await UserModel.countDocuments({ role: UserRole.TEACHER });

        // Đếm số lớp học đang hoạt động từ DB
        const activeClasses = await ClassModel.countDocuments({ status: ClassStatus.ACTIVE });

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

        // 2. Hiệu suất giảng dạy của giáo viên (Teacher Performance)
        const activeClassesData = await ClassModel.find({ status: ClassStatus.ACTIVE }).populate('teacherId', 'name');

        const classIdsData = activeClassesData.map(c => c._id);
        const allAssignments = await ClassActivityModel.find({ classId: { $in: classIdsData } });

        const assignmentIdsData = allAssignments.map(a => a._id);
        const allGrades = await GradeModel.find({ assignmentId: { $in: assignmentIdsData } });

        const performanceMap = new Map();

        activeClassesData.forEach((c: any) => {
            if (c.teacherId) {
                const tId = c.teacherId._id.toString();
                if (!performanceMap.has(tId)) {
                    performanceMap.set(tId, {
                        teacherName: c.teacherId.name,
                        assignmentCount: 0,
                        totalScore: 0,
                        gradeCount: 0
                    });
                }
            }
        });

        allAssignments.forEach(a => {
            const cls = activeClassesData.find(c => c._id.toString() === a.classId.toString());
            if (cls && cls.teacherId) {
                const tId = cls.teacherId._id.toString();
                if (performanceMap.has(tId)) {
                    performanceMap.get(tId).assignmentCount++;
                }
            }
        });

        allGrades.forEach(g => {
            const assignment = allAssignments.find(a => a._id.toString() === g.assignmentId.toString());
            if (assignment) {
                const cls = activeClassesData.find(c => c._id.toString() === assignment.classId.toString());
                if (cls && cls.teacherId) {
                    const tId = cls.teacherId._id.toString();
                    if (performanceMap.has(tId)) {
                        performanceMap.get(tId).totalScore += g.score;
                        performanceMap.get(tId).gradeCount++;
                    }
                }
            }
        });

        const teacherPerformanceData = Array.from(performanceMap.values()).map((data: any) => ({
            name: data.teacherName,
            assignments: data.assignmentCount,
            averageScore: data.gradeCount > 0 ? Math.round((data.totalScore / data.gradeCount) * 10) / 10 : 0
        }));

        // Lấy danh sách hoạt động gần đây từ bảng Notification
        const notifications = await NotificationModel.find({ recipientRole: UserRole.ADMIN })
            .populate('sender', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(10);

        const recentActions = notifications.map((notif: any) => {
            const sender = notif.sender;
            const isSystem = !sender;
            const userName = isSystem ? "Hệ thống" : sender.name;
            const { badge, badgeColor } = getBadgeAndColor(notif.type);

            return {
                id: notif._id.toString(),
                user: userName,
                action: notif.message,
                time: formatTimeAgo(notif.createdAt),
                avatar: isSystem ? "" : (sender.avatar || ""),
                badge,
                badgeColor,
                fallback: isSystem ? "HT" : getFallback(userName),
                isSystem
            };
        });
        // Lấy dữ liệu thống kê giáo viên và học sinh
        const classesWithTeacher = await ClassModel.find({ status: ClassStatus.ACTIVE }).populate('teacherId', 'name');

        const teacherMap = new Map();

        classesWithTeacher.forEach((c: any) => {
            if (c.teacherId && c.teacherId.name) {
                const teacherName = c.teacherId.name;
                if (!teacherMap.has(teacherName)) {
                    teacherMap.set(teacherName, {
                        teacher: teacherName,
                        subject: c.subject || 'Môn học chung',
                        classes: []
                    });
                }
                teacherMap.get(teacherName).classes.push({
                    className: c.name,
                    students: c.students ? c.students.length : 0
                });
            }
        });

        const teacherStudentStats = Array.from(teacherMap.values());

        let finalTeacherPerformanceData = teacherPerformanceData;
        let finalRecentActions = recentActions;
        let finalTeacherStudentStats = teacherStudentStats;

        res.status(200).json({
            message: 'Lấy dữ liệu thống kê thành công',
            data: {
                totalStudents: totalStudents,
                totalTeachers: totalTeachers,
                activeClasses: activeClasses,
                engagementRate: engagementRate,
                teacherPerformanceData: finalTeacherPerformanceData,
                recentActions: finalRecentActions,
                teacherStudentStats: finalTeacherStudentStats
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

        let gioi = 0, kha = 0, trungBinh = 0, yeuKem = 0;
        if (grades.length > 0) {
            grades.forEach(g => {
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

        const now = new Date();
        const lastLogin = user.lastLoginDate;
        let streak = user.streak || 0;
        
        if (lastLogin) {
            const lastLoginDate = new Date(lastLogin).setHours(0,0,0,0);
            const todayDate = new Date(now).setHours(0,0,0,0);
            const diffTime = Math.abs(todayDate - lastLoginDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
                streak += 1;
            } else if (diffDays > 1) {
                streak = 1;
            }
        } else {
            streak = 1;
        }

        user.lastLoginDate = now;
        user.streak = streak;
        // Mock XP addition for daily login
        user.xp = (user.xp || 0) + 10;
        user.level = Math.floor(user.xp / 100) + 1;
        await user.save();

        const gamification = {
            xp: user.xp || 0,
            level: user.level || 1,
            streak: user.streak || 0
        };

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
        attendances.forEach(att => {
            if (att.records) {
                att.records.forEach(r => {
                    if (r.studentId.toString() === studentId.toString()) {
                        totalRecords++;
                        if (r.status === 'present') presentCount++;
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

        const todaySchedule: any[] = [];
        if (classes.length > 0) {
            const firstClass: any = classes[0];
            todaySchedule.push({
                _id: firstClass._id.toString(),
                className: firstClass.name,
                subject: firstClass.subject || 'Môn học chung',
                teacherName: firstClass.teacherId?.name || 'Giáo viên',
                startTime: '08:00',
                endTime: '09:30',
                status: 'upcoming'
            });
        }
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

        res.status(200).json({
            message: 'Lấy dữ liệu thống kê học sinh thành công',
            data: {
                gamification,
                stats: {
                    totalClasses: classes.length,
                    attendanceRate,
                    pendingAssignmentsCount,
                    totalXP: user.xp || 0
                },
                todoList,
                todaySchedule,
                learningProgress,
                announcements,
                weeklyGoals
            }
        });
    } catch (error: any) {
        next(error);
    }
};
