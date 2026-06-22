import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
    recipientRole: 'admin' | 'teacher' | 'student';
    sender: Types.ObjectId;
    title: string;
    message: string;
    type: 'classroom' | 'quiz' | 'assignment' | 'announcement';
    readBy: Types.ObjectId[];
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    recipientRole: { type: String, enum: ['admin', 'teacher', 'student'], default: 'admin' },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['classroom', 'quiz', 'assignment', 'announcement'], required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    createdAt: { type: Date, default: Date.now }
});

export const NotificationModel = model<INotification>('Notification', NotificationSchema);
