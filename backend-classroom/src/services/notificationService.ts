import { NotificationModel } from '../models/Notification';
import mongoose from 'mongoose';
import { UserRole, NotificationType } from '../constants/enums';
import { notifyAdminStatsUpdate } from '../socket';

export const createAdminNotification = async (
    senderId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType
) => {
    try {
        await NotificationModel.create({
            recipientRole: UserRole.ADMIN,
            sender: new mongoose.Types.ObjectId(senderId),
            title,
            message,
            type,
            readBy: []
        });
        notifyAdminStatsUpdate();
    } catch (error) {
        console.error('❌ Lỗi tạo thông báo Admin:', error);
    }
};

export const createUserNotification = async (
    recipientId: string | mongoose.Types.ObjectId,
    recipientRole: UserRole,
    senderId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType
) => {
    try {
        await NotificationModel.create({
            recipientRole,
            recipientId: new mongoose.Types.ObjectId(recipientId),
            sender: new mongoose.Types.ObjectId(senderId),
            title,
            message,
            type,
            readBy: []
        });
    } catch (error) {
        console.error('❌ Lỗi tạo thông báo User:', error);
    }
};
