import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { ClassModel } from '../models/Class';
import { AttendanceModel } from '../models/Attendance';

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

const ATTENDANCE_STATUSES: Array<'present' | 'absent' | 'late'> = ['present', 'present', 'present', 'present', 'late', 'absent'];
const randomStatus = () => ATTENDANCE_STATUSES[Math.floor(Math.random() * ATTENDANCE_STATUSES.length)];

const seedStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối tới Database');

        // ── 1. Tìm giáo viên ─────────────────────────────────────────
        const teacher = await UserModel.findOne({ role: 'teacher' });
        if (!teacher) {
            console.error('❌ Không tìm thấy giáo viên. Hãy chạy seedClasses.ts trước!');
            process.exit(1);
        }

        // ── 2. Tìm lớp học của giáo viên ─────────────────────────────
        const classes = await ClassModel.find({ teacherId: teacher._id, status: { $ne: 'Archived' } });
        if (classes.length === 0) {
            console.error('❌ Giáo viên chưa có lớp nào. Hãy chạy seedClasses.ts trước!');
            process.exit(1);
        }
        console.log(`📚 Tìm thấy ${classes.length} lớp học của giáo viên "${teacher.name}"`);

        // ── 3. Xóa học sinh cũ (chỉ những email trong danh sách mẫu) ─
        const sampleEmails = STUDENT_DATA.map(s => s.email);
        await UserModel.deleteMany({ email: { $in: sampleEmails } });
        console.log('🧹 Đã dọn sạch học sinh mẫu cũ (nếu có)');

        // ── 4. Hash password chung ────────────────────────────────────
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('student123', salt);

        // ── 5. Tạo 20 học sinh ────────────────────────────────────────
        const createdStudents = await UserModel.insertMany(
            STUDENT_DATA.map(s => ({
                name: s.name,
                email: s.email,
                passwordHash,
                role: 'student',
                status: 'Active',
                gender: s.gender,
                dob: s.dob,
                phone: s.phone,
                parentPhone: s.parentPhone,
            }))
        );
        console.log(`🎉 Đã tạo ${createdStudents.length} học sinh mẫu`);

        // ── 6. Phân chia học sinh vào các lớp ─────────────────────────
        // Lớp đầu tiên: tất cả, các lớp sau: chia đều
        const studentsPerClass = Math.ceil(createdStudents.length / classes.length);
        for (let i = 0; i < classes.length; i++) {
            const cls = classes[i];
            if (!cls) continue;
            const chunk = createdStudents.slice(i * studentsPerClass, (i + 1) * studentsPerClass);
            await ClassModel.findByIdAndUpdate(cls._id, {
                $set: { students: chunk.map(s => s._id) }
            });
            console.log(`  📌 Gán ${chunk.length} HS vào lớp "${cls.name}"`);
        }

        // ── 7. Seed dữ liệu điểm danh (3 ngày gần nhất) ─────────────
        await AttendanceModel.deleteMany({ classId: { $in: classes.map(c => c._id) } });

        const today = new Date();
        for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
            const date = new Date(today);
            date.setDate(today.getDate() - dayOffset);
            date.setHours(8, 0, 0, 0);

            for (let i = 0; i < classes.length; i++) {
                const cls = classes[i];
                if (!cls) continue;
                const chunk = createdStudents.slice(i * studentsPerClass, (i + 1) * studentsPerClass);

                if (chunk.length === 0) continue;

                await AttendanceModel.create({
                    classId: cls._id,
                    date,
                    records: chunk.map(s => ({
                        studentId: s._id as any,
                        status: (dayOffset === 0 ? randomStatus() : randomStatus()) as any,
                        note: '',
                    })),
                });
            }
        }
        console.log('📅 Đã tạo dữ liệu điểm danh cho 3 ngày gần nhất');

        console.log('\n═══════════════════════════════════════════════════');
        console.log('✅ SEED HOÀN TẤT!');
        console.log('  🎓 Học sinh login: <email> / student123');
        console.log('  Ví dụ: nam.nguyen@student.edu.vn / student123');
        console.log('═══════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi Seed Students:', error);
        process.exit(1);
    }
};

seedStudents();
