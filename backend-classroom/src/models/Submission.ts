/**
 * ============================================================================
 * TÊN FILE: Submission.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/Submission.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Schema & TypeScript Interface cho Bài nộp tự luận/file của Học sinh (Submissions).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Đảm bảo tính duy nhất (Compound Index `{ assignmentId: 1, studentId: 1 }` unique): Mỗi học sinh chỉ có 1 bản ghi bài nộp cho 1 bài tập.
 *   - Lưu giữ tệp đính kèm (`attachments`), đoạn văn bài nộp (`submissionText`), trao đổi bình luận bài nộp (`comments`).
 *   - Lưu giữ toàn bộ lịch sử các lần nộp lại (`history`) để Giáo viên theo dõi tiến trình chỉnh sửa.
 *   - Quản lý trạng thái bài nộp (`status`: SUBMITTED, LATE, GRADED, v.v.).
 * ============================================================================
 */

import { Schema, model, Document, Types } from 'mongoose';
import { SubmissionStatus } from '../constants/enums';

export interface IAttachment {
    name: string;
    url: string;
    size: string;
}

export interface ISubmissionComment {
    userId: Types.ObjectId;
    name: string;
    isTeacher: boolean;
    text: string;
    createdAt: Date;
}

export interface ISubmissionHistory {
    submissionText?: string;
    attachments: IAttachment[];
    submittedAt: Date;
}

export interface ISubmission extends Document {
    assignmentId: Types.ObjectId;
    studentId: Types.ObjectId;
    submissionText?: string;
    attachments: IAttachment[];
    comments: ISubmissionComment[];
    status: SubmissionStatus;
    submittedAt: Date;
    history: ISubmissionHistory[];
}

const AttachmentSchema = new Schema<IAttachment>({
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: String, default: '' }
});

const SubmissionCommentSchema = new Schema<ISubmissionComment>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    isTeacher: { type: Boolean, default: false },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const SubmissionHistorySchema = new Schema<ISubmissionHistory>({
    submissionText: { type: String, default: '' },
    attachments: [AttachmentSchema],
    submittedAt: { type: Date, required: true }
});

const SubmissionSchema = new Schema<ISubmission>({
    assignmentId: { type: Schema.Types.ObjectId, ref: 'ClassActivity', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submissionText: { type: String, default: '' },
    attachments: [AttachmentSchema],
    comments: { type: [SubmissionCommentSchema], default: [] },
    status: { type: String, enum: Object.values(SubmissionStatus), default: SubmissionStatus.SUBMITTED },
    submittedAt: { type: Date, default: Date.now },
    history: { type: [SubmissionHistorySchema], default: [] }
});

// Mỗi học sinh chỉ có duy nhất một bản ghi nộp bài cho mỗi bài tập
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const SubmissionModel = model<ISubmission>('Submission', SubmissionSchema);
