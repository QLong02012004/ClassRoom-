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
