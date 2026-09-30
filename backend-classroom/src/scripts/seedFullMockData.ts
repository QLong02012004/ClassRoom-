/**
 * ============================================================================
 * TÊN FILE: seedFullMockData.ts
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/seedFullMockData.ts
 * MỤC ĐÍCH:
 *   Script Dọn Dẹp Toàn Bộ Dữ Liệu Cũ & Nạp Dữ Liệu Mock Chuyên Nghiệp (Full Production Mock Seed).
 *   Chuẩn bị giao diện đẹp mắt, dữ liệu phong phú, sống động cho việc quay video quảng cáo và demo sản phẩm.
 * ============================================================================
 */

import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { ClassModel } from '../models/Class';
import { AttendanceModel } from '../models/Attendance';
import { ClassActivityModel } from '../models/ClassActivity';
import { BankItemModel, BankItemType, BankItemSharingStatus } from '../models/BankItem';
import { AnnouncementModel } from '../models/Announcement';
import { GradeModel } from '../models/Grade';
import { ScheduleModel } from '../models/Schedule';
import { SubmissionModel } from '../models/Submission';
import { QuizResultModel } from '../models/QuizResult';
import { ClassJoinRequestModel } from '../models/ClassJoinRequest';
import MaterialModel from '../models/Material';
import { NotificationModel } from '../models/Notification';
import { UserRole, UserStatus, ClassStatus, AttendanceStatus, SubmissionStatus, QuizStatus, NotificationType, AnnouncementType } from '../constants/enums';

dotenv.config();

const STUDENT_NAMES = [
    { name: 'Nguyễn Minh Khôi', email: 'student@gmail.com', gender: 'Nam', dob: '2007-05-12', phone: '0905123456', parentPhone: '0912345000', xp: 420, level: 4, streak: 5 },
    { name: 'Trần Linh Chi', email: 'chi.tran@student.edu.vn', gender: 'Nữ', dob: '2007-06-22', phone: '0901111002', parentPhone: '0912345002', xp: 580, level: 5, streak: 8 },
    { name: 'Nguyễn Hoàng Nam', email: 'nam.nguyen@student.edu.vn', gender: 'Nam', dob: '2007-03-15', phone: '0901111001', parentPhone: '0912345001', xp: 510, level: 5, streak: 6 },
    { name: 'Võ Minh Anh', email: 'anh.vo@student.edu.vn', gender: 'Nữ', dob: '2007-11-08', phone: '0901111003', parentPhone: '0912345003', xp: 460, level: 4, streak: 4 },
    { name: 'Lê Quốc Hùng', email: 'hung.le@student.edu.vn', gender: 'Nam', dob: '2007-01-30', phone: '0901111004', parentPhone: '0912345004', xp: 390, level: 3, streak: 3 },
    { name: 'Phạm Thu Hà', email: 'ha.pham@student.edu.vn', gender: 'Nữ', dob: '2007-09-14', phone: '0901111005', parentPhone: '0912345005', xp: 340, level: 3, streak: 2 },
    { name: 'Đỗ Văn Bình', email: 'binh.do@student.edu.vn', gender: 'Nam', dob: '2007-04-02', phone: '0901111006', parentPhone: '0912345006', xp: 310, level: 3, streak: 1 },
    { name: 'Hoàng Thị Lan', email: 'lan.hoang@student.edu.vn', gender: 'Nữ', dob: '2007-07-19', phone: '0901111007', parentPhone: '0912345007', xp: 290, level: 2, streak: 3 },
    { name: 'Bùi Đức Khoa', email: 'khoa.bui@student.edu.vn', gender: 'Nam', dob: '2007-12-05', phone: '0901111008', parentPhone: '0912345008', xp: 260, level: 2, streak: 2 },
    { name: 'Ngô Thị Tuyết', email: 'tuyet.ngo@student.edu.vn', gender: 'Nữ', dob: '2007-02-28', phone: '0901111009', parentPhone: '0912345009', xp: 240, level: 2, streak: 1 },
    { name: 'Đinh Quang Huy', email: 'huy.dinh@student.edu.vn', gender: 'Nam', dob: '2007-08-11', phone: '0901111010', parentPhone: '0912345010', xp: 220, level: 2, streak: 2 },
    { name: 'Trương Minh Phúc', email: 'phuc.truong@student.edu.vn', gender: 'Nam', dob: '2007-05-17', phone: '0901111011', parentPhone: '0912345011', xp: 200, level: 2, streak: 0 },
    { name: 'Lý Thị Ngọc', email: 'ngoc.ly@student.edu.vn', gender: 'Nữ', dob: '2007-10-03', phone: '0901111012', parentPhone: '0912345012', xp: 180, level: 1, streak: 1 },
    { name: 'Mai Văn Đức', email: 'duc.mai@student.edu.vn', gender: 'Nam', dob: '2007-03-25', phone: '0901111013', parentPhone: '0912345013', xp: 160, level: 1, streak: 0 },
    { name: 'Vũ Thị Hoa', email: 'hoa.vu@student.edu.vn', gender: 'Nữ', dob: '2007-06-09', phone: '0901111014', parentPhone: '0912345014', xp: 140, level: 1, streak: 1 },
    { name: 'Tạ Quốc Trung', email: 'trung.ta@student.edu.vn', gender: 'Nam', dob: '2007-01-14', phone: '0901111015', parentPhone: '0912345015', xp: 120, level: 1, streak: 0 },
    { name: 'Hồ Thị Thu', email: 'thu.ho@student.edu.vn', gender: 'Nữ', dob: '2007-11-27', phone: '0901111016', parentPhone: '0912345016', xp: 110, level: 1, streak: 1 },
    { name: 'Phan Văn Toàn', email: 'toan.phan@student.edu.vn', gender: 'Nam', dob: '2007-04-18', phone: '0901111017', parentPhone: '0912345017', xp: 95, level: 1, streak: 0 },
    { name: 'Cao Thị Bích', email: 'bich.cao@student.edu.vn', gender: 'Nữ', dob: '2007-07-06', phone: '0901111018', parentPhone: '0912345018', xp: 80, level: 1, streak: 0 },
    { name: 'Đặng Quang Vinh', email: 'vinh.dang@student.edu.vn', gender: 'Nam', dob: '2007-09-21', phone: '0901111019', parentPhone: '0912345019', xp: 60, level: 1, streak: 0 }
];

const seedFullMockData = async () => {
    try {
        console.log('🔄 Đang kết nối MongoDB...');
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối MongoDB thành công.');

        // ========================================================
        // 1. DỌN SẠCH DỮ LIỆU CŨ (CLEAN SLATE)
        // ========================================================
        console.log('\n🧹 BƯỚC 1: Dọn dẹp sạch toàn bộ Collections cũ...');
        await Promise.all([
            UserModel.deleteMany({}),
            ClassModel.deleteMany({}),
            ClassActivityModel.deleteMany({}),
            BankItemModel.deleteMany({}),
            SubmissionModel.deleteMany({}),
            QuizResultModel.deleteMany({}),
            GradeModel.deleteMany({}),
            AttendanceModel.deleteMany({}),
            AnnouncementModel.deleteMany({}),
            ScheduleModel.deleteMany({}),
            MaterialModel.deleteMany({}),
            NotificationModel.deleteMany({}),
            ClassJoinRequestModel.deleteMany({})
        ]);
        console.log('✅ Đã dọn dẹp sạch 100% dữ liệu cũ.');

        // ========================================================
        // 2. KHỞI TẠO TÀI KHOẢN (ADMIN, TEACHERS, STUDENTS)
        // ========================================================
        console.log('\n👤 BƯỚC 2: Khởi tạo các tài khoản người dùng mẫu...');
        const salt = await bcrypt.genSalt(10);
        const pass123 = await bcrypt.hash('123456', salt);
        const passAdmin = await bcrypt.hash('admin123', salt);

        // 2.1 Admin
        const admin = await UserModel.create({
            name: 'Root Administrator',
            email: 'admin@gmail.com',
            passwordHash: passAdmin,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            phone: '0905999999',
            bio: 'Quản trị viên trưởng hệ thống LMS ClassRoom.',
            isEmailVerified: true,
            isGoogleAccount: false
        });

        // 2.2 Giáo viên ACTIVE (Đang giảng dạy)
        const teacher = await UserModel.create({
            name: 'ThS. Trần Thị Mai Phương',
            email: 'teacher@gmail.com',
            passwordHash: pass123,
            role: UserRole.TEACHER,
            status: UserStatus.ACTIVE,
            phone: '0988123456',
            subject: 'Sinh học',
            degree: 'Thạc sĩ Sư phạm Sinh học',
            bio: 'Giáo viên phụ trách bộ môn Sinh học, chuyên bồi dưỡng học sinh giỏi và luyện thi THPT Quốc gia.',
            isEmailVerified: true,
            isGoogleAccount: false
        });

        const teacher2 = await UserModel.create({
            name: 'Thầy Lê Hoàng Long',
            email: 'teacher2@gmail.com',
            passwordHash: pass123,
            role: UserRole.TEACHER,
            status: UserStatus.ACTIVE,
            phone: '0977654321',
            subject: 'Toán học',
            degree: 'Cử nhân Sư phạm Toán',
            bio: 'Giáo viên Toán học 12 năm kinh nghiệm luyện thi Đại học.',
            isEmailVerified: true,
            isGoogleAccount: false
        });

        const teacher3 = await UserModel.create({
            name: 'Cô Nguyễn Hồng Hạnh',
            email: 'teacher3@gmail.com',
            passwordHash: pass123,
            role: UserRole.TEACHER,
            status: UserStatus.ACTIVE,
            phone: '0933445566',
            subject: 'Tiếng Anh',
            degree: 'Thạc sĩ Ngôn ngữ Anh',
            bio: 'Giáo viên Tiếng Anh IELTS 8.0 với 8 năm kinh nghiệm giảng dạy chuyên sâu.',
            isEmailVerified: true,
            isGoogleAccount: false
        });

        await UserModel.insertMany([
            {
                name: 'Thầy Phạm Quốc Bảo',
                email: 'bao.pham@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.ACTIVE,
                phone: '0966112233',
                subject: 'Vật lý',
                degree: 'Thạc sĩ Vật lý Ứng dụng',
                bio: 'Tổ trưởng tổ Vật lý, chuyên bồi dưỡng học sinh giỏi cấp tỉnh và quốc gia.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Cô Đặng Hải Yến',
                email: 'yen.dang@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.ACTIVE,
                phone: '0912998877',
                subject: 'Hóa học',
                degree: 'Cử nhân Sư phạm Hóa học',
                bio: 'Giáo viên Hóa học nhiệt huyết, ứng dụng phương pháp trực quan hóa thí nghiệm số.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Thầy Vũ Đình Trọng',
                email: 'trong.vu@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.ACTIVE,
                phone: '0944556677',
                subject: 'Tin học',
                degree: 'Kỹ sư Khoa học Máy tính & Sư phạm Tin',
                bio: 'Huấn luyện viên đội tuyển Tin học trẻ, giảng dạy Python, C++ và thuật toán.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Cô Bùi Thanh Thảo',
                email: 'thao.bui@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.ACTIVE,
                phone: '0983221100',
                subject: 'Ngữ văn',
                degree: 'Thạc sĩ Văn học Việt Nam',
                bio: 'Giáo viên Ngữ văn trường THPT Chuyên, tác giả tài liệu ôn luyện thi vào 10 và THPTQG.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Cô Chu Diệu Linh',
                email: 'linh.chu@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.ACTIVE,
                phone: '0981122334',
                subject: 'Toán học',
                degree: 'Cử nhân Sư phạm Toán (Chất lượng cao)',
                bio: 'Giảng dạy Toán 10 và 11, chuyên luyện thi học sinh giỏi cấp Thành phố.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Thầy Trần Hải Đăng',
                email: 'dang.tran@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.ACTIVE,
                phone: '0972233445',
                subject: 'Tiếng Anh',
                degree: 'Thạc sĩ Phương pháp Giảng dạy Tiếng Anh (TESOL)',
                bio: 'Giảng viên Tiếng Anh Cambridge & IELTS, kinh nghiệm 9 năm giảng dạy.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Thầy Tạ Quang Huy',
                email: 'huy.ta@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.ACTIVE,
                phone: '0963344556',
                subject: 'Lịch sử',
                degree: 'Cử nhân Sư phạm Lịch sử',
                bio: 'Giáo viên Lịch sử nhiệt huyết, ứng dụng sơ đồ tư duy và học lịch sử qua câu chuyện.',
                isEmailVerified: true,
                isGoogleAccount: false
            }
        ]);

        // 2.3 Giáo viên PENDING (Chờ phê duyệt - Demo duyệt / từ chối hồ sơ)
        const teacherPending = await UserModel.create({
            name: 'Cô Phạm Thu Hà (Chờ duyệt)',
            email: 'teacher.pending@gmail.com',
            passwordHash: pass123,
            role: UserRole.TEACHER,
            status: UserStatus.PENDING,
            phone: '0911223344',
            subject: 'Tiếng Anh',
            degree: 'Thạc sĩ Ngôn ngữ Anh (ĐH Ngoại Ngữ)',
            bio: 'Giáo viên Tiếng Anh IELTS 8.5 nộp hồ sơ xin giảng dạy khối 10 và 11.',
            isEmailVerified: true,
            isGoogleAccount: false
        });

        await UserModel.insertMany([
            {
                name: 'Thầy Hoàng Văn Nam (Chờ duyệt)',
                email: 'nam.hoang@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.PENDING,
                phone: '0922334455',
                subject: 'Lịch sử',
                degree: 'Cử nhân Sư phạm Lịch sử',
                bio: 'Ứng tuyển giáo viên thỉnh giảng Lịch sử ôn thi THPT Quốc gia.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Cô Nguyễn Minh Châu (Chờ duyệt)',
                email: 'chau.nguyen@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.PENDING,
                phone: '0933557799',
                subject: 'Địa lý',
                degree: 'Thạc sĩ Địa lý Tự nhiên',
                bio: 'Giáo viên Địa lý ứng tuyển giảng dạy khối Trung học phổ thông.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Thầy Phan Thanh Sơn (Chờ duyệt)',
                email: 'son.phan@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.PENDING,
                phone: '0966778899',
                subject: 'GDCD',
                degree: 'Cử nhân Giáo dục Công dân & Luật học',
                bio: 'Hồ sơ tuyển dụng giáo viên Giáo dục Kinh tế & Pháp luật.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Cô Lê Quỳnh Trang (Chờ duyệt)',
                email: 'trang.le@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.PENDING,
                phone: '0977889900',
                subject: 'Sinh học',
                degree: 'Thạc sĩ Di truyền học Thực nghiệm',
                bio: 'Tốt nghiệp xuất sắc ĐH Sư phạm Hà Nội, nộp hồ sơ xin giảng dạy bộ môn Sinh học.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Thầy Lương Gia Bảo (Chờ duyệt)',
                email: 'bao.luong@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.PENDING,
                phone: '0914455667',
                subject: 'Toán học',
                degree: 'Thạc sĩ Toán Ứng dụng (ĐH Khoa học Tự nhiên)',
                bio: 'Hồ sơ xin thỉnh giảng Toán Giải tích và Hình học không gian lớp 11-12.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Cô Mai Thùy Dung (Chờ duyệt)',
                email: 'dung.mai@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.PENDING,
                phone: '0925566778',
                subject: 'Ngữ văn',
                degree: 'Cử nhân Sư phạm Ngữ văn',
                bio: 'Giáo viên trẻ năng động nộp hồ sơ giảng dạy Văn học hiện đại và kỹ năng nghị luận xã hội.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Thầy Trịnh Tuấn Anh (Chờ duyệt)',
                email: 'anh.trinh@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.PENDING,
                phone: '0936677889',
                subject: 'Tin học',
                degree: 'Kỹ sư Công nghệ Thông tin (ĐH Bách Khoa)',
                bio: 'Ứng tuyển giáo viên phụ trách phòng thực hành Tin học và CLB Robotics sáng tạo trẻ.',
                isEmailVerified: true,
                isGoogleAccount: false
            }
        ]);

        // 2.4 Giáo viên LOCKED (Tạm khóa - Demo mở khóa tài khoản)
        await UserModel.insertMany([
            {
                name: 'Thầy Đỗ Minh Tuấn (Tạm khóa)',
                email: 'tuan.do@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.LOCKED,
                phone: '0901234888',
                subject: 'Toán học',
                degree: 'Cử nhân Sư phạm Toán',
                bio: 'Tài khoản tạm khóa do giáo viên nghỉ phép dài hạn đi nghiên cứu sinh tại nước ngoài.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Cô Trần Thúy Ngân (Tạm khóa)',
                email: 'ngan.tran@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.LOCKED,
                phone: '0901234777',
                subject: 'Tiếng Anh',
                degree: 'Cử nhân Ngôn ngữ Anh',
                bio: 'Tài khoản đang bị tạm khóa để xác minh bảo mật sau khi phát hiện đăng nhập từ IP lạ.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Thầy Ngô Đức Huy (Tạm khóa)',
                email: 'huy.ngo@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.LOCKED,
                phone: '0901234666',
                subject: 'Hóa học',
                degree: 'Thạc sĩ Hóa học Hữu cơ',
                bio: 'Hết hạn hợp đồng thỉnh giảng học kỳ 1, tạm đóng quyền truy cập chờ ký phụ lục.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Cô Dương Ánh Tuyết (Tạm khóa)',
                email: 'tuyet.duong@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.LOCKED,
                phone: '0901234555',
                subject: 'Vật lý',
                degree: 'Cử nhân Sư phạm Vật lý',
                bio: 'Tài khoản bị tạm khóa do vi phạm chính sách chia sẻ tài nguyên chưa được phê duyệt.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Cô Võ Ngọc Ánh (Tạm khóa)',
                email: 'anh.vo@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.LOCKED,
                phone: '0901234444',
                subject: 'Ngữ văn',
                degree: 'Cử nhân Sư phạm Văn',
                bio: 'Tạm khóa theo yêu cầu cá nhân để chuyển công tác và biệt phái ngắn hạn tại cơ sở khác.',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Thầy Đoàn Thế Vinh (Tạm khóa)',
                email: 'vinh.doan@teacher.edu.vn',
                passwordHash: pass123,
                role: UserRole.TEACHER,
                status: UserStatus.LOCKED,
                phone: '0901234333',
                subject: 'Tin học',
                degree: 'Kỹ sư Hệ thống Thông tin',
                bio: 'Tài khoản đang tạm ngưng do nghỉ phép dài hạn và tạm hoãn giảng dạy học kỳ này.',
                isEmailVerified: true,
                isGoogleAccount: false
            }
        ]);

        // 2.5 Danh sách Học sinh ACTIVE
        const studentDocs = await UserModel.insertMany(
            STUDENT_NAMES.map(s => ({
                name: s.name,
                email: s.email,
                passwordHash: pass123,
                role: UserRole.STUDENT,
                status: UserStatus.ACTIVE,
                gender: s.gender,
                dob: s.dob,
                phone: s.phone,
                parentPhone: s.parentPhone,
                xp: s.xp,
                level: s.level,
                streak: s.streak,
                school: 'THPT Chuyên Quốc Gia',
                gradeLevel: '12',
                isEmailVerified: true,
                isGoogleAccount: false
            }))
        );

        // 2.6 Học sinh PENDING (Chờ duyệt)
        await UserModel.insertMany([
            {
                name: 'Lý Gia Hưng (Chờ duyệt)',
                email: 'hung.ly@student.edu.vn',
                passwordHash: pass123,
                role: UserRole.STUDENT,
                status: UserStatus.PENDING,
                gender: 'Nam',
                dob: '2007-08-20',
                phone: '0908881111',
                parentPhone: '0919991111',
                xp: 0,
                level: 1,
                streak: 0,
                school: 'THPT Chuyên Quốc Gia',
                gradeLevel: '12',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Trương Ngọc Ánh (Chờ duyệt)',
                email: 'anh.truong@student.edu.vn',
                passwordHash: pass123,
                role: UserRole.STUDENT,
                status: UserStatus.PENDING,
                gender: 'Nữ',
                dob: '2007-10-15',
                phone: '0908882222',
                parentPhone: '0919992222',
                xp: 0,
                level: 1,
                streak: 0,
                school: 'THPT Chuyên Quốc Gia',
                gradeLevel: '12',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Võ Thái Sơn (Chờ duyệt)',
                email: 'son.vo@student.edu.vn',
                passwordHash: pass123,
                role: UserRole.STUDENT,
                status: UserStatus.PENDING,
                gender: 'Nam',
                dob: '2007-04-12',
                phone: '0908883333',
                parentPhone: '0919993333',
                xp: 0,
                level: 1,
                streak: 0,
                school: 'THPT Chuyên Quốc Gia',
                gradeLevel: '12',
                isEmailVerified: true,
                isGoogleAccount: false
            }
        ]);

        // 2.7 Học sinh LOCKED (Đang khóa)
        await UserModel.insertMany([
            {
                name: 'Hoàng Tuấn Kiệt (Tạm khóa)',
                email: 'kiet.hoang@student.edu.vn',
                passwordHash: pass123,
                role: UserRole.STUDENT,
                status: UserStatus.LOCKED,
                gender: 'Nam',
                dob: '2007-02-14',
                phone: '0907771111',
                parentPhone: '0918881111',
                xp: 150,
                level: 2,
                streak: 0,
                school: 'THPT Chuyên Quốc Gia',
                gradeLevel: '12',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Lê Hải Đăng (Tạm khóa)',
                email: 'dang.le@student.edu.vn',
                passwordHash: pass123,
                role: UserRole.STUDENT,
                status: UserStatus.LOCKED,
                gender: 'Nam',
                dob: '2007-07-25',
                phone: '0907772222',
                parentPhone: '0918882222',
                xp: 80,
                level: 1,
                streak: 0,
                school: 'THPT Chuyên Quốc Gia',
                gradeLevel: '12',
                isEmailVerified: true,
                isGoogleAccount: false
            },
            {
                name: 'Phạm Thùy Linh (Tạm khóa)',
                email: 'linh.pham@student.edu.vn',
                passwordHash: pass123,
                role: UserRole.STUDENT,
                status: UserStatus.LOCKED,
                gender: 'Nữ',
                dob: '2007-09-30',
                phone: '0907773333',
                parentPhone: '0918883333',
                xp: 220,
                level: 2,
                streak: 0,
                school: 'THPT Chuyên Quốc Gia',
                gradeLevel: '12',
                isEmailVerified: true,
                isGoogleAccount: false
            }
        ]);

        const mainStudent = studentDocs[0]; // student@gmail.com
        const secondStudent = studentDocs[1];
        if (!mainStudent || !secondStudent) {
            throw new Error('Không thể khởi tạo danh sách học sinh mẫu.');
        }
        console.log(`  🎉 Đã tạo: 1 Admin, 16 Giáo viên (7 Active, 5 Pending, 4 Locked), 26 Học sinh (20 Active, 3 Pending, 3 Locked).`);

        // ========================================================
        // 3. KHỞI TẠO CÁC LỚP HỌC (CLASSES)
        // ========================================================
        console.log('\n📚 BƯỚC 3: Khởi tạo các Lớp học mẫu...');
        const allStudentIds = studentDocs.map(s => s._id);

        // Lớp 1: Lớp 12 Sinh - Ôn thi THPT (Lớp chính để Demo - GV 1)
        const classBio = await ClassModel.create({
            name: 'Lớp 12 Sinh - Ôn thi THPT',
            subject: 'Sinh học',
            code: 'BIO12A',
            teacherId: teacher._id,
            status: ClassStatus.ACTIVE,
            students: allStudentIds // 20 học sinh
        });

        // Lớp 2: Sinh học 10 - Nâng cao (GV 1)
        const classBio10 = await ClassModel.create({
            name: 'Sinh học 10 - Nâng cao',
            subject: 'Sinh học',
            code: 'BIO10B',
            teacherId: teacher._id,
            status: ClassStatus.ACTIVE,
            students: allStudentIds.slice(0, 16)
        });

        // Lớp 3: Toán 12 - Luyện thi Đại học (GV 2)
        const classMath = await ClassModel.create({
            name: 'Toán 12 - Luyện thi Đại học',
            subject: 'Toán học',
            code: 'MATH12',
            teacherId: teacher2._id,
            status: ClassStatus.ACTIVE,
            students: allStudentIds.slice(0, 18)
        });

        // Lớp 4: Toán 11 - Hình học Không gian & Đại số (GV 2)
        const classMath11 = await ClassModel.create({
            name: 'Toán 11 - Hình học Không gian & Đại số',
            subject: 'Toán học',
            code: 'MATH11',
            teacherId: teacher2._id,
            status: ClassStatus.ACTIVE,
            students: allStudentIds.slice(0, 14)
        });

        // Lớp 5: Tiếng Anh IELTS Chuyên sâu (GV 3)
        const classEng = await ClassModel.create({
            name: 'Tiếng Anh IELTS Chuyên sâu',
            subject: 'Tiếng Anh',
            code: 'ENG101',
            teacherId: teacher3._id,
            status: ClassStatus.ACTIVE,
            students: allStudentIds.slice(0, 15)
        });

        // Lớp 6: Tiếng Anh 10 - Giao tiếp Học thuật (GV 3)
        const classEng10 = await ClassModel.create({
            name: 'Tiếng Anh 10 - Giao tiếp Học thuật',
            subject: 'Tiếng Anh',
            code: 'ENG102',
            teacherId: teacher3._id,
            status: ClassStatus.ACTIVE,
            students: allStudentIds.slice(0, 12)
        });

        // Lớp 7: Lớp ĐÃ ĐÓNG (Closed) - Để demo chức năng Đóng/Mở lớp học
        const classClosed = await ClassModel.create({
            name: 'Bồi dưỡng HSG Sinh 12 (Kỳ 1 - Đã kết thúc)',
            subject: 'Sinh học',
            code: 'BIOOLD',
            teacherId: teacher._id,
            status: ClassStatus.CLOSED,
            students: allStudentIds.slice(0, 8)
        });

        console.log(`  🎉 Đã tạo 7 lớp học cho 3 giáo viên (6 đang hoạt động, 1 đã đóng). Lớp chính: BIO12A.`);

        // ========================================================
        // 4. YÊU CẦU THAM GIA LỚP (PENDING JOIN REQUEST)
        // ========================================================
        console.log('\n🙋 BƯỚC 4: Tạo yêu cầu xin vào lớp chờ Giáo viên duyệt...');
        // Tạo 1 học sinh chưa có trong lớp gửi yêu cầu xin vào lớp BIO12A
        const applicantStudent = await UserModel.create({
            name: 'Đặng Tuấn Anh (Học sinh mới)',
            email: 'tuananh.dang@student.edu.vn',
            passwordHash: pass123,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
            isEmailVerified: true
        });
        await ClassJoinRequestModel.create({
            classId: classBio._id,
            studentId: applicantStudent._id,
            status: 'pending'
        });
        console.log('  🎉 Tạo 1 yêu cầu xin vào lớp chờ giáo viên duyệt.');

        // ========================================================
        // 5. NGÂN HÀNG CÂU HỎI & ĐỀ THI (BANK ITEMS)
        // ========================================================
        console.log('\n🏦 BƯỚC 5: Khởi tạo Ngân hàng Câu hỏi & Đề thi trắc nghiệm AI...');
        
        // Đề thi trắc nghiệm mẫu
        const quizBankItem = await BankItemModel.create({
            teacherId: teacher._id,
            type: BankItemType.QUIZ,
            title: 'Đề thi trắc nghiệm: Di truyền học phân tử (10 câu chuẩn)',
            description: 'Đề thi kiểm tra kiến thức về ADN, ARN, phiên mã, dịch mã và điều hòa hoạt động gen.',
            subject: 'Sinh học',
            maxScore: 10,
            durationMinutes: 15,
            sharingStatus: BankItemSharingStatus.CENTER_SHARED,
            shuffleQuestions: true,
            shuffleOptions: true,
            quizQuestions: [
                {
                    questionText: 'Quá trình nhân đôi ADN diễn ra theo nguyên tắc nào sau đây?',
                    options: ['Bổ sung và bán bảo tồn', 'Bảo tồn và gián đoạn', 'Một chiều và liên tục', 'Tự do và ngẫu nhiên'],
                    correctOptionIndex: 0,
                    points: 1,
                    tags: ['ADN', 'Nhân đôi ADN'],
                    explanation: 'Quá trình nhân đôi ADN luôn tuân thủ nguyên tắc bổ sung (A-T, G-X) và nguyên tắc bán bảo tồn (mỗi phân tử con chứa 1 mạch cũ và 1 mạch mới).'
                },
                {
                    questionText: 'Loại ARN nào sau đây mang bộ ba đối mã (anticodon)?',
                    options: ['mARN', 'tARN', 'rARN', 'hnARN'],
                    correctOptionIndex: 1,
                    points: 1,
                    tags: ['Dịch mã', 'ARN'],
                    explanation: 'tARN (ARN vận chuyển) mang bộ ba đối mã anticodon tương ứng với codon trên mARN.'
                },
                {
                    questionText: 'Mã di truyền có tính thoái hóa nghĩa là gì?',
                    options: [
                        'Nhiều bộ ba khác nhau cùng mã hóa cho một loại axit amin',
                        'Một bộ ba mã hóa cho nhiều loại axit amin',
                        'Mã di truyền dùng chung cho hầu hết sinh vật',
                        'Mỗi loài sinh vật có một bộ mã di truyền riêng'
                    ],
                    correctOptionIndex: 0,
                    points: 1,
                    tags: ['Mã di truyền'],
                    explanation: 'Tính thoái hóa (dư thừa) nghĩa là có 61 bộ ba mã hóa cho 20 loại axit amin, do đó nhiều bộ ba cùng mã hóa cho một loại axit amin.'
                },
                {
                    questionText: 'Trong mô hình cấu trúc Operon Lac ở vi khuẩn E.coli, vùng vận hành (operator) là nơi nào?',
                    options: [
                        'Protein ức chế có thể liên kết làm ngăn cản phiên mã',
                        'Enzim ARN polimeraza bám vào khởi động phiên mã',
                        'Mang thông tin mã hóa cho protein ức chế',
                        'Chứa các gen cấu trúc Z, Y, A'
                    ],
                    correctOptionIndex: 0,
                    points: 1,
                    tags: ['Operon Lac', 'Điều hòa gen'],
                    explanation: 'Vùng vận hành O (operator) là vị trí tương tác đặc hiệu với protein ức chế.'
                },
                {
                    questionText: 'Dạng đột biến gen nào sau đây KHÔNG làm thay đổi số lượng nuclêôtit của gen?',
                    options: ['Thay thế một cặp nuclêôtit', 'Mất một cặp nuclêôtit', 'Thêm một cặp nuclêôtit', 'Mất hai cặp nuclêôtit'],
                    correctOptionIndex: 0,
                    points: 1,
                    tags: ['Đột biến gen'],
                    explanation: 'Đột biến thay thế 1 cặp nuclêôtit chỉ thay đổi loại nuclêôtit chứ không thay đổi tổng số lượng nuclêôtit của gen.'
                }
            ]
        });

        // Bài tập tự luận mẫu trong ngân hàng
        const essayBankItem = await BankItemModel.create({
            teacherId: teacher._id,
            type: BankItemType.DOCUMENT,
            title: 'Chuyên đề Tự luận: Cơ chế điều hòa biểu hiện gen và ứng dụng thực tiễn',
            description: 'Yêu cầu vẽ sơ đồ Operon Lac và phân tích cơ chế hoạt động khi môi trường có lactose và không có lactose.',
            subject: 'Sinh học',
            maxScore: 10,
            sharingStatus: BankItemSharingStatus.CENTER_SHARED
        });

        // 5.2 Các đề thi và tài liệu mẫu do Admin khởi tạo toàn trường (Đầy đủ môn học)
        await BankItemModel.insertMany([
            {
                teacherId: admin._id,
                type: BankItemType.QUIZ,
                title: 'Đề thi thử THPT Quốc Gia môn Toán: Hàm số & Tích phân',
                description: 'Bộ 10 câu trắc nghiệm chuẩn cấu trúc đề thi tốt nghiệp THPT, có lời giải chi tiết và phân loại dạng bài.',
                subject: 'Toán',
                maxScore: 10,
                durationMinutes: 45,
                sharingStatus: BankItemSharingStatus.CENTER_SHARED,
                shuffleQuestions: true,
                shuffleOptions: true,
                quizQuestions: [
                    {
                        questionText: 'Cho hàm số y = f(x) có bảng biến thiên. Số điểm cực trị của hàm số đã cho là bao nhiêu?',
                        options: ['2 điểm', '3 điểm', '1 điểm', '0 điểm'],
                        correctOptionIndex: 0,
                        points: 1,
                        tags: ['Hàm số', 'Cực trị'],
                        explanation: 'Điểm cực trị là điểm mà tại đó đạo hàm đổi dấu. Dựa vào bảng biến thiên có 2 lần đổi dấu.'
                    },
                    {
                        questionText: 'Tính tích phân I = ∫ (2x + 1) dx từ 0 đến 1?',
                        options: ['2', '1', '3', '0.5'],
                        correctOptionIndex: 0,
                        points: 1,
                        tags: ['Tích phân'],
                        explanation: 'Nguyên hàm là x^2 + x. Thay cận từ 0 đến 1: (1 + 1) - 0 = 2.'
                    }
                ]
            },
            {
                teacherId: admin._id,
                type: BankItemType.QUIZ,
                title: 'Đề kiểm tra 45 phút Hóa học 12: Este - Lipit & Cacbohiđrat',
                description: 'Kiểm tra kiến thức trọng tâm Hóa hữu cơ 12: Phản ứng xà phòng hóa, tính chất của glucozơ và saccarozơ.',
                subject: 'Hóa học',
                maxScore: 10,
                durationMinutes: 45,
                sharingStatus: BankItemSharingStatus.CENTER_SHARED,
                shuffleQuestions: true,
                shuffleOptions: true,
                quizQuestions: [
                    {
                        questionText: 'Chất nào sau đây phản ứng với dung dịch AgNO3 trong NH3 đun nóng tạo kết tủa Ag (phản ứng tráng bạc)?',
                        options: ['Glucozơ', 'Saccarozơ', 'Tinh bột', 'Xenlulozơ'],
                        correctOptionIndex: 0,
                        points: 1,
                        tags: ['Cacbohiđrat', 'Tráng bạc'],
                        explanation: 'Glucozơ có nhóm -CHO nên có khả năng tham gia phản ứng tráng bạc tạo 2 mol Ag.'
                    },
                    {
                        questionText: 'Thủy phân este X có công thức phân tử CH3COOC2H5 trong dung dịch NaOH thu được muối nào?',
                        options: ['CH3COONa', 'C2H5COONa', 'HCOONa', 'CH3COONH4'],
                        correctOptionIndex: 0,
                        points: 1,
                        tags: ['Este', 'Thủy phân'],
                        explanation: 'CH3COOC2H5 + NaOH -> CH3COONa + C2H5OH.'
                    }
                ]
            },
            {
                teacherId: admin._id,
                type: BankItemType.QUIZ,
                title: 'Đề thi Tiếng Anh: Ngữ pháp Trọng tâm & Đọc hiểu IELTS',
                description: 'Đề thi trắc nghiệm Tiếng Anh chuẩn hóa: Thì của động từ, mệnh đề quan hệ và bài đọc hiểu 5 câu.',
                subject: 'Tiếng Anh',
                maxScore: 10,
                durationMinutes: 30,
                sharingStatus: BankItemSharingStatus.CENTER_SHARED,
                shuffleQuestions: true,
                shuffleOptions: true,
                quizQuestions: [
                    {
                        questionText: 'Choose the correct option: If she _______ harder, she would have passed the final exam.',
                        options: ['had studied', 'studied', 'studies', 'would study'],
                        correctOptionIndex: 0,
                        points: 1,
                        tags: ['Conditional Sentences', 'Type 3'],
                        explanation: 'Câu điều kiện loại 3 diễn tả điều kiện trái với quá khứ: If + S + had + PII, S + would have + PII.'
                    },
                    {
                        questionText: 'The scientist _______ discovered the new vaccine won the Nobel Prize.',
                        options: ['who', 'whom', 'which', 'whose'],
                        correctOptionIndex: 0,
                        points: 1,
                        tags: ['Relative Clause'],
                        explanation: 'Dùng đại từ quan hệ "who" thay thế cho danh từ chỉ người làm chủ ngữ (The scientist).'
                    }
                ]
            },
            {
                teacherId: admin._id,
                type: BankItemType.QUIZ,
                title: 'Đề kiểm tra Vật lý 12: Dao động cơ & Sóng cơ học',
                description: 'Hệ thống 10 câu hỏi bao quát con lắc lò xo, con lắc đơn, sự giao thoa và truyền sóng.',
                subject: 'Vật lý',
                maxScore: 10,
                durationMinutes: 25,
                sharingStatus: BankItemSharingStatus.CENTER_SHARED,
                shuffleQuestions: true,
                shuffleOptions: true,
                quizQuestions: [
                    {
                        questionText: 'Một con lắc lò xo có độ cứng k, vật nặng khối lượng m. Chu kỳ dao động riêng của con lắc là:',
                        options: ['T = 2π√(m/k)', 'T = 2π√(k/m)', 'T = √(m/k)', 'T = (1/2π)√(k/m)'],
                        correctOptionIndex: 0,
                        points: 1,
                        tags: ['Dao động cơ', 'Con lắc lò xo'],
                        explanation: 'Công thức tính chu kỳ dao động của con lắc lò xo: T = 2π√(m/k).'
                    }
                ]
            },
            {
                teacherId: admin._id,
                type: BankItemType.DOCUMENT,
                title: 'Chuyên đề Tự luận Toán: Khảo sát hàm số và bài toán tương giao đồ thị',
                description: 'Tuyển tập 15 bài toán tự luận vận dụng cao chuyên đề tương giao đồ thị và cực trị có chứa tham số m.',
                subject: 'Toán',
                maxScore: 10,
                fileUrl: 'https://example.com/files/chuyen_de_toan_ham_so.pdf',
                sharingStatus: BankItemSharingStatus.CENTER_SHARED
            },
            {
                teacherId: admin._id,
                type: BankItemType.DOCUMENT,
                title: 'Bộ câu hỏi Tự luận Hóa học: Phương pháp giải bài toán Peptit & Este đa chức',
                description: 'Hướng dẫn phương pháp quy đổi este đa chức và đồng đẳng hóa peptit kèm 20 bài tập tự luyện.',
                subject: 'Hóa học',
                maxScore: 10,
                fileUrl: 'https://example.com/files/chuyen_de_hoa_peptit.docx',
                sharingStatus: BankItemSharingStatus.CENTER_SHARED
            },
            {
                teacherId: admin._id,
                type: BankItemType.DOCUMENT,
                title: 'Chuyên đề Đọc hiểu & Nghị luận xã hội 200 chữ môn Ngữ văn',
                description: 'Hệ thống cấu trúc bài viết đoạn văn 200 chữ đạt điểm tối đa (mở đoạn, giải thích, bàn luận, dẫn chứng, phản đề, bài học).',
                subject: 'Ngữ văn',
                maxScore: 10,
                fileUrl: 'https://example.com/files/ngu_van_nghi_luan_xa_hoi.pdf',
                sharingStatus: BankItemSharingStatus.CENTER_SHARED
            },
            {
                teacherId: admin._id,
                type: BankItemType.DOCUMENT,
                title: 'Tuyển tập 50 Câu Collocations & Cụm từ dễ nhầm lẫn trong đề thi Tiếng Anh',
                description: 'Tổng hợp từ vựng, idioms, phrasal verbs phổ biến nhất thường xuất hiện trong đề thi tốt nghiệp THPT Quốc gia.',
                subject: 'Tiếng Anh',
                maxScore: 10,
                fileUrl: 'https://example.com/files/tieng_anh_collocations.pdf',
                sharingStatus: BankItemSharingStatus.CENTER_SHARED
            }
        ]);

        console.log('  🎉 Đã tạo Ngân hàng câu hỏi trắc nghiệm & bài tập tự luận mẫu phong phú cho Admin & Giáo viên.');

        // ========================================================
        // 6. CÁC HOẠT ĐỘNG HỌC TẬP TRONG LỚP (CLASS ACTIVITIES)
        // ========================================================
        console.log('\n📝 BƯỚC 6: Tạo các Bài tập & Bài thi trong Lớp 12 Sinh...');

        // 6.1 BÀI TẬP ĐANG MỞ (Pending) - Deadline 3 ngày tới -> Để học sinh thấy ở Tab "Đang mở"
        const openHomework = await ClassActivityModel.create({
            classId: classBio._id,
            bankItemId: essayBankItem._id,
            type: BankItemType.DOCUMENT,
            title: 'Bài tập về nhà Tuần 3: Đột biến gen và ứng dụng chọn giống',
            description: 'Các em tải tài liệu đính kèm, hoàn thành bài làm ra vở hoặc file Word/PDF và nộp trước hạn.',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ngày nữa
            maxScore: 10,
            category: 'homework',
            allowMultipleSubmissions: true,
            attachments: [
                { name: 'De_bai_tap_tuan_3_Sinh_hoc_12.pdf', url: 'https://example.com/files/De_bai_tap_tuan_3.pdf', size: '1.2 MB' }
            ]
        });

        // 6.2 BÀI THI TRẮC NGHIỆM ĐANG MỞ - 15 phút, hạn 5 ngày tới
        const openQuiz = await ClassActivityModel.create({
            classId: classBio._id,
            bankItemId: quizBankItem._id,
            type: BankItemType.QUIZ,
            title: 'Đề thi trắc nghiệm 15 phút: Di truyền học phân tử (Đợt 1)',
            description: 'Bài kiểm tra trắc nghiệm 15 phút. Hệ thống tự động tính điểm và nộp bài khi hết giờ.',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 ngày nữa
            maxScore: 10,
            category: 'periodic',
            durationMinutes: 15,
            status: QuizStatus.OPEN
        });

        // 6.3 BÀI TẬP ĐÃ CHẤM (Graded) - Hạn 7 ngày trước -> Có điểm số và lời phê sẵn trong Sổ điểm
        const gradedHomework = await ClassActivityModel.create({
            classId: classBio._id,
            type: BankItemType.DOCUMENT,
            title: 'Bài tập tự luận Tuần 1: Cấu trúc phân tử ADN & Bản chất mã di truyền',
            description: 'Phân tích các dạng liên kết hóa học trong ADN và giải bài toán tính số lượng nuclêôtit.',
            dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày trước
            maxScore: 10,
            category: 'homework',
            allowMultipleSubmissions: true
        });

        // 6.4 BÀI TẬP ĐÃ NỘP - CHỜ CHẤM (Submitted) - Hạn hôm qua -> student@gmail.com đã nộp, chờ GV chấm
        const submittedHomework = await ClassActivityModel.create({
            classId: classBio._id,
            type: BankItemType.DOCUMENT,
            title: 'Bài tập tự luận Tuần 2: Quá trình nhân đôi ADN và phiên mã tổng hợp ARN',
            description: 'Giải thích nguyên tắc bán bảo tồn và tính chiều dài mạch ARN được tổng hợp.',
            dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hôm qua
            maxScore: 10,
            category: 'homework',
            allowMultipleSubmissions: true
        });

        console.log('  🎉 Đã tạo 4 hoạt động bài tập (2 đang mở, 1 đã nộp chờ chấm, 1 đã chấm xong).');

        // ========================================================
        // 7. BÀI NỘP & SỔ ĐIỂM (SUBMISSIONS & GRADEBOOK)
        // ========================================================
        console.log('\n📊 BƯỚC 7: Nạp Bài nộp của Học sinh & Đồng bộ Sổ điểm...');

        // 7.1 Bài nộp cho "Bài tập Tuần 1" (Đã chấm điểm cho tất cả học sinh)
        const mockScores = [9.5, 9.0, 8.5, 9.0, 8.0, 8.5, 7.5, 8.0, 9.0, 8.5, 7.0, 8.0, 8.5, 9.0, 7.5, 8.0, 8.5, 9.0, 7.5, 8.0];
        for (let i = 0; i < studentDocs.length; i++) {
            const st = studentDocs[i];
            if (!st) continue;
            const score = mockScores[i] || 8.0;
            const isMainStudent = st.email === 'student@gmail.com';
            const feedback = isMainStudent 
                ? 'Bài làm xuất sắc! Sơ đồ vẽ rất chi tiết, nắm vững nguyên tắc bổ sung và các enzim tham gia.' 
                : 'Bài làm đầy đủ, nắm vững kiến thức trọng tâm.';

            // Tạo Submission
            await SubmissionModel.create({
                assignmentId: gradedHomework._id,
                studentId: st._id,
                status: SubmissionStatus.GRADED,
                submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                submissionText: `Em xin gửi bài tập Tuần 1 môn Sinh học. Em đã hoàn thành 5 câu hỏi lý thuyết và 2 bài tập tính toán.`,
                attachments: [
                    { name: `Bai_lam_Sinh_tuan_1_${st.name.replace(/\s+/g, '_')}.pdf`, url: 'https://example.com/files/bai_lam.pdf', size: '2.1 MB' }
                ]
            });

            // Đồng bộ sang Grade Model (Sổ điểm)
            await GradeModel.create({
                assignmentId: gradedHomework._id,
                studentId: st._id,
                score,
                feedback,
                gradedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            });
        }

        // 7.2 Bài nộp cho "Bài tập Tuần 2" (student@gmail.com ĐÃ NỘP - CHỜ CHẤM)
        await SubmissionModel.create({
            assignmentId: submittedHomework._id,
            studentId: mainStudent._id,
            status: SubmissionStatus.SUBMITTED,
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            submissionText: 'Thưa cô, em đã nộp bài tập tuần 2 về quá trình phiên mã và dịch mã. Nhờ cô xem và góp ý giúp em phần bài tập tính số liên kết peptit ạ!',
            attachments: [
                { name: 'Bai_lam_Tuan_2_Nguyen_Minh_Khoi.docx', url: 'https://example.com/files/bai_lam_tuan_2.docx', size: '1.5 MB' }
            ]
        });

        // 7.3 Lịch sử thi trắc nghiệm trước đó của student@gmail.com (Để Dashboard hiện Biểu đồ & Lỗ hổng AI)
        await QuizResultModel.create({
            quizId: openQuiz._id,
            studentId: mainStudent._id,
            answers: [0, 1, 0, 0, 1], // Đúng 4/5 câu
            score: 8.0,
            totalQuestions: 5,
            submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        });

        console.log('  🎉 Đã tạo đầy đủ Bài nộp, Điểm số Sổ điểm và Lịch sử thi trắc nghiệm.');

        // ========================================================
        // 8. BẢNG TIN LỚP HỌC (ANNOUNCEMENTS & COMMENTS)
        // ========================================================
        console.log('\n📢 BƯỚC 8: Khởi tạo Bảng tin lớp học (Stream Tab)...');
        
        // Bài 1: Thông báo chào mừng ghim lên đầu
        await AnnouncementModel.create({
            classId: classBio._id,
            authorId: teacher._id,
            content: 'Chào mừng tất cả các em học sinh đến với Lớp 12 Sinh - Ôn thi THPT Quốc gia 2026! 🌟\nCô đã đính kèm Đề cương chi tiết và Lộ trình ôn tập 30 tuần bên dưới. Các em nhớ tải về và theo dõi lịch nộp bài tập hàng tuần nhé!',
            type: AnnouncementType.ANNOUNCEMENT,
            isPinned: true,
            attachments: [
                { name: 'De_cuong_on_thi_THPT_Sinh_hoc_2026.pdf', url: 'https://example.com/files/de_cuong.pdf', size: '3.4 MB' },
                { name: 'So_do_tu_duy_Di_truyen_hoc.png', url: 'https://example.com/files/so_do_tu_duy.png', size: '850 KB' }
            ],
            comments: [
                {
                    authorId: mainStudent._id,
                    authorName: mainStudent.name,
                    authorRole: 'student',
                    content: 'Dạ em chào cô ạ! Đề cương rất chi tiết, cảm ơn cô nhiều ạ!',
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
                },
                {
                    authorId: secondStudent._id,
                    authorName: secondStudent.name,
                    authorRole: 'student',
                    content: 'Thưa cô, tuần này mình có lịch học phụ đạo vào thứ Bảy không ạ?',
                    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
                },
                {
                    authorId: teacher._id,
                    authorName: teacher.name,
                    authorRole: 'teacher',
                    content: 'Chào Chi, thứ Bảy tuần này lớp mình sẽ có ca làm đề thi thử vào lúc 14h00 nhé.',
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                }
            ],
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        });

        // Bài 2: Nhắc nhở nộp bài tập
        await AnnouncementModel.create({
            classId: classBio._id,
            authorId: teacher._id,
            content: '⏰ Nhắc nhở cả lớp: Hạn nộp bài tập tự luận Tuần 3 là vào Chủ nhật tuần này. Các bạn nộp đúng hạn sẽ được cộng +15 điểm thưởng XP vào bảng vinh danh!',
            type: AnnouncementType.REMINDER,
            isPinned: false,
            comments: [],
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        });

        console.log('  🎉 Đã tạo 2 bài đăng Bảng tin kèm đính kèm file và bình luận trao đổi.');

        // ========================================================
        // 9. ĐIỂM DANH CHUYÊN CẦN (ATTENDANCE)
        // ========================================================
        console.log('\n📋 BƯỚC 9: Tạo bản ghi Điểm danh lớp học...');
        
        // Điểm danh buổi học gần nhất
        const attendanceRecords = studentDocs.map((s, idx) => ({
            studentId: s._id as Types.ObjectId,
            status: idx === 3 ? AttendanceStatus.LATE : (idx === 7 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT),
            note: idx === 3 ? 'Đến muộn 10 phút do kẹt xe' : (idx === 7 ? 'Nghỉ có phép từ phụ huynh' : '')
        }));

        await AttendanceModel.create({
            classId: classBio._id,
            date: new Date(),
            records: attendanceRecords,
            syncedToGoogleSheet: true,
            lastSyncedAt: new Date()
        });

        console.log('  🎉 Đã tạo bản ghi điểm danh đầy đủ học sinh cho Lớp 12 Sinh.');

        // ========================================================
        // 10. THỜI KHÓA BIỂU (SCHEDULES)
        // ========================================================
        console.log('\n📅 BƯỚC 10: Khởi tạo Thời khóa biểu lịch học...');
        await ScheduleModel.insertMany([
            {
                classId: classBio._id,
                teacherId: teacher._id,
                subject: 'Sinh học 12',
                chapter: 'Chương 1: Cơ chế di truyền & Biến dị',
                dayOfWeek: 2, // Thứ 2
                startTime: '07:30',
                endTime: '09:00',
                progress: 45
            },
            {
                classId: classBio._id,
                teacherId: teacher._id,
                subject: 'Sinh học 12',
                chapter: 'Chương 2: Tính quy luật của hiện tượng di truyền',
                dayOfWeek: 4, // Thứ 4
                startTime: '14:00',
                endTime: '15:30',
                progress: 20
            },
            {
                classId: classMath._id,
                teacherId: teacher2._id,
                subject: 'Toán học 12',
                chapter: 'Chuyên đề: Ứng dụng đạo hàm khảo sát hàm số',
                dayOfWeek: 6, // Thứ 6
                startTime: '09:15',
                endTime: '10:45',
                progress: 60
            }
        ]);
        console.log('  🎉 Đã tạo thời khóa biểu các ca học trong tuần.');

        // ========================================================
        // 11. KHO TÀI LIỆU CÔNG KHAI (MATERIALS)
        // ========================================================
        console.log('\n📁 BƯỚC 11: Tạo Kho Tài liệu tham khảo công khai...');
        await MaterialModel.insertMany([
            {
                title: 'Sổ tay Công thức Sinh học 12 Trọng tâm (PDF)',
                subject: 'Sinh học',
                grade: '12',
                description: 'Tổng hợp toàn bộ công thức tính toán số lượng nuclêôtit, chiều dài ADN, số liên kết hiđrô và các quy luật di truyền Menđen.',
                type: 'pdf',
                size: '4.2 MB',
                fileUrl: 'https://example.com/materials/so_tay_sinh_12.pdf',
                uploaderId: teacher._id,
                isPublic: true
            },
            {
                title: 'Cẩm nang Toàn diện Công thức Giải nhanh Toán 12 (PDF)',
                subject: 'Toán',
                grade: '12',
                description: 'Bí kíp bấm máy tính Casio 580VNX và công thức giải nhanh hình học không gian Oxyz, tích phân và hàm số.',
                type: 'pdf',
                size: '6.5 MB',
                fileUrl: 'https://example.com/materials/cam_nang_toan_12.pdf',
                uploaderId: admin._id,
                isPublic: true
            },
            {
                title: 'Infographic Sơ đồ Tư duy: Toàn bộ Hóa học Hữu cơ 11 & 12',
                subject: 'Hóa học',
                grade: '12',
                description: 'Hệ thống hóa chuỗi biến hóa hiđrocacbon, ancol, anđehit, axit cacboxylic, este và amin trên sơ đồ tư duy màu sắc trực quan.',
                type: 'pdf',
                size: '3.8 MB',
                fileUrl: 'https://example.com/materials/mindmap_hoa_hoc.pdf',
                uploaderId: admin._id,
                isPublic: true
            },
            {
                title: 'Ebook: 1000 Từ vựng Học thuật IELTS Band 7.5+ Theo Chủ đề',
                subject: 'Tiếng Anh',
                grade: '12',
                description: 'Phân loại từ vựng chuyên sâu theo 20 chủ đề phổ biến nhất: Môi trường, Công nghệ, Giáo dục, Kinh tế kèm bài tập ứng dụng.',
                type: 'pdf',
                size: '5.2 MB',
                fileUrl: 'https://example.com/materials/1000_tu_vung_ielts.pdf',
                uploaderId: admin._id,
                isPublic: true
            },
            {
                title: 'Bộ 500 Câu Hỏi Trắc nghiệm Sinh học có lời giải chi tiết',
                subject: 'Sinh học',
                grade: '12',
                description: 'Tài liệu ôn thi THPT Quốc gia phân dạng từ nhận biết, thông hiểu đến vận dụng cao.',
                type: 'doc',
                size: '8.6 MB',
                fileUrl: 'https://example.com/materials/500_cau_trac_nghiem.docx',
                uploaderId: teacher._id,
                isPublic: true
            },
            {
                title: 'Tuyển tập 30 Đề thi thử THPT Quốc gia môn Vật lý chuẩn cấu trúc',
                subject: 'Vật lý',
                grade: '12',
                description: 'Đề thi thử từ các trường chuyên danh tiếng kèm bảng đáp án và hướng dẫn giải các câu phân loại điểm 9-10.',
                type: 'pdf',
                size: '9.4 MB',
                fileUrl: 'https://example.com/materials/30_de_thi_thu_vat_ly.pdf',
                uploaderId: admin._id,
                isPublic: true
            },
            {
                title: 'Video Bài giảng: Cơ chế Phiên mã và Dịch mã 3D trực quan',
                subject: 'Sinh học',
                grade: '12',
                description: 'Mô phỏng 3D quá trình ARN Polimeraza di chuyển trên mạch khuôn và ribôxôm tổng hợp chuỗi pôlipeptit.',
                type: 'video',
                size: '120 MB',
                fileUrl: 'https://example.com/materials/video_dich_ma_3d.mp4',
                uploaderId: teacher._id,
                isPublic: true
            },
            {
                title: 'Video Thí nghiệm: Phản ứng Tráng bạc & Phản ứng Màu Biure',
                subject: 'Hóa học',
                grade: '12',
                description: 'Ghi hình thực nghiệm trong phòng lab hiện tượng tráng gương của glucozơ và màu tím đặc trưng của lòng trắng trứng.',
                type: 'video',
                size: '85 MB',
                fileUrl: 'https://example.com/materials/video_thi_nghiem_hoa.mp4',
                uploaderId: admin._id,
                isPublic: true
            }
        ]);
        console.log('  🎉 Đã tạo 8 tài liệu tham khảo công khai phong phú trong Kho học liệu.');

        // ========================================================
        // 12. THÔNG BÁO QUẢ CHUÔNG (NOTIFICATIONS)
        // ========================================================
        console.log('\n🔔 BƯỚC 12: Tạo thông báo mẫu trên Quả Chuông...');
        await NotificationModel.insertMany([
            {
                recipientRole: UserRole.STUDENT,
                recipientId: mainStudent._id,
                sender: teacher._id,
                title: 'Điểm số bài tập mới',
                message: 'Bài tập "Bài tập tự luận Tuần 1: Cấu trúc ADN" của bạn đã được ThS. Trần Thị Mai Phương chấm: 9.5 điểm.',
                type: NotificationType.ASSIGNMENT,
                readBy: [],
                createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 phút trước
            },
            {
                recipientRole: UserRole.STUDENT,
                recipientId: mainStudent._id,
                sender: teacher._id,
                title: 'Bài tập mới vừa được giao',
                message: 'Cô Trần Thị Mai Phương đã giao bài tập mới: "Bài tập về nhà Tuần 3: Đột biến gen". Hạn nộp: 3 ngày tới.',
                type: NotificationType.ASSIGNMENT,
                readBy: [],
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
                recipientRole: UserRole.TEACHER,
                recipientId: teacher._id,
                sender: mainStudent._id,
                title: 'Bài nộp mới từ học sinh',
                message: 'Học sinh Nguyễn Minh Khôi đã nộp "Bài tập tự luận Tuần 2: Quá trình phiên mã".',
                type: NotificationType.ASSIGNMENT,
                readBy: [],
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
            },
            {
                recipientRole: UserRole.ADMIN,
                recipientId: admin._id,
                sender: teacherPending._id,
                title: 'Hồ sơ giáo viên mới chờ phê duyệt',
                message: 'Cô Phạm Thu Hà (Tiếng Anh) đã hoàn thành đăng ký tài khoản và đang chờ bạn phê duyệt.',
                type: NotificationType.CLASSROOM,
                readBy: [],
                createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 phút trước
            },
            {
                recipientRole: UserRole.ADMIN,
                recipientId: admin._id,
                sender: teacher._id,
                title: 'Tạo lớp học mới',
                message: 'Giáo viên ThS. Trần Thị Mai Phương vừa tạo lớp học mới: "Lớp 12 Sinh - Ôn thi THPT".',
                type: NotificationType.CLASSROOM,
                readBy: [],
                createdAt: new Date(Date.now() - 35 * 60 * 1000) // 35 phút trước
            },
            {
                recipientRole: UserRole.ADMIN,
                recipientId: admin._id,
                sender: teacher2._id,
                title: 'Thêm học sinh vào lớp',
                message: 'Thầy Lê Hoàng Long vừa thêm học sinh vào lớp học "Toán 12 - Luyện thi Đại học".',
                type: NotificationType.CLASSROOM,
                readBy: [],
                createdAt: new Date(Date.now() - 75 * 60 * 1000) // 1 giờ 15 phút trước
            },
            {
                recipientRole: UserRole.ADMIN,
                recipientId: admin._id,
                sender: teacher3._id,
                title: 'Giao bài tập mới',
                message: 'Cô Nguyễn Hồng Hạnh vừa giao bài tập mới: "IELTS Reading Mini Test" cho lớp "Tiếng Anh IELTS Chuyên sâu".',
                type: NotificationType.ASSIGNMENT,
                readBy: [],
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 giờ trước
            },
            {
                recipientRole: UserRole.ADMIN,
                recipientId: admin._id,
                sender: teacher._id,
                title: 'Xuất bản đề thi trắc nghiệm',
                message: 'ThS. Trần Thị Mai Phương vừa tạo đề trắc nghiệm: "Di truyền học phân tử 15 phút" cho lớp "Lớp 12 Sinh - Ôn thi THPT".',
                type: NotificationType.QUIZ,
                readBy: [],
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 giờ trước
            },
            {
                recipientRole: UserRole.ADMIN,
                recipientId: admin._id,
                sender: teacher._id,
                title: 'Hoàn tất điểm danh lớp học',
                message: 'Giáo viên ThS. Trần Thị Mai Phương vừa hoàn thành điểm danh lớp "Lớp 12 Sinh - Ôn thi THPT" với tỷ lệ có mặt đạt 95%.',
                type: NotificationType.CLASSROOM,
                readBy: [],
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 giờ trước
            }
        ]);
        console.log('  🎉 Đã tạo thông báo Real-time và lịch sử hoạt động phong phú cho Admin, Giáo viên và Học sinh.');

        // ========================================================
        // TỔNG KẾT & HOÀN TẤT
        // ========================================================
        console.log('\n========================================================');
        console.log('✨ HOÀN TẤT DỌN DẸP & SEED DỮ LIỆU MOCK 100% THÀNH CÔNG! ✨');
        console.log('========================================================');
        console.log('📌 Danh sách tài khoản đã chuẩn bị sẵn để quay video demo:');
        console.log('  1. ADMIN:    admin@gmail.com    | Mật khẩu: admin123');
        console.log('  2. TEACHER:  teacher@gmail.com  | Mật khẩu: 123456 (hoặc teacher123)');
        console.log('  3. PENDING:  teacher.pending@gmail.com | Mật khẩu: 123456 (Chờ Admin duyệt)');
        console.log('  4. STUDENT:  student@gmail.com  | Mật khẩu: 123456');
        console.log('📌 Lớp học chính để test: BIO12A (Lớp 12 Sinh - Ôn thi THPT)');
        console.log('========================================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi seed dữ liệu mock:', error);
        process.exit(1);
    }
};

seedFullMockData();
