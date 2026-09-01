/**
 * ============================================================================
 * TÊN FILE: notificationService.ts
 * ĐƯỜNG DẪN: backend-classroom/src/services/notificationService.ts
 * MỤC ĐÍCH:
 *   Dịch vụ phụ trợ khởi tạo và gửi thông báo chuông (Notification Helper Services).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `createAdminNotification`: Tạo thông báo gửi cho Ban Quản trị Admin và phát tín hiệu WebSockets `admin_stats_update`.
 *   - `createUserNotification`: Gửi thông báo tới người dùng cụ thể và phát tín hiệu `notification_update`.
 * ============================================================================
 */

import { NotificationModel } from '../models/Notification';
import mongoose from 'mongoose';
import { UserRole, NotificationType } from '../constants/enums';
import { notifyAdminStatsUpdate, notifyNotificationUpdate } from '../socket';

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
        notifyNotificationUpdate(String(recipientId));
    } catch (error) {
        console.error('❌ Lỗi tạo thông báo User:', error);
    }
};
