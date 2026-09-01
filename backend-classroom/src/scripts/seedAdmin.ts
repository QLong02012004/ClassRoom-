/**
 * ============================================================================
 * TÊN FILE: seedAdmin.ts
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/seedAdmin.ts
 * MỤC ĐÍCH:
 *   Script Khởi Tạo Tài Khoản Root Admin Mặc Định (`admin@gmail.com` / `admin123`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Kiểm tra xem đã có tài khoản Admin nào tồn tại trong DB chưa.
 *   - Nếu chưa có: Tạo mới với role `ADMIN`, băm mật khẩu bằng Bcrypt và set `isEmailVerified: true`.
 * ============================================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { UserRole } from '../constants/enums';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database để chuẩn bị Seed Admin');

        // Kiểm tra xem đã có admin nào chưa
        const adminExists = await UserModel.findOne({ role: UserRole.ADMIN });
        if (adminExists) {
            console.log('⚠️ Đã tồn tại tài khoản Admin trong hệ thống, không cần tạo mới!');
            process.exit(0);
        }

        // Tạo tài khoản admin mặc định
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        await UserModel.create({
            name: 'Root Admin',
            email: 'admin@gmail.com',
            passwordHash,
            role: UserRole.ADMIN,
            isEmailVerified: true
        });

        console.log('🎉 Tạo tài khoản Root Admin thành công!');
        console.log('Email: admin@gmail.com');
        console.log('Password: admin123');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi Seed Admin:', error);
        process.exit(1);
    }
};

seedAdmin();
