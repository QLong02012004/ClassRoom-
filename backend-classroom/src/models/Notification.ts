import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, NotificationType } from '../constants/enums';

export interface INotification extends Document {
    recipientRole: UserRole;
    recipientId?: Types.ObjectId;  // Nếu có → gửi riêng cho học sinh cụ thể
    sender: Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    readBy: Types.ObjectId[];
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    recipientRole: { type: String, enum: Object.values(UserRole), default: UserRole.ADMIN },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    createdAt: { type: Date, default: Date.now }
});

export const NotificationModel = model<INotification>('Notification', NotificationSchema);
