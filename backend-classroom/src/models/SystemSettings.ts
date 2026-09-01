/**
 * ============================================================================
 * TÊN FILE: SystemSettings.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/SystemSettings.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Schema & TypeScript Interface cho Cấu hình Hệ thống (System Settings Singleton).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lưu giữ các thiết lập toàn cục: Tên trường/trung tâm (`systemName`), múi giờ (`timezone`), định dạng hiển thị ngày (`dateFormat`).
 *   - Quản lý công tắc Chế độ Bảo trì (`maintenanceMode`: true/false).
 * ============================================================================
 */

import { Schema, model, Document } from 'mongoose';

export interface ISystemSettings extends Document {
    systemName: string;
    timezone: string;
    dateFormat: string;
    maintenanceMode: boolean;
    updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
    systemName: { type: String, default: "Classroom Manager Institutional" },
    timezone: { type: String, default: "gmt7" },
    dateFormat: { type: String, default: "ddmm" },
    maintenanceMode: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});

export const SystemSettingsModel = model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
