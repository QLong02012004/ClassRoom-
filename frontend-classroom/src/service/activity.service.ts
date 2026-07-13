import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IClassActivity {
  _id: string;
  classId: string;
  bankItemId: any; // Can be populated
  type: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  category: string;
  durationMinutes?: number;
  status?: string;
  createdAt: string;
}

export const activityService = {
  // Giao bài tập / đề thi cho lớp
  assignActivity: async (classId: string, data: any): Promise<IBackendRes<IClassActivity>> => {
    return await api.post(`/api/v1/classes/${classId}/activities`, data);
  },

  // Lấy danh sách hoạt động của lớp
  getClassActivities: async (classId: string): Promise<IBackendRes<IClassActivity[]>> => {
    return await api.get(`/api/v1/classes/${classId}/activities`);
  },

  // Lấy chi tiết hoạt động
  getActivityById: async (id: string): Promise<IBackendRes<IClassActivity>> => {
    return await api.get(`/api/v1/activities/${id}`);
  },

  // Cập nhật hoạt động
  updateActivity: async (id: string, data: any): Promise<IBackendRes<IClassActivity>> => {
    return await api.put(`/api/v1/activities/${id}`, data);
  },

  // Xóa hoạt động
  deleteActivity: async (id: string): Promise<IBackendRes<any>> => {
    return await api.delete(`/api/v1/activities/${id}`);
  },

  // Nộp bài trắc nghiệm
  submitQuiz: async (id: string, answers: number[]): Promise<IBackendRes<any>> => {
    return await api.post(`/api/v1/activities/${id}/submit`, { answers });
  },

  // Lấy điểm của cá nhân (dành cho học sinh)
  getMyQuizResult: async (id: string): Promise<IBackendRes<any>> => {
    return await api.get(`/api/v1/activities/${id}/my-result`);
  },

  // Lấy tất cả điểm (dành cho giáo viên)
  getQuizResults: async (id: string): Promise<IBackendRes<any>> => {
    return await api.get(`/api/v1/activities/${id}/results`);
  }
};
