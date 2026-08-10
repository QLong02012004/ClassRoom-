# BỘ KỊCH BẢN KIỂM THỬ CHI TIẾT TOÀN DIỆN DÀNH CHO GIÁO VIÊN (TEACHER DETAILED TEST CASES)

> **Mục đích:** Danh sách kịch bản kiểm thử (Test Cases) chi tiết với đầy đủ các trường hợp kiểm thử (Positive, Negative, Boundary, Security, Edge Cases) cho từng tính năng dành riêng cho Giáo viên (Teacher) trên hệ thống Quản lý Học tập ClassRoom.

---

## 📌 THÔNG TIN TÀI KHOẢN GIÁO VIÊN MẶC ĐỊNH
- **Đường dẫn đăng nhập:** `http://localhost:5173/login`
- **Email Giáo viên thử nghiệm:** `teacher@gmail.com`
- **Mật khẩu Giáo viên:** `teacher123` hoặc `123456`
- **Email Học sinh thử nghiệm:** `student@gmail.com` / `123456`
- **Email Admin thử nghiệm:** `admin@gmail.com` / `admin123`

---

## 🛠️ CHI TIẾT CÁC KỊCH BẢN KIỂM THỬ (TEST CASES & SUB-CASES)

---

### MODULE 1: XÁC THỰC, ĐĂNG KÝ & QUẢN LÝ HỒ SƠ (`/login`, `/register`, `/profile`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-TCH-01** | **Đăng nhập Giáo viên** | **01.1 (Positive)**: Đăng nhập hợp lệ bằng tài khoản Giáo viên | 1. Mở `/login`<br>2. Nhập Email & Mật khẩu Giáo viên<br>3. Bấm "Đăng nhập" | Email: `teacher@gmail.com`<br>Pass: `teacher123` | - Đăng nhập thành công, xuất hiện Toast chào mừng.<br>- Tự động chuyển hướng vào `/classrooms`. | `[ ] Pass`<br>`[ ] Fail` |
| | | **01.2 (Negative)**: Nhập sai Mật khẩu | 1. Nhập Email chuẩn<br>2. Nhập sai Mật khẩu<br>3. Bấm "Đăng nhập" | Email: `teacher@gmail.com`<br>Pass: `wrongpass` | Hiển thị Toast thông báo lỗi: *"Tài khoản hoặc mật khẩu không chính xác!"*. | `[ ] Pass`<br>`[ ] Fail` |
| | | **01.3 (Negative)**: Để trống Email hoặc Mật khẩu | 1. Để trống thông tin<br>2. Bấm "Đăng nhập" | Form trống | Hiển thị thông báo validation ngay bên dưới ô nhập: *"Vui lòng nhập Email / Mật khẩu"*. | `[ ] Pass`<br>`[ ] Fail` |
| | | **01.4 (Security)**: SQL Injection / Script XSS trong ô Đăng nhập | 1. Nhập chuỗi SQL/XSS vào ô Email & Mật khẩu | `' OR '1'='1`<br>`<script>alert(1)</script>` | Hệ thống lọc dữ liệu an toàn, báo lỗi đăng nhập không hợp lệ, không bị dính XSS hay SQL Injection. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-02** | **Đăng ký Giáo viên & Xác thực OTP 6 số** | **02.1 (Positive)**: Đăng ký thủ công -> Nhập OTP 6 số | 1. Mở `/register`, chọn vai trò Giáo viên<br>2. Nhập thông tin Đăng ký<br>3. Nhập mã OTP 6 số từ Email | Email: `thaya@gmail.com`<br>Pass: `123456` | - Xác thực OTP 6 số thành công.<br>- Tài khoản chuyển sang trạng thái `Pending` chờ Admin duyệt.<br>- Đăng nhập khi chưa được Admin duyệt: Báo lỗi *"Tài khoản của bạn đang chờ Ban giám hiệu phê duyệt..."*. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.2 (UI/UX)**: Đếm ngược 30s Gửi lại mã OTP | 1. Mở Modal OTP 6 số<br>2. Quan sát bộ đếm ngược 30s<br>3. Hết 30s bấm "Gửi lại mã" | Re-send OTP click | Bộ đếm ngược chạy từ 30s về 0s. Khi hết 30s nút "Gửi lại mã" sáng lên, click gửi thành công mã OTP mới. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.3 (Positive)**: Đăng ký lại mượt mà cho Email chưa xác thực | 1. Đăng ký với email `draft@gmail.com`<br>2. Tắt Modal OTP (chưa xác thực)<br>3. Thực hiện Đăng ký lại với Email `draft@gmail.com` | Email: `draft@gmail.com` | Hệ thống tự động xóa bản ghi chưa xác thực cũ, phát hành OTP mới mà không báo lỗi trùng Email. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.4 (Security)**: Tự động bật Modal OTP khi Cố Đăng nhập | 1. Đăng ký tài khoản nhưng tắt Modal OTP<br>2. Mở trang `/login` và bấm Đăng nhập | Email chưa xác thực | Hiển thị Toast cảnh báo và **tự động mở Modal OTP 6 số ngay trên màn hình Đăng nhập** để kích hoạt tại chỗ. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-03** | **Quản lý & Cập nhật Hồ sơ Cá nhân (`/profile`)** | **03.1 (View)**: Xem đầy đủ 7 trường thông tin cá nhân | 1. Truy cập `/profile` | Profile Data | Hiển thị đầy đủ: Avatar, Họ tên, Email, Giới tính, Ngày sinh, SĐT/Zalo, Bằng cấp/Trình độ, Môn giảng dạy, Bio giới thiệu. | `[ ] Pass`<br>`[ ] Fail` |
| | | **03.2 (Positive)**: Chỉnh sửa thông tin cá nhân | 1. Click "Chỉnh sửa hồ sơ"<br>2. Cập nhật Họ tên, SĐT, Bằng cấp, Bio<br>3. Bấm "Lưu" | New Profile Info | Toast "Cập nhật hồ sơ thành công", dữ liệu trên giao diện được làm mới tức thì. | `[ ] Pass`<br>`[ ] Fail` |
| | | **03.3 (Positive)**: Đổi Avatar hợp lệ (< 2MB) | 1. Click biểu tượng bút ở Avatar<br>2. Chọn file `.jpg` / `.png` < 2MB | Valid Image File | Tải ảnh lên thành công, Avatar ở Header và Profile tự động đổi sang ảnh mới. | `[ ] Pass`<br>`[ ] Fail` |
| | | **03.4 (Negative)**: Đổi Avatar quá dung lượng (> 5MB) | 1. Chọn file ảnh > 5MB hoặc file `.pdf` | Invalid File | Hiển thị thông báo lỗi: *"Dung lượng file vượt quá giới hạn 2MB!"*. | `[ ] Pass`<br>`[ ] Fail` |
| | | **03.5 (Validation)**: Ràng buộc chưa đủ thông tin trước khi Tạo Lớp | 1. Tạo tài khoản Giáo viên mới chưa điền SĐT/Bằng cấp<br>2. Vào `/classrooms` bấm "Tạo lớp học mới" | Account thiếu thông tin | - Xuất hiện Modal Cảnh Báo *"Cần hoàn thiện hồ sơ trước khi tạo lớp"*.<br>- Bấm **[ Cập nhật hồ sơ ngay ]** tự động chuyển hướng đến `/profile`. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 2: QUẢN LÝ LỚP HỌC & TRẠNG THÁI LỚP (`/classrooms`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-TCH-04** | **Tạo Lớp học Mới & Tự động Ưu tiên** | **04.1 (Positive)**: Tạo lớp mới hợp lệ -> Tự động sinh `classCode` | 1. Đăng nhập Giáo viên đủ hồ sơ<br>2. Nhập Tên lớp & Môn học<br>3. Bấm "Tạo lớp ngay" | Tên: `Toán 12A1`<br>Môn: `Toán` | - Hệ thống tự động sinh `classCode` 6 ký tự ngẫu nhiên duy nhất (VD: `M8K9L2`).<br>- Lớp mới có trạng thái `Pending` (Màu cam có hiệu ứng nhấp nháy).<br>- Tự động được ưu tiên xếp ở **TOP ĐẦU Trang 1** Dashboard Giáo viên. | `[ ] Pass`<br>`[ ] Fail` |
| | | **04.2 (Validation)**: Để trống Tên lớp hoặc Môn học | 1. Để trống Tên lớp<br>2. Bấm "Tạo lớp ngay" | Form thiếu Tên lớp | Hiển thị Toast lỗi: *"Vui lòng điền đầy đủ thông tin tên lớp và môn học!"*. | `[ ] Pass`<br>`[ ] Fail` |
| | | **04.3 (Security)**: Cố nhấp chuột vào lớp đang Pending | 1. Click vào thẻ lớp `Pending` từ Dashboard | Click Pending Class | Chặn không cho truy cập vào chi tiết lớp, hiện Toast: *"Lớp học đang chờ Admin duyệt, chưa thể truy cập."*. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-05** | **Chế độ Xem Lưới & Bảng (Grid & Table View)** | **05.1 (UI/UX)**: Chuyển đổi qua lại giữa dạng Lưới và Bảng | 1. Click icon Chuyển xem Lưới/Bảng ở góc trên bên phải | Switch View Icon | Giao diện chuyển đổi mượt mà giữa dạng Thẻ Lưới (Grid) và Bảng Tính (Table), dữ liệu đồng bộ 100%. | `[ ] Pass`<br>`[ ] Fail` |
| | | **05.2 (Search & Filter)**: Tìm kiếm & Lọc danh sách lớp | 1. Nhập từ khóa tên lớp/mã code vào ô tìm kiếm<br>2. Chọn Dropdown Lọc trạng thái | Search: `Toán` | Danh sách lớp tự động lọc chính xác theo từ khóa và trạng thái được chọn. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-06** | **Đóng & Mở lại Lớp học (Close/Re-open)** | **06.1 (Positive)**: Đóng lớp học sau khi kết thúc kỳ | 1. Tại Thẻ lớp hoặc Menu `...` -> Chọn "Đóng lớp học" | Active Class | - Trạng thái đổi thành `Đã đóng` (`Closed`), thẻ mờ đi (`opacity: 0.6`, `cursor: not-allowed`).<br>- Cả Giáo viên và Học sinh bấm vào đều bị chặn + Toast: *"Lớp học đã bị đóng, không thể truy cập."*. | `[ ] Pass`<br>`[ ] Fail` |
| | | **06.2 (Positive)**: Mở lại lớp học | 1. Bấm nút "Mở lại lớp" trên thẻ hoặc Menu `...` | Closed Class | Trạng thái chuyển lại thành `Active` (Màu xanh), Giáo viên và Học sinh lại truy cập tương tác bình thường. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-07** | **Lưu trữ Lớp học (Archive Class)** | **07.1 (Positive)**: Đưa lớp vào kho Lưu trữ | 1. Menu `...` -> Chọn "Lưu trữ lớp"<br>2. Bấm Xác nhận trong Dialog | Select Class | Toast thông báo lưu trữ thành công, lớp bị ẩn khỏi Dashboard (Soft delete) nhưng bảo lưu trọn vẹn dữ liệu. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-08** | **Nhận Thông báo Real-time khi Admin Khóa/Mở khóa** | **08.1 (Real-time Socket)**: Admin khóa lớp -> Giáo viên nhận thông báo tức thì | 1. Mở song song 2 trình duyệt (Admin & Teacher)<br>2. Admin bấm Khóa 1 lớp của Giáo viên | Admin Lock Action | - Quả chuông trên Header Giáo viên **nảy chấm đỏ real-time**.<br>- Click Chuông xem thông báo: *"Lớp học [Tên lớp] của bạn đã bị Quản trị viên hệ thống khóa."*<br>- Thẻ lớp trên Dashboard Giáo viên tự động chuyển sang `LOCKED` mờ đi mà không cần F5. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-09** | **Sao chép Mã Lớp 1-Touch & Thao tác Lớp** | **09.1 (Positive)**: Nút sao chép mã code 1 chạm | 1. Click nút Copy bên cạnh mã lớp `classCode` | Copy Button Click | Toast thông báo *"Đã sao chép mã lớp vào bộ nhớ tạm!"*. Dán ra văn bản thu được đúng mã code. | `[ ] Pass`<br>`[ ] Fail` |
| | | **09.2 (Positive)**: Chỉnh sửa thông tin Lớp học | 1. Menu `...` -> "Chỉnh sửa lớp"<br>2. Sửa Tên lớp hoặc Mô tả<br>3. Bấm "Lưu thay đổi" | New Class Name | Thông tin lớp học được cập nhật thành công. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 3: KHÔNG GIAN LỚP HỌC, QUẢN LÝ HỌC SINH & BẢNG TIN (`/classrooms/:id`, `/classrooms/:id/students`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-TCH-10** | **Phê duyệt Yêu cầu Xin vào Lớp của Học sinh** | **10.1 (Positive)**: Duyệt đơn lẻ hoặc Duyệt tất cả (`Approve All`) | 1. Bấm nút "Duyệt học sinh" trên thẻ/bảng lớp<br>2. Chọn Duyệt từng em hoặc bấm "Duyệt tất cả" | Pending Student Requests | - Học sinh được duyệt chuyển sang trạng thái chính thức trong lớp.<br>- Sĩ số lớp tự động tăng lên. | `[ ] Pass`<br>`[ ] Fail` |
| | | **10.2 (Positive)**: Từ chối học sinh xin vào lớp | 1. Bấm nút "Từ chối" ở hàng học sinh xin vào lớp | Reject Action | Đơn xin gia nhập của học sinh bị hủy bỏ, học sinh nhận được thông báo từ chối. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-11** | **Quản lý Danh sách Học sinh trong Lớp** | **11.1 (Positive)**: Thêm trực tiếp Học sinh vào lớp | 1. Vào Tab Thành viên -> Bấm "Thêm học sinh"<br>2. Nhập Email học sinh đã có trên hệ thống | Student Email | Học sinh được thêm trực tiếp vào lớp mà không cần qua bước duyệt `Pending`. | `[ ] Pass`<br>`[ ] Fail` |
| | | **11.2 (Positive)**: Mời học sinh ra khỏi lớp (Xóa khỏi lớp) | 1. Tại hàng học sinh -> Bấm Menu `...` -> Chọn "Xóa khỏi lớp"<br>2. Bấm Xác nhận | Select Student | Học sinh bị xóa khỏi danh sách lớp, không còn truy cập vào bài tập của lớp đó được nữa. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-12** | **Đăng Thông báo & Chia sẻ Tài liệu Bảng tin** | **12.1 (Positive)**: Đăng thông báo kèm file PDF/Word/Video | 1. Vào Tab Bảng tin -> Nhập nội dung thông báo<br>2. Đính kèm file PDF/Word hoặc chèn Link Youtube<br>3. Bấm "Đăng bài" | Text & File PDF/Word | Bài đăng xuất hiện trên Bảng tin công khai của lớp. Học sinh có thể xem, tải file và gửi bình luận. | `[ ] Pass`<br>`[ ] Fail` |
| | | **12.2 (Interactive)**: Bình luận & Quản lý bình luận công khai | 1. Gõ câu trả lời bên dưới bài đăng<br>2. Bấm nút xóa nếu muốn xóa bình luận | Comment text | Bình luận xuất hiện tức thì bên dưới bài đăng. Giáo viên có quyền xóa bình luận không phù hợp. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 4: TẠO BÀI TẬP, CHẤM ĐIỂM & ĐỀ THI AI GEMINI (`/assignments`, `/bank`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-TCH-13** | **Giao Bài tập Tự luận Mới** | **13.1 (Positive)**: Tạo bài tập tự luận có hạn nộp & hệ số | 1. Tab Bài tập -> Bấm "Giao bài tập mới"<br>2. Điền Tiêu đề, Mô tả, Chọn Hạn nộp (Deadline), Hệ số điểm<br>3. Bấm nút giao bài `AnimatedAddButton` | Title, Deadline, Score Weight | Bài tập được giao thành công, thông báo bài tập mới tự động phát tới toàn bộ Học sinh trong lớp. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-14** | **Chấm bài Tự luận & Lời phê** | **14.1 (Positive)**: Xem bài nộp của HS -> Nhập điểm & Lời phê | 1. Mở danh sách bài nộp của bài tập<br>2. Click xem file đính kèm PDF/Word của học sinh<br>3. Nhập điểm `9.5` & gõ Lời phê nhận xét<br>4. Bấm "Lưu điểm" | Score: `9.5`<br>Lời phê: `Bài làm xuất sắc` | - Điểm số và lời phê lưu thành công, học sinh nhận được thông báo điểm.<br>- Dữ liệu điểm **tự động đồng bộ 100% sang Sổ điểm (`/gradebook`)**. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-15** | **Tạo Đề thi Trắc nghiệm bằng AI Gemini từ file Word** | **15.1 (AI Feature)**: Upload file Word `.docx` bóc tách câu hỏi | 1. Vào Ngân hàng đề `/bank` -> Click "Tạo đề AI từ file Word"<br>2. Tải tệp `.docx` bộ đề thi trắc nghiệm lên | File `.docx` bộ đề trắc nghiệm | - AI Gemini tự động quét và bóc tách chuẩn xác danh sách câu hỏi, 4 đáp án A/B/C/D và chọn đáp án đúng.<br>- Hiển thị màn hình Xem trước câu hỏi bóc tách cho phép Giáo viên duyệt/sửa trước khi lưu. | `[ ] Pass`<br>`[ ] Fail` |
| | | **15.2 (Positive)**: Giao đề thi trắc nghiệm có đồng hồ đếm ngược | 1. Chọn đề thi vừa tạo -> Bấm "Giao bài thi cho lớp"<br>2. Chọn thời gian làm bài (VD: 15 phút, 45 phút) | Timer: 15 mins | Bài thi trắc nghiệm xuất hiện trên giao diện Học sinh kèm đồng hồ tính giờ đếm ngược. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 5: ĐIỂM DANH HÀNG NGÀY & SỔ ĐIỂM SPREADSHEET (`/attendance`, `/gradebook`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-TCH-16** | **Quản lý Điểm danh Hàng ngày (`/attendance`)** | **16.1 (Positive)**: Tích chọn trạng thái chuyên cần | 1. Truy cập `/attendance`<br>2. Chọn Lớp học & chọn Ngày điểm danh<br>3. Tích chọn trạng thái từng HS: `Có mặt`, `Đi muộn`, `Vắng mặt`<br>4. Bấm "Lưu điểm danh" | Attendance Status | - Dữ liệu điểm danh lưu thành công vào CSDL.<br>- Hệ thống tự động tính điểm thưởng XP chuyên cần cộng/trừ cho Học sinh (Có mặt +5 XP, Vắng mặt -5 XP). | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-17** | **Quản lý Sổ điểm Bảng tính Spreadsheet (`/gradebook`)** | **17.1 (Spreadsheet Grid)**: Nhập điểm trực tiếp vào ô tính | 1. Truy cập `/gradebook` -> Chọn Lớp<br>2. Click trực tiếp vào ô điểm (Miệng, 15p, 1 tiết, Cuối kỳ) để sửa<br>3. Bấm `SaveButton` | Student Grades | - Hệ thống tự động tính toán Điểm Trung Bình (ĐTB) môn theo đúng công thức hệ số.<br>- Tự động xếp loại học lực Học sinh (Giỏi / Khá / Trung bình / Yếu). | `[ ] Pass`<br>`[ ] Fail` |

---

## 🚀 QUY TRÌNH THỰC HIỆN KIỂM THỬ KHUYÊN DÙNG (TEACHER TEST STEPS)

1. **Bước 1 (Xác thực & Hồ sơ)**: Thực hiện từ **TC-TCH-01** đến **TC-TCH-03**. Kiểm thử đăng ký, xác thực OTP 6 số qua Email, ràng buộc cập nhật đủ 7 trường hồ sơ cá nhân trước khi tạo lớp.
2. **Bước 2 (Quản lý Lớp & Socket Real-time)**: Thực hiện từ **TC-TCH-04** đến **TC-TCH-09**. Tạo lớp mới, chuyển đổi hiển thị Lưới/Bảng, đóng/mở lớp, lưu trữ lớp và thử nghiệm nhận thông báo Socket Real-time khi Admin khóa lớp.
3. **Bước 3 (Thành viên & Bảng tin)**: Thực hiện từ **TC-TCH-10** đến **TC-TCH-12**. Phê duyệt đơn xin vào lớp của học sinh (Single & Approve All), thêm/xóa học sinh, đăng bài thông báo đính kèm file PDF/Word/Video.
4. **Bước 4 (Bài tập, Chấm điểm & Đề thi AI Gemini)**: Thực hiện từ **TC-TCH-13** đến **TC-TCH-15**. Giao bài tập tự luận, chấm điểm kèm lời phê, bóc tách đề trắc nghiệm bằng AI từ file Word `.docx` và giao bài thi đếm ngược.
5. **Bước 5 (Điểm danh & Sổ điểm Spreadsheet)**: Thực hiện **TC-TCH-16** và **TC-TCH-17**. Thực hiện điểm danh hàng ngày và nhập điểm trực tiếp trên bảng tính Spreadsheet tự động tính ĐTB môn.
