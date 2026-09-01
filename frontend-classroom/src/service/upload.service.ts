/**
 * ============================================================================
 * TÊN FILE: upload.service.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/service/upload.service.ts
 * MỤC ĐÍCH:
 *   Cung cấp đối tượng `uploadService` gửi FormData chứa tập tin đính kèm (ảnh, PDF, zip) lên máy chủ.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Khởi tạo `FormData`, đính kèm `file` và gửi `POST /api/v1/upload/file` với header `multipart/form-data`.
 * ============================================================================
 */

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
