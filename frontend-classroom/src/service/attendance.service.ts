import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IStudent {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface IAttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  note?: string;
}

export interface IAttendance {
  _id: string;
  classId: string;
  date: string;
  records: IAttendanceRecord[];
}

export const attendanceService = {
  // Lấy danh sách học sinh của một lớp
  getClassroomStudents: async (classId: string): Promise<IBackendRes<IStudent[]>> => {
    return await api.get(`/api/v1/classrooms/${classId}/students`);
  },

  // Lấy bản ghi điểm danh theo lớp + ngày
  getAttendance: async (classId: string, date: string): Promise<IBackendRes<IAttendance | null>> => {
    return await api.get(`/api/v1/attendance`, { params: { classId, date } });
  },

  // Lưu / cập nhật điểm danh
  saveAttendance: async (data: {
    classId: string;
    date: string;
    records: IAttendanceRecord[];
  }): Promise<IBackendRes<IAttendance>> => {
    return await api.post(`/api/v1/attendance`, data);
  },
};
