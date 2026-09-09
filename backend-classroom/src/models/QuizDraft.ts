/**
 * ============================================================================
 * TÊN FILE: QuizDraft.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/QuizDraft.ts
 * MỤC ĐÍCH:
 *   Lưu trữ bản nháp bài làm trắc nghiệm (Autosave Draft) của học sinh.
 *   Đảm bảo câu trả lời không bị mất khi mất điện, mạng chập chờn hay đổi thiết bị.
 * ============================================================================
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface IQuizDraft extends Document {
    quizId: Types.ObjectId;
    studentId: Types.ObjectId;
    answers: Record<string, number>;
    flagged: Record<string, boolean>;
    questionOrder?: number[];
    optionOrders?: Record<string, number[]>;
    currentQIndex?: number;
    startedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const QuizDraftSchema = new Schema<IQuizDraft>(
    {
        quizId: { type: Schema.Types.ObjectId, ref: 'ClassActivity', required: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        answers: { type: Schema.Types.Mixed, default: {} },
        flagged: { type: Schema.Types.Mixed, default: {} },
        questionOrder: { type: [Number], default: [] },
        optionOrders: { type: Schema.Types.Mixed, default: {} },
        currentQIndex: { type: Number, default: 0 },
        startedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

QuizDraftSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export const QuizDraftModel = model<IQuizDraft>('QuizDraft', QuizDraftSchema);
