# BỘ KỊCH BẢN KIỂM THỬ CHI TIẾT TOÀN DIỆN DÀNH CHO QUẢN TRỊ VIÊN (ADMIN DETAILED TEST CASES)

> **Mục đích:** Danh sách kịch bản kiểm thử (Test Cases) chi tiết với đầy đủ các trường hợp kiểm thử (Positive, Negative, Boundary, Security, Edge Cases) cho từng tính năng dành riêng cho Quản trị viên (Admin).

---

## 📌 THÔNG TIN TÀI KHOẢN ADMIN MẶC ĐỊNH
- **Đường dẫn đăng nhập:** `http://localhost:5173/login`
- **Email Admin:** `admin@gmail.com`
- **Mật khẩu Admin:** `admin123`
- **Email Giáo viên thử nghiệm:** `teacher@gmail.com` / `123456`
- **Email Học sinh thử nghiệm:** `student@gmail.com` / `123456`

---

## 🛠️ CHI TIẾT CÁC KỊCH BẢN KIỂM THỬ (TEST CASES & SUB-CASES)

---

### MODULE 1: XÁC THỰC & BẢO MẬT ĐIỀU HƯỚNG (ADMIN AUTHENTICATION & ACCESS CONTROL)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ADM-01** | **Đăng nhập Admin** | **01.1 (Positive)**: Đăng nhập hợp lệ bằng tài khoản Admin | 1. Mở `/login`<br>2. Nhập Email & Mật khẩu Admin<br>3. Bấm "Đăng nhập" | Email: `admin@gmail.com`<br>Pass: `admin123` | - Đăng nhập thành công, xuất hiện Toast chào mừng.<br>- Tự động chuyển hướng vào `/admin/dashboard`. | `[ ] Pass`<br>`[ ] Fail` |
| | | **01.2 (Negative)**: Nhập sai Mật khẩu Admin | 1. Nhập Email Admin<br>2. Nhập sai Mật khẩu<br>3. Bấm "Đăng nhập" | Email: `admin@gmail.com`<br>Pass: `wrongpass` | - Đăng nhập thất bại.<br>- Hiển thị Toast lỗi: "Tài khoản hoặc mật khẩu không chính xác!". | `[ ] Pass`<br>`[ ] Fail` |
| | | **01.3 (Negative)**: Để trống Email hoặc Mật khẩu | 1. Để trống Email hoặc Pass<br>2. Bấm "Đăng nhập" | Form trống | Hiển thị thông báo validation ngay bên dưới ô nhập: "Vui lòng nhập Email / Mật khẩu". | `[ ] Pass`<br>`[ ] Fail` |
| | | **01.4 (Security)**: SQL Injection / Script XSS trong ô Đăng nhập | 1. Nhập chuỗi SQL/XSS vào ô Email & Mật khẩu | `' OR '1'='1`<br>`<script>alert(1)</script>` | Hệ thống lọc dữ liệu an toàn, báo lỗi đăng nhập không hợp lệ, không bị dính XSS hay SQL Injection. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-01B** | **Đăng nhập & Đăng ký bằng Google** | **01B.1 (Positive)**: Đăng nhập/Đăng ký 1-Click qua Google OAuth 2.0 | 1. Mở `/login` hoặc `/register`<br>2. Click nút **[ Đăng nhập / Đăng ký bằng Google ]**<br>3. Chọn tài khoản Google | Google Credentials | - Hệ thống tự động xác thực Email thật từ Google.<br>- Học sinh vào hệ thống ngay lập tức (`Active`).<br>- Giáo viên lưu ở trạng thái `Pending` chờ Admin duyệt. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-02** | **Bảo vệ Route Admin & Ngân hàng Đề (Access Control)** | **02.1 (Security)**: Tài khoản Học sinh cố truy cập URL Admin | 1. Đăng nhập Student<br>2. Gõ URL `/admin/dashboard` hoặc `/admin/users` | Student account | - Tự động chặn và chuyển hướng về `/dashboard` hoặc `/classrooms`.<br>- Không rò rỉ dữ liệu trang Admin. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.2 (Security)**: Tài khoản Giáo viên cố truy cập URL Admin | 1. Đăng nhập Teacher<br>2. Gõ URL `/admin/dashboard` hoặc `/admin/users` | Teacher account | - Tự động chặn và chuyển hướng về `/classrooms`. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.3 (Security)**: Người dùng chưa đăng nhập (Guest) vào URL Admin | 1. Mở tab ẩn danh (Guest)<br>2. Gõ trực tiếp `http://localhost:5173/admin/dashboard` | Guest | - Tự động chuyển hướng về trang Đăng nhập `/login`. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.4 (Security)**: Học sinh cố truy cập URL Ngân hàng Đề `/bank` | 1. Đăng nhập Student<br>2. Gõ trực tiếp `http://localhost:5173/bank` | Student account | - Tự động chặn truy cập bằng `TeacherOrAdminRoute`.<br>- Chuyển hướng về `/dashboard`. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-03** | **Menu Sidebar Admin** | **03.1 (Navigation)**: Chuyển đổi qua lại giữa các menu | 1. Đăng nhập Admin<br>2. Click lần lượt: Tổng quan, Quản lý Người dùng, Quản lý Lớp học, Ngân hàng | Click từng menu item | - URL chuyển tương ứng: `/admin/dashboard`, `/admin/users`, `/admin/classrooms`, `/bank`.<br>- Menu hiện tại được Highlight rõ ràng. | `[ ] Pass`<br>`[ ] Fail` |
| | | **03.2 (UI/UX)**: Thu gọn & Mở rộng Sidebar | 1. Hover/Rê chuột vào Sidebar<br>2. Di chuột ra ngoài Sidebar | Hover / Unhover | - Sidebar mở rộng mượt mà khi hover và thu gọn khi di chuột ra ngoài. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 2: BẢNG ĐIỀU KHIỂN TỔNG QUAN (ADMIN DASHBOARD & ANALYTICS - `/admin/dashboard`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ADM-04** | **Thẻ chỉ số tổng hợp (Widgets)** | **04.1 (Data Integrity)**: Hiển thị 4 thẻ thống kê số liệu | 1. Truy cập `/admin/dashboard`<br>2. Kiểm tra 4 thẻ chỉ số | Số liệu thực tế trong DB | Hiển thị chính xác 4 chỉ số:<br>1. Tổng số Học sinh<br>2. Tổng số Giáo viên<br>3. Lớp học đang hoạt động<br>4. Tỷ lệ điểm danh hôm nay | `[ ] Pass`<br>`[ ] Fail` |
| | | **04.2 (Real-time)**: Tự động nhảy số khi có dữ liệu mới | 1. Mở tab khác tạo 1 Lớp học mới hoặc 1 Giáo viên mới<br>2. Quay lại tab Admin | Thêm mới data | Thẻ tương ứng tự động tăng chỉ số mà không cần F5 lại toàn bộ trang. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-04B** | **Xuất báo cáo hệ thống (Export CSV)** | **04B.1 (Positive)**: Tải xuống báo cáo hệ thống dạng CSV | 1. Tại Admin Dashboard, click nút "Xuất báo cáo" ở góc trên bên phải | Click nút | - Hiển thị Toast thông báo: *"Đang tải xuống báo cáo hệ thống..."*<br>- Tệp CSV `Bao_Cao_He_Thong_Classroom.csv` tự động tải về máy. | `[ ] Pass`<br>`[ ] Fail` |
| | | **04B.2 (Encoding)**: Kiểm tra font chữ Tiếng Việt trong file CSV | 1. Mở file CSV vừa tải bằng Excel hoặc Notepad | File CSV | - File hiển thị chuẩn font Tiếng Việt có dấu (UTF-8 BOM), không bị lỗi ký tự ngoằn ngoèo. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-05** | **Biểu đồ Tăng trưởng (User Growth)** | **05.1 (UI/UX)**: Biểu đồ cột (Bar Chart) 12 tháng (T1 -> T12) | 1. Quan sát khu vực Biểu đồ Tăng trưởng | Dữ liệu các tháng trong năm | - Trục hoành hiển thị đúng thứ tự từ `T1` đến `T12`.<br>- Các tháng chưa diễn ra trong năm có giá trị bằng 0 (không bị hiển thị cột thừa). | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-06** | **Dòng thời gian Hoạt động gần đây (Recent Activity)** | **06.1 (Synchronized Data)**: Kiểm tra đồng bộ dữ liệu thời gian thực với Chuông Thông báo | 1. Đăng nhập Giáo viên tạo 1 lớp học mới hoặc thêm học sinh mới<br>2. Chuyển sang tài khoản Admin quan sát mục Hoạt động gần đây | Sự kiện thời gian thực từ Giáo viên | - Danh sách hiển thị **đồng bộ 100% với Chuông thông báo** các hành động thực tế của Giáo viên:<br>  + **Tạo lớp mới**: Icon Bảng đen (Xanh dương) + Nội dung *"Giáo viên [Tên] đã tạo lớp học mới..."*<br>  + **Thêm học sinh**: Icon Học sinh (Xanh ngọc/Cyan) + Nội dung *"Giáo viên [Tên] vừa thêm học sinh vào lớp..."* | `[ ] Pass`<br>`[ ] Fail` |
| | | **06.2 (UI/UX)**: Highlight thông tin Giáo viên & Lớp học | 1. Xem từng hàng hoạt động | Dữ liệu sự kiện | - In đậm Tên giáo viên + Highlight Tên lớp học/Môn học.<br>- Hiển thị thời gian tương đối chính xác (ví dụ: *5 phút trước*). | `[ ] Pass`<br>`[ ] Fail` |
| | | **06.3 (Navigation)**: Thao tác nút "Xem tất cả" | 1. Click nút "Xem tất cả" ở chân thẻ Hoạt động gần đây | Click xem thêm | Cuộn và hiển thị toàn bộ danh sách các thông báo hoạt động gần đây của hệ thống. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-06B** | **Phân bổ Học sinh theo Giáo viên (Stats)** | **06B.1 (Interactive Chart)**: Biểu đồ tròn (Donut Chart) sĩ số | 1. Quan sát thẻ Giáo viên ở nửa dưới Dashboard<br>2. Hover vào từng phần của biểu đồ tròn | Donut Chart | Hover vào từng phân khúc hiển thị Tooltip Tên lớp học & Sĩ số tương ứng. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-06C** | **Chuông Thông báo (Notification Popover)** | **06C.1 (Real-time Event - Tạo lớp)**: Giáo viên tạo lớp mới -> Admin nhận thông báo | 1. Dùng tài khoản Giáo viên tạo lớp `"Toán Cao Cấp"`<br>2. Chuyển sang tài khoản Admin, click Chuông thông báo | Giáo viên tạo lớp | Chuông xuất hiện Chấm đỏ. Popover hiển thị:<br>- **Tiêu đề**: `Tạo lớp học mới`<br>- **Nội dung**: *"Giáo viên [Tên] đã tạo lớp học mới: "Toán Cao Cấp"..."* | `[ ] Pass`<br>`[ ] Fail` |
| | | **06C.2 (Real-time Event - Thêm học sinh)**: Giáo viên thêm học sinh -> Admin nhận thông báo | 1. Dùng tài khoản Giáo viên thêm 1 Học sinh vào lớp<br>2. Chuyển sang tài khoản Admin, click Chuông thông báo | Thêm học sinh | Popover hiển thị thông báo cho Admin:<br>- **Tiêu đề**: `Thêm học sinh mới vào lớp`<br>- **Nội dung**: *"Giáo viên [Tên] vừa thêm học sinh vào lớp học..."* | `[ ] Pass`<br>`[ ] Fail` |
| | | **06C.3 (Interactive & Sync)**: Chuyển trạng thái Đã đọc & Đóng Popover | 1. Click vào 1 thông báo chưa đọc trong Popover<br>2. Click ra ngoài vùng Popover | Click thông báo & Click outside | - Thông báo chuyển từ nền cam nhạt sang trắng, dấu chấm đỏ biến mất.<br>- Dữ liệu đồng bộ hoàn toàn với danh sách Hoạt động gần đây trên Dashboard. | `[ ] Pass`<br>`[ ] Fail` |

| **TC-ADM-04B** | **Thông báo Duyệt Giáo viên (Chuông & Dashboard)** | **04B.1 (Real-time Alert)**: Cảnh báo real-time khi có Giáo viên mới đăng ký | 1. Đăng ký 1 Giáo viên mới tại `/register`<br>2. Mở tài khoản Admin<br>3. Click thông báo trên Quả Chuông Header hoặc Thẻ Hoạt động gần đây | Pending Teacher Notification | - Quả chuông trên Header hiện chấm đỏ + thông báo mới.<br>- Click vào thông báo trong Chuông hoặc thẻ Hoạt động gần đây chuyển thẳng đến `/admin/users?status=Pending` để duyệt. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 3: QUẢN LÝ NGƯỜI DÙNG (USER MANAGEMENT - `/admin/users`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ADM-07** | **Tạo Giáo viên mới trực tiếp** | **07.1 (Positive)**: Admin tạo tài khoản Giáo viên hợp lệ | 1. Click "Thêm giáo viên mới"<br>2. Nhập Tên, Email, Mật khẩu chuẩn<br>3. Bấm "Tạo tài khoản" | Họ tên: `Lê Văn B`<br>Email: `teacherb@gmail.com`<br>Pass: `123456` | - Toast: "Tạo tài khoản thành công".<br>- Bảng tự động xuất hiện Giáo viên mới với Badge xanh `Active`. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-07B** | **Tự động Ưu tiên & Phê duyệt Giáo viên tự đăng ký** | **07B.1 (Positive)**: Tài khoản Pending tự động xếp TOP ĐẦU Trang 1 | 1. Mở `/register`, chọn Đăng ký Giáo viên -> Điền form Đăng ký<br>2. Nhập mã OTP 6 chữ số gửi về Email để xác thực Email<br>3. Admin mở `/admin/users`, thấy tài khoản Giáo viên hiển thị ở dòng đầu<br>4. Bấm nút **[ Phê duyệt ]** | Email: `thaya@gmail.com` | - Sau khi nhập OTP, Giáo viên chuyển sang trạng thái `Pending` chờ Admin duyệt.<br>- Tài khoản `Pending` tự động ưu tiên xếp ở **dòng đầu tiên của Trang 1**.<br>- Admin bấm Phê duyệt: Toast *"Đã phê duyệt kích hoạt tài khoản thành công!"*, Badge đổi từ Cam (`Pending`) sang Xanh (`Active`). | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-07C** | **Đăng ký Học sinh Thủ công & Xác thực OTP** | **07C.1 (Positive)**: Học sinh tự đăng ký -> Nhập OTP -> Active ngay lập tức | 1. Mở `/register`, chọn Đăng ký Học sinh<br>2. Nhập thông tin & gửi Đăng ký<br>3. Nhập mã OTP 6 số từ Email<br>4. Đăng nhập ngay | Email: `hocsinha@gmail.com` | - Sau khi xác thực OTP thành công, tài khoản Học sinh chuyển ngay sang `Active` (không cần Admin duyệt).<br>- Học sinh đăng nhập vào hệ thống bình thường. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-07D** | **Kiểm thử Bảo mật Tài khoản chưa Xác thực Email** | **07D.1 (Security Check)**: Đăng nhập bằng tài khoản chưa nhập OTP | 1. Đăng ký tài khoản (Học sinh/Giáo viên)<br>2. Đóng Modal OTP (chưa nhập OTP)<br>3. Mở `/login` và bấm Đăng nhập | Unverified Email Account | - Hiển thị Toast cảnh báo: *"Tài khoản của bạn chưa được xác thực Email..."*<br>- **Tự động kích hoạt Modal OTP 6 số ngay tại màn hình Đăng nhập**: Cho phép nhập 6 số OTP để kích hoạt tài khoản tại chỗ mà không cần quay về trang Đăng ký. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-07E** | **Đăng ký lại bằng Email chưa xác thực** | **07E.1 (Positive)**: Đăng ký lại bằng Email đã tạo nhưng chưa nhập OTP | 1. Đăng ký tài khoản với Email `unverified@gmail.com`<br>2. Đóng Modal OTP (chưa nhập OTP)<br>3. Thực hiện Đăng ký lại với Email `unverified@gmail.com` | Email: `unverified@gmail.com` | - Hệ thống tự động xóa bản ghi chưa xác thực cũ.<br>- Khởi tạo lượt đăng ký mới, gửi mã OTP mới và mở Modal OTP bình thường (không bị lỗi báo trùng Email). | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-08** | **Tạo Giáo viên (Negative & Validation)** | **08.1 (Negative)**: Tạo bằng Email đã tồn tại | 1. Nhập Email đã có trong hệ thống<br>2. Bấm "Tạo tài khoản" | Email: `admin@gmail.com` | - Báo lỗi: "Email này đã được sử dụng!".<br>- Không tạo trùng lặp. | `[ ] Pass`<br>`[ ] Fail` |
| | | **08.2 (Validation)**: Nhập Email sai định dạng | 1. Nhập Email không có `@` hoặc thiếu tên miền<br>2. Bấm "Tạo tài khoản" | Email: `teacherbformat` | - Hiển thị lỗi validation: "Email không đúng định dạng!". | `[ ] Pass`<br>`[ ] Fail` |
| | | **08.3 (Boundary)**: Mật khẩu không đủ mạnh (< 8 ký tự hoặc thiếu chữ hoa/chữ thường/chữ số/ký tự đặc biệt) | 1. Nhập Mật khẩu không đủ mạnh (quá ngắn hoặc thiếu ký tự quy định) | Pass: `123` hoặc `Password123` | - Hiển thị lỗi validation: "Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường, chữ số và ký tự đặc biệt!". | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-09** | **Tìm kiếm Người dùng** | **09.1 (Search)**: Tìm kiếm theo Tên chính xác hoặc tương đối | 1. Nhập từ khóa tên vào ô Tìm kiếm | Từ khóa: `Nguyễn` hoặc `Admin` | Bảng lập tức lọc ra các dòng có chứa từ khóa trong Tên. | `[ ] Pass`<br>`[ ] Fail` |
| | | **09.2 (Search)**: Tìm kiếm theo Email | 1. Nhập từ khóa email vào ô Tìm kiếm | Từ khóa: `teacher@gmail.com` | Bảng hiển thị đúng tài khoản tương ứng với Email. | `[ ] Pass`<br>`[ ] Fail` |
| | | **09.3 (Empty Result)**: Tìm từ khóa không tồn tại | 1. Nhập chuỗi ký tự ngẫu nhiên | Từ khóa: `xyz123456` | Bảng hiển thị trạng thái trống: "Không tìm thấy người dùng phù hợp". | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-10** | **Lọc theo Vai trò** | **10.1 (Filter)**: Lọc riêng Giáo viên / Học sinh / Admin | 1. Chọn Lọc `Giáo viên` hoặc `Học sinh` trong Dropdown | Select Role | Bảng chỉ hiển thị danh sách người dùng thuộc đúng Vai trò được chọn. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-11** | **Lọc theo Trạng thái** | **11.1 (Filter)**: Lọc tài khoản Active / Pending / Locked | 1. Chọn Lọc `Active`, `Chờ phê duyệt` hoặc `Locked` | Select Status | Bảng lọc chính xác các tài khoản tương ứng với Trạng thái được chọn. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-11B** | **Xem Hồ Sơ Chi Tiết & Tách Biệt Thao Tác** | **11B.1 (Interactive Modal)**: Click vào dòng người dùng mở Modal Hồ Sơ Chi Tiết | 1. Click vào bất kỳ ô dữ liệu của người dùng trên bảng<br>2. Quan sát Modal Hồ sơ Chi tiết và khoảng cách 2 nút Phê duyệt / Đóng | Click Table Cell | - Modal mở rộng hiển thị đầy đủ 7 trường thông tin người dùng (`Avatar`, `Giới tính`, `DOB`, `SĐT/Zalo`, `Bằng cấp/Trình độ`, `Môn học`, `Bio`, `Ngày đăng ký`).<br>- **Tách biệt 2 nút Phê duyệt ngay & Đóng**: Có khoảng cách (`gap-3`) rõ ràng, không bị dính vào nhau.<br>- Thao tác click xem hồ sơ **không làm dính chọn checkbox selection**. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-12** | **Khóa tài khoản Người dùng** | **12.1 (Positive)**: Khóa 1 tài khoản đang Active | 1. Chọn tài khoản `Active`<br>2. Bấm Menu `...` -> "Khóa tài khoản"<br>3. Xác nhận Modal | User ID | - Toast: "Đã khóa tài khoản thành công".<br>- Badge Trạng thái chuyển sang Đỏ (`Locked`). | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-13** | **Kiểm thử Bảo mật tài khoản bị Khóa** | **13.1 (Security Check)**: Đăng nhập bằng tài khoản vừa bị khóa | 1. Mở tab ẩn danh<br>2. Đăng nhập bằng tài khoản bị khóa ở TC-ADM-12 | Locked Account Credential | - Đăng nhập thất bại.<br>- Hiển thị Toast lỗi: *"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!"* | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-13B** | **Kiểm thử Bảo mật tài khoản Chờ duyệt** | **13B.1 (Security Check)**: Đăng nhập bằng Giáo viên mới đăng ký chưa được duyệt | 1. Mở tab ẩn danh<br>2. Đăng nhập tài khoản Giáo viên vừa tạo ở TC-ADM-07B (khi chưa được Admin bấm Phê duyệt) | Pending Teacher Credential | - Đăng nhập thất bại.<br>- Hiển thị Toast lỗi: *"Tài khoản của bạn đang chờ Ban giám hiệu phê duyệt. Vui lòng liên hệ Admin!"* | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-14** | **Mở khóa tài khoản** | **14.1 (Positive)**: Mở khóa tài khoản Locked | 1. Chọn tài khoản `Locked`<br>2. Bấm Menu `...` -> "Mở khóa tài khoản" | User ID | - Badge Trạng thái đổi lại Xanh lá (`Active`).<br>- Tài khoản đăng nhập lại bình thường. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-15** | **Phân quyền / Đổi Vai trò** | **15.1 (Positive)**: Nâng quyền Giáo viên thành Admin | 1. Chọn 1 Giáo viên<br>2. Menu `...` -> "Đổi vai trò" -> Chọn `Admin` | Role: `Admin` | - Vai trò cập nhật thành Admin.<br>- Tài khoản đó có thể đăng nhập vào trang Quản trị Admin. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-16** | **Reset Mật khẩu** | **16.1 (Positive)**: Admin đặt lại mật khẩu cho người dùng | 1. Menu `...` -> "Reset Mật khẩu"<br>2. Nhập mật khẩu mới `newpass123`<br>3. Bấm "Xác nhận" | New Pass: `newpass123` | - Toast: "Đặt lại mật khẩu thành công".<br>- Người dùng dùng mật khẩu mới đăng nhập thành công. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-17** | **Xóa tài khoản vĩnh viễn** | **17.1 (Positive)**: Xóa 1 tài khoản phụ | 1. Menu `...` -> "Xóa tài khoản"<br>2. Bấm Đồng ý trong Dialog cảnh báo | Confirm Delete | Tài khoản biến mất vĩnh viễn khỏi danh sách và Database. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 4: QUẢN LÝ LỚP HỌC HỆ THỐNG (CLASSROOM MANAGEMENT - `/admin/classrooms`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ADM-18** | **Hiển thị Bảng Lớp học** | **18.1 (Data View)**: Kiểm tra danh sách toàn hệ thống | 1. Truy cập `/admin/classrooms` | Danh sách lớp | Hiển thị đầy đủ thông tin: Tên lớp, Mã lớp, Giáo viên phụ trách, Bộ môn, Sĩ số, Ngày tạo, Trạng thái. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-19** | **Panel Quick View (Xem nhanh)** | **19.1 (Interactive)**: Trượt Panel xem chi tiết hoạt động lớp | 1. Click vào 1 hàng lớp học trong bảng | Select Row | - Panel bên phải trượt ra mượt mà.<br>- Hiển thị chủ đề bài giảng, các bài tập mới và timeline hoạt động của lớp. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-20** | **Khóa Lớp học Vi phạm** | **20.1 (Positive)**: Admin thực hiện khóa Lớp học | 1. Click nút "Khóa lớp"<br>2. Xác nhận trong Dialog | Select Active Class | - Trạng thái lớp đổi thành `Locked`. | `[ ] Pass`<br>`[ ] Fail` |
| | | **20.2 (Impact Check)**: Giáo viên / Học sinh vào Lớp bị khóa | 1. Dùng tài khoản Giáo viên hoặc Học sinh truy cập vào lớp bị khóa | Locked Class | Hệ thống ngăn chặn tương tác bài tập và hiển thị cảnh báo: *"Lớp học này đã bị khóa bởi Admin!"*. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-21** | **Mở khóa Lớp học** | **21.1 (Positive)**: Mở khóa lớp đang Locked | 1. Click nút "Mở khóa lớp" | Select Locked Class | Lớp đổi trạng thái thành `Active`, Học sinh và Giáo viên thao tác lại bình thường. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-22** | **Xóa vĩnh viễn Lớp học** | **22.1 (Positive)**: Admin xóa lớp học rác | 1. Click "Xóa lớp"<br>2. Đồng ý trong AlertDialog | Select Class | Lớp học và các dữ liệu liên quan bị xóa hoàn toàn. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-TCH-01** | **Ràng buộc Tạo Lớp học** | **01.1 (Validation)**: Giáo viên chưa hoàn thiện hồ sơ click Tạo lớp | 1. Đăng nhập Giáo viên chưa cập nhật đủ (Giới tính, DOB, SĐT, Bằng cấp, Môn học)<br>2. Bấm nút "Tạo lớp học mới" | Account thiếu thông tin | - Xuất hiện Modal Cảnh Báo *"Cần hoàn thiện hồ sơ trước khi tạo lớp"*.<br>- Liệt kê chính xác các trường thông tin còn thiếu.<br>- Bấm **[ Cập nhật hồ sơ ngay ]** chuyển hướng trực tiếp sang trang Hồ sơ cá nhân (`/profile`). | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 5: CÀI ĐẶT HỆ THỐNG (SYSTEM SETTINGS - `/admin/settings`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ADM-23** | **Cập nhật Cấu hình Chung** | **23.1 (Positive)**: Đổi tên Hệ thống / Múi giờ | 1. Truy cập `/admin/settings`<br>2. Thay đổi Tên hệ thống<br>3. Bấm "Lưu cấu hình" | System Name mới | Toast "Cập nhật cài đặt thành công". Tên mới cập nhật ở Header/Sidebar. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-24** | **Bật Chế độ Bảo trì (Maintenance Mode)** | **24.1 (Impact Check)**: Bật Bảo trì -> Học sinh/Giáo viên bị chặn | 1. Bật công tắc "Chế độ bảo trì" ON<br>2. Bấm Lưu<br>3. Mở tab ẩn danh đăng nhập tài khoản Student / Teacher | Maintenance Switch = ON | - Học sinh / Giáo viên đăng nhập sẽ thấy Màn hình Cảnh báo Bảo trì hệ thống.<br>- Admin vẫn thao tác bình thường. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-25** | **Tắt Chế độ Bảo trì** | **25.1 (Impact Check)**: Tắt Bảo trì -> Mở lại bình thường | 1. Tắt công tắc Bảo trì OFF<br>2. Bấm Lưu | Maintenance Switch = OFF | Hệ thống khôi phục truy cập bình thường cho toàn bộ người dùng. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 6: QUẢN LÝ HỒ SƠ CÁ NHÂN & BẢO MẬT (PROFILE & SECURITY - `/profile`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ADM-26** | **Xem Hồ sơ Admin** | **26.1 (View)**: Kiểm tra thông tin thông số cá nhân | 1. Truy cập `/profile` | Profile Data | Hiển thị chuẩn xác Avatar, Tên Admin, Email, Vai trò `Quản trị viên hệ thống`, Quyền hạn `Tối cao`. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-27** | **Cập nhật Thông tin cá nhân** | **27.1 (Positive)**: Chỉnh sửa Họ tên, SĐT, Địa chỉ | 1. Click "Chỉnh sửa"<br>2. Nhập thông tin mới<br>3. Bấm "Lưu" | New Profile Info | Toast "Cập nhật hồ sơ thành công", dữ liệu trên giao diện được làm mới tức thì. | `[ ] Pass`<br>`[ ] Fail` |
| | | **27.1B (Validation)**: Chỉnh sửa thông tin không hợp lệ (tên rỗng/chữ số, SĐT sai định dạng, ngày sinh tương lai) | 1. Click "Chỉnh sửa"<br>2. Nhập tên chứa số, SĐT thiếu số hoặc ngày sinh tương lai<br>3. Bấm "Lưu" | Tên: `A123`, SĐT: `123` | Hiển thị Toast thông báo lỗi validation tương ứng từ hệ thống. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-28** | **Đổi Avatar** | **28.1 (Positive)**: Tải tệp ảnh hợp lệ (< 2MB) | 1. Click biểu tượng bút ở Avatar<br>2. Chọn tệp `.jpg` / `.png` < 2MB | Valid Image File | Tải ảnh lên thành công, Avatar ở Header và Profile tự động đổi sang ảnh mới. | `[ ] Pass`<br>`[ ] Fail` |
| | | **28.2 (Negative)**: Chọn tệp sai định dạng hoặc quá lớn | 1. Chọn file `.pdf` hoặc file ảnh > 5MB | Invalid File | Hiển thị thông báo lỗi: "File không đúng định dạng hoặc dung lượng vượt quá giới hạn!". | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-29** | **Đổi mật khẩu thành công** | **29.1 (Positive)**: Nhập đúng Mật khẩu cũ & Mật khẩu mới chuẩn | 1. Click "Đổi mật khẩu"<br>2. Nhập Pass cũ `admin123`<br>3. Nhập Pass mới `admin@2026`<br>4. Bấm "Xác nhận" | Pass cũ: `admin123`<br>Pass mới: `admin@2026` | Toast "Đổi mật khẩu thành công". Đăng xuất và dùng `admin@2026` đăng nhập lại thành công. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-30** | **Đổi mật khẩu thất bại** | **30.1 (Negative)**: Nhập sai Mật khẩu hiện tại | 1. Nhập sai Mật khẩu hiện tại | Wrong Old Pass | Báo lỗi: "Mật khẩu hiện tại không chính xác!". Mật khẩu không đổi. | `[ ] Pass`<br>`[ ] Fail` |
| | | **30.2 (Negative)**: Mật khẩu xác nhận không khớp | 1. Pass mới và Pass xác nhận khác nhau | Mismatch Pass | Báo lỗi: "Mật khẩu xác nhận không khớp!". | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-31** | **Đăng xuất hệ thống** | **31.1 (Positive)**: Thực hiện Đăng xuất | 1. Click nút "Đăng xuất" tại Profile hoặc Header | Action Logout | Xóa Token lưu vết và chuyển hướng tự động về màn hình Đăng nhập `/login`. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 7: NGÂN HÀNG ĐỀ & BÀI TẬP (QUESTION BANK - `/bank`)

| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub-Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ADM-32** | **Xem Danh sách Ngân hàng Đề** | **32.1 (View List)**: Admin truy cập danh sách học liệu hệ thống | 1. Đăng nhập Admin<br>2. Truy cập đường dẫn `/bank` | Danh sách học liệu | Hiển thị bảng/lưới câu hỏi & đề thi trắc nghiệm dùng chung toàn trung tâm (`CENTER_SHARED`) và cá nhân. | `[ ] Pass`<br>`[ ] Fail` |
| | | **32.2 (Filter Types)**: Lọc học liệu theo loại (Quiz / Assignment) | 1. Chọn Tab/Lọc "Trắc nghiệm" hoặc "Tự luận" | Filter Type | Danh sách tự động lọc đúng loại tài nguyên học liệu tương ứng. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-33** | **Lọc Môn học Mở rộng & Môn khác** | **33.1 (Standard Subjects)**: Lọc môn học tiêu chuẩn hệ thống | 1. Click bộ lọc Môn học<br>2. Chọn một môn chuẩn (*Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học...*) | Môn chọn sẵn | Danh sách hiển thị chính xác các đề thi thuộc môn học đã chọn. | `[ ] Pass`<br>`[ ] Fail` |
| | | **33.2 (Custom Subject)**: Chọn tùy chọn `+ Môn khác...` và nhập môn mới | 1. Click bộ lọc Môn học<br>2. Chọn `+ Môn khác...`<br>3. Nhập môn học tùy chỉnh (VD: *Tiếng Pháp*) | Môn khác: `Tiếng Pháp` | Ô nhập tên môn xuất hiện, hệ thống tự động lọc đề thi theo môn học vừa nhập. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-34** | **Xem Hướng dẫn & Tải File Mẫu** | **34.1 (Guide Modal)**: Mở Modal Hướng dẫn định dạng tệp | 1. Tại trang tạo đề thi trắc nghiệm, click nút "File mẫu & Hướng dẫn" | User Click | Modal Hướng dẫn mở ra, hiển thị bảng cấu trúc 6 cột Excel và văn bản Word mẫu rõ ràng. | `[ ] Pass`<br>`[ ] Fail` |
| | | **34.2 (Download Samples)**: Tải tệp mẫu Word `.docx` và Excel `.xlsx` | 1. Click nút "Tải file Excel mẫu"<br>2. Click nút "Tải file Word mẫu" | Action Click | Trình duyệt tự động tải xuống tệp mẫu `Mau_De_Thi_Trac_Nghiem.csv` và `Mau_De_Thi_Word.txt`. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-35** | **Import Đề thi (Word / Excel / AI Gemini)** | **35.1 (Excel Import)**: Nhập đề thi từ tệp Excel chuẩn | 1. Click "Nhập dữ liệu (Word/Excel)"<br>2. Chọn tệp `.xlsx` mẫu chuẩn | File Excel 6 cột | Hệ thống đọc tệp và import toàn bộ câu hỏi, 4 phương án A/B/C/D và chỉ định đúng đáp án đúng. | `[ ] Pass`<br>`[ ] Fail` |
| | | **35.2 (Word Regex Import)**: Nhập đề thi từ tệp Word chuẩn cấu trúc | 1. Chọn tệp Word `.docx` theo cấu trúc `Câu 1: ...` | File `.docx` chuẩn | Hệ thống tự động bóc tách đúng tên câu hỏi, lựa chọn A, B, C, D và vị trí đáp án đúng. | `[ ] Pass`<br>`[ ] Fail` |
| | | **35.3 (AI Gemini Import)**: Nhập tệp Word bất kỳ dùng AI bóc tách tự động | 1. Click "Tạo đề bằng AI"<br>2. Chọn tệp Word bài giảng lý thuyết bất kỳ | File Word lý thuyết | AI Gemini (`gemini-2.5-flash`) tự đọc hiểu và sinh bộ câu hỏi trắc nghiệm chuẩn 100%. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-36** | **Tính điểm tự động theo Điểm tối đa** | **36.1 (Auto Divide)**: Tự động chia đều điểm trắc nghiệm | 1. Điền Điểm tối đa đề thi = `10`<br>2. Click nút "Chia điểm đều" (hoặc khi import tệp mới) | Điểm tối đa: `10` | Số điểm từng câu trắc nghiệm được tính tự động = `10 / Số câu` (VD: 20 câu -> 0.5 đ/câu). Toast báo thành công. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-ADM-37** | **Quản lý & Xóa dữ liệu Ngân hàng đề** | **37.1 (Edit Item)**: Chỉnh sửa thông tin tài nguyên | 1. Click biểu tượng Bút sửa tại học liệu<br>2. Cập nhật Tiêu đề, Môn học, Thang điểm | Data update | Thông tin học liệu được lưu mới thành công. | `[ ] Pass`<br>`[ ] Fail` |
| | | **37.2 (Delete Item)**: Xóa tài nguyên lỗi/vi phạm | 1. Click biểu tượng Thùng rác xóa<br>2. Xác nhận trong Dialog | Select Item | Tài nguyên bị xóa vĩnh viễn khỏi Ngân hàng đề thi hệ thống. | `[ ] Pass`<br>`[ ] Fail` |

---

## 🚀 QUY TRÌNH THỰC HIỆN KIỂM THỬ KHUYÊN DÙNG (TEST EXECUTION STEPS)

1. **Bước 1 (Xác thực & Chặn quyền)**: Chạy kịch bản từ **TC-ADM-01** đến **TC-ADM-03**. Thử nghiệm tab ẩn danh để kiểm tra tính năng bảo vệ Route.
2. **Bước 2 (Bảng điều khiển & Thông báo)**: Thực hiện **TC-ADM-04** đến **TC-ADM-06C**. Sử dụng tài khoản Giáo viên tạo 1 lớp học mới và thêm 1 học sinh, sau đó chuyển sang Admin xem thông báo chuông.
3. **Bước 3 (Quản lý Người dùng & Bảo mật)**: Thực hiện từ **TC-ADM-07** đến **TC-ADM-17**. Thử tạo giáo viên, nhập email trùng, khóa tài khoản rồi dùng tab ẩn danh kiểm tra xem tài khoản bị khóa có bị chặn không.
4. **Bước 4 (Quản lý Lớp học & Chế độ Bảo trì)**: Thực hiện từ **TC-ADM-18** đến **TC-ADM-25**. Kiểm thử bật công tắc Chế độ Bảo trì để đảm bảo Học sinh/Giáo viên bị chặn hoàn toàn.
5. **Bước 5 (Hồ sơ & Đổi Mật khẩu)**: Thực hiện từ **TC-ADM-26** đến **TC-ADM-31**.
6. **Bước 6 (Ngân hàng Đề & Bài tập)**: Thực hiện từ **TC-ADM-32** đến **TC-ADM-37** để hoàn tất toàn bộ quy trình kiểm thử dành cho Admin.
