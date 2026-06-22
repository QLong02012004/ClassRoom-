import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface ISchedule {
  _id: string;
  classId: {
    _id: string;
    name: string;
    subject?: string;
    code: string;
  };
  teacherId: string;
  subject: string;
  chapter?: string;
  dayOfWeek: number; // 1: Thứ 2, 2: Thứ 3...
  startTime: string; // "07:30"
  endTime: string;   // "09:00"
  progress: number;
}

export const scheduleService = {
  // Lấy danh sách lịch dạy của giáo viên
  getSchedule: async (): Promise<IBackendRes<ISchedule[]>> => {
    return await api.get(`/api/v1/schedule`);
  },

  // Tạo lịch dạy mới
  createSchedule: async (data: {
    classId: string;
    subject: string;
    chapter?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    progress?: number;
  }): Promise<IBackendRes<ISchedule>> => {
    return await api.post(`/api/v1/schedule`, data);
  },

  // Xóa lịch dạy
  deleteSchedule: async (id: string): Promise<IBackendRes<ISchedule>> => {
    return await api.delete(`/api/v1/schedule/${id}`);
  },
};
