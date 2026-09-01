/**
 * ============================================================================
 * TÊN FILE: notificationController.ts
 * ĐƯỜNG DẪN: backend-classroom/src/controllers/notificationController.ts
 * MỤC ĐÍCH:
 *   Quản lý Thông báo Chuông (Notification Popover) của người dùng: Thông báo chấm điểm,
 *   thông báo gia nhập lớp, thông báo bài đăng bảng tin, đánh dấu đã đọc & xóa thông báo.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Nhận request từ Express Router (`/api/v1/notifications`).
 *   - Truy vấn `NotificationModel` theo người nhận (`recipientId` hoặc `recipientRole`).
 *   - Trả về số lượng chưa đọc (`unreadCount`) cho badge quả chuông trên thanh TopHeader.
 *
 * THÀNH PHẦN & API CHÍNH:
 *   - `getNotifications`: Lấy danh sách thông báo và số lượng chưa đọc của tài khoản hiện tại.
 *   - `markAsRead`: Đánh dấu 1 thông báo cụ thể là đã đọc.
 *   - `markAllAsRead`: Đánh dấu tất cả thông báo của người dùng là đã đọc.
 *   - `deleteNotification`: Xóa 1 thông báo khỏi danh sách.
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { NotificationModel } from '../models/Notification';
import mongoose from 'mongoose';
import { UserRole, NotificationType } from '../constants/enums';

// 1. Lấy danh sách thông báo (lọc theo role HOẶC recipientId trực tiếp)
export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = (req as any).user?.id;
        const userRole = (req as any).user?.role;

        const notifications = await NotificationModel.find({
            $or: [
                { recipientRole: userRole, recipientId: null },
                { recipientId: new mongoose.Types.ObjectId(userId) }
            ]
        })
            .populate('sender', 'name email avatar')
            .sort({ createdAt: -1 })
            .limit(50);

        const result = notifications.map(notif => {
            const notifObj = notif.toObject();
            const isRead = notif.readBy.some(readId => String(readId) === String(userId));
            return { ...notifObj, isRead };
        });

        return res.status(200).json({
            message: 'Lấy danh sách thông báo thành công',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// 2. Đánh dấu một thông báo đã đọc
export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user?.id;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID thông báo không hợp lệ' });
        }

        const notification = await NotificationModel.findById(id);
        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        }

        if (!notification.readBy.some(readId => String(readId) === String(userId))) {
            notification.readBy.push(new mongoose.Types.ObjectId(userId));
            await notification.save();
        }

        return res.status(200).json({
            message: 'Đã đánh dấu đã đọc thông báo',
            data: { _id: notification._id, isRead: true }
        });
    } catch (error) {
        next(error);
    }
};

// 3. Đánh dấu tất cả thông báo là đã đọc
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = (req as any).user?.id;
        const userRole = (req as any).user?.role;

        await NotificationModel.updateMany(
            {
                $or: [
                    { recipientRole: userRole, recipientId: null },
                    { recipientId: new mongoose.Types.ObjectId(userId) }
                ],
                readBy: { $ne: new mongoose.Types.ObjectId(userId) }
            },
            { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } }
        );

        return res.status(200).json({ message: 'Đã đánh dấu đọc toàn bộ thông báo thành công' });
    } catch (error) {
        next(error);
    }
};

// 4. Giáo viên gửi cảnh báo tới một học sinh cụ thể
export const sendWarningToStudent = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const senderId = (req as any).user?.id;
        const senderRole = (req as any).user?.role;

        if (senderRole !== 'teacher') {
            return res.status(403).json({ message: 'Chỉ giáo viên mới có thể gửi cảnh báo học sinh' });
        }

        const { studentId, title, message } = req.body;

        if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'studentId không hợp lệ' });
        }
        if (!title?.trim() || !message?.trim()) {
            return res.status(400).json({ message: 'Tiêu đề và nội dung cảnh báo không được để trống' });
        }

        const notification = await NotificationModel.create({
            recipientRole: UserRole.STUDENT,
            recipientId: new mongoose.Types.ObjectId(studentId),
            sender: new mongoose.Types.ObjectId(senderId),
            title: title.trim(),
            message: message.trim(),
            type: NotificationType.WARNING,
            readBy: []
        });

        return res.status(201).json({
            message: 'Đã gửi cảnh báo tới học sinh thành công',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};
