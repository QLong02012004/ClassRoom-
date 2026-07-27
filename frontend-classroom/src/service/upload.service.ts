import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export const uploadService = {
  uploadFile: async (file: File): Promise<IBackendRes<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post('/api/v1/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
