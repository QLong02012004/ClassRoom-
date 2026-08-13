/**
 * SCRIPT: KHỞI TẠO BÀI TẬP MẪU CHO CÁC LỚP HỌC
 * Tác dụng: Tạo các đề bài tập tự luận mẫu trong ngân hàng đề (BankItem) và giao các hoạt động này (ClassActivity) cho mỗi lớp học.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ClassModel } from '../models/Class';
import { ClassActivityModel } from '../models/ClassActivity';
import { BankItemModel, BankItemType, BankItemSharingStatus } from '../models/BankItem';
import { GradeModel } from '../models/Grade';
import { AssignmentCategory } from '../constants/enums';

dotenv.config();

const seedAssignments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database để chuẩn bị Seed Assignments');

        // Tìm tất cả các lớp học
        const classrooms = await ClassModel.find({});
        if (classrooms.length === 0) {
            console.error('❌ Chưa có lớp học nào trong hệ thống. Vui lòng chạy seed:classes và seed:students trước!');
            process.exit(1);
        }

        // Xóa các bài tập và điểm số cũ
        await ClassActivityModel.deleteMany({ type: BankItemType.DOCUMENT });
        await BankItemModel.deleteMany({ type: BankItemType.DOCUMENT });
        await GradeModel.deleteMany({});
        console.log('🧹 Đã dọn sạch các bài tập và điểm số cũ');

        // Tạo bài tập mẫu cho mỗi lớp
        for (const cls of classrooms) {
            const templates = [
                {
                    teacherId: cls.teacherId,
                    type: BankItemType.DOCUMENT,
                    title: `Bài tập về nhà tuần 1 - ${cls.subject || 'Học phần'}`,
                    description: 'Yêu cầu cả lớp hoàn thành bài tập về nhà đầy đủ.',
                    maxScore: 10,
                    sharingStatus: BankItemSharingStatus.PRIVATE
                },
                {
                    teacherId: cls.teacherId,
                    type: BankItemType.DOCUMENT,
                    title: `Kiểm tra định kỳ tháng 1 - ${cls.subject || 'Học phần'}`,
                    description: 'Bài kiểm tra định kỳ bắt buộc. Đề thi gồm trắc nghiệm và tự luận.',
                    maxScore: 10,
                    sharingStatus: BankItemSharingStatus.PRIVATE
                },
                {
                    teacherId: cls.teacherId,
                    type: BankItemType.DOCUMENT,
                    title: `Chuyên cần tháng 1`,
                    description: 'Điểm chuyên cần và thái độ học tập trên lớp.',
                    maxScore: 10,
                    sharingStatus: BankItemSharingStatus.PRIVATE
                }
            ];

            for (const temp of templates) {
                const bankItem = await BankItemModel.create(temp);
                await ClassActivityModel.create({
                    classId: cls._id,
                    bankItemId: bankItem._id,
                    type: bankItem.type,
                    title: bankItem.title,
                    description: bankItem.description,
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Hạn 7 ngày tới
                    maxScore: bankItem.maxScore,
                    category: temp.title.includes('Kiểm tra') 
                        ? AssignmentCategory.PERIODIC 
                        : (temp.title.includes('Chuyên cần') ? AssignmentCategory.ATTITUDE : AssignmentCategory.HOMEWORK)
                });
            }
            console.log(`  📌 Đã tạo 3 bài tập mẫu cho lớp "${cls.name}"`);
        }

        console.log('🎉 SEED ASSIGNMENTS THÀNH CÔNG!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi Seed Assignments:', error);
        process.exit(1);
    }
};

seedAssignments();
