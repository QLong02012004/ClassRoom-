import { Schema, model, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
    classId: Types.ObjectId;
    title: string;
    description: string;
    dueDate: Date;
    maxScore: number;
    category: 'mieng' | '15phut' | 'giuaky' | 'cuoiky';
    createdAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    maxScore: { type: Number, default: 10 },
    category: { type: String, enum: ['mieng', '15phut', 'giuaky', 'cuoiky'], default: '15phut' },
    createdAt: { type: Date, default: Date.now }
});

export const AssignmentModel = model<IAssignment>('Assignment', AssignmentSchema);
