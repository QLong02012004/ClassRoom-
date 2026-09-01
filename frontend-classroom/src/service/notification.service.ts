/**
 * ============================================================================
 * TÊN FILE: notification.service.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/service/notification.service.ts
 * MỤC ĐÍCH:
 *   Cung cấp đối tượng `notificationService` gọi API HTTP quản lý Thông báo Quả Chuông.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lấy danh sách thông báo cá nhân/vai trò, đánh dấu đã đọc (`markAsRead` / `markAllAsRead`).
 *   - Gửi cảnh báo nhắm mục tiêu cho học sinh (`sendWarning`).
 * ============================================================================
 */

import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface INotificationItem {
  _id: string;
  recipientRole: 'admin' | 'teacher' | 'student';
  sender: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  title: string;
  message: string;
  type: 'classroom' | 'quiz' | 'assignment' | 'announcement';
  readBy: string[];
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (): Promise<IBackendRes<INotificationItem[]>> => {
    return await api.get('/api/v1/notifications');
  },

  markAsRead: async (id: string): Promise<IBackendRes<{ _id: string; isRead: boolean }>> => {
    return await api.post(`/api/v1/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<IBackendRes<void>> => {
    return await api.post('/api/v1/notifications/read-all');
  },

  sendWarning: async (studentId: string, title: string, message: string): Promise<IBackendRes<any>> => {
    return await api.post('/api/v1/notifications/warn', { studentId, title, message });
  }
};
