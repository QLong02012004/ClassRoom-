import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IComment {
  _id?: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
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

  // Gửi bình luận
  addComment: async (announcementId: string, content: string): Promise<IBackendRes<IAnnouncement>> => {
    return await api.post(`/api/v1/announcements/${announcementId}/comments`, { content });
  },

  // Xóa thông báo
  deleteAnnouncement: async (announcementId: string): Promise<IBackendRes<null>> => {
    return await api.delete(`/api/v1/announcements/${announcementId}`);
  }
};
