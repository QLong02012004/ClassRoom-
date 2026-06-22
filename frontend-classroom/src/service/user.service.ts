import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IUserItem {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'Active' | 'Locked';
  parentPhone?: string;
  avatar?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export const userService = {
  // Lấy danh sách người dùng
  getUsers: async (params?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<IBackendRes<IUserItem[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return await api.get(`/api/v1/users${query}`);
  },

  // Cập nhật trạng thái tài khoản (Khóa / Mở khóa)
  updateUserStatus: async (
    userId: string,
    status: 'Active' | 'Locked'
  ): Promise<IBackendRes<IUserItem>> => {
    return await api.put(`/api/v1/users/${userId}/status`, { status });
  },

  // Thay đổi vai trò (role) của người dùng
  updateUserRole: async (
    userId: string,
    role: 'admin' | 'teacher' | 'student'
  ): Promise<IBackendRes<IUserItem>> => {
    return await api.put(`/api/v1/users/${userId}/role`, { role });
  },

  // Đặt lại mật khẩu (Admin/Teacher)
  resetUserPassword: async (id: string, newPassword: string): Promise<IBackendRes<IUserItem>> => {
    return await api.put(`/api/v1/users/${id}/reset-password`, { newPassword });
  },

  // Xóa tài khoản (Admin)
  deleteUser: async (id: string): Promise<IBackendRes<any>> => {
    return await api.delete(`/api/v1/users/${id}`);
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (data: Partial<IUserItem>): Promise<IBackendRes<IUserItem>> => {
    return await api.put(`/api/v1/users/profile`, data);
  },

  // Tự đổi mật khẩu
  changePassword: async (data: { oldPassword: string; newPassword: string }): Promise<IBackendRes<any>> => {
    return await api.put(`/api/v1/users/change-password`, data);
  }
};
