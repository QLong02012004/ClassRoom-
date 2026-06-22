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
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{ type: Number, required: true }],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now }
});

// Mỗi học sinh chỉ có một bản ghi kết quả cho mỗi bài trắc nghiệm
QuizResultSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export const QuizResultModel = model<IQuizResult>('QuizResult', QuizResultSchema);
