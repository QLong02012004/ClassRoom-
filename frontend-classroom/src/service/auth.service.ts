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

  createTeacher: async (data: { name: string, email: string, password: string }): Promise<IBackendRes<IModelUser>> => {
    return await api.post('/api/v1/auth/create-teacher', data);
  },

  createStudent: async (data: { name: string, email: string, password: string, parentPhone?: string, classId?: string }): Promise<any> => {
    return await api.post('/api/v1/auth/create-student', data);
  },
};

