# BANNER TÀI KHOẢN DEMO DÙNG THỬ NGAY (READY-TO-USE DEMO ACCOUNTS)
## Hệ thống Quản lý Học tập LMS ClassRoom

> **Dành cho Nhà tuyển dụng / Người đánh giá:** Dưới đây là danh sách các tài khoản thử nghiệm được khởi tạo sẵn với đầy đủ dữ liệu mẫu (Sample Data) cho từng vai trò. Bạn có thể sử dụng các tài khoản này để trải nghiệm trực tiếp hệ thống ngay lập tức mà **không cần tốn thời gian đăng ký hoặc xác thực OTP**.

---

## 🔑 BẢNG TÀI KHOẢN DEMO SẴN CÓ (DEMO CREDENTIALS TABLE)

| STT | Vai trò (Role) | Email Đăng nhập | Mật khẩu (Password) | Trang chính | Quyền hạn & Dữ liệu mẫu có sẵn |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | 👑 **Quản trị viên (Admin)** | `admin@gmail.com` | `admin123` | `/admin/dashboard` | **System-Wide Access**<br>- Quản lý người dùng, duyệt 1-Click Giáo viên `Pending` nảy đập đập ở TOP 1 Trang 1.<br>- Khóa/Mở khóa tài khoản & Lớp học vi phạm.<br>- Bật/Tắt Chế độ Bảo trì Hệ thống.<br>- Xuất Báo cáo CSV toàn trung tâm. |
| **2** | 👨‍🏫 **Giáo viên (Teacher)** | `teacher@gmail.com` | `teacher123` *(hoặc `123456`)* | `/classrooms` | **Class-Scoped Management**<br>- Đã có sẵn 3-5 Lớp học mẫu đủ các trạng thái (`Active`, `Closed`, `Pending`).<br>- Tạo lớp mới tự động sinh `classCode` duy nhất.<br>- Đóng/Mở lại lớp, Lưu trữ lớp.<br>- Tạo đề thi trắc nghiệm **AI Gemini bóc tách từ file Word `.docx`**.<br>- Chấm bài tự luận, Điểm danh hàng ngày & Sổ điểm Spreadsheet (`/gradebook`).<br>- **Nhận thông báo Real-time** khi Admin khóa lớp. |
| **3** | 🎓 **Học sinh (Student)** | `student@gmail.com` | `123456` | `/dashboard` | **User-Scoped Learning**<br>- Đã tham gia vào các lớp học mẫu.<br>- Nộp bài tập tự luận với nút máy bay giấy **`<AnimatedSendButton>`**.<br>- Làm bài thi trắc nghiệm Online có đồng hồ đếm ngược.<br>- Hỏi đáp Trợ lý **AI Gemini Assistant (`/chat`)**.<br>- Tích lũy Điểm thưởng XP, Cấp độ Level, Chuỗi Streak & Bảng xếp hạng Leaderboard.<br>- Widget Cảnh báo Lỗ hổng Kiến thức & Phòng Ôn tập theo Tag. |

---

## ⚡ HƯỚNG DẪN TRẢI NGHIỆM TẬP TRUNG CHO NHÀ TUYỂN DỤNG (QUICK DEMO FLOWS)

### 🔹 Luồng 1: Trải nghiệm Vai trò Admin (2 phút)
1. Đăng nhập bằng `admin@gmail.com` / `admin123`.
2. Mở `/admin/dashboard`: Xem 4 thẻ Thống kê Widgets, Biểu đồ Tăng trưởng 12 tháng, Timeline Hoạt động gần đây và bấm nút **"Xuất báo cáo"** (tải tệp CSV).
3. Mở `/admin/users`: Xem danh sách tài khoản `Pending` được tự động ưu tiên xếp ở **TOP 1 Trang 1** và thử bấm nút **[ Phê duyệt ]** 1-Click.
4. Mở `/admin/classrooms`: Thử bấm Khóa 1 lớp học vi phạm.

### 🔹 Luồng 2: Trải nghiệm Vai trò Giáo viên (3 phút)
1. Đăng nhập bằng `teacher@gmail.com` / `teacher123`.
2. Mở `/classrooms`: 
   - Thử bấm nút chuyển đổi giữa dạng **Lưới (Grid)** và dạng **Bảng (Table)**.
   - Thử nghiệm tính năng **Đóng Lớp** (`Closed`) / **Mở lại Lớp**.
3. Mở Ngân hàng Đề `/bank`: Bấm "Tạo đề AI từ file Word", tải 1 file `.docx` trắc nghiệm lên để **AI Gemini tự động bóc tách bộ đề**.
4. Mở Sổ điểm `/gradebook`: Click trực tiếp vào ô bảng tính để sửa điểm và quan sát ĐTB môn tự động tính lại.
5. **Thử nghiệm Real-time Socket.io**: Mở song song 2 tab (1 tab Admin, 1 tab Giáo viên). Tại tab Admin bấm Khóa lớp của Giáo viên -> Tab Giáo viên **nảy chấm đỏ trên Chuông thông báo tức thì** và thẻ lớp chuyển sang `LOCKED` mờ đi mà không cần F5!

### 🔹 Luồng 3: Trải nghiệm Vai trò Học sinh (2 phút)
1. Đăng nhập bằng `student@gmail.com` / `123456`.
2. Mở Dashboard `/dashboard`: Quan sát Thẻ tích lũy XP, Level, Chuỗi Streak, Bảng xếp hạng Leaderboard và Card **"Cảnh báo Lỗ hổng Kiến thức"** (bấm **[ Luyện tập ngay ]**).
3. Mở 1 Bài tập tự luận: Tải file bài làm và bấm nút máy bay giấy **`<AnimatedSendButton>`** (rê chuột kiểm tra hiệu ứng máy bay giấy bay mượt mà).
4. Mở `/chat`: Gửi câu hỏi thắc mắc bài tập cho **Trợ lý AI Gemini**.

---

## 📌 GHI CHÚ BẢO MẬT & DỌN DẸP DỮ LIỆU
- Các tài khoản Demo trên được bảo vệ không thể bị xóa vĩnh viễn khỏi hệ thống bởi các thao tác thử nghiệm thông thường.
- Dữ liệu điểm số và bài làm tạo mới bởi các tài khoản thử nghiệm được lưu trữ an toàn trong MongoDB CSDL.
