/**
 * ============================================================================
 * TÊN FILE: analytics.service.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/service/analytics.service.ts
 * MỤC ĐÍCH:
 *   Cung cấp đối tượng `analyticsService` gọi API Phân tích Thông minh (AI Learning Analytics).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `getStudentWeaknessRadar`: Lấy dữ liệu tỷ lệ sai theo thẻ kiến thức để vẽ biểu đồ Radar.
 *   - `getClassErrorInsights`: Lấy danh sách câu hỏi bị sai nhiều nhất trong lớp.
 *   - `getPracticeQuestions`: Lấy bộ câu hỏi luyện tập ôn bù khuyết thiếu theo tag.
 * ============================================================================
 */

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
