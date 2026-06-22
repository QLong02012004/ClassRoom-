import { NotificationModel } from '../models/Notification';
import mongoose from 'mongoose';

export const createAdminNotification = async (
    senderId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    type: 'classroom' | 'quiz' | 'assignment' | 'announcement'
) => {
    try {
        await NotificationModel.create({
            recipientRole: 'admin',
            sender: new mongoose.Types.ObjectId(senderId),
            title,
            message,
            type,
            readBy: []
        });
    } catch (error) {
        console.error('❌ Lỗi tạo thông báo Admin:', error);
    }
};
