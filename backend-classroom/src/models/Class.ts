import { Schema, model, Document, Types } from 'mongoose';

export interface IClass extends Document {
    name: string;
    subject?: string;
    code: string; // Mã lớp duy nhất để HS tham gia
    teacherId: Types.ObjectId;
    students: Types.ObjectId[];
    status: 'Active' | 'Locked' | 'Archived';
    createdAt: Date;
}

const ClassSchema = new Schema<IClass>({
    name: { type: String, required: true },
    subject: { type: String, default: "" },
    code: { type: String, required: true, unique: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['Active', 'Locked', 'Archived'], default: 'Active' },
    createdAt: { type: Date, default: Date.now }
});

export const ClassModel = model<IClass>('Class', ClassSchema);
