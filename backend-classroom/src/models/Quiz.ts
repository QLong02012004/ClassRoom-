import { Schema, model, Document, Types } from 'mongoose';

export interface IQuizQuestion {
    _id?: Types.ObjectId;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
}

export interface IQuiz extends Document {
    classId: Types.ObjectId;
    title: string;
    durationMinutes: number;
    questions: IQuizQuestion[];
    createdAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true }
});

const QuizSchema = new Schema<IQuiz>({
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: true },
    durationMinutes: { type: Number, required: true, default: 15 },
    questions: [QuizQuestionSchema],
    createdAt: { type: Date, default: Date.now }
});

export const QuizModel = model<IQuiz>('Quiz', QuizSchema);
