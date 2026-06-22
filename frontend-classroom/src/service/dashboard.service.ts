import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeClasses: number;
  engagementRate: number;
  trafficData: { name: string; value: number }[];
  recentActions: {
    id: string;
    user: string;
    action: string;
    time: string;
    avatar: string;
    badge: string;
    badgeColor: string;
    fallback: string;
    isSystem?: boolean;
  }[];
}

export interface ITeacherDashboardStats {
  stats: {
    totalClasses: number;
    totalStudents: number;
    attendanceRate: number;
    pendingGrades: number;
  };
  scoreDistribution: {
    gioi: number;
    kha: number;
    trungBinh: number;
  };
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
  }
};
