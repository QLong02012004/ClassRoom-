# BỘ KỊCH BẢN KIỂM THỬ CHI TIẾT TOÀN DIỆN DÀNH CHO HỌC SINH (STUDENT DETAILED TEST CASES)

> **Mục đích:** Danh sách kịch bản kiểm thử (Test Cases) chi tiết với đầy đủ các trường hợp kiểm thử (Positive, Negative, Boundary, Security, Edge Cases) cho từng tính năng dành riêng cho Học sinh (Student) trên hệ thống Quản lý Học tập ClassRoom.

---

## 📌 THÔNG TIN TÀI KHOẢN HỌC SINH MẶC ĐỊNH
- **Đường dẫn đăng nhập:** `http://localhost:5173/login`
- **Email Học sinh thử nghiệm:** `student@gmail.com`
- **Mật khẩu Học sinh:** `123456`
- **Email Giáo viên thử nghiệm:** `teacher@gmail.com` / `123456`
- **Email Admin thử nghiệm:** `admin@gmail.com` / `admin123`

---

## 🛠️ CHI TIẾT CÁC KỊCH BẢN KIỂM THỬ (TEST CASES & SUB-CASES)

---

### MODULE 1: XÁC THỰC, ĐĂNG KÝ & THAM GIA LỚP (`/login`, `/register`, `/dashboard`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-01** | **Đăng nhập Học sinh** | **01.1 (Positive)**: Đăng nhập hợp lệ | 1. Mở `/login`<br>2. Nhập Email & Mật khẩu Học sinh<br>3. Bấm "Đăng nhập" | Email: `student@gmail.com`<br>Pass: `123456` | - Đăng nhập thành công, xuất hiện Toast chào mừng.<br>- Chuyển hướng tự động vào Trang chủ Học sinh `/dashboard`. | `[ ] Pass`<br>`[ ] Fail` |
| | | **01.2 (Positive)**: Đăng nhập 1-Click bằng Google OAuth 2.0 | 1. Click nút **[ Đăng nhập / Đăng ký bằng Google ]**<br>2. Chọn tài khoản Google của Học sinh | Google Credentials | Xác thực thành công, tự động khởi tạo hoặc đăng nhập tài khoản Học sinh ở trạng thái `Active`. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-02** | **Đăng ký Học sinh & Xác thực OTP 6 số** | **02.1 (Positive)**: Đăng ký thủ công -> Nhập OTP 6 số qua Email | 1. Mở `/register`, chọn vai trò Học sinh<br>2. Nhập thông tin & gửi Đăng ký<br>3. Nhập mã OTP 6 số gửi về Email | Email: `hocsinha@gmail.com`<br>Pass: `123456` | - Xác thực OTP thành công, tài khoản chuyển sang trạng thái `Active` ngay lập tức (không cần Admin duyệt).<br>- Học sinh có thể đăng nhập vào hệ thống bình thường ngay lập tức. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.2 (UI/UX)**: Đếm ngược 30s Gửi lại mã OTP | 1. Mở Modal OTP 6 số<br>2. Quan sát bộ đếm ngược 30s | Re-send OTP click | Bộ đếm ngược chạy từ 30s về 0s. Khi hết 30s nút "Gửi lại mã" sáng lên, click gửi thành công mã OTP mới. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.3 (Security)**: Tự động kích hoạt Modal OTP khi Cố Đăng nhập | 1. Đăng ký tài khoản Học sinh nhưng tắt Modal OTP<br>2. Mở `/login` và bấm Đăng nhập | Email chưa xác thực | Hiển thị Toast cảnh báo và **tự động mở Modal OTP 6 số ngay trên màn hình Đăng nhập** để kích hoạt tại chỗ. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-03** | **Tham gia Lớp học bằng Mã Code (`classCode`)** | **03.1 (Positive)**: Nhập mã `classCode` hợp lệ | 1. Tại Dashboard, bấm nút "Tham gia lớp học"<br>2. Nhập mã `classCode` của Giáo viên (VD: `X8K9L2`) | Valid `classCode` | Gửi yêu cầu xin vào lớp thành công, lớp hiển thị ở tab `Đang chờ duyệt` của Học sinh. | `[ ] Pass`<br>`[ ] Fail` |
| | | **03.2 (Negative)**: Nhập sai mã code không tồn tại | 1. Nhập mã code ngẫu nhiên không có trong hệ thống | `INVALID` | Hiển thị Toast lỗi: *"Mã lớp học không tồn tại trên hệ thống!"*. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-04** | **Truy cập Lớp học đã được Phê duyệt** | **04.1 (Positive)**: Giáo viên duyệt -> Học sinh truy cập lớp | 1. Sau khi Giáo viên bấm Phê duyệt yêu cầu xin vào lớp<br>2. Click vào thẻ lớp trên Dashboard | Approved Class Card | Chuyển hướng thành công vào Chi tiết lớp học, xem Bảng tin, Bài tập, Tài liệu và Danh sách bài thi. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 2: KIỂM THỬ BẢO MẬT & TRẠNG THÁI LỚP HỌC (`/dashboard`, `/classrooms`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-05** | **Chặn truy cập Lớp Đã đóng (`Closed`)** | **05.1 (Security Check)**: Bấm vào lớp bị Giáo viên đóng | 1. Tìm lớp học có trạng thái `Closed`<br>2. Nhấp chuột vào thẻ lớp từ Dashboard | Closed Class Card | - Thẻ lớp học bị mờ đi (`opacity: 0.6`, `cursor: not-allowed`).<br>- Chặn không cho truy cập vào lớp và hiện Toast cảnh báo: *"Lớp học đã bị đóng, không thể truy cập."*. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-06** | **Chặn truy cập Lớp Bị khóa (`Locked`)** | **06.1 (Security Check)**: Bấm vào lớp bị Admin khóa | 1. Tìm lớp học có trạng thái `Locked`<br>2. Nhấp chuột vào thẻ lớp từ Dashboard | Locked Class Card | - Thẻ lớp học bị mờ đi.<br>- Chặn không cho truy cập vào lớp và hiện Toast cảnh báo: *"Lớp học đã bị khóa bởi Quản trị viên hệ thống."*. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 3: HỌC TẬP, NỘP BÀI & THI TRẮC NGHIỆM (`/assignments`, `/exams`, `/chat`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-07** | **Xem Bảng tin & Tải Tài liệu** | **07.1 (Interactive)**: Xem file PDF/Word & bình luận bài đăng | 1. Vào Tab Bảng tin trong lớp<br>2. Click tải file PDF/Word đính kèm<br>3. Nhập câu hỏi bình luận công khai | Comment text | Tải file thành công, bình luận hiển thị công khai dưới bài đăng của Giáo viên. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-08** | **Nộp Bài tập Tự luận với `<AnimatedSendButton>`** | **08.1 (Positive)**: Nộp bài bằng file & nút máy bay giấy | 1. Mở bài tập tự luận (`/assignments/:id`)<br>2. Tải file làm bài `.pdf`/`.docx`<br>3. Gõ ghi chú bài giải<br>4. Click nút nộp bài máy bay giấy | File bài làm | - Nút `<AnimatedSendButton>` có hiệu ứng máy bay giấy bay mượt mà khi di chuột.<br>- Đã nộp bài thành công, trạng thái đổi thành "Đã nộp bài (Chờ chấm)". | `[ ] Pass`<br>`[ ] Fail` |
| | | **08.2 (Positive)**: Chỉnh sửa bài nộp trước hạn Deadline | 1. Khi chưa hết hạn Deadline, mở lại bài tập đã nộp<br>2. Bấm "Chỉnh sửa bài làm"<br>3. Tải file mới & nộp lại | New file solution | Bài làm cũ được thay thế bằng bài làm mới, cập nhật thời gian nộp thành công. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-09** | **Làm Bài thi Trắc nghiệm Online đếm ngược** | **09.1 (Exam Flow)**: Làm bài thi có đồng hồ đếm ngược | 1. Mở bài thi trắc nghiệm (`/exams/:id`)<br>2. Tích chọn các đáp án A/B/C/D<br>3. Quan sát đồng hồ đếm ngược<br>4. Bấm "Nộp bài" | Answers selection | - Đồng hồ chạy đếm ngược chuẩn xác.<br>- Tự động nộp bài khi hết giờ.<br>- Hiển thị kết quả điểm số, số câu đúng/sai và lời giải chi tiết ngay sau khi nộp. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-10** | **Hỏi đáp Trợ lý AI Gemini (`/chat`)** | **10.1 (AI Assistant)**: Trợ lý học tập thông minh | 1. Truy cập `/chat`<br>2. Nhập thắc mắc bài tập hoặc xin tóm tắt lý thuyết | Question text | AI Gemini phản hồi phân tích chi tiết lời giải và hướng dẫn từng bước mượt mà. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 4: GAMIFICATION XP, THĂNG CẤP LEVEL & ANALYTICS (`/dashboard`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-11** | **Tích lũy XP, Level & Bảng xếp hạng** | **11.1 (Gamification)**: Cộng điểm thưởng XP & Thăng cấp Level | 1. Được GV chấm điểm bài tập hoặc hoàn thành bài thi<br>2. Mở Dashboard xem Thẻ XP & Leaderboard | Gamification System | - Điểm XP được cộng chuẩn công thức: $XP = Điểm \times 3 + 15$ (Thưởng nộp đúng hạn).<br>- Cấp độ Level tự động thăng cấp khi đạt mốc XP.<br>- Vị trí trên Bảng xếp hạng Leaderboard lớp học cập nhật tương ứng. | `[ ] Pass`<br>`[ ] Fail` |
| | | **11.2 (Streak Counter)**: Đếm chuỗi nộp bài nối tiếp | 1. Nộp liên tiếp 3 bài tập đúng hạn Deadline | On-time submissions | Chuỗi Streak tăng lên 3 ngày. Nếu có 1 bài nộp trễ hạn, Streak tự động reset về 0. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-12** | **Widget Cảnh báo Lỗ hổng Kiến thức** | **12.1 (AI Analytics)**: Ôn tập dạng bài sai $\ge 40\%$ | 1. Quan sát Card "Cảnh báo Lỗ hổng Kiến thức" ở Dashboard<br>2. Bấm nút **[ Luyện tập ngay ]** | Weakness Analytics | - Tự động lọc ra top 5 dạng bài có tỷ lệ làm sai $\ge 40\%$.<br>- Bấm "Luyện tập ngay" mở phòng ôn tập trắc nghiệm đúng thẻ tag điểm yếu đó. | `[ ] Pass`<br>`[ ] Fail` |

---

## 🚀 QUY TRÌNH THỰC HIỆN KIỂM THỬ KHUYÊN DÙNG (STUDENT TEST STEPS)

1. **Bước 1 (Đăng ký & OTP)**: Thực hiện từ **TC-STU-01** đến **TC-STU-02**. Đăng ký tài khoản Học sinh, xác thực OTP 6 số qua Email để chuyển `Active` ngay lập tức.
2. **Bước 2 (Tham gia Lớp & Kiểm tra Bảo mật)**: Thực hiện từ **TC-STU-03** đến **TC-STU-06**. Nhập mã `classCode` xin vào lớp và kiểm tra tính năng chặn truy cập khi lớp ở trạng thái `Closed` hoặc `Locked`.
3. **Bước 3 (Học tập & Nộp bài)**: Thực hiện từ **TC-STU-07** đến **TC-STU-10**. Xem bài giảng PDF, nộp bài tập tự luận bằng nút máy bay `<AnimatedSendButton>`, làm thi trắc nghiệm online đếm ngược và hỏi đáp trợ lý AI Gemini.
4. **Bước 4 (Gamification & Ôn tập điểm yếu)**: Thực hiện **TC-STU-11** và **TC-STU-12**. Kiểm tra tích lũy XP thăng cấp Level, chuỗi Streak nộp bài, xem Bảng xếp hạng Leaderboard và bấm "Luyện tập ngay" ôn tập lỗ hổng kiến thức.
