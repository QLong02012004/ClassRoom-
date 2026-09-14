/**
 * ============================================================================
 * TÊN FILE: database.ts
 * ĐƯỜNG DẪN: backend-classroom/src/config/database.ts
 * MỤC ĐÍCH:
 *   Quản lý kết nối cơ sở dữ liệu MongoDB Atlas cho toàn bộ hệ thống Backend.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Lấy chuỗi kết nối `MONGO_URI` từ biến môi trường (`.env`).
 *   - Sử dụng `mongoose.connect()` kết nối tới MongoDB Cluster.
 *   - Tự động thực thi migration nhẹ: Cập nhật `isEmailVerified: true` cho các tài khoản khởi tạo cũ để hiển thị nhất quán trên Admin Dashboard.
 * ============================================================================
 */

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

        // Tự động cập nhật isEmailVerified: true cho các tài khoản cũ/seeded (chưa có trường này) để hiển thị trên trang Admin
        try {
            const { UserModel } = require('../models/User');
            const result1 = await UserModel.updateMany(
                { isEmailVerified: { $exists: false } },
                { $set: { isEmailVerified: true } }
            );
            if (result1.modifiedCount > 0) {
                console.log(`🔧 Đã đồng bộ isEmailVerified cho ${result1.modifiedCount} người dùng cũ.`);
            }
        } catch (dbErr) {
            console.error('⚠️ Lỗi đồng bộ isEmailVerified cho người dùng cũ:', dbErr);
        }

        // Tự động làm tròn maxScore bị lỗi dấu phẩy động hoặc bị gán nhầm <= 1
        try {
            const { ClassActivityModel } = require('../models/ClassActivity');
            const { BankItemModel } = require('../models/BankItem');
            await ClassActivityModel.updateMany(
                { $or: [{ maxScore: { $gt: 9.99, $lt: 10.01 } }, { maxScore: { $lte: 1 } }, { maxScore: null }] },
                { $set: { maxScore: 10 } }
            );
            await BankItemModel.updateMany(
                { $or: [{ maxScore: { $gt: 9.99, $lt: 10.01 } }, { maxScore: { $lte: 1 } }, { maxScore: null }] },
                { $set: { maxScore: 10 } }
            );
        } catch (scoreErr) {
            console.error('⚠️ Lỗi đồng bộ maxScore:', scoreErr);
        }
    } catch (error) {
        console.error(`❌ Thất bại! Lỗi kết nối: ${(error as Error).message}`);
        process.exit(1);
    }
};