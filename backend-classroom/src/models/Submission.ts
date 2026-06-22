import { Schema, model, Document, Types } from 'mongoose';

export interface IAttachment {
    name: string;
    url: string;
    size: string;
}

export interface ISubmission extends Document {
    assignmentId: Types.ObjectId;
    studentId: Types.ObjectId;
    submissionText?: string;
    attachments: IAttachment[];
    status: 'submitted' | 'late';
    submittedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: String, default: '' }
});

const SubmissionSchema = new Schema<ISubmission>({
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submissionText: { type: String, default: '' },
    attachments: [AttachmentSchema],
    status: { type: String, enum: ['submitted', 'late'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now }
});

// Mỗi học sinh chỉ có duy nhất một bản ghi nộp bài cho mỗi bài tập
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const SubmissionModel = model<ISubmission>('Submission', SubmissionSchema);
