import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database để chuẩn bị Seed Admin');

        // Kiểm tra xem đã có admin nào chưa
        const adminExists = await UserModel.findOne({ role: 'admin' });
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
            role: 'admin'
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
