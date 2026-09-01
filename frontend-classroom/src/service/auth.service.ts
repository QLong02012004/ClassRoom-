/**
 * ============================================================================
 * TÊN FILE: auth.service.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/service/auth.service.ts
 * MỤC ĐÍCH:
 *   Cung cấp đối tượng `authService` gọi API HTTP xử lý đăng nhập, đăng ký,
 *   xác thực OTP Email, đăng nhập Google One-Tap và làm mới Token tự động.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Gọi API `/api/v1/auth/*` qua instance Axios `api`.
 *   - Tự động đính kèm Refresh Token Cookie nhờ cấu hình `withCredentials: true`.
 *
 * THÀNH PHẦN CHÍNH:
 *   - `login` & `logout`: Đăng nhập & đăng xuất tài khoản.
 *   - `refreshToken`: Làm mới Access Token khi vừa tải trang hoặc hết hạn.
 *   - `getMe`: Lấy thông tin chi tiết tài khoản hiện tại.
 *   - `registerStudent` & `registerTeacher`: Đăng ký tài khoản Học sinh/Giáo viên.
 *   - `verifyEmail` & `resendOTP`: Xác nhận mã OTP Email.
 *   - `loginWithGoogle`: Đăng nhập nhanh Google One-Tap.
 * ============================================================================
 */

import api from '../utils/AxiosCustomize';
import type { IBackendRes, IModelUser, ILoginData } from '../types/backend';

export const authService = {
  login: async (email: string, password: string): Promise<IBackendRes<ILoginData>> => {
    return await api.post('/api/v1/auth/login', { email, password });
  },

  logout: async (): Promise<IBackendRes<null>> => {
    return await api.post('/api/v1/auth/logout');
  },

  refreshToken: async (): Promise<IBackendRes<{ accessToken: string; user: IModelUser }>> => {
    // Cookie refresh_token tự gửi kèm nhờ withCredentials: true
    return await api.post('/api/v1/auth/refresh-token');
  },

  getMe: async (): Promise<IBackendRes<IModelUser>> => {
    return await api.get('/api/v1/auth/me');
  },

  createTeacher: async (data: { name: string, email: string, password: string, subject?: string }): Promise<IBackendRes<IModelUser>> => {
    return await api.post('/api/v1/auth/create-teacher', data);
  },

  createStudent: async (data: { name: string, email: string, password: string, parentPhone?: string, classId?: string }): Promise<any> => {
    return await api.post('/api/v1/auth/create-student', data);
  },

  registerStudent: async (data: { name: string, email: string, password: string, parentPhone?: string }): Promise<any> => {
    return await api.post('/api/v1/auth/register-student', data);
  },

  registerTeacher: async (data: { name: string, email: string, password: string, subject?: string, phone?: string }): Promise<any> => {
    return await api.post('/api/v1/auth/register-teacher', data);
  },

  loginWithGoogle: async (data: { credential: string; role?: string; subject?: string }): Promise<any> => {
    return await api.post('/api/v1/auth/google-login', data);
  },

  verifyEmail: async (data: { email: string; otp: string }): Promise<any> => {
    return await api.post('/api/v1/auth/verify-email', data);
  },

  resendOTP: async (data: { email: string }): Promise<any> => {
    return await api.post('/api/v1/auth/resend-otp', data);
  }
};

