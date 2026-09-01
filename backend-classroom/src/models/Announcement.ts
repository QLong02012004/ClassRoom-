/**
 * ============================================================================
 * TÊN FILE: Announcement.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/Announcement.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Schema & TypeScript Interface cho Bài đăng Bảng tin Lớp học (Announcements).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Quản lý bài đăng của lớp học (`classId`), tác giả đăng (`authorId`), loại thông báo (`type`).
 *   - Hỗ trợ danh sách tệp đính kèm (`attachments`), ghim bài viết (`isPinned`), mảng lượt thích (`likes`).
 *   - Nhúng mảng bình luận (`comments`) kèm lượt thích bình luận và liên kết người bình luận.
 * ============================================================================
 */

import { Schema, model, Document, Types } from 'mongoose';
import { AnnouncementType } from '../constants/enums';

export interface IComment {
    authorId: Types.ObjectId;
    authorName: string;
    authorRole?: string;
    content: string;
    createdAt: Date;
    likes?: Types.ObjectId[];
}

export interface IAttachment {
    name: string;
    url: string;
    size: string;
}

export interface IAnnouncement extends Document {
    classId: Types.ObjectId;
    authorId: Types.ObjectId;
    content: string;
    type: AnnouncementType;
    attachments: IAttachment[];
    comments: IComment[];
    createdAt: Date;
    isPinned?: boolean;
    likes?: Types.ObjectId[];
}

const CommentSchema = new Schema<IComment>({
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

const AttachmentSchema = new Schema<IAttachment>({
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: String, default: '' }
});

const AnnouncementSchema = new Schema<IAnnouncement>({
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: Object.values(AnnouncementType), default: AnnouncementType.ANNOUNCEMENT },
    attachments: [AttachmentSchema],
    comments: [CommentSchema],
    createdAt: { type: Date, default: Date.now },
    isPinned: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

export const AnnouncementModel = model<IAnnouncement>('Announcement', AnnouncementSchema);
