/**
 * ============================================================================
 * TÊN FILE: material.service.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/service/material.service.ts
 * MỤC ĐÍCH:
 *   Cung cấp đối tượng `materialService` gọi API HTTP quản lý Thư viện Tài liệu Tham khảo công khai.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lấy danh sách tài liệu (`getPublicMaterials`), tạo mới (`createMaterial`), xóa (`deleteMaterial`).
 * ============================================================================
 */

import api from '../utils/AxiosCustomize';

export interface IMaterialData {
  title: string;
  subject: string;
  grade: string;
  description: string;
  type: string;
  size?: string;
  fileUrl: string;
}

export const materialService = {
  getPublicMaterials: () => api.get("/api/v1/materials"),
  createMaterial: (data: IMaterialData) => api.post("/api/v1/materials", data),
  deleteMaterial: (id: string) => api.delete(`/api/v1/materials/${id}`),
};
