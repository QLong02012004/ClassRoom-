# TÀI LIỆU ĐẶC TẢ CHỨC NĂNG HỆ THỐNG QUẢN LÝ LỚP HỌC (LMS)

---

## I. Tổng Quan Hệ Thống & Tài Khoản Mặc Định

Hệ thống quản lý học tập (LMS) phân chia làm 3 vai trò chính với thông tin tài khoản thử nghiệm như sau:

| Vai trò | Email đăng nhập | Mật khẩu | Phạm vi tác động |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@gmail.com` | `admin123` | Toàn hệ thống (System-wide) |
| **Giáo viên (Teacher)** | `teacher@gmail.com` | `teacher123` | Lớp học được phân công (Class-scoped) |
| **Học sinh (Student)** | *(Do GV/Admin cấp)* | *(Mặc định)* | Cá nhân trong lớp học (User-scoped) |

---

## II. Ma Trận Phân Quyền Chức Năng (RBAC Matrix)

> **Ký hiệu:** > * `C` (Create): Tạo mới | `R` (Read): Xem/Tải về  
> * `U` (Update): Sửa/Cập nhật | `D` (Delete): Xóa/Khóa/Hủy bỏ

| Nhóm Chức Năng | Chi tiết Nghiệp Vụ | Admin | Teacher | Student |
| :--- | :--- | :---: | :---: | :---: |
| **Quản lý Tài khoản** | Đăng ký / Đăng nhập hệ thống | R | C U R | R |
| | Cấp phát / Khóa / Xóa tài khoản Giáo viên | **C U D** | - | - |
| | Cấp phát / Khóa / Xóa tài khoản Học sinh | **C U D** | **C U D** | - |
| | Khôi phục (Reset) mật khẩu Học sinh | **U** | **U** | - |
| | Phân quyền Admin cho tài khoản khác | **U** | - | - |
| **Quản lý Lớp học** | Tạo lớp học mới (Sinh mã Code tự động) | - | **C** | - |
| | Xem danh sách lớp, sĩ số, GV phụ trách | **R** | **R** | **R** (Chỉ lớp đã vào) |
| | Chỉnh sửa thông tin / Xóa lớp học | - | **U D** | - |
| | Can thiệp hệ thống (Khóa/Xóa lớp vi phạm) | **U D** | - | - |
| | Tham gia lớp học bằng mã Code | - | - | **C** |
| **Tương tác & Bài học**| Đăng thông báo, tài liệu (PDF, Word, Video) | - | **C U D** | **R** |
| | Bình luận công khai (Comment) hỏi đáp | - | **C R D** | **C R** |
| **Bài tập & Điểm số** | Giao bài tập, thiết lập thời hạn (Deadline) | - | **C U D** | **R** |
| | Nộp bài tập (Đính kèm file / Văn bản) | - | - | **C U** |
| | Chấm điểm, chỉnh sửa điểm, để lại lời phê | - | **C U D** | **R** |
| | Tự động tính Điểm trung bình theo hệ số | - | **R** | **R** |
| **Điểm danh (Attendance)**| Tích chọn trạng thái (Có mặt / Vắng / Muộn) | - | **C U** | - |
| | Thống kê số buổi vắng cá nhân / cả lớp | - | **R** (Cả lớp) | **R** (Cá nhân) |
| **Trắc nghiệm (Quiz)** | Biên soạn ngân hàng câu hỏi, cài thời gian | - | **C U D** | - |
| | Làm bài trực tuyến (Có đồng hồ đếm ngược) | - | - | **C** |
| | Tự động chấm điểm và đồng bộ vào Sổ điểm | - | **R** | **R** |
| **Báo cáo & Analytics**| Trực quan hóa phổ điểm, tỷ lệ chuyên cần | **R** (Hệ thống)| **R** (Lớp) | - |
| **Hệ thống (Settings)** | Gửi mail tự động (Deadline, Báo cáo PH) | **C U** | - | - |
| | Cấu hình chung (Tên, Logo, Switch bảo mật)| **C U** | - | - |

---

## III. Đặc Tả Chi Tiết Phân Hệ Giao Diện (UI/UX Specification)

*Định hướng thiết kế sử dụng thư viện **shadcn/ui** và **Tailwind CSS**.*

### 1. Phân Hệ Admin (Admin Portal)

#### 1.1. Trang chủ Admin (Dashboard)
* **Giao diện:** Layout Dashboard tiêu chuẩn, hỗ trợ Responsive và Dark/Light Mode.
* **Thành phần:**
    * `Card Widgets`: 4 thẻ hiển thị tổng số Giáo viên, Học sinh, Lớp học đang hoạt động và Số lượt tương tác (kèm badge chỉ số tăng trưởng `%`).
    * `Charts`: Biểu đồ hình cột (**Bar Chart**) hoặc biểu đồ vùng (**Area Chart**) thể hiện tần suất hoạt động hệ thống theo thời gian thực.
    * `Recent Actions`: Danh sách các hoạt động vừa diễn ra trên hệ thống dạng Timeline (dùng `Avatar` và `Badge`).

#### 1.2. Trang quản lý người dùng (User Management)
* **Giao diện:** Bản dữ liệu `shadcn/ui Table` kết hợp `TanStack Table`.
* **Thành phần:**
    * `Toolbar`: Thanh tìm kiếm theo Tên/Email, bộ lọc `DropdownMenu` theo Vai trò và Trạng thái. Nút "Thêm giáo viên mới" kích hoạt `Dialog` (Modal Form).
    * `Data Columns`: Họ tên (kèm Avatar), Email, Vai trò (Badge Đỏ: Admin, Xanh: GV, Xám: HS), Trạng thái (Badge Xanh lá: Active, Đỏ: Locked).
    * `Action Menu`: Nút ba chấm (`...`) cho từng dòng: Sửa thông tin, Đổi vai trò, Reset mật khẩu, Khóa/Mở khóa tài khoản.

#### 1.3. Trang quản lý lớp học toàn hệ thống (Classroom Management)
* **Giao diện:** Dạng bảng dữ liệu giám sát.
* **Thành phần:** Các cột: Tên lớp, Giáo viên phụ trách, Sĩ số hiện tại, Ngày tạo, Trạng thái hoạt động. Nút "Khóa/Xóa lớp" đi kèm `AlertDialog` xác nhận hành động hủy diệt dữ liệu.

#### 1.4. Trang cài đặt hệ thống (Settings Page)
* **Giao diện:** Thiết kế chia tab dọc (`Tabs` component).
* **Thành phần:** Form chỉnh sửa thông tin nền tảng, các nút gạt (`Switch`) cấu hình bảo mật, hệ thống kích hoạt tự động gửi Email thông báo.

---

### 2. Phân Hệ Giáo Viên (Teacher Portal)

#### 2.1. Trang danh sách lớp học (Classrooms Page)
* **Giao diện:** Mạng lưới các thẻ (`Grid Layout` chứa các `Card` component).
* **Thành phần:** Mỗi thẻ đại diện cho một lớp học hiển thị: Tên lớp, Sĩ số, **Mã Code tham gia (được làm nổi bật)**. Nút nhanh để "Tạo lớp mới" mở ra Popup Form điền tên lớp.

#### 2.2. Không gian lớp học tổng hợp (Classroom Hub)
* **Giao diện:** Một màn hình chính điều hướng bằng thanh Tab ngang (`Tabs` component).
* **Các Tab thành phần:**
    * **Tab Bảng tin:** Form đăng bài viết (hỗ trợ đính kèm tệp tin PDF/Word, Link Drive, Link Youtube). Bên dưới là danh sách bài đăng kèm khu vực viết bình luận.
    * **Tab Bài tập:** Nút giao bài mới (Cài tiêu đề, nội dung, điểm số tối đa, và component `Popover` lịch chọn ngày Deadline). Danh sách bài tập đã giao kèm số lượng học sinh đã nộp/chưa nộp.
    * **Tab Thành viên & Điểm danh:** Danh sách học sinh. Phía đầu trang có bộ chọn Ngày, bên cạnh mỗi học sinh là nút chọn nhanh (`RadioGroup` hoặc `ToggleGroup`) các trạng thái: `Có mặt`, `Vắng`, `Muộn`.
    * **Tab Sổ điểm:** Giao diện bảng tính (`Spreadsheet-like Table`). Cho phép giáo viên click trực tiếp vào ô để nhập/sửa các đầu điểm (Miệng, 15p, Giữa kỳ, Cuối kỳ). Hệ thống tự động tính điểm Trung bình bằng công thức chạy ngầm.

#### 2.3. Hệ thống Trắc nghiệm (Quiz System) và Báo cáo
* Giao diện tạo câu hỏi trắc nghiệm (nhập câu hỏi, các đáp án A/B/C/D và tích chọn đáp án đúng).
* Trang Dashboard riêng của lớp chứa biểu đồ cột hiển thị Phổ điểm và biểu đồ đường thể hiện Tỷ lệ chuyên cần theo tháng.

---

### 3. Phân Hệ Học Sinh (Student Portal)

#### 3.1. Trang tổng quan & Tham gia lớp (Join Class)
* **Giao diện:** Ô nhập mã Code nổi bật ở thanh Header hoặc góc màn hình. Khi nhập mã đúng, lớp học mới tự động được thêm vào Grid danh sách lớp của học sinh dưới dạng `Card`.

#### 3.2. Không gian học tập trong lớp (Student Classroom View)
* **Giao diện:** Tabs điều hướng tương tự giáo viên nhưng bị giới hạn quyền hạn:
    * **Tab Bảng tin:** Chỉ được xem thông báo, tải tài liệu do GV đăng và tham gia bình luận hỏi đáp.
    * **Tab Chuyên cần:** Xem bảng thống kê cá nhân (Ví dụ: Có mặt: 18 buổi, Muộn: 2 buổi, Vắng: 1 buổi). Không có quyền chỉnh sửa.
    * **Tab Bài tập:** Hiển thị danh sách bài tập chia làm 2 mục: *Chưa hoàn thành* (Sắp xếp theo thứ tự ưu tiên Deadline gần nhất) và *Đã hoàn thành* (Hiển thị Điểm và Lời phê nếu giáo viên đã chấm). Nút "Nộp bài" cho phép đính kèm file hoặc nhập text trực tiếp.
    * **Tab Thi Online:** Giao diện làm bài trắc nghiệm. Khi bấm bắt đầu, màn hình chuyển sang chế độ tập trung, xuất hiện thanh đếm ngược thời gian (`Countdown Timer`). Hết giờ, hệ thống tự động gọi hàm `submit` để thu bài, khóa tương tác và hiển thị ngay kết quả số câu đúng.
