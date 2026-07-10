import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ClassModel } from '../models/Class';
import { AssignmentModel } from '../models/Assignment';
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
        await AssignmentModel.deleteMany({});
        await GradeModel.deleteMany({});
        console.log('🧹 Đã dọn sạch các bài tập và điểm số cũ');

        // Tạo bài tập mẫu cho mỗi lớp
        for (const cls of classrooms) {
            const assignmentsToCreate = [
                {
                    classId: cls._id,
                    title: `Bài tập về nhà tuần 1 - ${cls.subject || 'Học phần'}`,
                    description: 'Yêu cầu cả lớp hoàn thành bài tập về nhà đầy đủ.',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Hạn 7 ngày tới
                    maxScore: 10,
                    category: AssignmentCategory.HOMEWORK
                },
                {
                    classId: cls._id,
                    title: `Kiểm tra định kỳ tháng 1 - ${cls.subject || 'Học phần'}`,
                    description: 'Bài kiểm tra định kỳ bắt buộc. Đề thi gồm trắc nghiệm và tự luận.',
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Hạn 14 ngày tới
                    maxScore: 10,
                    category: AssignmentCategory.PERIODIC
                },
                {
                    classId: cls._id,
                    title: `Chuyên cần tháng 1`,
                    description: 'Điểm chuyên cần và thái độ học tập trên lớp.',
                    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 
                    maxScore: 10,
                    category: AssignmentCategory.ATTITUDE
                }
            ];

            await AssignmentModel.insertMany(assignmentsToCreate);
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
