import { Request, Response, NextFunction } from 'express';
import { NotificationModel } from '../models/Notification';
import mongoose from 'mongoose';

// 1. Lấy danh sách thông báo (chỉ cho vai trò hiện tại của user đăng nhập)
export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = (req as any).user?.id;
        const userRole = (req as any).user?.role;

        // Chỉ lấy thông báo có recipientRole khớp với role của user hiện tại
        const notifications = await NotificationModel.find({ recipientRole: userRole })
            .populate('sender', 'name email avatar')
            .sort({ createdAt: -1 })
            .limit(50);

        const result = notifications.map(notif => {
            const notifObj = notif.toObject();
            const isRead = notif.readBy.some(readId => String(readId) === String(userId));
            return {
                ...notifObj,
                isRead
            };
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

        // Thêm userId vào mảng readBy nếu chưa có
        if (!notification.readBy.some(readId => String(readId) === String(userId))) {
            notification.readBy.push(new mongoose.Types.ObjectId(userId));
            await notification.save();
        }

        return res.status(200).json({
            message: 'Đã đánh dấu đã đọc thông báo',
            data: {
                _id: notification._id,
                isRead: true
            }
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

        // Cập nhật bằng cách $addToSet để đẩy userId vào mảng readBy của tất cả thông báo chưa đọc tương ứng
        await NotificationModel.updateMany(
            {
                recipientRole: userRole,
                readBy: { $ne: new mongoose.Types.ObjectId(userId) }
            },
            {
                $addToSet: { readBy: new mongoose.Types.ObjectId(userId) }
            }
        );

        return res.status(200).json({
            message: 'Đã đánh dấu đọc toàn bộ thông báo thành công'
        });
    } catch (error) {
        next(error);
    }
};
