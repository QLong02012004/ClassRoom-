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
    
    durationMinutes: { type: Number },
    status: { type: String, enum: Object.values(QuizStatus) },
    
    createdAt: { type: Date, default: Date.now }
});

export const ClassActivityModel = model<IClassActivity>('ClassActivity', ClassActivitySchema);
