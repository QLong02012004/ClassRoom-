/**
 * ============================================================================
 * TÊN FILE: seedUsersDemo.ts
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/seedUsersDemo.ts
 * MỤC ĐÍCH:
 *   Khởi tạo và nạp danh sách Người dùng Mẫu (Users) phong phú, đặc biệt là Giáo viên (Teachers),
 *   được phân bổ đồng đều theo cả 3 trạng thái:
 *   - Active (Hoạt động)
 *   - Pending (Chờ duyệt)
 *   - Locked (Tạm khóa)
 *
 *   Đặc biệt: Script sử dụng phương thức Upsert (cập nhật nếu có, tạo mới nếu chưa)
 *   để KHÔNG làm mất hoặc xáo trộn các lớp học, bài tập, điểm số hiện có trong DB!
 * ============================================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { UserRole, UserStatus } from '../constants/enums';

dotenv.config();

interface IDemoUserSeed {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    subject?: string;
    degree?: string;
    phone?: string;
    parentPhone?: string;
    gender?: string;
    dob?: string;
    bio?: string;
    xp?: number;
    level?: number;
    streak?: number;
}

const DEMO_USERS: IDemoUserSeed[] = [
    // ==========================================
    // 1. ADMIN
    // ==========================================
    {
        name: 'Root Administrator',
        email: 'admin@gmail.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        phone: '0905999999',
        gender: 'Nam',
        bio: 'Quản trị viên trưởng hệ thống LMS ClassRoom.',
    },
    {
        name: 'Ban Thanh Tra & Đào Tạo',
        email: 'thanhtra.admin@school.edu.vn',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        phone: '0905888777',
        gender: 'Nữ',
        bio: 'Phụ trách kiểm duyệt tài khoản giảng dạy và giám sát hệ thống.',
    },

    // ==========================================
    // 2. GIÁO VIÊN - TRẠNG THÁI: ACTIVE (HOẠT ĐỘNG)
    // ==========================================
    {
        name: 'ThS. Trần Thị Mai Phương',
        email: 'teacher@gmail.com',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Sinh học',
        degree: 'Thạc sĩ Sư phạm Sinh học',
        phone: '0988123456',
        gender: 'Nữ',
        dob: '1988-03-15',
        bio: 'Giáo viên phụ trách bộ môn Sinh học, chuyên bồi dưỡng học sinh giỏi và luyện thi THPT Quốc gia.',
    },
    {
        name: 'Thầy Lê Hoàng Long',
        email: 'teacher2@gmail.com',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Toán học',
        degree: 'Cử nhân Sư phạm Toán',
        phone: '0977654321',
        gender: 'Nam',
        dob: '1985-11-20',
        bio: 'Giáo viên Toán học 12 năm kinh nghiệm luyện thi Đại học.',
    },
    {
        name: 'Cô Nguyễn Hồng Hạnh',
        email: 'teacher3@gmail.com',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Tiếng Anh',
        degree: 'Thạc sĩ Ngôn ngữ Anh',
        phone: '0933445566',
        gender: 'Nữ',
        dob: '1990-07-08',
        bio: 'Giáo viên Tiếng Anh IELTS 8.0 với 8 năm kinh nghiệm giảng dạy chuyên sâu.',
    },
    {
        name: 'Thầy Phạm Quốc Bảo',
        email: 'bao.pham@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Vật lý',
        degree: 'Thạc sĩ Vật lý Ứng dụng',
        phone: '0966112233',
        gender: 'Nam',
        dob: '1987-05-12',
        bio: 'Tổ trưởng tổ Vật lý, chuyên bồi dưỡng học sinh giỏi cấp tỉnh và quốc gia.',
    },
    {
        name: 'Cô Đặng Hải Yến',
        email: 'yen.dang@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Hóa học',
        degree: 'Cử nhân Sư phạm Hóa học',
        phone: '0912998877',
        gender: 'Nữ',
        dob: '1992-09-18',
        bio: 'Giáo viên Hóa học nhiệt huyết, ứng dụng phương pháp trực quan hóa thí nghiệm số.',
    },
    {
        name: 'Thầy Vũ Đình Trọng',
        email: 'trong.vu@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Tin học',
        degree: 'Kỹ sư Khoa học Máy tính & Sư phạm Tin',
        phone: '0944556677',
        gender: 'Nam',
        dob: '1991-02-25',
        bio: 'Huấn luyện viên đội tuyển Tin học trẻ, giảng dạy Python, C++ và thuật toán.',
    },
    {
        name: 'Cô Bùi Thanh Thảo',
        email: 'thao.bui@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Ngữ văn',
        degree: 'Thạc sĩ Văn học Việt Nam',
        phone: '0983221100',
        gender: 'Nữ',
        dob: '1989-12-04',
        bio: 'Giáo viên Ngữ văn trường THPT Chuyên, tác giả nhiều tài liệu ôn luyện thi vào 10 và THPTQG.',
    },
    {
        name: 'Cô Chu Diệu Linh',
        email: 'linh.chu@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Toán học',
        degree: 'Cử nhân Sư phạm Toán (Chất lượng cao)',
        phone: '0981122334',
        gender: 'Nữ',
        dob: '1992-05-18',
        bio: 'Giảng dạy Toán 10 và 11, chuyên luyện thi học sinh giỏi cấp Thành phố.',
    },
    {
        name: 'Thầy Trần Hải Đăng',
        email: 'dang.tran@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Tiếng Anh',
        degree: 'Thạc sĩ Phương pháp Giảng dạy Tiếng Anh (TESOL)',
        phone: '0972233445',
        gender: 'Nam',
        dob: '1988-08-27',
        bio: 'Giảng viên Tiếng Anh Cambridge & IELTS, kinh nghiệm 9 năm giảng dạy.',
    },
    {
        name: 'Thầy Tạ Quang Huy',
        email: 'huy.ta@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        subject: 'Lịch sử',
        degree: 'Cử nhân Sư phạm Lịch sử',
        phone: '0963344556',
        gender: 'Nam',
        dob: '1986-04-10',
        bio: 'Giáo viên Lịch sử nhiệt huyết, ứng dụng sơ đồ tư duy và phương pháp học lịch sử qua câu chuyện.',
    },

    // ==========================================
    // 3. GIÁO VIÊN - TRẠNG THÁI: PENDING (CHỜ PHÊ DUYỆT)
    // ==========================================
    {
        name: 'Cô Phạm Thu Hà (Chờ duyệt)',
        email: 'teacher.pending@gmail.com',
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
        subject: 'Tiếng Anh',
        degree: 'Thạc sĩ Ngôn ngữ Anh (ĐH Ngoại Ngữ)',
        phone: '0911223344',
        gender: 'Nữ',
        dob: '1993-06-14',
        bio: 'Giáo viên Tiếng Anh IELTS 8.5 nộp hồ sơ xin giảng dạy khối 10 và 11.',
    },
    {
        name: 'Thầy Hoàng Văn Nam (Chờ duyệt)',
        email: 'nam.hoang@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
        subject: 'Lịch sử',
        degree: 'Cử nhân Sư phạm Lịch sử',
        phone: '0922334455',
        gender: 'Nam',
        dob: '1994-08-30',
        bio: 'Ứng tuyển giáo viên thỉnh giảng Lịch sử ôn thi THPT Quốc gia.',
    },
    {
        name: 'Cô Nguyễn Minh Châu (Chờ duyệt)',
        email: 'chau.nguyen@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
        subject: 'Địa lý',
        degree: 'Thạc sĩ Địa lý Tự nhiên',
        phone: '0933557799',
        gender: 'Nữ',
        dob: '1992-04-19',
        bio: 'Giáo viên Địa lý ứng tuyển giảng dạy khối Trung học phổ thông.',
    },
    {
        name: 'Thầy Phan Thanh Sơn (Chờ duyệt)',
        email: 'son.phan@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
        subject: 'GDCD',
        degree: 'Cử nhân Giáo dục Công dân & Luật học',
        phone: '0966778899',
        gender: 'Nam',
        dob: '1990-10-10',
        bio: 'Hồ sơ tuyển dụng giáo viên Giáo dục Kinh tế & Pháp luật.',
    },
    {
        name: 'Cô Lê Quỳnh Trang (Chờ duyệt)',
        email: 'trang.le@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
        subject: 'Sinh học',
        degree: 'Thạc sĩ Di truyền học Thực nghiệm',
        phone: '0977889900',
        gender: 'Nữ',
        dob: '1995-01-22',
        bio: 'Tốt nghiệp xuất sắc ĐH Sư phạm Hà Nội, nộp hồ sơ xin giảng dạy bộ môn Sinh học.',
    },
    {
        name: 'Thầy Lương Gia Bảo (Chờ duyệt)',
        email: 'bao.luong@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
        subject: 'Toán học',
        degree: 'Thạc sĩ Toán Ứng dụng (ĐH Khoa học Tự nhiên)',
        phone: '0914455667',
        gender: 'Nam',
        dob: '1993-11-05',
        bio: 'Hồ sơ xin thỉnh giảng Toán Giải tích và Hình học không gian lớp 11-12.',
    },
    {
        name: 'Cô Mai Thùy Dung (Chờ duyệt)',
        email: 'dung.mai@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
        subject: 'Ngữ văn',
        degree: 'Cử nhân Sư phạm Ngữ văn',
        phone: '0925566778',
        gender: 'Nữ',
        dob: '1996-03-12',
        bio: 'Giáo viên trẻ năng động nộp hồ sơ giảng dạy Văn học hiện đại và kỹ năng nghị luận xã hội.',
    },
    {
        name: 'Thầy Trịnh Tuấn Anh (Chờ duyệt)',
        email: 'anh.trinh@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.PENDING,
        subject: 'Tin học',
        degree: 'Kỹ sư Công nghệ Thông tin (ĐH Bách Khoa)',
        phone: '0936677889',
        gender: 'Nam',
        dob: '1994-09-28',
        bio: 'Ứng tuyển giáo viên phụ trách phòng thực hành Tin học và CLB Robotics sáng tạo trẻ.',
    },

    // ==========================================
    // 4. GIÁO VIÊN - TRẠNG THÁI: LOCKED (ĐANG KHÓA / TẠM DỪNG)
    // ==========================================
    {
        name: 'Thầy Đỗ Minh Tuấn (Tạm khóa)',
        email: 'tuan.do@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.LOCKED,
        subject: 'Toán học',
        degree: 'Cử nhân Sư phạm Toán',
        phone: '0901234888',
        gender: 'Nam',
        dob: '1984-06-15',
        bio: 'Tài khoản tạm khóa do giáo viên nghỉ phép dài hạn đi nghiên cứu sinh tại nước ngoài.',
    },
    {
        name: 'Cô Trần Thúy Ngân (Tạm khóa)',
        email: 'ngan.tran@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.LOCKED,
        subject: 'Tiếng Anh',
        degree: 'Cử nhân Ngôn ngữ Anh',
        phone: '0901234777',
        gender: 'Nữ',
        dob: '1993-09-09',
        bio: 'Tài khoản đang bị tạm khóa để xác minh bảo mật sau khi phát hiện đăng nhập từ địa chỉ IP lạ.',
    },
    {
        name: 'Thầy Ngô Đức Huy (Tạm khóa)',
        email: 'huy.ngo@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.LOCKED,
        subject: 'Hóa học',
        degree: 'Thạc sĩ Hóa học Hữu cơ',
        phone: '0901234666',
        gender: 'Nam',
        dob: '1986-12-01',
        bio: 'Hết hạn hợp đồng thỉnh giảng học kỳ 1, tạm đóng quyền truy cập chờ ký phụ lục.',
    },
    {
        name: 'Cô Dương Ánh Tuyết (Tạm khóa)',
        email: 'tuyet.duong@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.LOCKED,
        subject: 'Vật lý',
        degree: 'Cử nhân Sư phạm Vật lý',
        phone: '0901234555',
        gender: 'Nữ',
        dob: '1991-03-31',
        bio: 'Tài khoản bị tạm khóa do vi phạm chính sách chia sẻ tài nguyên chưa được phê duyệt.',
    },
    {
        name: 'Cô Võ Ngọc Ánh (Tạm khóa)',
        email: 'anh.vo@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.LOCKED,
        subject: 'Ngữ văn',
        degree: 'Cử nhân Sư phạm Văn',
        phone: '0901234444',
        gender: 'Nữ',
        dob: '1987-02-14',
        bio: 'Tạm khóa theo yêu cầu cá nhân để chuyển công tác và biệt phái ngắn hạn tại cơ sở khác.',
    },
    {
        name: 'Thầy Đoàn Thế Vinh (Tạm khóa)',
        email: 'vinh.doan@teacher.edu.vn',
        role: UserRole.TEACHER,
        status: UserStatus.LOCKED,
        subject: 'Tin học',
        degree: 'Kỹ sư Hệ thống Thông tin',
        phone: '0901234333',
        gender: 'Nam',
        dob: '1990-10-03',
        bio: 'Tài khoản đang tạm ngưng do nghỉ phép dài hạn và tạm hoãn giảng dạy học kỳ này.',
    },

    // ==========================================
    // 5. HỌC SINH - TRẠNG THÁI: ACTIVE
    // ==========================================
    {
        name: 'Nguyễn Minh Khôi',
        email: 'student@gmail.com',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        gender: 'Nam',
        dob: '2007-05-12',
        phone: '0905123456',
        parentPhone: '0912345000',
        xp: 420,
        level: 4,
        streak: 5,
        bio: 'Học sinh lớp 12 Sinh, đam mê môn Khoa học tự nhiên và Lập trình.'
    },
    {
        name: 'Trần Linh Chi',
        email: 'chi.tran@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        gender: 'Nữ',
        dob: '2007-06-22',
        phone: '0901111002',
        parentPhone: '0912345002',
        xp: 580,
        level: 5,
        streak: 8,
    },
    {
        name: 'Nguyễn Hoàng Nam',
        email: 'nam.nguyen@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        gender: 'Nam',
        dob: '2007-03-15',
        phone: '0901111001',
        parentPhone: '0912345001',
        xp: 510,
        level: 5,
        streak: 6,
    },
    {
        name: 'Võ Minh Anh',
        email: 'anh.vo@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        gender: 'Nữ',
        dob: '2007-11-08',
        phone: '0901111003',
        parentPhone: '0912345003',
        xp: 460,
        level: 4,
        streak: 4,
    },
    {
        name: 'Lê Quốc Hùng',
        email: 'hung.le@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        gender: 'Nam',
        dob: '2007-01-30',
        phone: '0901111004',
        parentPhone: '0912345004',
        xp: 390,
        level: 3,
        streak: 3,
    },

    {
        name: 'Lý Gia Hưng',
        email: 'hung.ly@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        gender: 'Nam',
        dob: '2007-08-20',
        phone: '0908881111',
        parentPhone: '0919991111',
        xp: 120,
        level: 2,
        streak: 1,
        bio: 'Học sinh lớp 12, thành viên mới tham gia hệ thống.',
    },
    {
        name: 'Trương Ngọc Ánh',
        email: 'anh.truong@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        gender: 'Nữ',
        dob: '2007-10-15',
        phone: '0908882222',
        parentPhone: '0919992222',
        xp: 210,
        level: 3,
        streak: 2,
    },
    {
        name: 'Võ Thái Sơn',
        email: 'son.vo@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        gender: 'Nam',
        dob: '2007-04-12',
        phone: '0908883333',
        parentPhone: '0919993333',
        xp: 180,
        level: 2,
        streak: 3,
    },

    // ==========================================
    // 7. HỌC SINH - TRẠNG THÁI: LOCKED (ĐANG KHÓA)
    // ==========================================
    {
        name: 'Hoàng Tuấn Kiệt (Tạm khóa)',
        email: 'kiet.hoang@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.LOCKED,
        gender: 'Nam',
        dob: '2007-02-14',
        phone: '0907771111',
        parentPhone: '0918881111',
        xp: 150,
        level: 2,
        streak: 0,
        bio: 'Tạm khóa tài khoản do spam bình luận trên bảng tin lớp học.',
    },
    {
        name: 'Lê Hải Đăng (Tạm khóa)',
        email: 'dang.le@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.LOCKED,
        gender: 'Nam',
        dob: '2007-07-25',
        phone: '0907772222',
        parentPhone: '0918882222',
        xp: 80,
        level: 1,
        streak: 0,
        bio: 'Tạm khóa theo yêu cầu của phụ huynh học sinh.',
    },
    {
        name: 'Phạm Thùy Linh (Tạm khóa)',
        email: 'linh.pham@student.edu.vn',
        role: UserRole.STUDENT,
        status: UserStatus.LOCKED,
        gender: 'Nữ',
        dob: '2007-09-30',
        phone: '0907773333',
        parentPhone: '0918883333',
        xp: 220,
        level: 2,
        streak: 0,
        bio: 'Tạm dừng hoạt động chờ chuyển sang lớp chuyên.',
    }
];

export const seedUsersDemo = async () => {
    try {
        console.log('🔄 Đang kết nối MongoDB...');
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Đã kết nối MongoDB thành công.');

        const salt = await bcrypt.genSalt(10);
        const pass123 = await bcrypt.hash('123456', salt);
        const passAdmin = await bcrypt.hash('admin123', salt);

        console.log(`\n👥 Bắt đầu đồng bộ ${DEMO_USERS.length} tài khoản người dùng mẫu...`);

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of DEMO_USERS) {
            const isUserAdmin = item.role === UserRole.ADMIN;
            const passwordHash = isUserAdmin ? passAdmin : pass123;

            const existing = await UserModel.findOne({ email: item.email.toLowerCase() });

            if (existing) {
                // Cập nhật thông tin và trạng thái
                existing.name = item.name;
                existing.role = item.role;
                existing.status = item.status;
                existing.subject = item.subject || existing.subject || '';
                existing.degree = item.degree || existing.degree || '';
                existing.phone = item.phone || existing.phone || '';
                existing.parentPhone = item.parentPhone || existing.parentPhone || '';
                existing.gender = item.gender || existing.gender || '';
                existing.dob = item.dob || existing.dob || '';
                existing.bio = item.bio || existing.bio || '';
                existing.isEmailVerified = true;
                await existing.save();
                updatedCount++;
            } else {
                // Tạo mới
                await UserModel.create({
                    name: item.name,
                    email: item.email.toLowerCase(),
                    passwordHash,
                    role: item.role,
                    status: item.status,
                    subject: item.subject || '',
                    degree: item.degree || '',
                    phone: item.phone || '',
                    parentPhone: item.parentPhone || '',
                    gender: item.gender || 'Nam',
                    dob: item.dob || '',
                    bio: item.bio || '',
                    xp: item.xp || 0,
                    level: item.level || 1,
                    streak: item.streak || 0,
                    school: 'THPT Chuyên Quốc Gia',
                    gradeLevel: '12',
                    isEmailVerified: true,
                    isGoogleAccount: false
                });
                createdCount++;
            }
        }

        console.log(`\n🎉 HOÀN TẤT ĐỒNG BỘ:`);
        console.log(`  - Tạo mới: ${createdCount} tài khoản`);
        console.log(`  - Cập nhật: ${updatedCount} tài khoản`);

        // Thống kê phân bổ theo vai trò và trạng thái
        const allUsers = await UserModel.find({}, 'role status subject name');
        const stats: Record<string, number> = {};
        for (const u of allUsers) {
            const key = `${u.role.toUpperCase()} - ${u.status}`;
            stats[key] = (stats[key] || 0) + 1;
        }

        console.log('\n📊 BẢNG PHÂN BỔ TRẠNG THÁI NGƯỜI DÙNG HIỆN TẠI TRONG DB:');
        console.table(stats);

        await mongoose.disconnect();
        console.log('🔌 Đã đóng kết nối MongoDB an toàn.\n');
    } catch (error) {
        console.error('❌ Lỗi trong quá trình seed users demo:', error);
        process.exit(1);
    }
};

// Chạy trực tiếp nếu file được gọi bằng ts-node/node
if (require.main === module) {
    seedUsersDemo();
}
