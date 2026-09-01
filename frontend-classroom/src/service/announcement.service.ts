/**
 * ============================================================================
 * TÊN FILE: announcement.service.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/service/announcement.service.ts
 * MỤC ĐÍCH:
 *   Cung cấp đối tượng `announcementService` gọi API HTTP quản lý Bảng tin lớp học
 *   (Tạo bài đăng, bình luận, ghim bài viết, thích bài viết/bình luận).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Kết nối tới các endpoints `/api/v1/announcements/*`.
 *   - Định nghĩa các TypeScript Interface: `IAnnouncement`, `IComment`, `IAttachment`.
 * ============================================================================
 */

import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IComment {
  _id?: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  likes?: string[];
}

export interface IAttachment {
  name: string;
  url: string;
  size?: string;
}

export interface IAnnouncement {
  _id: string;
  classId: string;
  authorId: {
    _id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  content: string;
  type: 'announcement' | 'reminder' | 'material';
  attachments: IAttachment[];
  comments: IComment[];
  createdAt: string;
  isPinned?: boolean;
  likes?: string[];
}

export const announcementService = {
  // Lấy danh sách thông báo của lớp học
  getAnnouncements: async (classId: string): Promise<IBackendRes<IAnnouncement[]>> => {
    return await api.get('/api/v1/announcements', { params: { classId } });
  },

  // Đăng thông báo mới
  createAnnouncement: async (data: {
    classId: string;
    content: string;
    type?: string;
    attachments?: IAttachment[];
  }): Promise<IBackendRes<IAnnouncement>> => {
    return await api.post('/api/v1/announcements', data);
  },

  // Chỉnh sửa thông báo
  updateAnnouncement: async (
    announcementId: string,
    data: { content?: string; attachments?: IAttachment[] }
  ): Promise<IBackendRes<IAnnouncement>> => {
    return await api.put(`/api/v1/announcements/${announcementId}`, data);
  },

  // Gửi bình luận
  addComment: async (announcementId: string, content: string): Promise<IBackendRes<IAnnouncement>> => {
    return await api.post(`/api/v1/announcements/${announcementId}/comments`, { content });
  },

  // Xóa thông báo
  deleteAnnouncement: async (announcementId: string): Promise<IBackendRes<null>> => {
    return await api.delete(`/api/v1/announcements/${announcementId}`);
  },

  // Ghim / Bỏ ghim thông báo
  togglePin: async (announcementId: string): Promise<IBackendRes<IAnnouncement>> => {
    return await api.patch(`/api/v1/announcements/${announcementId}/pin`);
  },

  // Thích / Bỏ thích bài đăng
  likeAnnouncement: async (announcementId: string): Promise<IBackendRes<IAnnouncement>> => {
    return await api.put(`/api/v1/announcements/${announcementId}/like`);
  },

  // Thích / Bỏ thích bình luận
  likeComment: async (announcementId: string, commentId: string): Promise<IBackendRes<IAnnouncement>> => {
    return await api.put(`/api/v1/announcements/${announcementId}/comments/${commentId}/like`);
  },

  // Xóa bình luận
  deleteComment: async (announcementId: string, commentId: string): Promise<IBackendRes<IAnnouncement>> => {
    return await api.delete(`/api/v1/announcements/${announcementId}/comments/${commentId}`);
  }
};
