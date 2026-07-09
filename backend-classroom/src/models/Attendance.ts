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
    createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure one attendance record per class per day (using date precision trick or just ignoring uniqueness for now)
AttendanceSchema.index({ classId: 1, date: 1 });

export const AttendanceModel = model<IAttendance>('Attendance', AttendanceSchema);
