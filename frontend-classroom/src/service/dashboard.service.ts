import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IDashboardStats {
  totalStudents: number;
  totalTeachers: number;
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
  getTeacherDashboardStats: async (): Promise<IBackendRes<ITeacherDashboardStats>> => {
    return await api.get('/api/v1/dashboard/teacher');
  },
  getStudentDashboardStats: async (): Promise<IBackendRes<any>> => {
    return await api.get('/api/v1/dashboard/student');
  },
  getLeaderboard: async (classId: string): Promise<IBackendRes<any>> => {
    return await api.get(`/api/v1/dashboard/student/leaderboard?classId=${classId}`);
  }
};
