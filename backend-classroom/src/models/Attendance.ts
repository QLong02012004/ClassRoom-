/**
 * ============================================================================
 * TÊN FILE: Attendance.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/Attendance.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Schema & TypeScript Interface cho Bản ghi Điểm danh (Attendance) lớp học theo ngày.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lưu thông tin lớp học (`classId`), ngày điểm danh (`date`).
 *   - Mảng `records` lưu trạng thái của từng học sinh (Present, Late, Absent, Excused) kèm ghi chú (`note`).
 *   - Quản lý cờ đồng bộ Google Sheets (`syncedToGoogleSheet`, `lastSyncedAt`, `syncError`).
 * ============================================================================
 */

import { Schema, model, Document, Types } from 'mongoose';
import { AttendanceStatus } from '../constants/enums';

export interface IAttendance extends Document {
    classId: Types.ObjectId;
    date: Date;
    records: {
        studentId: Types.ObjectId;
        status: AttendanceStatus;
        note?: string;
    }[];
    syncedToGoogleSheet?: boolean;
    lastSyncedAt?: Date;
    syncError?: string;
    createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    date: { type: Date, required: true },
    records: [{
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: Object.values(AttendanceStatus), required: true },
        note: { type: String }
    }],
    syncedToGoogleSheet: { type: Boolean, default: false },
    lastSyncedAt: { type: Date },
    syncError: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

AttendanceSchema.index({ classId: 1, date: 1 });

export const AttendanceModel = model<IAttendance>('Attendance', AttendanceSchema);
