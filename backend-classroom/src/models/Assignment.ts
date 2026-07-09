import { Schema, model, Document, Types } from 'mongoose';
import { AssignmentCategory } from '../constants/enums';

export interface IAssignment extends Document {
    classId: Types.ObjectId;
    title: string;
    description: string;
    dueDate: Date;
    maxScore: number;
    category: AssignmentCategory;
    createdAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    maxScore: { type: Number, default: 10 },
    category: { type: String, enum: Object.values(AssignmentCategory), default: AssignmentCategory.MIN15 },
    createdAt: { type: Date, default: Date.now }
});

export const AssignmentModel = model<IAssignment>('Assignment', AssignmentSchema);
