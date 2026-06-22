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
    } catch (error) {
        console.error(`❌ Thất bại! Lỗi kết nối: ${(error as Error).message}`);
        process.exit(1);
    }
};