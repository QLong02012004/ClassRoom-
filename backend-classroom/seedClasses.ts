import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from './src/models/User';
import { ClassModel } from './src/models/Class';

dotenv.config();

const seedClasses = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        // Tìm giáo viên, nếu chưa có thì không thể tạo
        const teacher = await UserModel.findOne({ role: 'teacher' });
        if (!teacher) {
            console.log('Không tìm thấy tài khoản Giáo viên nào. Vui lòng tạo Giáo viên trước.');
            process.exit(1);
        }

        // Tìm học sinh
        const students = await UserModel.find({ role: 'student' }).limit(10);
        const studentIds = students.map(s => s._id);

        console.log('Xóa các lớp học cũ...');
        await ClassModel.deleteMany({});

        console.log('Tạo lớp học mẫu...');
        const classesToCreate = [
            {
                name: 'Lập trình React nâng cao',
                code: 'REACT1',
                teacherId: teacher._id,
                students: studentIds,
                status: 'Active'
            },
            {
                name: 'Cơ sở dữ liệu SQL Server',
                code: 'SQLDB2',
                teacherId: teacher._id,
                students: studentIds.slice(0, 5),
                status: 'Active'
            },
            {
                name: 'Tiếng Anh Giao Tiếp 2',
                code: 'ENG102',
                teacherId: teacher._id,
                students: studentIds.slice(0, 3),
                status: 'Locked'
            },
            {
                name: 'Lớp Hóa 11A1',
                code: 'CHE11A',
                teacherId: teacher._id,
                students: studentIds,
                status: 'Locked'
            }
        ];

        await ClassModel.insertMany(classesToCreate);
        console.log('Đã tạo xong các lớp học mẫu!');

        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi seed lớp học:', error);
        process.exit(1);
    }
};

seedClasses();
