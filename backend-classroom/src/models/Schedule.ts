import { Schema, model, Document, Types } from 'mongoose';

export interface ISchedule extends Document {
    classId: Types.ObjectId;
    teacherId: Types.ObjectId;
    subject: string;
    chapter?: string;
    dayOfWeek: number; // 1: Thứ 2, 2: Thứ 3, ..., 7: CN
    startTime: string; // "07:30"
    endTime: string;   // "09:00"
    progress: number;  // 0 - 100
    createdAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>({
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    chapter: { type: String, default: '' },
    dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    createdAt: { type: Date, default: Date.now }
});

export const ScheduleModel = model<ISchedule>('Schedule', ScheduleSchema);
