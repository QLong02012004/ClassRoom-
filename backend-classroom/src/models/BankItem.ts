/**
 * ============================================================================
 * TÊN FILE: BankItem.ts
 * ĐƯỜNG DẪN: backend-classroom/src/models/BankItem.ts
 * MỤC ĐÍCH:
 *   Định nghĩa Schema & TypeScript Interface cho Ngân hàng Tài nguyên Đề thi & Bài tập (Bank Items).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Quản lý danh sách câu hỏi trắc nghiệm (`quizQuestions`), mảng các lựa chọn (`options`), vị trí đáp án đúng (`correctOptionIndex`) và thẻ phân loại kiến thức (`tags`).
 *   - Quản lý quyền chia sẻ (`sharingStatus`: `CENTER_SHARED` toàn trung tâm hoặc `PRIVATE` cá nhân GV).
 *   - Cấu hình đảo câu hỏi (`shuffleQuestions`), đảo đáp án (`shuffleOptions`) và đính kèm file mẫu (`fileUrl`).
 * ============================================================================
 */

import { Schema, model, Document, Types } from 'mongoose';

export enum BankItemType {
    QUIZ = 'quiz',
    DOCUMENT = 'document'
}

export interface IQuizQuestion {
    _id?: Types.ObjectId;
    questionText: string;
    imageUrl?: string;
    options: string[];
    optionImages?: string[];
    correctOptionIndex: number;
    points: number;
    tags?: string[];
}

export enum BankItemSharingStatus {
    CENTER_SHARED = 'CENTER_SHARED',
    PRIVATE = 'PRIVATE'
}

export interface IBankItem extends Document {
    teacherId: Types.ObjectId;
    type: BankItemType;
    title: string;
    description: string;
    maxScore: number;
    subject?: string;
    sharingStatus: BankItemSharingStatus;
    
    // Fields for Quiz
    quizQuestions?: IQuizQuestion[];
    durationMinutes?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    
    // Fields for Document (Assignment)
    fileUrl?: string;
    
    createdAt: Date;
    updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
    questionText: { type: String, required: true },
    imageUrl: { type: String },
    options: [{ type: String, required: true }],
    optionImages: [{ type: String }],
    correctOptionIndex: { type: Number, required: true },
    points: { type: Number, required: true, default: 1 },
    tags: [{ type: String }]
});

const BankItemSchema = new Schema<IBankItem>({
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(BankItemType), required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    maxScore: { type: Number, default: 10 },
    subject: { type: String, default: '' },
    sharingStatus: { type: String, enum: Object.values(BankItemSharingStatus), default: BankItemSharingStatus.PRIVATE },
    
    quizQuestions: { type: [QuizQuestionSchema], default: undefined },
    durationMinutes: { type: Number },
    shuffleQuestions: { type: Boolean },
    shuffleOptions: { type: Boolean },
    
    fileUrl: { type: String },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const BankItemModel = model<IBankItem>('BankItem', BankItemSchema);
