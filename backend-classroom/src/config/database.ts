import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            console.error('❌ Lỗi: MONGO_URI chưa được cấu hình trong file .env');
            process.exit(1);
        }
        const conn = await mongoose.connect(mongoURI);
        console.log(`🍃 MongoDB Atlas đã kết nối thành công: ${conn.connection.host}`);

        // Tự động cập nhật isEmailVerified: true cho các tài khoản cũ/seeded để chúng hiển thị trên trang Admin
        try {
            const { UserModel } = require('../models/User');
            const result1 = await UserModel.updateMany(
                { isEmailVerified: { $exists: false } },
                { $set: { isEmailVerified: true } }
            );
            const result2 = await UserModel.updateMany(
                { status: { $in: ['Active', 'Locked', 'Pending'] }, isEmailVerified: false },
                { $set: { isEmailVerified: true } }
            );
            if (result1.modifiedCount > 0 || result2.modifiedCount > 0) {
                console.log(`🔧 Đã đồng bộ isEmailVerified cho ${result1.modifiedCount + result2.modifiedCount} người dùng cũ.`);
            }
        } catch (dbErr) {
            console.error('⚠️ Lỗi đồng bộ isEmailVerified cho người dùng cũ:', dbErr);
        }
    } catch (error) {
        console.error(`❌ Thất bại! Lỗi kết nối: ${(error as Error).message}`);
        process.exit(1);
    }
};