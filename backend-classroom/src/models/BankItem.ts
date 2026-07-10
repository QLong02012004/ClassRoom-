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
}

export interface IBankItem extends Document {
    teacherId: Types.ObjectId;
    type: BankItemType;
    title: string;
    description: string;
    maxScore: number;
    
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
    points: { type: Number, required: true, default: 1 }
});

const BankItemSchema = new Schema<IBankItem>({
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(BankItemType), required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    maxScore: { type: Number, default: 10 },
    
    quizQuestions: { type: [QuizQuestionSchema], default: undefined },
    durationMinutes: { type: Number },
    shuffleQuestions: { type: Boolean },
    shuffleOptions: { type: Boolean },
    
    fileUrl: { type: String },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const BankItemModel = model<IBankItem>('BankItem', BankItemSchema);
