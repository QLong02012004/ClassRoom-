import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { QuizModel } from '../models/Quiz';
import { QuizResultModel } from '../models/QuizResult';

dotenv.config();

const cleanQuizzes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database để dọn dẹp dữ liệu trắc nghiệm');

        const quizDel = await QuizModel.deleteMany({});
        const resultDel = await QuizResultModel.deleteMany({});

        console.log(`🎉 Đã xóa ${quizDel.deletedCount} đề thi trắc nghiệm!`);
        console.log(`🎉 Đã xóa ${resultDel.deletedCount} kết quả làm bài!`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi dọn dẹp dữ liệu:', error);
        process.exit(1);
    }
};

cleanQuizzes();
