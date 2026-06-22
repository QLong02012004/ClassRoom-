import { Schema, model, Document, Types } from 'mongoose';

export interface IComment {
    authorId: Types.ObjectId;
    authorName: string;
    content: string;
    createdAt: Date;
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
    type: 'announcement' | 'reminder' | 'material';
    attachments: IAttachment[];
    comments: IComment[];
    createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
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
    type: { type: String, enum: ['announcement', 'reminder', 'material'], default: 'announcement' },
    attachments: [AttachmentSchema],
    comments: [CommentSchema],
    createdAt: { type: Date, default: Date.now }
});

export const AnnouncementModel = model<IAnnouncement>('Announcement', AnnouncementSchema);
