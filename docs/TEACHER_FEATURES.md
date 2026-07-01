# Tài liệu Đặc tả Chức năng Giáo viên (Teacher)

Tài liệu này định nghĩa chi tiết các chức năng dành cho vai trò Giáo viên (Teacher) trong hệ thống Classroom Manager. Mục đích là để làm rõ luồng xử lý, đặc biệt là phần Bảng điều khiển (Dashboard) và các chức năng quản lý lớp học, nhằm phục vụ cho việc bảo trì, sửa lỗi và kết nối API một cách chuẩn xác nhất.

## 1. Bảng điều khiển (`/dashboard`)

Đây là trung tâm theo dõi tổng quan các hoạt động giảng dạy của Giáo viên.

**Các chức năng chính (Cần đảm bảo kết nối API đầy đủ):**
- **Thống kê tổng quan:**
  - Tổng số lớp học đang quản lý.
  - Tổng số học sinh trong tất cả các lớp.
  - Tỉ lệ chuyên cần trung bình (Attendance Rate).
  - Số lượng bài tập cần chấm (Pending Grades).
- **Biểu đồ phổ điểm (Score Distribution):** Thống kê số lượng học sinh đạt loại Giỏi, Khá, Trung bình trong học kỳ, giúp giáo viên nắm bắt chất lượng học tập chung. Hỗ trợ lọc theo từng lớp.
- **Hoạt động gần đây (Recent Activities):** Hiển thị danh sách các hoạt động mới nhất liên quan đến lớp học của giáo viên (vd: Học sinh nộp bài, Học sinh bình luận, Giáo viên vừa điểm danh).
- **Biểu đồ xu hướng chuyên cần (Attendance Trend):** Theo dõi tỉ lệ đi học của học sinh qua các tháng (So sánh tháng hiện tại với năm ngoái).

> [!WARNING]
> Hiện tại trang Dashboard của Giáo viên chưa kết nối đầy đủ các API cho biểu đồ Xu hướng chuyên cần và Hoạt động gần đây (đang dùng mock data). Cần phải hoàn thiện API cho các phần này.

## 2. Quản lý Lớp học (`/classrooms`)

Nơi Giáo viên quản lý các lớp học do mình phụ trách.

**Các chức năng chính:**
- **Danh sách lớp học:** Hiển thị các lớp dưới dạng lưới (Grid) hoặc danh sách, kèm thông tin mã lớp, sĩ số học sinh, chủ đề.
- **Tạo lớp học mới:** Nút "Tạo lớp học mới" (Sử dụng `AnimatedAddButton`), giáo viên có thể tạo lớp và hệ thống sẽ sinh ra `classCode`.
- **Xem chi tiết lớp:** Nhấn vào lớp học để chuyển tới trang quản lý riêng biệt của lớp đó (Thông báo, Bài tập, Học sinh).
- **Sao chép mã lớp:** Cho phép sao chép nhanh mã lớp học để gửi cho học sinh tham gia.

## 3. Quản lý Học sinh (`/classrooms/:id/students`)

Quản lý danh sách học sinh thuộc một lớp cụ thể.

**Các chức năng chính:**
- **Danh sách học sinh:** Xem danh sách học sinh trong lớp (Mã HS, Họ tên, Email).
- **Thêm học sinh:** Giáo viên có thể thêm trực tiếp học sinh vào lớp thông qua form thêm (Sử dụng `AnimatedAddButton`).
- **Loại học sinh:** Cho phép xóa/mời học sinh ra khỏi lớp.

## 4. Quản lý Lịch dạy (`/schedule`)

Quản lý thời khóa biểu và các tiết học.

**Các chức năng chính:**
- **Lên lịch dạy mới:** Thêm tiết học vào lịch (chọn lớp, ngày giờ, nội dung). Nút "Lên lịch dạy mới" (Sử dụng `AnimatedAddButton`).
- **Xem thời khóa biểu:** Hiển thị lịch dạy theo tuần/tháng.
- **Tiết học đang diễn ra:** Hiển thị tiết học hiện tại, hỗ trợ thao tác nhanh như **Điểm danh** (chuyển hướng sang `/attendance` kèm theo ID của lớp).

## 5. Điểm danh (`/attendance`)

Điểm danh học sinh cho từng buổi học.

**Các chức năng chính:**
- **Ghi nhận điểm danh:** Chọn lớp và ngày, hiển thị danh sách học sinh. Giáo viên chọn trạng thái (Có mặt, Đi muộn, Vắng).
- **Ghi chú:** Có thể thêm lời ghi chú cho từng học sinh (vd: Lý do vắng).
- **Lưu điểm danh:** Nút "Lưu điểm danh" sử dụng `AnimatedAddButton`.

## 6. Quản lý Bài tập (`/assignments`)

Tạo bài tập và chấm điểm cho học sinh.

**Các chức năng chính:**
- **Giao bài tập:** Form tạo bài tập (Tiêu đề, Hạn nộp, Điểm tối đa, Loại điểm). Nút "Giao bài ngay" sử dụng `AnimatedAddButton`.
- **Danh sách bài tập:** Hiển thị các bài tập đã giao, phân loại theo tab (Miệng, 15 phút, Giữa kỳ, Cuối kỳ).
- **Chấm bài & Lời phê:** Nhấn vào bài tập để mở Modal chấm bài. Hiển thị trạng thái (Đã nộp, Nộp muộn, Chưa nộp), file đính kèm của học sinh. Nút "Lưu điểm & lời phê" sử dụng `AnimatedAddButton`.
- **Thống kê nộp bài:** Biểu đồ tỷ lệ nộp bài đúng hạn trong 7 ngày qua.

## 7. Sổ điểm (`/gradebook`)

Quản lý tổng quan điểm số của cả lớp.

**Các chức năng chính:**
- **Bảng điểm (Grid):** Hiển thị dạng bảng (Excel-like), cột là các bài tập, dòng là học sinh. Hỗ trợ nhập/sửa điểm trực tiếp trên bảng.
- **Tính điểm trung bình:** Tự động tính điểm trung bình (ĐTB) quy về thang điểm 10 theo hệ số của bài tập. Xếp loại (Giỏi, Khá, TB, Yếu).
- **Lưu điểm:** Nút "Lưu thay đổi" sử dụng `AnimatedAddButton`.

## 8. Danh sách các API Teacher sử dụng (Dự kiến)

Dưới đây là danh sách các REST API chính dành cho Teacher:

### Module Dashboard
- `GET /api/v1/dashboard/teacher`: Lấy dữ liệu thống kê tổng quan (sĩ số, số lớp, tỉ lệ chuyên cần, phổ điểm...).
- `GET /api/v1/dashboard/teacher/activities`: Lấy danh sách hoạt động gần đây của các lớp.
- `GET /api/v1/dashboard/teacher/attendance-trend`: Lấy dữ liệu biểu đồ xu hướng chuyên cần.

### Module Lớp học
- `GET /api/v1/classrooms/teacher`: Lấy danh sách các lớp do giáo viên quản lý.
- `POST /api/v1/classrooms`: Giáo viên tạo lớp học mới.
- `GET /api/v1/classrooms/:id/students`: Lấy danh sách học sinh của một lớp.
- `POST /api/v1/classrooms/:id/students`: Thêm học sinh vào lớp.

### Module Lịch dạy
- `GET /api/v1/schedules/teacher`: Lấy lịch dạy của giáo viên.
- `POST /api/v1/schedules`: Thêm lịch dạy mới.

### Module Điểm danh & Điểm số
- `GET /api/v1/attendance/:classId`: Lấy dữ liệu điểm danh theo lớp và ngày.
- `POST /api/v1/attendance`: Lưu dữ liệu điểm danh.
- `GET /api/v1/gradebook/:classId`: Lấy dữ liệu sổ điểm (assignments, grades, students).
- `POST /api/v1/gradebook/grades`: Lưu điểm số và lời phê.
- `POST /api/v1/gradebook/assignments`: Tạo bài tập mới.
- `GET /api/v1/gradebook/assignments/:id/submissions`: Lấy bài nộp của học sinh.

## 9. Luồng dữ liệu (Data Flow) - Ví dụ Bảng điều khiển
- **Lấy dữ liệu (Fetch):** Khi Giáo viên vào trang `/dashboard`, Component gọi API `GET /api/v1/dashboard/teacher`.
- Dữ liệu trả về sẽ được map vào các State: `stats` (Tổng quan), `scoreStats` (Phổ điểm), `trendData` (Xu hướng chuyên cần), và `activities` (Hoạt động).
- **Lưu ý UI:** Nếu API đang tải, các con số sẽ hiển thị hiệu ứng Loading/Skeleton để mang lại trải nghiệm mượt mà.
