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

---

## 5. CƠ CHẾ GAMIFICATION & TÍNH ĐIỂM (XP)
Nhằm tạo động lực học tập, hệ thống áp dụng cơ chế cộng điểm Kinh nghiệm (XP) cho học sinh dựa trên nỗ lực và kết quả thực tế. (XP sẽ quyết định Cấp độ - Level của học sinh).

### 5.1 Dựa trên Điểm số (Nguồn XP chính)
- Học sinh nhận được XP tương ứng với điểm số đạt được trong các bài kiểm tra/bài tập.
- **Công thức**: `XP = Điểm số × 10`
- *(Ví dụ: Đạt 10 điểm -> Nhận 100 XP, 8.5 điểm -> Nhận 85 XP).*

### 5.2 Dựa trên Thái độ nộp bài
- **Nộp bài đúng hạn**: Thưởng thêm **+50 XP** cho mỗi bài.
- **Nộp bài trễ hạn**: Nhận **0 XP** thưởng (vẫn nhận XP từ điểm số nếu được chấm).

### 5.3 Dựa trên Chuyên cần (Điểm danh)
- **Có mặt (Present)**: **+20 XP**
- **Đi muộn (Late)**: **+5 XP**
- **Vắng mặt (Absent)**: **0 XP** (Trong tương lai có thể áp dụng trừ XP).

### 5.4 Chuỗi học tập (Streak)
- Streak không tính bằng số ngày đăng nhập, mà tính bằng **chuỗi số bài tập nộp đúng hạn liên tiếp**.
- Nếu học sinh nộp trễ dù chỉ 1 bài, chuỗi Streak sẽ bị reset về 0.
- *(Có thể thiết kế hệ thống mốc thưởng: Đạt Streak 5, 10, 20... sẽ được cộng thêm XP đột biến).*

### 5.5 Phạm vi Xếp hạng (Leaderboard)
- **Công bằng giữa các học viên**: Việc tính tổng XP và xếp hạng sẽ được **tách biệt theo từng Lớp học**. (Học viên học 3 lớp sẽ có 3 quỹ điểm XP và 3 vị trí xếp hạng khác nhau ở 3 lớp đó).
- **Trên trang chủ (Dashboard)**: Bảng xếp hạng sẽ có bộ lọc chọn Lớp học (Dropdown), mặc định hiển thị xếp hạng của lớp học có hoạt động gần nhất.
- **Trên trang Chi tiết lớp học**: Sẽ hiển thị trực tiếp Bảng xếp hạng nội bộ của riêng lớp học đó.
