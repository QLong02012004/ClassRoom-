import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface ISystemSettings {
  systemName: string;
  timezone: string;
  dateFormat: string;
  maintenanceMode: boolean;
  updatedAt?: string;
}

export const settingsService = {
  // Lấy cấu hình hệ thống
  getSettings: async (): Promise<IBackendRes<ISystemSettings>> => {
    return await api.get('/api/v1/settings');
  },

  // Cập nhật cấu hình hệ thống (Admin)
  updateSettings: async (data: Partial<ISystemSettings>): Promise<IBackendRes<ISystemSettings>> => {
    return await api.put('/api/v1/settings', data);
  }
};
