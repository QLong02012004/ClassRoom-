import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { ClassModel } from '../models/Class';
import { AttendanceModel } from '../models/Attendance';
import { AssignmentModel } from '../models/Assignment';
import { AnnouncementModel } from '../models/Announcement';
import { GradeModel } from '../models/Grade';
import { ScheduleModel } from '../models/Schedule';
import { SubmissionModel } from '../models/Submission';
import { QuizModel } from '../models/Quiz';
import { QuizResultModel } from '../models/QuizResult';

dotenv.config();

const STUDENT_DATA = [
    { name: 'Nguyễn Hoàng Nam',   email: 'nam.nguyen@student.edu.vn',   gender: 'Nam',  dob: '2007-03-15', phone: '0901111001', parentPhone: '0912345001' },
    { name: 'Trần Linh Chi',       email: 'chi.tran@student.edu.vn',      gender: 'Nữ',   dob: '2007-06-22', phone: '0901111002', parentPhone: '0912345002' },
    { name: 'Võ Minh Anh',        email: 'anh.vo@student.edu.vn',        gender: 'Nữ',   dob: '2007-11-08', phone: '0901111003', parentPhone: '0912345003' },
    { name: 'Lê Quốc Hùng',       email: 'hung.le@student.edu.vn',       gender: 'Nam',  dob: '2007-01-30', phone: '0901111004', parentPhone: '0912345004' },
    { name: 'Phạm Thu Hà',        email: 'ha.pham@student.edu.vn',       gender: 'Nữ',   dob: '2007-09-14', phone: '0901111005', parentPhone: '0912345005' },
    { name: 'Đỗ Văn Bình',        email: 'binh.do@student.edu.vn',       gender: 'Nam',  dob: '2007-04-02', phone: '0901111006', parentPhone: '0912345006' },
    { name: 'Hoàng Thị Lan',      email: 'lan.hoang@student.edu.vn',     gender: 'Nữ',   dob: '2007-07-19', phone: '0901111007', parentPhone: '0912345007' },
    { name: 'Bùi Đức Khoa',       email: 'khoa.bui@student.edu.vn',      gender: 'Nam',  dob: '2007-12-05', phone: '0901111008', parentPhone: '0912345008' },
    { name: 'Ngô Thị Tuyết',      email: 'tuyet.ngo@student.edu.vn',     gender: 'Nữ',   dob: '2007-02-28', phone: '0901111009', parentPhone: '0912345009' },
    { name: 'Đinh Quang Huy',     email: 'huy.dinh@student.edu.vn',      gender: 'Nam',  dob: '2007-08-11', phone: '0901111010', parentPhone: '0912345010' },
    { name: 'Trương Minh Phúc',   email: 'phuc.truong@student.edu.vn',   gender: 'Nam',  dob: '2007-05-17', phone: '0901111011', parentPhone: '0912345011' },
    { name: 'Lý Thị Ngọc',       email: 'ngoc.ly@student.edu.vn',       gender: 'Nữ',   dob: '2007-10-03', phone: '0901111012', parentPhone: '0912345012' },
    { name: 'Mai Văn Đức',        email: 'duc.mai@student.edu.vn',       gender: 'Nam',  dob: '2007-03-25', phone: '0901111013', parentPhone: '0912345013' },
    { name: 'Vũ Thị Hoa',        email: 'hoa.vu@student.edu.vn',        gender: 'Nữ',   dob: '2007-06-09', phone: '0901111014', parentPhone: '0912345014' },
    { name: 'Tạ Quốc Trung',      email: 'trung.ta@student.edu.vn',      gender: 'Nam',  dob: '2007-01-14', phone: '0901111015', parentPhone: '0912345015' },
    { name: 'Hồ Thị Thu',        email: 'thu.ho@student.edu.vn',        gender: 'Nữ',   dob: '2007-11-27', phone: '0901111016', parentPhone: '0912345016' },
    { name: 'Phan Văn Toàn',      email: 'toan.phan@student.edu.vn',     gender: 'Nam',  dob: '2007-04-18', phone: '0901111017', parentPhone: '0912345017' },
    { name: 'Cao Thị Bích',       email: 'bich.cao@student.edu.vn',      gender: 'Nữ',   dob: '2007-07-06', phone: '0901111018', parentPhone: '0912345018' },
    { name: 'Đặng Quang Vinh',    email: 'vinh.dang@student.edu.vn',     gender: 'Nam',  dob: '2007-09-21', phone: '0901111019', parentPhone: '0912345019' },
    { name: 'Chu Thị Dung',       email: 'dung.chu@student.edu.vn',      gender: 'Nữ',   dob: '2007-02-12', phone: '0901111020', parentPhone: '0912345020' },
];

const generateClassCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const cleanAndSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database');

        // 1. XÓA SẠCH TẤT CẢ DỮ LIỆU
        console.log('🧹 Đang xóa dữ liệu cũ...');
        await AnnouncementModel.deleteMany({});
        await AssignmentModel.deleteMany({});
        await AttendanceModel.deleteMany({});
        await ClassModel.deleteMany({});
        await GradeModel.deleteMany({});
        await QuizModel.deleteMany({});
        await QuizResultModel.deleteMany({});
        await ScheduleModel.deleteMany({});
        await SubmissionModel.deleteMany({});
        await UserModel.deleteMany({});
        console.log('✅ Đã xóa sạch dữ liệu ở tất cả các bảng!');

        // 2. SEED ADMIN
        console.log('👤 Đang tạo tài khoản Admin...');
        const saltAdmin = await bcrypt.genSalt(10);
        const passAdmin = await bcrypt.hash('admin123', saltAdmin);
        await UserModel.create({
            name: 'Root Admin',
            email: 'admin@gmail.com',
            passwordHash: passAdmin,
            role: 'admin'
        });
        console.log('  🎉 Tạo tài khoản Root Admin thành công (admin@gmail.com / admin123)');

        // 3. SEED TEACHER
        console.log('👤 Đang tạo tài khoản Giáo viên...');
        const saltTeacher = await bcrypt.genSalt(10);
        const passTeacher = await bcrypt.hash('teacher123', saltTeacher);
        const teacher = await UserModel.create({
            name: 'Nguyễn Văn Teacher',
            email: 'teacher@gmail.com',
            passwordHash: passTeacher,
            role: 'teacher'
        });
        console.log('  🎉 Tạo tài khoản Giáo viên thành công (teacher@gmail.com / teacher123)');

        // 4. SEED CLASSES
        console.log('📚 Đang tạo các lớp học mẫu...');
        const sampleClasses = [
            { name: 'Lớp 12A1', subject: 'Toán học' },
            { name: 'Lớp 12A2', subject: 'Vật lý' },
            { name: 'Lớp 11B1', subject: 'Hóa học' },
            { name: 'Lớp 10C1', subject: 'Ngữ văn' },
            { name: 'Luyện thi Đại học', subject: 'Tiếng Anh' }
        ];

        const createdClasses = [];
        for (const cls of sampleClasses) {
            let code = generateClassCode();
            let isCodeUnique = false;
            while (!isCodeUnique) {
                const existingClass = await ClassModel.findOne({ code });
                if (!existingClass) isCodeUnique = true;
                else code = generateClassCode();
            }

            const newCls = await ClassModel.create({
                name: cls.name,
                subject: cls.subject,
                code,
                teacherId: teacher._id,
                status: 'Active'
            });
            createdClasses.push(newCls);
        }
        console.log(`  🎉 Đã tạo thành công ${createdClasses.length} lớp học mẫu!`);

        // 5. SEED STUDENTS
        console.log('👤 Đang tạo 20 tài khoản Học sinh...');
        const saltStudent = await bcrypt.genSalt(10);
        const passStudent = await bcrypt.hash('student123', saltStudent);

        const createdStudents = await UserModel.insertMany(
            STUDENT_DATA.map(s => ({
                name: s.name,
                email: s.email,
                passwordHash: passStudent,
                role: 'student',
                status: 'Active',
                gender: s.gender,
                dob: s.dob,
                phone: s.phone,
                parentPhone: s.parentPhone,
            }))
        );
        console.log(`  🎉 Đã tạo ${createdStudents.length} học sinh mẫu thành công!`);

        // 6. PHÂN CHIA HỌC SINH VÀO CÁC LỚP
        console.log('🔗 Đang phân chia học sinh vào các lớp học...');
        const studentsPerClass = Math.ceil(createdStudents.length / createdClasses.length);
        for (let i = 0; i < createdClasses.length; i++) {
            const cls = createdClasses[i];
            if (!cls) continue;
            const chunk = createdStudents.slice(i * studentsPerClass, (i + 1) * studentsPerClass);
            await ClassModel.findByIdAndUpdate(cls._id, {
                $set: { students: chunk.map(s => s._id) }
            });
            console.log(`    📌 Đã gán ${chunk.length} HS vào lớp "${cls.name}"`);
        }

        console.log('\n🌟 ĐÃ HOÀN THÀNH XÓA SẠCH VÀ RE-SEED TOÀN BỘ DATABASE! 🌟');
        console.log('Mọi dữ liệu bảng điểm, bài nộp, thông báo, bài trắc nghiệm đã được dọn sạch hoàn toàn.');
        console.log('Các tài khoản đã được chuẩn bị sẵn sàng để test thực tế.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi hệ thống:', error);
        process.exit(1);
    }
};

cleanAndSeed();
