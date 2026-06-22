import { Schema, model, Document, Types } from 'mongoose';

export interface IGrade extends Document {
    assignmentId: Types.ObjectId;
    studentId: Types.ObjectId;
    score: number;
    feedback?: string;
    gradedAt: Date;
}

const GradeSchema = new Schema<IGrade>({
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
    feedback: { type: String, default: '' },
    gradedAt: { type: Date, default: Date.now }
});

// Ensure a student only has one grade per assignment
GradeSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const GradeModel = model<IGrade>('Grade', GradeSchema);
