import { Request, Response, NextFunction } from 'express';
import { AnnouncementModel } from '../models/Announcement';
import { UserModel } from '../models/User';
import { ClassModel } from '../models/Class';
import { createAdminNotification } from '../services/notificationService';

// [GET] /api/v1/announcements
// Lấy danh sách thông báo của một lớp học
export const getAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId } = req.query;
        if (!classId) {
            return res.status(400).json({ message: 'Thiếu classId' });
        }

        const announcements = await AnnouncementModel.find({ classId: classId as string })
            .populate('authorId', 'name role avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Lấy danh sách thông báo thành công',
            data: announcements
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/announcements
// Tạo thông báo mới
export const createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { classId, content, type, attachments } = req.body;
        const authorId = (req as any).user?.id;

        if (!classId || !content) {
            return res.status(400).json({ message: 'Thiếu classId hoặc nội dung thông báo' });
        }

        const announcement = await AnnouncementModel.create({
            classId,
            authorId,
            content,
            type: type || 'announcement',
            attachments: attachments || []
        });

        const populatedAnnouncement = await announcement.populate('authorId', 'name role avatar');

        // Kích hoạt thông báo cho Admin
        const classroom = await ClassModel.findById(classId);
        const classroomName = classroom ? classroom.name : 'lớp học';
        const teacherName = (req as any).user?.name || 'Giáo viên';
        await createAdminNotification(
            authorId,
            'Đăng thông báo mới',
            `Giáo viên ${teacherName} đã đăng một thông báo mới trong lớp "${classroomName}".`,
            'announcement'
        );

        res.status(201).json({
            message: 'Đăng thông báo thành công',
            data: populatedAnnouncement
        });
    } catch (error) {
        next(error);
    }
};

// [POST] /api/v1/announcements/:id/comments
// Thêm bình luận vào thông báo
export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const authorId = (req as any).user?.id;

        if (!content) {
            return res.status(400).json({ message: 'Nội dung bình luận là bắt buộc' });
        }

        const user = await UserModel.findById(authorId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const comment = {
            authorId: user._id as any,
            authorName: user.name,
            content,
            createdAt: new Date()
        };

        const updatedAnnouncement = await AnnouncementModel.findByIdAndUpdate(
            id,
            { $push: { comments: comment } },
            { new: true }
        ).populate('authorId', 'name role avatar');

        if (!updatedAnnouncement) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo để bình luận' });
        }

        res.status(200).json({
            message: 'Thêm bình luận thành công',
            data: updatedAnnouncement
        });
    } catch (error) {
        next(error);
    }
};

// [DELETE] /api/v1/announcements/:id
// Xóa thông báo (chỉ tác giả mới có quyền)
export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const requesterId = (req as any).user?.id;

        const announcement = await AnnouncementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        }

        // Chỉ tác giả mới được xóa
        if (announcement.authorId.toString() !== requesterId) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa thông báo này' });
        }

        await AnnouncementModel.findByIdAndDelete(id);

        res.status(200).json({ message: 'Đã xóa thông báo thành công' });
    } catch (error) {
        next(error);
    }
};
