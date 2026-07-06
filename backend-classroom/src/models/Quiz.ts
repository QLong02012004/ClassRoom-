import { Schema, model, Document, Types } from 'mongoose';

export interface IQuizQuestion {
    _id?: Types.ObjectId;
    questionText: string;
    imageUrl?: string;
    options: string[];
    optionImages?: string[];
    correctOptionIndex: number;
    points: number;
}

export interface IQuiz extends Document {
    classId: Types.ObjectId;
    title: string;
    durationMinutes: number;
    status: 'open' | 'closed' | 'draft';
    questions: IQuizQuestion[];
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    createdAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
    questionText: { type: String, required: true },
    imageUrl: { type: String },
    options: [{ type: String, required: true }],
    optionImages: [{ type: String }],
    correctOptionIndex: { type: Number, required: true },
    points: { type: Number, required: true, default: 1 }
});

const QuizSchema = new Schema<IQuiz>({
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: true },
    durationMinutes: { type: Number, required: true, default: 15 },
    status: { type: String, enum: ['open', 'closed', 'draft'], default: 'open' },
    questions: [QuizQuestionSchema],
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export const QuizModel = model<IQuiz>('Quiz', QuizSchema);
