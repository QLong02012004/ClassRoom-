import { Schema, model, Document } from 'mongoose';
import { UserRole, UserStatus } from '../constants/enums';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    parentPhone?: string;
    avatar?: string;
    dob?: string;
    gender?: string;
    phone?: string;
    address?: string;
    subject?: string;
    bio?: string;
    degree?: string;
    xp?: number;
    level?: number;
    streak?: number;
    lastLoginDate?: Date;
    isEmailVerified: boolean;
    emailVerificationOTP?: string;
    emailVerificationExpires?: Date;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.STUDENT },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    parentPhone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    subject: { type: String, default: '' },
    bio: { type: String, default: '' },
    degree: { type: String, default: '' },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastLoginDate: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationOTP: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

export const UserModel = model<IUser>('User', UserSchema);