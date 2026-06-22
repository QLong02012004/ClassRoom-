import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'teacher' | 'student';
    status: 'Active' | 'Locked';
    parentPhone?: string;
    avatar?: string;
    dob?: string;
    gender?: string;
    phone?: string;
    address?: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
    status: { type: String, enum: ['Active', 'Locked'], default: 'Active' },
    parentPhone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

export const UserModel = model<IUser>('User', UserSchema);