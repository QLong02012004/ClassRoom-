import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export const analyticsService = {
  getStudentWeaknessRadar: async (): Promise<IBackendRes<any>> => {
    return await api.get('/api/v1/analytics/student/weakness');
  },
  getClassErrorInsights: async (activityId: string): Promise<IBackendRes<any>> => {
    return await api.get(`/api/v1/analytics/class/${activityId}/errors`);
  },
  getPracticeQuestions: async (tag: string, limit: number = 10): Promise<IBackendRes<any>> => {
    return await api.get(`/api/v1/analytics/practice?tag=${encodeURIComponent(tag)}&limit=${limit}`);
  }
};
