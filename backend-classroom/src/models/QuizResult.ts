/**
 * ============================================================================
 * TÊN FILE: QuizResult.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/QuizResult.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Schema & TypeScript Interface cho Kết quả Bài thi Trắc nghiệm (Quiz Results).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Quản lý bài thi (`quizId`), học sinh (`studentId`), mảng lựa chọn của học sinh (`answers`).
 *   - Lưu điểm tự động tính toán (`score`), tổng số câu hỏi (`totalQuestions`) và thời điểm nộp bài (`submittedAt`).
 *   - Chỉ mục duy nhất (`quizId: 1, studentId: 1` unique) ngăn chặn việc làm bài nhiều lần nếu không được phép.
 * ============================================================================
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface IQuizResult extends Document {
    quizId: Types.ObjectId;
    studentId: Types.ObjectId;
    answers: number[];
    score: number;
    totalQuestions: number;
    submittedAt: Date;
}

const QuizResultSchema = new Schema<IQuizResult>({
    quizId: { type: Schema.Types.ObjectId, ref: 'ClassActivity', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{ type: Number, required: true }],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now }
});

// Mỗi học sinh chỉ có một bản ghi kết quả cho mỗi bài trắc nghiệm
QuizResultSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export const QuizResultModel = model<IQuizResult>('QuizResult', QuizResultSchema);
