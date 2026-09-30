/**
 * ============================================================================
 * TÊN FILE: seedBankItems.ts
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/seedBankItems.ts
 * MỤC ĐÍCH:
 *   Khởi tạo bộ dữ liệu mẫu Ngân hàng Đề thi & Tài nguyên (Question & Resource Bank).
 *   - Phân bổ đầy đủ các môn học: Toán, Lý, Hóa, Sinh, Tin, Anh, Văn, Sử.
 *   - Đầy đủ các loại: Trắc nghiệm (quiz), Tự luận / Tài liệu (document).
 *   - Đầy đủ quyền hạn: Dùng chung (CENTER_SHARED), Cá nhân (PRIVATE).
 *   - Sử dụng cơ chế Upsert theo tiêu đề (title) để không làm trùng lặp.
 * ============================================================================
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { BankItemModel, BankItemType, BankItemSharingStatus } from '../models/BankItem';
import { UserRole } from '../constants/enums';

dotenv.config();

const BANK_ITEMS_DATA = [
    // ==========================================
    // 1. TOÁN HỌC
    // ==========================================
    {
        title: 'Đề khảo sát: Khảo sát & Vẽ đồ thị hàm số 12',
        description: 'Bộ câu hỏi trắc nghiệm trọng tâm về tính đơn điệu, cực trị, tiệm cận và đồ thị hàm số bậc 3, bậc 4 trùng phương.',
        subject: 'Toán học',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        durationMinutes: 45,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'teacher2@gmail.com',
        quizQuestions: [
            {
                questionText: 'Hàm số y = x^3 - 3x + 2 đồng biến trên khoảng nào dưới đây?',
                options: ['(-∞; -1) và (1; +∞)', '(-1; 1)', '(-∞; 1)', '(0; 2)'],
                correctOptionIndex: 0,
                points: 2.5,
                tags: ['Hàm số', 'Đơn điệu'],
                explanation: 'y\' = 3x^2 - 3. y\' > 0 khi x < -1 hoặc x > 1.'
            },
            {
                questionText: 'Điểm cực đại của đồ thị hàm số y = -x^3 + 3x^2 - 4 là:',
                options: ['(2; 0)', '(0; -4)', '(-2; 16)', '(1; -2)'],
                correctOptionIndex: 0,
                points: 2.5,
                tags: ['Cực trị'],
                explanation: 'y\' = -3x^2 + 6x = 0 <=> x=0 hoặc x=2. y\'\'(2) = -6 < 0 => cực đại tại x=2, y(2)=0.'
            },
            {
                questionText: 'Đồ thị hàm số y = (2x + 1)/(x - 1) có tiệm cận ngang là đường thẳng:',
                options: ['y = 2', 'x = 1', 'y = 1/2', 'y = -1'],
                correctOptionIndex: 0,
                points: 2.5,
                tags: ['Tiệm cận'],
                explanation: 'lim (x->±∞) (2x+1)/(x-1) = 2 => TCN y = 2.'
            },
            {
                questionText: 'Tìm giá trị lớn nhất của hàm số y = x^4 - 2x^2 + 3 trên đoạn [0; 2]:',
                options: ['11', '3', '2', '7'],
                correctOptionIndex: 0,
                points: 2.5,
                tags: ['GTLN-GTNN'],
                explanation: 'y(0)=3, y(1)=2, y(2)=11. Giá trị lớn nhất là 11 tại x=2.'
            }
        ]
    },
    {
        title: 'Bộ đề rèn luyện: Hình học không gian Oxyz & Mặt cầu',
        description: 'Đề luyện tập chuyên đề phương trình mặt cầu, mặt phẳng và tọa độ không gian.',
        subject: 'Toán học',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.PRIVATE,
        maxScore: 10,
        durationMinutes: 30,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'teacher2@gmail.com',
        quizQuestions: [
            {
                questionText: 'Trong không gian Oxyz, mặt cầu (S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16 có bán kính là:',
                options: ['R = 4', 'R = 16', 'R = 8', 'R = 2'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Oxyz', 'Mặt cầu'],
                explanation: 'R^2 = 16 => R = 4.'
            },
            {
                questionText: 'Vectơ pháp tuyến của mặt phẳng (P): 2x - 3y + z - 5 = 0 là:',
                options: ['n = (2; -3; 1)', 'n = (2; 3; 1)', 'n = (-2; 3; 1)', 'n = (2; -3; -5)'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Oxyz', 'Mặt phẳng'],
                explanation: 'Vectơ pháp tuyến là các hệ số trước x, y, z: (2; -3; 1).'
            }
        ]
    },
    {
        title: 'Đề cương & Bài tập tự luận: Tích phân & Ứng dụng thực tế',
        description: 'Tài liệu hướng dẫn phương pháp tính tích phân từng phần, đổi biến số và ứng dụng tính diện tích, thể tích khối tròn xoay.',
        subject: 'Toán học',
        type: BankItemType.DOCUMENT,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        teacherEmail: 'linh.chu@teacher.edu.vn',
        fileUrl: 'https://ddsjbzyhwlretgcsmikf.supabase.co/storage/v1/object/public/materials/De_cuong_Tich_phan_12.pdf'
    },

    // ==========================================
    // 2. TIẾNG ANH
    // ==========================================
    {
        title: 'IELTS Reading Test: Climate Change & Renewable Energy',
        description: 'Bài kiểm tra kỹ năng đọc hiểu chuyên sâu với chủ đề biến đổi khí hậu và năng lượng tái tạo.',
        subject: 'Tiếng Anh',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        durationMinutes: 20,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'teacher3@gmail.com',
        quizQuestions: [
            {
                questionText: 'What is considered the primary cause of global warming in recent decades?',
                options: ['Greenhouse gas emissions', 'Volcanic eruptions', 'Solar radiation changes', 'Ocean currents'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['IELTS Reading', 'Environment'],
                explanation: 'Scientific consensus points to human-driven greenhouse gas emissions.'
            },
            {
                questionText: 'Which of the following is a renewable energy source?',
                options: ['Solar power', 'Natural gas', 'Coal', 'Petroleum'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Vocabulary', 'Science'],
                explanation: 'Solar power is derived directly from sunlight and naturally replenishes.'
            }
        ]
    },
    {
        title: 'Grammar Mastery: Mệnh đề quan hệ & Câu điều kiện nâng cao',
        description: 'Bộ câu hỏi trắc nghiệm ngữ pháp tiếng Anh nâng cao phục vụ ôn thi THPT Quốc gia.',
        subject: 'Tiếng Anh',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.PRIVATE,
        maxScore: 10,
        durationMinutes: 15,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'dang.tran@teacher.edu.vn',
        quizQuestions: [
            {
                questionText: 'If I _______ earlier, I would not have missed the bus.',
                options: ['had left', 'left', 'have left', 'would leave'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Conditional Sentences', 'Type 3'],
                explanation: 'Third conditional for past unreal situations: If + had + V3/ed.'
            },
            {
                questionText: 'The woman _______ daughter won the national prize is a famous doctor.',
                options: ['whose', 'whom', 'who', 'which'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Relative Clause'],
                explanation: '"Whose" indicates possession ("whose daughter").'
            }
        ]
    },
    {
        title: 'Writing Task 2: Tổng hợp đề bài & Bài mẫu chuẩn Band 7.5+',
        description: 'Tài liệu hướng dẫn cấu trúc viết luận IELTS Task 2, từ vựng theo chủ đề Education, Technology và Society.',
        subject: 'Tiếng Anh',
        type: BankItemType.DOCUMENT,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        teacherEmail: 'teacher3@gmail.com',
        fileUrl: 'https://ddsjbzyhwlretgcsmikf.supabase.co/storage/v1/object/public/materials/IELTS_Writing_Task2_Band75.pdf'
    },

    // ==========================================
    // 3. SINH HỌC
    // ==========================================
    {
        title: 'Đề thi trắc nghiệm: Di truyền học phân tử (10 câu chuẩn)',
        description: 'Đề thi kiểm tra kiến thức về ADN, ARN, phiên mã, dịch mã và điều hòa hoạt động gen.',
        subject: 'Sinh học',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        durationMinutes: 15,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'teacher@gmail.com',
        quizQuestions: [
            {
                questionText: 'Quá trình nhân đôi ADN diễn ra theo nguyên tắc nào sau đây?',
                options: ['Bổ sung và bán bảo tồn', 'Bảo tồn và gián đoạn', 'Một chiều và liên tục', 'Tự do và ngẫu nhiên'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['ADN', 'Nhân đôi ADN'],
                explanation: 'Quá trình nhân đôi ADN luôn tuân thủ nguyên tắc bổ sung (A-T, G-X) và nguyên tắc bán bảo tồn.'
            },
            {
                questionText: 'Loại ARN nào sau đây mang bộ ba đối mã (anticodon)?',
                options: ['tARN', 'mARN', 'rARN', 'snARN'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['ARN', 'Dịch mã'],
                explanation: 'tARN (ARN vận chuyển) mang bộ ba đối mã tương ứng với codon trên mARN.'
            }
        ]
    },
    {
        title: 'Bài tập tự luận: Cơ chế nhân đôi ADN và Đột biến gen',
        description: 'Đề bài tập tự luận rèn luyện kỹ năng tính toán số lượng nuclêôtit, liên kết hiđrô và chiều dài gen.',
        subject: 'Sinh học',
        type: BankItemType.DOCUMENT,
        sharingStatus: BankItemSharingStatus.PRIVATE,
        maxScore: 10,
        teacherEmail: 'teacher@gmail.com',
        fileUrl: 'https://ddsjbzyhwlretgcsmikf.supabase.co/storage/v1/object/public/materials/Bai_tap_Tu_luan_ADN_Dot_bien.pdf'
    },

    // ==========================================
    // 4. VẬT LÝ
    // ==========================================
    {
        title: 'Kiểm tra 15 phút: Dao động điều hòa & Con lắc lò xo',
        description: 'Đề kiểm tra nhanh các công thức tính chu kỳ, tần số, năng lượng dao động và phương trình li độ.',
        subject: 'Vật lý',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        durationMinutes: 15,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'bao.pham@teacher.edu.vn',
        quizQuestions: [
            {
                questionText: 'Chu kỳ dao động của con lắc lò xo có khối lượng m và độ cứng k được tính theo công thức:',
                options: ['T = 2π√(m/k)', 'T = 2π√(k/m)', 'T = (1/2π)√(m/k)', 'T = 2π√(g/l)'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Con lắc lò xo', 'Chu kỳ'],
                explanation: 'Công thức tính chu kỳ con lắc lò xo là T = 2π√(m/k).'
            },
            {
                questionText: 'Trong dao động điều hòa, gia tốc biến thiên:',
                options: ['Ngược pha so với li độ', 'Cùng pha so với li độ', 'Sớm pha π/2 so với li độ', 'Trễ pha π/2 so với vận tốc'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Gia tốc', 'Li độ'],
                explanation: 'Gia tốc a = -ω^2.x nên gia tốc luôn ngược pha so với li độ.'
            }
        ]
    },
    {
        title: 'Bộ đề nâng cao: Sóng ánh sáng & Giao thoa ánh sáng',
        description: 'Các bài toán giao thoa Y-âng với ánh sáng đơn sắc, đa sắc và ánh sáng trắng.',
        subject: 'Vật lý',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.PRIVATE,
        maxScore: 10,
        durationMinutes: 25,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'bao.pham@teacher.edu.vn',
        quizQuestions: [
            {
                questionText: 'Khoảng vân i trong thí nghiệm giao thoa khe Y-âng được xác định bởi công thức:',
                options: ['i = λD/a', 'i = λa/D', 'i = aD/λ', 'i = λ/(aD)'],
                correctOptionIndex: 0,
                points: 10,
                tags: ['Sóng ánh sáng', 'Giao thoa'],
                explanation: 'Khoảng vân i = λD/a.'
            }
        ]
    },

    // ==========================================
    // 5. HÓA HỌC
    // ==========================================
    {
        title: 'Trắc nghiệm Hóa học 12: Este - Lipit & Chất béo',
        description: 'Hệ thống câu hỏi lý thuyết đồng phân, danh pháp và phản ứng xà phòng hóa chất béo.',
        subject: 'Hóa học',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        durationMinutes: 20,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'yen.dang@teacher.edu.vn',
        quizQuestions: [
            {
                questionText: 'Este etyl axetat có công thức cấu tạo thu gọn là:',
                options: ['CH3COOC2H5', 'C2H5COOCH3', 'HCOOC2H5', 'CH3COOCH3'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Este', 'Danh pháp'],
                explanation: 'Etyl axetat gồm gốc axetat (CH3COO-) và gốc etyl (-C2H5).'
            },
            {
                questionText: 'Chất béo là trieste của axit béo với hợp chất nào sau đây?',
                options: ['Glixerol', 'Etylen glicol', 'Etanol', 'Metanol'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Lipit', 'Chất béo'],
                explanation: 'Chất béo (triglixerit) là trieste của glixerol với các axit béo.'
            }
        ]
    },
    {
        title: 'Đề cương bài tập tự luận: Hóa học Hữu cơ & Vô cơ 12',
        description: 'Tài liệu tuyển tập các dạng bài toán CO2 tác dụng với dung dịch kiềm và bài toán thủy phân peptit.',
        subject: 'Hóa học',
        type: BankItemType.DOCUMENT,
        sharingStatus: BankItemSharingStatus.PRIVATE,
        maxScore: 10,
        teacherEmail: 'yen.dang@teacher.edu.vn',
        fileUrl: 'https://ddsjbzyhwlretgcsmikf.supabase.co/storage/v1/object/public/materials/Hoa_Hoc_12_De_cuong.pdf'
    },

    // ==========================================
    // 6. TIN HỌC
    // ==========================================
    {
        title: 'Đề trắc nghiệm: Cấu trúc Dữ liệu & Giải thuật Python',
        description: 'Kiểm tra hiểu biết về danh sách liên kết, mảng, thuật toán sắp xếp (QuickSort, MergeSort) và độ phức tạp tính toán.',
        subject: 'Tin học',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        durationMinutes: 20,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'trong.vu@teacher.edu.vn',
        quizQuestions: [
            {
                questionText: 'Độ phức tạp thời gian trung bình của thuật toán QuickSort là:',
                options: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(1)'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Thuật toán', 'Độ phức tạp'],
                explanation: 'QuickSort có độ phức tạp trung bình là O(n log n).'
            },
            {
                questionText: 'Cấu trúc dữ liệu nào hoạt động theo nguyên tắc LIFO (Last In First Out)?',
                options: ['Stack (Ngăn xếp)', 'Queue (Hàng đợi)', 'Array (Mảng)', 'Linked List (Danh sách liên kết)'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Cấu trúc dữ liệu'],
                explanation: 'Stack hoạt động theo cơ chế vào sau ra trước (LIFO).'
            }
        ]
    },
    {
        title: 'Bài tập lớn: Thiết kế hệ thống Cơ sở dữ liệu Quản lý trường học',
        description: 'Yêu cầu phân tích ERD, chuẩn hóa lược đồ quan hệ 3NF và viết các câu lệnh SQL nâng cao.',
        subject: 'Tin học',
        type: BankItemType.DOCUMENT,
        sharingStatus: BankItemSharingStatus.PRIVATE,
        maxScore: 10,
        teacherEmail: 'trong.vu@teacher.edu.vn',
        fileUrl: 'https://ddsjbzyhwlretgcsmikf.supabase.co/storage/v1/object/public/materials/Bai_tap_lon_SQL_Python.pdf'
    },

    // ==========================================
    // 7. NGỮ VĂN
    // ==========================================
    {
        title: 'Đề kiểm tra Đọc hiểu & Nghị luận xã hội: Ý chí và Khát vọng',
        description: 'Ngữ liệu trích dẫn phong phú kèm hệ thống 4 câu hỏi đọc hiểu và viết đoạn văn 200 chữ.',
        subject: 'Ngữ văn',
        type: BankItemType.DOCUMENT,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        teacherEmail: 'thao.bui@teacher.edu.vn',
        fileUrl: 'https://ddsjbzyhwlretgcsmikf.supabase.co/storage/v1/object/public/materials/Ngu_van_12_Doc_hieu.pdf'
    },
    {
        title: 'Trắc nghiệm nhanh: Kiến thức Tiếng Việt & Phong cách Ngôn ngữ',
        description: 'Bộ câu hỏi trắc nghiệm kiểm tra các biện pháp tu từ, phong cách chức năng ngôn ngữ và liên kết câu.',
        subject: 'Ngữ văn',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.PRIVATE,
        maxScore: 10,
        durationMinutes: 15,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'thao.bui@teacher.edu.vn',
        quizQuestions: [
            {
                questionText: 'Biện pháp tu từ nào được sử dụng trong câu "Bàn tay ta làm nên tất cả / Có sức người sỏi đá cũng thành cơm"?',
                options: ['Hoán dụ', 'Ẩn dụ', 'So sánh', 'Nhân hóa'],
                correctOptionIndex: 0,
                points: 10,
                tags: ['Tiếng Việt', 'Biện pháp tu từ'],
                explanation: '"Bàn tay" lấy bộ phận chỉ toàn thể (sức lao động con người) là phép hoán dụ.'
            }
        ]
    },

    // ==========================================
    // 8. LỊCH SỬ
    // ==========================================
    {
        title: 'Đề thi trắc nghiệm: Lịch sử Việt Nam từ 1945 đến 1975',
        description: 'Kiểm tra các mốc son chói lọi trong hai cuộc kháng chiến chống Pháp và chống Mỹ cứu nước.',
        subject: 'Lịch sử',
        type: BankItemType.QUIZ,
        sharingStatus: BankItemSharingStatus.CENTER_SHARED,
        maxScore: 10,
        durationMinutes: 20,
        shuffleQuestions: true,
        shuffleOptions: true,
        teacherEmail: 'huy.ta@teacher.edu.vn',
        quizQuestions: [
            {
                questionText: 'Chiến dịch Điện Biên Phủ toàn thắng vào ngày tháng năm nào?',
                options: ['07/05/1954', '02/09/1945', '30/04/1975', '19/12/1946'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Lịch sử 12', 'Chiến dịch Điện Biên Phủ'],
                explanation: 'Chiều ngày 07/05/1954, lá cờ Quyết chiến Quyết thắng tung bay trên nóc hầm Đờ Cát.'
            },
            {
                questionText: 'Hiệp định Pari về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam được ký kết vào năm:',
                options: ['1973', '1954', '1975', '1968'],
                correctOptionIndex: 0,
                points: 5,
                tags: ['Hiệp định Pari'],
                explanation: 'Hiệp định Pari được ký kết chính thức vào ngày 27/01/1973.'
            }
        ]
    },
    {
        title: 'Chuyên đề tự luận: Nghệ thuật Quân sự trong Chiến dịch Hồ Chí Minh',
        description: 'Tài liệu chuyên khảo phân tích nghệ thuật chớp thời cơ và tiến công thần tốc trong mùa Xuân 1975.',
        subject: 'Lịch sử',
        type: BankItemType.DOCUMENT,
        sharingStatus: BankItemSharingStatus.PRIVATE,
        teacherEmail: 'huy.ta@teacher.edu.vn',
        maxScore: 10,
        fileUrl: 'https://ddsjbzyhwlretgcsmikf.supabase.co/storage/v1/object/public/materials/Lich_su_1975.pdf'
    }
];

const seedBankItems = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('🔄 Đang kết nối tới Database MongoDB...');
        console.log('✅ Đã kết nối MongoDB thành công.');

        let defaultTeacher = await UserModel.findOne({ role: UserRole.TEACHER });
        let adminUser = await UserModel.findOne({ role: UserRole.ADMIN });

        if (!defaultTeacher) {
            console.error('❌ Cần ít nhất 1 Giáo viên trong DB. Vui lòng chạy "npm run seed:users" trước!');
            process.exit(1);
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of BANK_ITEMS_DATA) {
            let teacher = await UserModel.findOne({ email: item.teacherEmail.toLowerCase() });
            if (!teacher) {
                teacher = defaultTeacher;
            }

            const authorId = item.sharingStatus === BankItemSharingStatus.CENTER_SHARED && adminUser 
                ? adminUser._id 
                : teacher._id;

            const payload: any = {
                title: item.title,
                description: item.description,
                subject: item.subject,
                type: item.type,
                sharingStatus: item.sharingStatus,
                maxScore: item.maxScore,
                teacherId: authorId,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 20 + 1) * 24 * 60 * 60 * 1000)
            };

            if (item.durationMinutes !== undefined) payload.durationMinutes = item.durationMinutes;
            if (item.shuffleQuestions !== undefined) payload.shuffleQuestions = item.shuffleQuestions;
            if (item.shuffleOptions !== undefined) payload.shuffleOptions = item.shuffleOptions;
            if (item.quizQuestions !== undefined) payload.quizQuestions = item.quizQuestions;
            if (item.fileUrl !== undefined) payload.fileUrl = item.fileUrl;

            const existing = await BankItemModel.findOne({ title: item.title });

            if (existing) {
                Object.assign(existing, payload);
                await existing.save();
                updatedCount++;
            } else {
                await BankItemModel.create(payload);
                createdCount++;
            }
        }

        console.log(`\n🎉 HOÀN TẤT ĐỒNG BỘ NGÂN HÀNG ĐỀ THI & TÀI NGUYÊN:`);
        console.log(`  - Tạo mới: ${createdCount} tài nguyên`);
        console.log(`  - Cập nhật: ${updatedCount} tài nguyên`);

        const allItems = await BankItemModel.find();
        console.log(`\n📊 TỔNG CỘNG TRONG DB: ${allItems.length} TÀI NGUYÊN`);
        const stats: Record<string, number> = {};
        for (const it of allItems) {
            const key = `${it.subject || 'Chung'} - [${it.type.toUpperCase()}] - [${it.sharingStatus}]`;
            stats[key] = (stats[key] || 0) + 1;
        }
        console.table(stats);

        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối an toàn.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi Seed Bank Items:', error);
        process.exit(1);
    }
};

seedBankItems();
