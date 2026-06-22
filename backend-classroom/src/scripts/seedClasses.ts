import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { ClassModel } from '../models/Class';

dotenv.config();

const generateClassCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const seedClasses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database để chuẩn bị Seed Classes');

        // Tìm giáo viên
        let teacher = await UserModel.findOne({ role: 'teacher' });
        
        // Nếu không có, tạo một giáo viên mẫu
        if (!teacher) {
            console.log('⚠️ Không tìm thấy giáo viên nào. Đang tạo giáo viên mẫu...');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('teacher123', salt);

            teacher = await UserModel.create({
                name: 'Nguyễn Văn Teacher',
                email: 'teacher@gmail.com',
                passwordHash,
                role: 'teacher'
            });
            console.log('🎉 Tạo tài khoản Giáo viên thành công (teacher@gmail.com / teacher123)');
        }

        // Xóa các lớp cũ của giáo viên này (tùy chọn)
        await ClassModel.deleteMany({ teacherId: teacher._id });
        console.log('🧹 Đã xóa các lớp học cũ của giáo viên này.');

        // Tạo 5 lớp học mới
        const sampleClasses = [
            { name: 'Lớp 12A1', subject: 'Toán học' },
            { name: 'Lớp 12A2', subject: 'Vật lý' },
            { name: 'Lớp 11B1', subject: 'Hóa học' },
            { name: 'Lớp 10C1', subject: 'Ngữ văn' },
            { name: 'Luyện thi Đại học', subject: 'Tiếng Anh' }
        ];

        for (const cls of sampleClasses) {
            let code = generateClassCode();
            let isCodeUnique = false;
            while (!isCodeUnique) {
                const existingClass = await ClassModel.findOne({ code });
                if (!existingClass) isCodeUnique = true;
                else code = generateClassCode();
            }

            await ClassModel.create({
                name: cls.name,
                subject: cls.subject,
                code,
                teacherId: teacher._id,
                status: 'Active'
            });
        }

        console.log('🎉 Đã tạo thành công 5 lớp học mẫu!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi Seed Classes:', error);
        process.exit(1);
    }
};

seedClasses();
