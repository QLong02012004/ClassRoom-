/**
 * ============================================================================
 * TÊN FILE: Class.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/Class.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Schema & TypeScript Interface cho Lớp học (Classrooms).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lưu trữ mã code 6 ký tự duy nhất (`code`) để học sinh gia nhập.
 *   - Quản lý danh sách ID học sinh (`students`), Giáo viên phụ trách (`teacherId`).
 *   - Cấu hình phê duyệt gia nhập (`requireApproval`).
 *   - Lưu thông tin liên kết tệp Google Sheets tự động (`googleSheetId`, `googleSheetUrl`).
 * ============================================================================
 */

import { Schema, model, Document, Types } from 'mongoose';
import { ClassStatus } from '../constants/enums';

export interface IClass extends Document {
    name: string;
    subject?: string;
    code: string; // Mã lớp duy nhất để HS tham gia
    teacherId: Types.ObjectId;
    students: Types.ObjectId[];
    status: ClassStatus;
    requireApproval?: boolean; // Yêu cầu duyệt học sinh khi gia nhập bằng mã lớp
    googleSheetId?: string;
    googleSheetUrl?: string;
    googleSheetSyncEnabled?: boolean;
    createdAt: Date;
}

const ClassSchema = new Schema<IClass>({
    name: { type: String, required: true },
    subject: { type: String, default: "" },
    code: { type: String, required: true, unique: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: Object.values(ClassStatus), default: ClassStatus.ACTIVE },
    requireApproval: { type: Boolean, default: true },
    googleSheetId: { type: String, default: null },
    googleSheetUrl: { type: String, default: null },
    googleSheetSyncEnabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export const ClassModel = model<IClass>('Class', ClassSchema);
