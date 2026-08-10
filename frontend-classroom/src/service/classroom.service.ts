import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IClassroomItem {
  id: string; // mã lớp code (VD: REACT1)
  _id: string; // ObjectId từ mongodb
  name: string;
  subject: string;
  teacher: {
    id: string;
    name: string;
    avatar: string;
  };
  studentCount: number;
  createdAt: string;
  status: 'Active' | 'Locked' | 'Pending' | 'Closed';
}

export interface ITeacherClassroom {
  _id: string;
  name: string;
  subject: string;
  code: string;
  teacherId: string | { _id: string; name: string; avatar?: string };
  students: string[];
  status: 'Active' | 'Locked' | 'Archived' | 'Pending' | 'Closed';
  requireApproval?: boolean;
  createdAt: string;
  googleSheetId?: string;
  googleSheetUrl?: string;
  pendingGrades?: number;
  pendingRequestsCount?: number;
  latestAssignmentTitle?: string | null;
  latestAssignmentDue?: string | null;
}

export interface IClassJoinRequestItem {
  _id: string;
  classId: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface IPendingStudentClassItem {
  requestId: string;
  requestedAt: string;
  class: ITeacherClassroom;
}

export interface IClassroomActivities {
  currentTopic: string;
  recentActivities: {
    type: 'assignment_created' | 'submission';
    content: string;
    time: string;
  }[];
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

  // Lấy lịch sử hoạt động lớp học (Admin)
  getAdminClassroomActivities: async (id: string): Promise<IBackendRes<IClassroomActivities>> => {
    return await api.get(`/api/v1/classrooms/admin/${id}/activities`);
  },

  // --- TEACHER METHODS ---
  getTeacherClassrooms: async (): Promise<IBackendRes<ITeacherClassroom[]>> => {
    return await api.get('/api/v1/classrooms/teacher');
  },

  getPendingJoinRequests: async (classId: string): Promise<IBackendRes<IClassJoinRequestItem[]>> => {
    return await api.get(`/api/v1/classrooms/${classId}/join-requests`);
  },

  getTeacherPendingCount: async (): Promise<IBackendRes<{ totalPendingCount: number }>> => {
    return await api.get('/api/v1/classrooms/teacher/pending-requests-count');
  },

  approveJoinRequest: async (classId: string, requestId: string): Promise<IBackendRes<any>> => {
    return await api.post(`/api/v1/classrooms/${classId}/join-requests/${requestId}/approve`);
  },

  rejectJoinRequest: async (classId: string, requestId: string): Promise<IBackendRes<any>> => {
    return await api.post(`/api/v1/classrooms/${classId}/join-requests/${requestId}/reject`);
  },

  approveAllJoinRequests: async (classId: string): Promise<IBackendRes<{ approvedCount: number }>> => {
    return await api.post(`/api/v1/classrooms/${classId}/join-requests/approve-all`);
  },

  // --- STUDENT METHODS ---
  getStudentClassrooms: async (): Promise<IBackendRes<ITeacherClassroom[]>> => {
    return await api.get('/api/v1/classrooms/student');
  },

  getStudentPendingClasses: async (): Promise<IBackendRes<IPendingStudentClassItem[]>> => {
    return await api.get('/api/v1/classrooms/student/pending');
  },

  joinClassByCode: async (code: string): Promise<IBackendRes<any>> => {
    return await api.post('/api/v1/classrooms/join', { code });
  },

  getClassroomDetail: async (id: string): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.get(`/api/v1/classrooms/${id}`);
  },

  createClassroom: async (data: { className: string; subject: string; requireApproval?: boolean }): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.post('/api/v1/classrooms', data);
  },

  updateClassroom: async (id: string, data: { className: string; subject: string; requireApproval?: boolean }): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.put(`/api/v1/classrooms/${id}`, data);
  },

  toggleCloseClassroom: async (id: string): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.put(`/api/v1/classrooms/${id}/close`);
  },

  addExistingStudent: async (id: string, studentId: string): Promise<IBackendRes<any>> => {
    return await api.post(`/api/v1/classrooms/${id}/students/add`, { studentId });
  },

  softDeleteClassroom: async (id: string): Promise<IBackendRes<any>> => {
    return await api.delete(`/api/v1/classrooms/${id}/soft`);
  },

  hardDeleteClassroom: async (id: string): Promise<IBackendRes<null>> => {
    return await api.delete(`/api/v1/classrooms/${id}/hard`);
  },

  generateGoogleSheet: async (id: string): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.post(`/api/v1/classrooms/${id}/google-sheet`);
  },

  linkGoogleSheet: async (id: string, googleSheetUrl: string): Promise<IBackendRes<ITeacherClassroom>> => {
    return await api.post(`/api/v1/classrooms/${id}/link-google-sheet`, { googleSheetUrl });
  }
};
