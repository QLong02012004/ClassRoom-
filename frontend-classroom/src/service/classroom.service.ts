import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IClassroomItem {
  id: string; // mã lớp code (VD: REACT1)
  _id: string; // ObjectId từ mongodb
  name: string;
  teacher: {
    id: string;
    name: string;
    avatar: string;
  };
  studentCount: number;
  createdAt: string;
  status: 'Active' | 'Locked';
}

export interface ITeacherClassroom {
  _id: string;
  name: string;
  subject: string;
  code: string;
  teacherId: string;
  students: string[];
  status: 'Active' | 'Locked' | 'Archived';
  createdAt: string;
}

export const classroomService = {
  // Lấy danh sách toàn bộ lớp học (dành cho Admin)
  getAdminClassrooms: async (): Promise<IBackendRes<IClassroomItem[]>> => {
    return await api.get('/api/v1/classrooms/admin');
  },

  // Cập nhật trạng thái lớp học (Khóa/Lưu trữ/Mở)
  updateClassroomStatus: async (id: string, status: 'Active' | 'Locked' | 'Archived'): Promise<IBackendRes<IClassroomItem>> => {
    return await api.put(`/api/v1/classrooms/${id}/status`, { status });
  },

  // Xóa lớp học vĩnh viễn (Admin)
  deleteClassroom: async (id: string): Promise<IBackendRes<null>> => {
    return await api.delete(`/api/v1/classrooms/${id}`);
  },

  // --- TEACHER METHODS ---
  getTeacherClassrooms: async (): Promise<IBackendRes<ITeacherClassroom[]>> => {
    return await api.get('/api/v1/classrooms/teacher');
  },

  // --- STUDENT METHODS ---
  getStudentClassrooms: async (): Promise<IBackendRes<ITeacherClassroom[]>> => {
    return await api.get('/api/v1/classrooms/student');
  },

  getClassroomDetail: async (id: string): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.get(`/api/v1/classrooms/${id}`);
  },
  
  createClassroom: async (data: { className: string; subject: string }): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.post('/api/v1/classrooms', data);
  },

  updateClassroom: async (id: string, data: { className: string; subject: string }): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.put(`/api/v1/classrooms/${id}`, data);
  },

  softDeleteClassroom: async (id: string): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.delete(`/api/v1/classrooms/${id}/soft`);
  },

  hardDeleteClassroom: async (id: string): Promise<IBackendRes<null>> => {
    return await api.delete(`/api/v1/classrooms/${id}/hard`);
  }
};
