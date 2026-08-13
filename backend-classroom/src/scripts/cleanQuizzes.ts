/**
 * SCRIPT: DỌN DẸP DỮ LIỆU TRẮC NGHIỆM (QUIZ)
 * Tác dụng: Xóa bỏ toàn bộ các đề thi trắc nghiệm trong ngân hàng đề, hoạt động trắc nghiệm đã giao và kết quả làm bài của học sinh.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ClassActivityModel } from '../models/ClassActivity';
import { BankItemModel, BankItemType } from '../models/BankItem';
import { QuizResultModel } from '../models/QuizResult';

dotenv.config();

const cleanQuizzes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database để dọn dẹp dữ liệu trắc nghiệm');

        const quizDel = await ClassActivityModel.deleteMany({ type: BankItemType.QUIZ });
        const bankQuizDel = await BankItemModel.deleteMany({ type: BankItemType.QUIZ });
        const resultDel = await QuizResultModel.deleteMany({});

        console.log(`🎉 Đã xóa ${quizDel.deletedCount + bankQuizDel.deletedCount} đề thi trắc nghiệm!`);
        console.log(`🎉 Đã xóa ${resultDel.deletedCount} kết quả làm bài!`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi dọn dẹp dữ liệu:', error);
        process.exit(1);
    }
};

cleanQuizzes();
