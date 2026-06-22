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
  }
};
