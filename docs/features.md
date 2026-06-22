# Đặc Tả Chức Năng Hệ Thống Quản Lý Lớp Học

Tài liệu này mô tả các chức năng được phân loại từ cơ bản đến nâng cao dành cho hệ thống quản lý lớp học của giáo viên.

---

## I. Các Chức Năng Cốt Lõi (Must-Have)
*Đây là nhóm tính năng bắt buộc phải có để hệ thống vận hành ổn định.*

### 1. Quản lý tài khoản (Authentication)
* [cite_start]**Giáo viên:** Có thể đăng ký tài khoản mới và đăng nhập vào hệ thống bảo mật bằng mật khẩu được mã hóa[cite: 6, 50].
* [cite_start]**Phân quyền:** Hệ thống phân rõ vai trò của Giáo viên để quản trị lớp học (có khả năng mở rộng cho Học sinh/Phụ huynh sau này)[cite: 6].

### 2. Quản lý danh sách lớp học (Classroom Management)
* [cite_start]**Thao tác:** Giáo viên có thể Tạo, Sửa thông tin, hoặc Xóa các lớp học do mình phụ trách[cite: 7].
* [cite_start]**Mã tham gia:** Mỗi khi tạo một lớp mới, hệ thống tự động sinh ra một **mã code ngẫu nhiên và duy nhất** để học sinh sử dụng khi tham gia lớp học[cite: 8].

### 3. Quản lý học sinh (Student Roster)
* [cite_start]**Thành viên:** Giáo viên có thể chủ động thêm học sinh mới hoặc xóa học sinh ra khỏi lớp học[cite: 9].
* [cite_start]**Hồ sơ:** Xem danh sách toàn bộ lớp kèm theo thông tin liên hệ cơ bản (Họ tên, mã học sinh, số điện thoại phụ huynh)[cite: 10].

### 4. Điểm danh điện tử (Attendance Tracking)
* [cite_start]**Nhập dữ liệu:** Giao diện điểm danh theo ngày cho phép tích chọn nhanh trạng thái của từng học sinh: `Có mặt` (Present), `Vắng` (Absent), hoặc `Muộn` (Late)[cite: 11].
* [cite_start]**Báo cáo:** Thống kê tổng số buổi vắng của từng học sinh để giáo viên dễ dàng theo dõi chuyên cần[cite: 12].

---

## II. Quản Lý Học Tập & Tương Tác (Should-Have)
[cite_start]*Nhóm tính năng giúp tăng hiệu quả tương tác và giao bài tập giữa giáo viên và học sinh[cite: 13].*

### 1. Bảng tin / Thông báo (Announcements)
* [cite_start]Giáo viên đăng tải các thông báo quan trọng, dặn dò bài tập về nhà[cite: 14].
* [cite_start]Cho phép phản hồi thông qua tính năng để lại bình luận công khai (comment)[cite: 15].

### 2. Quản lý bài tập & Tài liệu (Assignments & Materials)
* [cite_start]**Kho lưu trữ:** Giáo viên tải lên các file tài liệu bài học định dạng PDF, Word, hoặc đính kèm link Drive, video Youtube[cite: 15].
* [cite_start]**Giao bài:** Tạo bài tập về nhà yêu cầu cài đặt thời hạn nộp bài (Deadline)[cite: 16].
* **Chấm điểm:** Học sinh nộp bài dưới dạng tệp tin hoặc văn bản chữ. [cite_start]Giáo viên tiến hành chấm điểm và đưa ra nhận xét trực tiếp trên hệ thống[cite: 17].

### 3. Sổ điểm điện tử (Gradebook)
* [cite_start]Hỗ trợ lưu trữ điểm số theo các đầu điểm thành phần: Điểm miệng, Điểm 15 phút, Điểm giữa kỳ, và Điểm cuối kỳ[cite: 18].
* [cite_start]Hệ thống tự động tính toán Điểm trung bình môn dựa trên hệ số được thiết lập sẵn[cite: 19].

---

## III. Các Tính Năng Nâng Cao (Nice-to-Have)
[cite_start]*Các tính năng giúp nâng cấp hệ thống tối ưu và chuyên nghiệp hơn[cite: 20].*

### 1. Trực quan hóa dữ liệu (Dashboard & Analytics)
* [cite_start]Biểu đồ hình cột hoặc hình tròn thể hiện phổ điểm tổng quan của lớp học (Tỷ lệ học sinh đạt Giỏi, Khá, Trung bình)[cite: 20].
* [cite_start]Biểu đồ thống kê tỷ lệ chuyên cần của lớp học theo từng tháng[cite: 21].

### 2. Tạo đề trắc nghiệm Online (Quiz System)
* [cite_start]Giáo viên biên soạn ngân hàng câu hỏi trắc nghiệm và thiết lập thời gian làm bài cụ thể (ví dụ: 15 phút)[cite: 22].
* [cite_start]Học sinh thực hiện làm bài trực tuyến, hệ thống tự động khóa bài khi hết giờ, tự động chấm điểm và đồng bộ kết quả vào Sổ điểm[cite: 23].

### 3. Gửi thông báo tự động (Notifications)
* [cite_start]Tự động gửi email nhắc nhở học sinh khi sắp đến thời hạn nộp bài tập (Deadline)[cite: 24].
* [cite_start]Gửi báo cáo kết quả học tập, bảng điểm định kỳ trực tiếp tới email của phụ huynh[cite: 24].

---

## IV. Phân Hệ Dành Cho Học Sinh (Student Portal)
*Nhóm chức năng dành riêng cho trải nghiệm học tập và tương tác của học sinh.*

### 1. Tham gia lớp học (Join Class)
* **Cơ chế:** Học sinh sau khi đăng nhập sẽ tham gia vào lớp học bằng cách nhập **Mã code duy nhất** do giáo viên cung cấp.
* **Quản lý:** Hiển thị danh sách các lớp học mà học sinh đó đã tham gia thành công dưới dạng các thẻ (Card) trực quan.

### 2. Theo dõi học tập & Chuyên cần (Learning & Attendance Tracking)
* **Xem bảng tin:** Học sinh xem được các thông báo, dặn dò của giáo viên trên bảng tin lớp học và có thể tham gia bình luận hỏi đáp.
* **Theo dõi chuyên cần:** Xem lịch sử điểm danh cá nhân (Tổng số buổi có mặt, số buổi đi muộn, số buổi vắng) để tự điều chỉnh việc đi học.

### 3. Nộp bài tập & Xem tài liệu (Assignments & Materials)
* **Tải tài liệu:** Học sinh xem và tải về các tài liệu học tập (PDF, Word, video...) do giáo viên chia sẻ.
* **Nộp bài tập:** Xem danh sách bài tập về nhà sắp đến hạn. Học sinh tiến hành nộp bài bằng cách đính kèm file hoặc nhập nội dung văn bản trước khi hết Deadline.
* **Xem kết quả:** Nhận thông báo điểm số và lời phê nhận xét từ giáo viên ngay khi bài tập được chấm xong.

### 4. Làm bài thi trắc nghiệm Online (Online Examination)
* **Làm bài:** Vào phòng thi trắc nghiệm theo thời gian quy định của giáo viên, giao diện tích hợp đồng hồ đếm ngược tự động.
* **Nộp bài tự động:** Hệ thống tự động thu bài và khóa chọn đáp án khi hết giờ làm bài.
* **Biết kết quả:** Hiển thị số câu đúng/sai và số điểm đạt được ngay sau khi bấm nộp bài (nếu giáo viên cho phép cấu hình xem điểm trước).

## V. Phân Hệ Dành Cho Giáo Viên (Teacher Portal)
*Nhóm chức năng dành riêng cho người trực tiếp giảng dạy và điều hành lớp học.*

### 1. Bảng điều khiển (Teacher Dashboard)
* **Thống kê tổng quan:** Hiển thị biểu đồ phổ điểm, tỷ lệ chuyên cần của các lớp học do giáo viên phụ trách.

### 2. Quản lý danh sách lớp học (Classrooms Management)
* **Thao tác:** Tạo lớp mới (sinh mã Code tự động), sửa thông tin, xóa lớp.
* **Giao diện:** Hiển thị danh sách các lớp học dưới dạng thẻ (Card).

### 3. Không gian Lớp học (Classroom Hub)
* **Bảng tin & Tương tác:** Đăng thông báo, đính kèm tài liệu học tập (PDF, Word, Video) và phản hồi bình luận của học sinh.
* **Bài tập (Assignments):** Giao bài tập về nhà, cài đặt thời hạn (Deadline), chấm điểm và gửi lời phê.
* **Thành viên & Điểm danh:** Quản lý danh sách học sinh, thực hiện điểm danh nhanh hàng ngày (Có mặt/Vắng/Muộn).
* **Sổ điểm (Gradebook):** Lưu trữ điểm số theo các đầu điểm, tự động tính điểm trung bình môn.

### 4. Giao diện Giáo viên cần có (Teacher Interfaces)
* **Trang danh sách Lớp học (Classrooms Page):** Hiển thị các lớp học do giáo viên phụ trách dưới dạng thẻ (Card).
* **Trang Không gian Lớp học (Classroom Hub):** Thiết kế dạng Tabs để tích hợp mọi tính năng vào một màn hình duy nhất (Bảng tin, Bài tập, Học sinh, Sổ điểm).
* **Trang Sổ điểm & Điểm danh (Gradebook & Attendance):** Giao diện dạng lưới bảng tính (Spreadsheet) để nhập điểm nhanh.

---
### Thông tin tài khoản Giáo viên (Mặc định)
* **Email:** teacher@gmail.com
* **Mật khẩu:** teacher123

---

## VI. Phân Hệ Dành Cho Quản Trị Viên (Admin Portal)
*Nhóm chức năng dành cho người quản trị viên hệ thống để kiểm soát và điều hành toàn bộ nền tảng.*

### 1. Bảng điều khiển (Admin Dashboard)
* **Thống kê tổng quan:** Hiển thị các số liệu thống kê như tổng số giáo viên, tổng số học sinh, số lượng lớp học đang hoạt động, và biểu đồ hoạt động của hệ thống.

### 2. Quản lý người dùng (User Management)
* **Quản lý Giáo viên:** Xem danh sách, tạo mới/cấp tài khoản, cập nhật thông tin, khóa hoặc xóa tài khoản giáo viên.
* **Quản lý Học sinh:** Xem toàn bộ danh sách học sinh trên hệ thống, hỗ trợ khôi phục (reset) mật khẩu khi học sinh quên.
* **Phân quyền:** Cấp hoặc thu hồi quyền Admin đối với các tài khoản khác.

### 3. Quản lý hệ thống lớp học (System-wide Classroom Management)
* **Giám sát lớp học:** Xem danh sách tất cả các lớp học hiện có, giáo viên phụ trách, và số lượng thành viên trong từng lớp.
* **Can thiệp:** Khóa hoặc xóa các lớp học vi phạm quy định hoặc không còn hoạt động.

### 4. Giao diện Admin cần có (Admin Interfaces)
* **Trang chủ Admin (Dashboard):** Hiển thị các thẻ thống kê (Cards) và biểu đồ trực quan (Charts).
* **Trang quản lý người dùng (User Management Page):** Giao diện dạng bảng (Data Table) với các tính năng tìm kiếm, lọc (filter), phân trang (pagination) và các nút hành động (Thêm/Sửa/Xóa/Khóa).
* **Trang quản lý lớp học (Classroom Management Page):** Tương tự giao diện dạng bảng để giám sát toàn bộ lớp học trên hệ thống.
* **Trang cài đặt hệ thống (Settings Page - Tùy chọn):** Các form biểu mẫu để điều chỉnh cấu hình hệ thống.

---
### Thông tin tài khoản Admin (Mặc định)
* **Email:** admin@gmail.com
* **Mật khẩu:** admin123

---

## VII. Phân Quyền Chức Năng Theo Vai Trò (Role & Permissions)
*Nhằm làm rõ quyền hạn của từng đối tượng trên hệ thống, dưới đây là mô tả phân quyền chi tiết thay vì dạng bảng:*

### 1. Vai trò Quản trị viên (Admin)
- **Quản lý Tài khoản:** Admin là đối tượng duy nhất có quyền tạo mới, cấp phát tài khoản cho Giáo viên. Ngoài ra, Admin có quyền tối cao trong việc khóa hoặc xóa vĩnh viễn bất kỳ tài khoản nào (cả Giáo viên lẫn Học sinh) nếu có vi phạm.
- **Quản lý Lớp học:** Admin không trực tiếp tạo hay giảng dạy trong các lớp học. Vai trò của Admin ở đây là giám sát toàn bộ hệ thống lớp học, và có quyền can thiệp (khóa, xóa) các không gian lớp học có nội dung không phù hợp hoặc đã bị bỏ hoang.

### 2. Vai trò Giáo viên (Teacher)
- **Quản lý Lớp & Học sinh:** Giáo viên là người trực tiếp điều hành lớp học. Họ có toàn quyền tạo mới lớp học (hệ thống sinh mã Code tự động), sửa đổi thông tin hoặc xóa lớp học do mình phụ trách. Giáo viên cũng có quyền chủ động tạo tài khoản cho Học sinh.
- **Quản lý Học tập & Tương tác:** Giáo viên có quyền đăng tải thông báo, đính kèam tài liệu học tập (PDF, Video) lên bảng tin lớp học và phản hồi bình luận. Họ là người thiết lập bài tập về nhà, cài đặt thời hạn nộp bài (Deadline), cũng như trực tiếp chấm điểm và để lại lời phê cho học sinh.
- **Sổ điểm & Điểm danh:** Giáo viên có đặc quyền thực hiện điểm danh hàng ngày (Có mặt / Vắng / Muộn) và nhập điểm, sửa điểm trên hệ thống Sổ điểm. Hệ thống cung cấp cho giáo viên các biểu đồ trực quan hóa dữ liệu về chuyên cần và phổ điểm của lớp học.

### 3. Vai trò Học sinh (Student)
- **Tham gia lớp học:** Học sinh không có quyền tạo lớp. Các em chỉ có thể tham gia vào các lớp học hiện có bằng cách nhập chính xác Mã lớp (Code) do giáo viên cung cấp.
- **Tương tác & Học tập:** Trên không gian lớp học, học sinh được phép xem, tải xuống các tài liệu học tập và tham gia bình luận hỏi đáp. Đặc quyền quan trọng nhất của học sinh là nộp bài tập (Upload tệp tin hoặc gõ văn bản) và làm bài thi trắc nghiệm Online trước khi hết hạn Deadline.
- **Theo dõi kết quả:** Về mặt dữ liệu điểm số và chuyên cần, học sinh chỉ có quyền "Chỉ xem" (Read-only). Các em có thể theo dõi lịch sử điểm danh cá nhân, xem điểm số từng bài kiểm tra và đọc lời phê của giáo viên, nhưng tuyệt đối không có quyền chỉnh sửa.





Kế hoạch Triển khai: Quản lý tài khoản (Authentication & User Management)
Dựa trên yêu cầu của bạn về việc triển khai chức năng Quản lý tài khoản cho 3 role (Admin, Teacher, Student) theo thiết kế trong tài liệu features.md, dưới đây là kế hoạch chi tiết.

User Review Required
IMPORTANT

Xác nhận luồng thay đổi Database: Model User hiện tại trong backend đang thiếu trường status (để phân biệt Active/Locked). Kế hoạch này sẽ bổ sung trường này và thêm điều kiện chặn đăng nhập với các tài khoản bị khóa. Bạn có đồng ý với sự thay đổi Schema này không?

WARNING

Đổi tên API: Backend hiện tại đang đặt tên các hàm login là loginTeacher và loginTeacherService (nhưng logic lại dùng chung cho mọi role). Tôi sẽ đổi tên thành login và loginService để phản ánh đúng bản chất dùng cho cả 3 role (Admin, Teacher, Student).

Open Questions
Đối với học sinh, chức năng "Đăng ký" có mở công khai không, hay học sinh chỉ được cấp tài khoản bởi Admin/Teacher như trong bảng phân quyền? (Hiện tại backend chỉ có API tạo từ Admin/Teacher).
Với chức năng Khôi phục (Reset) mật khẩu, Admin/Teacher sẽ tạo mật khẩu mới trực tiếp rồi gửi cho Học sinh/Giáo viên, hay hệ thống sẽ random ra mật khẩu?
Proposed Changes
Backend (backend-classroom)
[MODIFY] src/models/User.ts
Thêm trường status: { type: String, enum: ['Active', 'Locked'], default: 'Active' }.
[MODIFY] src/services/authService.ts
Cập nhật logic hàm loginTeacherService (đổi tên thành loginService).
Thêm logic: Kiểm tra nếu user.status === 'Locked' thì ném ra lỗi từ chối đăng nhập.
[MODIFY] src/controllers/authController.ts & src/routes/authRoutes.ts
Đổi tên loginTeacher thành login.
Đảm bảo các route tạo tài khoản (create-teacher, create-student) lưu trữ trường status đúng chuẩn.
[NEW] src/controllers/userController.ts
Tạo controller để quản lý tài khoản với các hàm:

getUsers: Lấy danh sách user (hỗ trợ query tìm kiếm, filter theo role, status).
updateUserStatus: Khóa / Mở khóa tài khoản.
updateUserRole: Cấp quyền Admin cho tài khoản khác.
resetUserPassword: Reset mật khẩu cho user (chỉ áp dụng đối với những người có thẩm quyền nhỏ hơn hoặc bằng).
[NEW] src/routes/userRoutes.ts
Tạo route riêng biệt cho việc quản lý người dùng:

GET / -> getUsers
PUT /:id/status -> updateUserStatus
PUT /:id/role -> updateUserRole
PUT /:id/reset-password -> resetUserPassword
Cập nhật src/routes/index.ts để kết nối userRoutes.
Frontend (fontend-classroom)
[MODIFY] src/service/user.service.ts
Thêm file service (hoặc cập nhật auth.service.ts) gọi các endpoints mới của userRoutes (như getUsers, updateUserStatus, v.v.).
[MODIFY] src/pages/Admin/Teachers/AdminTeachers.tsx
Xóa bỏ Mock Data (initialData) và thay thế bằng dữ liệu thực lấy từ API GET /users.
Gắn chức năng cho các nút hành động (Action Menu):
Khóa tài khoản / Mở khóa: Gọi API update status.
Đổi quyền: Gọi API update role.
Reset mật khẩu: Mở Modal cho phép đặt lại mật khẩu và gọi API.
Tích hợp thêm state Loading khi fetch data.
[MODIFY] src/pages/Teacher/Students/TeacherStudents.tsx (nếu có)
Tương tự như Admin, giao diện của Giáo viên cũng cần tích hợp việc xem/sửa/khóa/tạo học sinh cho các lớp học do mình phụ trách.
Verification Plan
Automated Tests
Kiểm tra npm build của backend và frontend xem có lỗi syntax không.
Manual Verification
Dùng công cụ test API nội bộ gọi thử các chức năng CRUD người dùng.
Thử tạo mới một tài khoản Học sinh/Giáo viên, sau đó dùng tài khoản đó đăng nhập xem có thành công và redirect đúng page không.
Thử thao tác Khóa (Lock) tài khoản, sau đó dùng tài khoản vừa bị khóa đăng nhập xem hệ thống có trả về lỗi "Tài khoản bị khóa" hay không.