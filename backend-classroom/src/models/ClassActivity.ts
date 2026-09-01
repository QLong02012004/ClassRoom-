/**
 * ============================================================================
 * TÊN FILE: ClassActivity.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/ClassActivity.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Schema & TypeScript Interface cho Hoạt động học tập (Class Activities) được Giáo viên giao cho lớp.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Liên kết tới lớp học (`classId`) và bài gốc trong ngân hàng (`bankItemId`).
 *   - Phân loại theo loại hình (`type`: 'quiz' trắc nghiệm hoặc 'document' tự luận).
 *   - Quản lý hạn nộp (`dueDate`), điểm tối đa (`maxScore`), danh mục (`category`) và thời gian làm bài trắc nghiệm (`durationMinutes`).
 *   - Lưu trạng thái đóng/mở làm bài (`status`: QuizStatus).
 * ============================================================================
 */

import { Schema, model, Document, Types } from 'mongoose';
import { QuizStatus } from '../constants/enums';
import { BankItemType } from './BankItem';

export interface IClassActivity extends Document {
    classId: Types.ObjectId;
    bankItemId: Types.ObjectId; // Reference to the template
    type: BankItemType; // 'quiz' or 'document'
    title: string;
    description: string;
    dueDate: Date;
    maxScore: number;
    category: string;
    allowMultipleSubmissions: boolean;
    startDate?: Date;

    // For quizzes
    durationMinutes?: number;
    status?: QuizStatus; // OPEN, CLOSED, etc.

    createdAt: Date;
}

const ClassActivitySchema = new Schema<IClassActivity>({
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    bankItemId: { type: Schema.Types.ObjectId, ref: 'BankItem', required: true },
    type: { type: String, enum: Object.values(BankItemType), required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    maxScore: { type: Number, default: 10 },
    category: { type: String, default: 'homework' },
    allowMultipleSubmissions: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },

    durationMinutes: { type: Number },
    status: { type: String, enum: Object.values(QuizStatus) },

    createdAt: { type: Date, default: Date.now }
});

export const ClassActivityModel = model<IClassActivity>('ClassActivity', ClassActivitySchema);
