import { Request, Response, NextFunction } from 'express';
import { AnnouncementModel } from '../models/Announcement';
import { UserModel } from '../models/User';
import { ClassModel } from '../models/Class';
import { createAdminNotification, createUserNotification } from '../services/notificationService';
import { NotificationType, UserRole } from '../constants/enums';
import { notifyClassroomFeedUpdate } from '../socket';

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

        // Kích hoạt thông báo cho Admin & Tất cả Học sinh trong lớp
        const classroom = await ClassModel.findById(classId);
        const classroomName = classroom ? classroom.name : 'lớp học';
        const teacherName = (req as any).user?.name || 'Giáo viên';
        await createAdminNotification(
            authorId,
            'Đăng thông báo mới',
            `Giáo viên ${teacherName} đã đăng một thông báo mới trong lớp "${classroomName}".`,
            NotificationType.ANNOUNCEMENT
        );

        if (classroom && classroom.students && classroom.students.length > 0) {
            const notifTypeLabel = type === 'reminder' ? 'nhắc nhở' : type === 'material' ? 'tài liệu' : type === 'assignment' ? 'bài tập' : 'thông báo';
            const cleanContentSummary = content.substring(0, 80) + (content.length > 80 ? '...' : '');
            const notifTitle = `📢 ${classroomName}: Thông báo mới`;
            const notifMessage = `Giáo viên <strong>${teacherName}</strong> đã đăng một ${notifTypeLabel} mới: "${cleanContentSummary}"`;

            await Promise.all(
                classroom.students.map((studentId: any) =>
                    createUserNotification(
                        studentId.toString(),
                        UserRole.STUDENT,
                        authorId,
                        notifTitle,
                        notifMessage,
                        NotificationType.ANNOUNCEMENT
                    )
                )
            );
        }

        notifyClassroomFeedUpdate(classId);

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

        const announcement = await AnnouncementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo để bình luận' });
        }

        const comment = {
            authorId: user._id as any,
            authorName: user.name,
            authorRole: user.role,
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

        // Tự động tạo thông báo (Notification Bell) cho người nhận
        const classroom = await ClassModel.findById(announcement.classId);
        const classroomName = classroom ? classroom.name : 'lớp học';
        const cleanContentSummary = content.replace(/<!--replyTo:.*?-->/g, '').trim();
        const contentPreview = cleanContentSummary.substring(0, 60) + (cleanContentSummary.length > 60 ? '...' : '');

        // Map danh sách những người cần nhận thông báo: recipientId -> { role, isReply }
        const recipientsMap = new Map<string, { role: UserRole; isReply: boolean }>();

        // 1. Nếu có đính kèm <!--replyTo:commentId-->, lấy tác giả của comment đó
        const matchReplyTo = content.match(/<!--replyTo:(.*?)-->/);
        if (matchReplyTo) {
            const targetCommentId = matchReplyTo[1];
            const targetComment = (announcement.comments as any).id(targetCommentId);
            if (targetComment && targetComment.authorId.toString() !== authorId.toString()) {
                const targetUser = await UserModel.findById(targetComment.authorId);
                if (targetUser) {
                    recipientsMap.set(targetUser._id.toString(), {
                        role: targetUser.role as UserRole,
                        isReply: true
                    });
                }
            }
        }

        // 2. Nếu comment bắt đầu bằng @Tên, tìm comment tác giả tương ứng
        if (!matchReplyTo && content.trim().startsWith('@')) {
            const lowerContent = content.toLowerCase();
            for (const c of announcement.comments || []) {
                const cAuthorName = (c.authorName || '').toLowerCase().trim();
                if (cAuthorName && lowerContent.startsWith(`@${cAuthorName}`) && c.authorId.toString() !== authorId.toString()) {
                    const targetUser = await UserModel.findById(c.authorId);
                    if (targetUser) {
                        recipientsMap.set(targetUser._id.toString(), {
                            role: targetUser.role as UserRole,
                            isReply: true
                        });
                        break;
                    }
                }
            }
        }

        // 3. Thông báo cho tác giả của bài đăng thông báo (nếu tác giả không phải là người đang comment)
        const announcementAuthorId = announcement.authorId.toString();
        if (announcementAuthorId !== authorId.toString() && !recipientsMap.has(announcementAuthorId)) {
            const authorUser = await UserModel.findById(announcement.authorId);
            if (authorUser) {
                recipientsMap.set(authorUser._id.toString(), {
                    role: authorUser.role as UserRole,
                    isReply: false
                });
            }
        }

        // 4. Nếu giáo viên hoặc quản trị viên trả lời trong thread mà chưa tìm thấy người nhận cụ thể,
        // thông báo cho tất cả học sinh đã từng bình luận trong bài đăng này
        if ((user.role === UserRole.TEACHER || user.role === UserRole.ADMIN) && recipientsMap.size === 0) {
            for (const c of announcement.comments || []) {
                const cAuthorId = c.authorId.toString();
                if (cAuthorId !== authorId.toString() && !recipientsMap.has(cAuthorId)) {
                    const prevUser = await UserModel.findById(c.authorId);
                    if (prevUser) {
                        recipientsMap.set(cAuthorId, {
                            role: prevUser.role as UserRole,
                            isReply: true
                        });
                    }
                }
            }
        }

        // Gửi thông báo đến từng người nhận
        for (const [recId, info] of recipientsMap.entries()) {
            const notifTitle = info.isReply
                ? `💬 ${classroomName}: Phản hồi bình luận mới`
                : `💬 ${classroomName}: Bình luận mới`;

            const notifMessage = info.isReply
                ? `<strong>${user.name}</strong> đã trả lời bình luận của bạn: "${contentPreview}"`
                : `<strong>${user.name}</strong> đã bình luận vào bài đăng của bạn: "${contentPreview}"`;

            await createUserNotification(
                recId,
                info.role,
                authorId,
                notifTitle,
                notifMessage,
                NotificationType.ANNOUNCEMENT
            );
        }

        notifyClassroomFeedUpdate(updatedAnnouncement.classId ? updatedAnnouncement.classId.toString() : undefined);

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

        notifyClassroomFeedUpdate(announcement.classId ? announcement.classId.toString() : undefined);

        res.status(200).json({ message: 'Đã xóa thông báo thành công' });
    } catch (error) {
        next(error);
    }
};

// [PATCH] /api/v1/announcements/:id/pin
// Ghim hoặc bỏ ghim thông báo (chỉ tác giả mới có quyền)
export const togglePin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const requesterId = (req as any).user?.id;

        const announcement = await AnnouncementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        }

        // Chỉ tác giả mới được ghim/bỏ ghim
        if (announcement.authorId.toString() !== requesterId) {
            return res.status(403).json({ message: 'Bạn không có quyền ghim thông báo này' });
        }

        announcement.isPinned = !announcement.isPinned;
        await announcement.save();

        const populatedAnnouncement = await announcement.populate('authorId', 'name role avatar');

        notifyClassroomFeedUpdate(announcement.classId ? announcement.classId.toString() : undefined);

        res.status(200).json({
            message: announcement.isPinned ? 'Đã ghim thông báo' : 'Đã bỏ ghim thông báo',
            data: populatedAnnouncement
        });
    } catch (error) {
        next(error);
    }
};

export const likeComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, commentId } = req.params;
        const requesterId = (req as any).user.id;

        const announcement = await AnnouncementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
        }

        const comment = (announcement.comments as any).id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận' });
        }

        const likeIndex = comment.likes?.findIndex((userId: any) => userId.toString() === requesterId);

        if (likeIndex !== -1 && likeIndex !== undefined) {
            // Đã like, tiến hành unlike
            comment.likes!.splice(likeIndex, 1);
        } else {
            // Chưa like, tiến hành like
            if (!comment.likes) {
                comment.likes = [];
            }
            comment.likes.push(requesterId);
        }

        await announcement.save();

        notifyClassroomFeedUpdate(announcement.classId ? announcement.classId.toString() : undefined);

        res.status(200).json({
            message: likeIndex !== -1 && likeIndex !== undefined ? 'Đã bỏ thích bình luận' : 'Đã thích bình luận',
            data: announcement // Trả về announcement đã cập nhật
        });
    } catch (error) {
        next(error);
    }
};

export const likeAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const requesterId = (req as any).user.id;

        const announcement = await AnnouncementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
        }

        const likeIndex = announcement.likes?.findIndex((userId: any) => userId.toString() === requesterId);

        if (likeIndex !== -1 && likeIndex !== undefined) {
            // Đã like, tiến hành unlike
            announcement.likes!.splice(likeIndex, 1);
        } else {
            // Chưa like, tiến hành like
            if (!announcement.likes) {
                announcement.likes = [];
            }
            announcement.likes.push(requesterId as any);
        }

        await announcement.save();

        const populatedAnnouncement = await announcement.populate('authorId', 'name role avatar');

        notifyClassroomFeedUpdate(announcement.classId ? announcement.classId.toString() : undefined);

        res.status(200).json({
            message: likeIndex !== -1 && likeIndex !== undefined ? 'Đã bỏ thích bài đăng' : 'Đã thích bài đăng',
            data: populatedAnnouncement
        });
    } catch (error) {
        next(error);
    }
};

// [DELETE] /api/v1/announcements/:id/comments/:commentId
// Xóa bình luận (chính tác giả bình luận hoặc giáo viên có quyền xóa)
export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id, commentId } = req.params;
        const requesterId = (req as any).user.id;
        const requesterRole = (req as any).user.role;

        const announcement = await AnnouncementModel.findById(id);
        if (!announcement) {
            return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
        }

        const comment = (announcement.comments as any).id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận' });
        }

        // Tác giả bình luận OR giáo viên OR admin được quyền xóa
        const normalizedRole = requesterRole?.toLowerCase();
        if (
            comment.authorId.toString() !== requesterId &&
            normalizedRole !== UserRole.TEACHER &&
            normalizedRole !== UserRole.ADMIN
        ) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này' });
        }

        (announcement.comments as any).pull(commentId);
        await announcement.save();

        const updatedAnnouncement = await AnnouncementModel.findById(id).populate('authorId', 'name role avatar');

        notifyClassroomFeedUpdate(announcement.classId ? announcement.classId.toString() : undefined);

        res.status(200).json({
            message: 'Đã xóa bình luận thành công',
            data: updatedAnnouncement
        });
    } catch (error) {
        next(error);
    }
};
