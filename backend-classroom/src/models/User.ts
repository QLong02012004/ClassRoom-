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
    createdAt: { type: Date, default: Date.now }
});

export const UserModel = model<IUser>('User', UserSchema);