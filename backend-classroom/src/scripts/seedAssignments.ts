import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ClassModel } from '../models/Class';
import { AssignmentModel } from '../models/Assignment';

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

        // Xóa các bài tập cũ
        await AssignmentModel.deleteMany({});
        console.log('🧹 Đã dọn sạch các bài tập cũ');

        // Tạo bài tập mẫu cho mỗi lớp
        for (const cls of classrooms) {
            const assignmentsToCreate = [
                {
                    classId: cls._id,
                    title: `Bài tập 15 phút: Ôn tập môn ${cls.subject || 'Học phần'}`,
                    description: 'Yêu cầu cả lớp hoàn thành bài làm tự luận chi tiết và nộp đúng hạn quy định.',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Hạn 7 ngày tới
                    maxScore: 10,
                    category: '15phut'
                },
                {
                    classId: cls._id,
                    title: `Đề kiểm tra Giữa kỳ: Chuyên đề ${cls.subject || 'Học phần'}`,
                    description: 'Đề kiểm tra giữa kỳ bắt buộc. Trình bày sạch đẹp, nộp file PDF đính kèm.',
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Hạn 14 ngày tới
                    maxScore: 10,
                    category: 'giuaky'
                }
            ];

            await AssignmentModel.insertMany(assignmentsToCreate);
            console.log(`  📌 Đã tạo 2 bài tập mẫu cho lớp "${cls.name}"`);
        }

        console.log('🎉 SEED ASSIGNMENTS THÀNH CÔNG!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi Seed Assignments:', error);
        process.exit(1);
    }
};

seedAssignments();
