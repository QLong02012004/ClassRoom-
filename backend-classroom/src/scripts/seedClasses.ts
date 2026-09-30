/**
 * ============================================================================
 * TÊN FILE: seedClasses.ts
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/seedClasses.ts
 * MỤC ĐÍCH:
 *   Khởi tạo và làm phong phú danh sách Lớp học (Classrooms) cho trang Quản lý lớp học Admin.
 *   - Phân bổ đầy đủ các bộ môn: Sinh học, Toán học, Tiếng Anh, Vật lý, Hóa học, Tin học, Ngữ văn, Lịch sử.
 *   - Đầy đủ các trạng thái: Đang hoạt động (Active), Chờ duyệt (Pending), Đã khóa (Locked), Đã đóng (Closed).
 *   - Sử dụng Upsert theo mã code lớp học (code) để không làm trùng lặp khi chạy nhiều lần.
 * ============================================================================
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { ClassModel } from '../models/Class';
import { UserRole, ClassStatus } from '../constants/enums';

dotenv.config();

interface IClassSeedItem {
    name: string;
    subject: string;
    code: string;
    teacherEmail: string;
    status: ClassStatus;
    studentCount: number;
    requireApproval?: boolean;
}

const SEED_CLASSES: IClassSeedItem[] = [
    // ==========================================
    // 1. SINH HỌC (ThS. Trần Thị Mai Phương)
    // ==========================================
    {
        name: 'Lớp 12 Sinh - Ôn thi THPT',
        subject: 'Sinh học',
        code: 'BIO12A',
        teacherEmail: 'teacher@gmail.com',
        status: ClassStatus.ACTIVE,
        studentCount: 20
    },
    {
        name: 'Sinh học 10 - Nâng cao',
        subject: 'Sinh học',
        code: 'BIO10B',
        teacherEmail: 'teacher@gmail.com',
        status: ClassStatus.ACTIVE,
        studentCount: 16
    },
    {
        name: 'Bồi dưỡng HSG Sinh 12 (Kỳ 1)',
        subject: 'Sinh học',
        code: 'BIOOLD',
        teacherEmail: 'teacher@gmail.com',
        status: ClassStatus.CLOSED,
        studentCount: 8
    },
    {
        name: 'Di truyền học & CNSH Ứng dụng',
        subject: 'Sinh học',
        code: 'BIOGEN',
        teacherEmail: 'teacher@gmail.com',
        status: ClassStatus.LOCKED,
        studentCount: 12
    },

    // ==========================================
    // 2. TOÁN HỌC (Thầy Lê Hoàng Long & Cô Chu Diệu Linh)
    // ==========================================
    {
        name: 'Toán 12 - Luyện thi Đại học',
        subject: 'Toán học',
        code: 'MATH12',
        teacherEmail: 'teacher2@gmail.com',
        status: ClassStatus.ACTIVE,
        studentCount: 18
    },
    {
        name: 'Toán 11 - Hình học Không gian',
        subject: 'Toán học',
        code: 'MATH11',
        teacherEmail: 'teacher2@gmail.com',
        status: ClassStatus.ACTIVE,
        studentCount: 14
    },
    {
        name: 'Giải tích 12 Nâng cao',
        subject: 'Toán học',
        code: 'MATHAD',
        teacherEmail: 'linh.chu@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 19
    },
    {
        name: 'Toán 10 - Đại số Căn bản',
        subject: 'Toán học',
        code: 'MATH10',
        teacherEmail: 'linh.chu@teacher.edu.vn',
        status: ClassStatus.LOCKED,
        studentCount: 11
    },

    // ==========================================
    // 3. TIẾNG ANH (Cô Nguyễn Hồng Hạnh & Thầy Trần Hải Đăng)
    // ==========================================
    {
        name: 'Tiếng Anh IELTS Chuyên sâu',
        subject: 'Tiếng Anh',
        code: 'ENG101',
        teacherEmail: 'teacher3@gmail.com',
        status: ClassStatus.ACTIVE,
        studentCount: 15
    },
    {
        name: 'Tiếng Anh 10 - Giao tiếp Học thuật',
        subject: 'Tiếng Anh',
        code: 'ENG102',
        teacherEmail: 'teacher3@gmail.com',
        status: ClassStatus.ACTIVE,
        studentCount: 12
    },
    {
        name: 'Luyện thi THPTQG Môn Tiếng Anh',
        subject: 'Tiếng Anh',
        code: 'ENG12A',
        teacherEmail: 'dang.tran@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 22
    },
    {
        name: 'Tiếng Anh B1 & B2 Chuẩn Châu Âu',
        subject: 'Tiếng Anh',
        code: 'ENGB12',
        teacherEmail: 'dang.tran@teacher.edu.vn',
        status: ClassStatus.PENDING,
        studentCount: 0
    },

    // ==========================================
    // 4. VẬT LÝ (Thầy Phạm Quốc Bảo)
    // ==========================================
    {
        name: 'Vật lý 12 - Dao động & Sóng cơ',
        subject: 'Vật lý',
        code: 'PHY12A',
        teacherEmail: 'bao.pham@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 17
    },
    {
        name: 'Bồi dưỡng HSG Vật lý 11',
        subject: 'Vật lý',
        code: 'PHY11B',
        teacherEmail: 'bao.pham@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 10
    },
    {
        name: 'Vật lý 10 - Cơ học Cổ điển',
        subject: 'Vật lý',
        code: 'PHY10C',
        teacherEmail: 'bao.pham@teacher.edu.vn',
        status: ClassStatus.CLOSED,
        studentCount: 13
    },

    // ==========================================
    // 5. HÓA HỌC (Cô Đặng Hải Yến)
    // ==========================================
    {
        name: 'Hóa học 12 - Este & Lipit',
        subject: 'Hóa học',
        code: 'CHEM12',
        teacherEmail: 'yen.dang@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 19
    },
    {
        name: 'Hóa học 11 - Sự Điện li',
        subject: 'Hóa học',
        code: 'CHEM11',
        teacherEmail: 'yen.dang@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 15
    },
    {
        name: 'Thí nghiệm Hóa học 10',
        subject: 'Hóa học',
        code: 'CHEM10',
        teacherEmail: 'yen.dang@teacher.edu.vn',
        status: ClassStatus.LOCKED,
        studentCount: 9
    },

    // ==========================================
    // 6. TIN HỌC (Thầy Vũ Đình Trọng)
    // ==========================================
    {
        name: 'Lập trình Python & Thuật toán',
        subject: 'Tin học',
        code: 'IT101A',
        teacherEmail: 'trong.vu@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 16
    },
    {
        name: 'Tin học 12 - Cơ sở Dữ liệu & SQL',
        subject: 'Tin học',
        code: 'IT120B',
        teacherEmail: 'trong.vu@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 14
    },
    {
        name: 'CLB Robotics & IoT Sáng tạo',
        subject: 'Tin học',
        code: 'ITROBO',
        teacherEmail: 'trong.vu@teacher.edu.vn',
        status: ClassStatus.PENDING,
        studentCount: 0
    },

    // ==========================================
    // 7. NGỮ VĂN (Cô Bùi Thanh Thảo)
    // ==========================================
    {
        name: 'Ngữ văn 12 - Luyện thi THPT',
        subject: 'Ngữ văn',
        code: 'LIT12A',
        teacherEmail: 'thao.bui@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 21
    },
    {
        name: 'Văn học Dân gian & Hiện đại 10',
        subject: 'Ngữ văn',
        code: 'LIT10B',
        teacherEmail: 'thao.bui@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 18
    },

    // ==========================================
    // 8. LỊCH SỬ (Thầy Tạ Quang Huy)
    // ==========================================
    {
        name: 'Lịch sử 12 - Thế giới Hiện đại',
        subject: 'Lịch sử',
        code: 'HIS12A',
        teacherEmail: 'huy.ta@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 15
    },
    {
        name: 'Chuyên đề Lịch sử Kháng chiến',
        subject: 'Lịch sử',
        code: 'HIS11B',
        teacherEmail: 'huy.ta@teacher.edu.vn',
        status: ClassStatus.ACTIVE,
        studentCount: 13
    }
];

const seedClasses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('🔄 Đang kết nối tới Database MongoDB...');
        console.log('✅ Đã kết nối MongoDB thành công.');

        // Lấy danh sách học sinh
        const students = await UserModel.find({ role: UserRole.STUDENT });
        const studentIds = students.map(s => s._id);
        console.log(`👨‍🎓 Tìm thấy ${students.length} học sinh để phân bổ vào các lớp.`);

        // Fallback teacher nếu không tìm thấy email tương ứng
        let defaultTeacher = await UserModel.findOne({ role: UserRole.TEACHER });
        if (!defaultTeacher) {
            console.error('❌ Cần ít nhất 1 Giáo viên trong DB. Vui lòng chạy "npm run seed:users" trước!');
            process.exit(1);
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of SEED_CLASSES) {
            // Tìm giáo viên phụ trách theo email
            let teacher = await UserModel.findOne({ email: item.teacherEmail.toLowerCase() });
            if (!teacher) {
                teacher = defaultTeacher;
            }

            // Chọn học sinh cho lớp
            const classStudents = item.studentCount > 0 
                ? studentIds.slice(0, Math.min(item.studentCount, studentIds.length))
                : [];

            const existingClass = await ClassModel.findOne({ code: item.code });

            if (existingClass) {
                existingClass.name = item.name;
                existingClass.subject = item.subject;
                existingClass.teacherId = teacher._id as any;
                existingClass.status = item.status;
                existingClass.students = classStudents as any;
                existingClass.requireApproval = item.requireApproval !== undefined ? item.requireApproval : true;
                await existingClass.save();
                updatedCount++;
            } else {
                await ClassModel.create({
                    name: item.name,
                    subject: item.subject,
                    code: item.code,
                    teacherId: teacher._id,
                    status: item.status,
                    students: classStudents,
                    requireApproval: item.requireApproval !== undefined ? item.requireApproval : true,
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 + 1) * 24 * 60 * 60 * 1000)
                });
                createdCount++;
            }
        }

        console.log(`\n🎉 HOÀN TẤT ĐỒNG BỘ LỚP HỌC:`);
        console.log(`  - Tạo mới: ${createdCount} lớp học`);
        console.log(`  - Cập nhật: ${updatedCount} lớp học`);

        // Thống kê phân bổ theo môn và trạng thái
        const allClasses = await ClassModel.find();
        console.log(`\n📊 TỔNG CỘNG TRONG DB: ${allClasses.length} LỚP HỌC`);
        const stats: Record<string, number> = {};
        for (const c of allClasses) {
            const key = `${c.subject || 'Khác'} - [${c.status}]`;
            stats[key] = (stats[key] || 0) + 1;
        }
        console.table(stats);

        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối an toàn.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi Seed Classes:', error);
        process.exit(1);
    }
};

seedClasses();
