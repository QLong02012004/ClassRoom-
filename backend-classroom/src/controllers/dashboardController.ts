import { Request, Response, NextFunction } from 'express';
import { ClassModel } from '../models/Class';
import { UserModel } from '../models/User';
import { NotificationModel } from '../models/Notification';
import { SubmissionModel } from '../models/Submission';
import { QuizResultModel } from '../models/QuizResult';

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
        const totalStudents = await UserModel.countDocuments({ role: 'student' });
        const totalTeachers = await UserModel.countDocuments({ role: 'teacher' });

        // Đếm số lớp học đang hoạt động từ DB
        const activeClasses = await ClassModel.countDocuments({ status: 'Active' });

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

        // 2. Tần suất hoạt động (Traffic Data)
        const trafficData = [];
        const daysMap = new Map(); // key: YYYY-MM-DD, value: count
        
        // Khởi tạo mảng 7 ngày
        for (let i = 0; i < 7; i++) {
            const date = new Date(sevenDaysAgo);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            const dayName = dayNames[date.getDay()];
            trafficData.push({ name: dayName, value: 0, dateStr });
            daysMap.set(dateStr, trafficData[i]);
        }

        // Đếm submission
        activeSubmissions.forEach((s: any) => {
            const d = new Date(s.submittedAt);
            // Bù giờ Việt Nam để lấy ngày đúng (GMT+7)
            d.setHours(d.getHours() + 7);
            const dStr = d.toISOString().split('T')[0];
            if (daysMap.has(dStr)) {
                daysMap.get(dStr).value++;
            }
        });

        // Đếm quiz
        activeQuizzes.forEach((q: any) => {
            const d = new Date(q.submittedAt);
            d.setHours(d.getHours() + 7);
            const dStr = d.toISOString().split('T')[0];
            if (daysMap.has(dStr)) {
                daysMap.get(dStr).value++;
            }
        });

        // Format lại trafficData để xoá dateStr
        const finalTrafficData = trafficData.map(item => ({ name: item.name, value: item.value }));

        // Lấy danh sách hoạt động gần đây từ bảng Notification
        const notifications = await NotificationModel.find({ recipientRole: 'admin' })
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

        res.status(200).json({
            message: 'Lấy dữ liệu thống kê thành công',
            data: {
                totalStudents,
                totalTeachers,
                activeClasses,
                engagementRate,
                trafficData: finalTrafficData,
                recentActions
            }
        });
    } catch (error) {
        next(error);
    }
};

import { AttendanceModel } from '../models/Attendance';
import { AssignmentModel } from '../models/Assignment';
import { GradeModel } from '../models/Grade';
import mongoose from 'mongoose';

export const getTeacherDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const teacherId = (req as any).user?.id;
        if (!teacherId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin giáo viên" });
        }

        // 1. Số lượng lớp học
        const classes = await ClassModel.find({ teacherId });
        const classIds = classes.map(c => c._id);
        const totalClasses = classIds.length;

        // 2. Tổng số học sinh
        const studentSet = new Set<string>();
        classes.forEach(c => {
            if (c.students && c.students.length > 0) {
                c.students.forEach(s => studentSet.add(s.toString()));
            }
        });
        const totalStudents = studentSet.size;

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
                });
            }
        });
        
        const attendanceRate = totalRecords === 0 ? 96 : Math.round((presentCount / totalRecords) * 100);

        // 4. Bài tập cần chấm
        const pendingGrades = 15; // Mock for now

        // 5. Phổ điểm (Giỏi >= 8, Khá >= 6.5, TB < 6.5)
        const assignments = await AssignmentModel.find({ classId: { $in: classIds } });
        const assignmentIds = assignments.map(a => a._id);
        const grades = await GradeModel.find({ assignmentId: { $in: assignmentIds } });
        
        let gioi = 0, kha = 0, trungBinh = 0;
        if (grades.length > 0) {
            grades.forEach(g => {
                if (g.score >= 8) gioi++;
                else if (g.score >= 6.5) kha++;
                else trungBinh++;
            });
        } else {
            // Mock data if no grades
            gioi = 142;
            kha = 110;
            trungBinh = 68;
        }

        res.status(200).json({
            message: 'Lấy dữ liệu thống kê giáo viên thành công',
            data: {
                stats: {
                    totalClasses,
                    totalStudents,
                    attendanceRate,
                    pendingGrades
                },
                scoreDistribution: {
                    gioi,
                    kha,
                    trungBinh
                },
                classes: classes.map(c => ({
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
