/**
 * ============================================================================
 * TÊN FILE: dashboard.service.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/service/dashboard.service.ts
 * MỤC ĐÍCH:
 *   Cung cấp đối tượng `dashboardService` gọi API HTTP lấy dữ liệu thống kê tổng quan (Dashboard Analytics),
 *   phổ điểm, học sinh có nguy cơ và Bảng xếp hạng Gamification XP.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Định nghĩa TypeScript Interfaces: `IDashboardStats`, `ITeacherDashboardStats`.
 *   - Gọi các API `/api/v1/dashboard/*`.
 * ============================================================================
 */

import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  pendingTeachers?: number;
  activeClasses: number;
  engagementRate: number;
  attendanceRate?: number;
  userGrowthData?: { month: string; teachers: number; students: number }[];
  teacherPerformanceData?: { name: string; assignments: number; averageScore: number }[];
  recentActions: {
    id: string;
    user: string;
    teacherName?: string;
    className?: string;
    actionText?: string;
    actionType?: string;
    action: string;
    time: string;
    avatar: string;
    badge: string;
    badgeColor: string;
    fallback: string;
    isSystem?: boolean;
  }[];
  teacherStudentStats?: {
    teacher: string;
    subject: string;
    classes: {
      className: string;
      students: number;
    }[];
  }[];
}

export interface ITeacherDashboardStats {
  stats: {
    totalClasses: number;
    totalStudents: number;
    attendanceRate: number;
    pendingGrades: number;
    totalSubmitted: number;
    totalExpectedSubmissions: number;
  };
  scoreDistribution: {
    gioi: number;
    kha: number;
    trungBinh: number;
    yeuKem: number;
  };
  trendData: { month: string; currentYear: number; lastYear: number }[];
  recentActivities: {
    id: string;
    user: string;
    action: string;
    time: string;
    avatar: string;
  }[];
  atRiskStudents?: {
    id: string;
    name: string;
    avatar: string;
    className: string;
    issue: string;
    severity: 'high' | 'medium';
  }[];
  classes: {
    _id: string;
    className: string;
    subject: string;
  }[];
}

export const dashboardService = {
  getAdminStats: async (): Promise<IBackendRes<IDashboardStats>> => {
    return await api.get('/api/v1/dashboard/admin');
  },
  getTeacherDashboardStats: async (classId?: string): Promise<IBackendRes<ITeacherDashboardStats>> => {
    const url = classId && classId !== 'all' ? `/api/v1/dashboard/teacher?classId=${classId}` : '/api/v1/dashboard/teacher';
    return await api.get(url);
  },
  getStudentDashboardStats: async (): Promise<IBackendRes<any>> => {
    return await api.get('/api/v1/dashboard/student');
  },
  getLeaderboard: async (classId: string): Promise<IBackendRes<any>> => {
    return await api.get(`/api/v1/dashboard/student/leaderboard?classId=${classId}`);
  }
};
