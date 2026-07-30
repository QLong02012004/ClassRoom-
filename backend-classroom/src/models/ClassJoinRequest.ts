import { Schema, model, Document, Types } from 'mongoose';

export interface IClassJoinRequest extends Document {
    classId: Types.ObjectId;
    studentId: Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const ClassJoinRequestSchema = new Schema<IClassJoinRequest>(
    {
        classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

// Compound index to quickly find pending requests and prevent duplicate pending requests
ClassJoinRequestSchema.index({ classId: 1, studentId: 1, status: 1 });

export const ClassJoinRequestModel = model<IClassJoinRequest>('ClassJoinRequest', ClassJoinRequestSchema);
