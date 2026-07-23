# Tổng quan Chức năng & Phân quyền Hệ thống (ClassRoom)

Tài liệu này hệ thống hóa toàn bộ các chức năng và logic nghiệp vụ của trang web, được phân chia theo từng nhóm quyền (Role) cụ thể.

## 1. CÁC CHỨC NĂNG CHUNG (Dành cho mọi Role)
Bất kể đăng nhập với vai trò nào, người dùng đều có quyền truy cập vào các chức năng cốt lõi này:
- **Đăng nhập / Đăng ký (`/login`, `/register`)**: Xác thực tài khoản vào hệ thống.
- **Trang chủ (`/dashboard`)**: Bảng điều khiển tổng quan, hiển thị thống kê hoặc thông báo quan trọng.
- **Danh sách Lớp học (`/classrooms`)**: Xem các lớp học mà người dùng đang tham gia hoặc quản lý.
- **Chi tiết Lớp học (`/classrooms/:id`)**: Tuy dùng chung đường dẫn, nhưng giao diện bên trong sẽ được tự động chuyển hướng tùy theo Role:
  - Học sinh: Giao diện học tập, làm bài, tương tác.
  - Giáo viên/Admin: Giao diện quản lý lớp.

---

## 2. VAI TRÒ HỌC SINH (Student)
Vai trò có nhiều tính năng tương tác nhất để phục vụ quá trình học tập:
- **Bài tập (`/assignments` & `/assignments/:id`)**: Xem danh sách bài tập được giao, thời hạn và nộp bài.
- **Kiểm tra & Luyện tập (`/exams/:id` & `/practice`)**: Vào phòng thi trắc nghiệm hoặc làm các bài tập thực hành.
- **Bảng điểm (`/grades`)**: Theo dõi điểm số các bài kiểm tra của bản thân.
- **Tài liệu học tập (`/materials` & `/materials/:id`)**: Kho tài liệu trực tuyến (Video, PDF, Word) cho phép xem trước, tải về, lọc theo môn học và lớp.
- **Trợ lý học tập AI (`/chat`)**: Nhắn tin với Trợ lý ảo (tích hợp Gemini API) để giải đáp thắc mắc, tóm tắt bài giảng.
- **Hồ sơ cá nhân (`/profile`)**: Xem và cập nhật thông tin cá nhân.
- **Thời khóa biểu (`/schedule`)**: Xem lịch học các môn trong tuần.
- **Chuyên cần (`/attendance`)**: Theo dõi số buổi đi học, đi muộn, nghỉ phép.

---

## 3. VAI TRÒ GIÁO VIÊN (Teacher)
Được cung cấp các công cụ để giảng dạy, ra đề và đánh giá:
- **Lịch dạy (`/schedule`)**: Quản lý lịch lên lớp của cá nhân giáo viên.
- **Ngân hàng câu hỏi (`/bank`)**: Quản lý kho câu hỏi trắc nghiệm, tạo câu hỏi thủ công hoặc sử dụng tính năng **Tạo câu hỏi tự động bằng AI (Gemini)** từ file Word (docx).
- **Học sinh trong lớp (`/classrooms/:id/students`)**: Xem danh sách học sinh thuộc lớp mình chủ nhiệm/giảng dạy.
- **Quản lý Lớp học chi tiết (`TeacherClassroomDetail`)**: Giao bài tập, chấm điểm, theo dõi tiến độ học tập của cả lớp.

---

## 4. VAI TRÒ QUẢN TRỊ VIÊN (Admin)
Vai trò có quyền lực cao nhất, tập trung vào việc quản lý vận hành toàn bộ hệ thống:
- **Quản lý Người dùng (`/admin/users`)**: Thêm, sửa, xóa, cấp quyền cho Học sinh và Giáo viên.
- **Quản lý toàn bộ Lớp học (`/admin/classrooms`)**: Tạo lớp học mới, phân công giáo viên vào lớp, giám sát hoạt động.
- **Cài đặt hệ thống (`/admin/settings`)**: Tùy chỉnh các thông số cấu hình chung của nền tảng ClassRoom.
- **Quản lý chuyên sâu**: Admin có quyền truy cập vào giao diện Quản lý Lớp giống hệt như Giáo viên để can thiệp (chỉnh sửa bài tập, xem điểm) khi cần thiết.
