# Tài liệu Đặc tả Chức năng Quản trị (Admin)

Tài liệu này định nghĩa chi tiết các chức năng dành cho vai trò Quản trị viên (Admin) trong hệ thống Classroom Manager. Mục đích của tài liệu là giúp theo dõi các tính năng hiện tại, phục vụ cho việc bảo trì và nâng cấp trong tương lai.

## 1. Quản lý Người dùng (`/admin/users`)

Tính năng quản lý toàn bộ tài khoản giáo viên, học sinh và các quản trị viên khác trên hệ thống.

**Các chức năng chính:**
- **Thêm người dùng mới:** Admin có thể tạo tài khoản cho Giáo viên, bao gồm việc thiết lập họ tên, email và mật khẩu khởi tạo. (Tài khoản Học sinh thường do Giáo viên quản lý hoặc tự đăng ký).
- **Tìm kiếm & Lọc:**
  - Tìm kiếm người dùng theo tên hoặc email.
  - Lọc danh sách theo vai trò (Admin, Giáo viên, Học sinh).
  - Lọc theo trạng thái tài khoản (Đang hoạt động, Đang khóa).
- **Phân quyền (Đổi quyền):** Cho phép thay đổi vai trò của một người dùng (vd: từ Giáo viên sang Admin hoặc Học sinh).
- **Khóa / Mở khóa tài khoản:** Tạm thời vô hiệu hóa tài khoản của một người dùng. Khi bị khóa, người dùng không thể truy cập hệ thống.
- **Reset mật khẩu:** Đặt lại mật khẩu mới cho người dùng trong trường hợp họ quên mật khẩu.
- **Xóa tài khoản:** Xóa vĩnh viễn tài khoản khỏi hệ thống (Hỗ trợ xóa đơn lẻ hoặc xóa hàng loạt).

## 2. Quản lý Lớp học Hệ thống (`/admin/classrooms`)

Tính năng giám sát và quản trị tất cả các lớp học đang hoạt động hoặc đã bị khóa trên toàn hệ thống.

**Các chức năng chính:**
- **Thống kê tổng quan:** Xem tổng số lớp học, số lớp đang hoạt động, số lớp bị khóa, tổng học sinh tham gia và sĩ số trung bình mỗi lớp.
- **Danh sách lớp học:** Hiển thị thông tin lớp học bao gồm tên lớp, mã lớp, giáo viên phụ trách, bộ môn, sĩ số, ngày tạo và trạng thái.
- **Tìm kiếm & Lọc:**
  - Tìm kiếm lớp học theo tên lớp hoặc mã lớp.
  - Lọc theo bộ môn (tab phân loại) hoặc theo trạng thái hoạt động.
- **Quản trị lớp học:**
  - **Khóa / Mở khóa lớp học:** Khóa lớp học để tạm ngưng mọi hoạt động; giáo viên và học sinh không thể truy cập vào bài tập của lớp đó nữa.
  - **Xóa lớp học:** Xóa vĩnh viễn lớp học cùng mọi dữ liệu liên quan (điểm số, bài tập).
- **Xem nhanh lớp học (Quick View):** Khi nhấn vào một lớp, panel bên phải sẽ trượt ra hiển thị các thông tin nhanh như: chủ đề bài giảng hiện tại, các hoạt động mới nhất (ví dụ: tạo bài tập, đăng thông báo), v.v.

## 3. Cài đặt Hệ thống (`/admin/settings`)

Khu vực quản lý cấu hình toàn cục, bảo mật và thông báo cho hệ thống.

**Các chức năng chính:**
- **Cấu hình chung:**
  - Chỉnh sửa tên hệ thống.
  - Thiết lập múi giờ (GMT+7, GMT+8, v.v.).
  - Cấu hình định dạng ngày tháng (DD/MM/YYYY hoặc MM/DD/YYYY).
  - Cập nhật logo của hệ thống.
- **Chế độ bảo trì:** Bật/tắt chế độ bảo trì. Khi bật, hệ thống sẽ vô hiệu hóa truy cập của người dùng thông thường, chỉ Admin có thể truy cập.
- **Khu vực nguy hiểm (Danger Zone):** Đặt lại cấu hình hệ thống về mặc định gốc.
- **Các tính năng dự kiến (Đang phát triển):**
  - Cài đặt Bảo mật (Security).
  - Cài đặt Thông báo (Notifications).
  - Tích hợp bên thứ ba (Integrations).

## 4. Danh sách các API Admin sử dụng

Dưới đây là danh sách các REST API được gọi từ phía Client (Frontend) khi Quản trị viên thao tác trên hệ thống:

### Module Quản lý Người dùng
- `GET /api/v1/users`: Lấy danh sách toàn bộ người dùng (hỗ trợ query `role`, `status`, `search`).
- `POST /api/v1/auth/create-teacher`: Tạo mới tài khoản Giáo viên.
- `PUT /api/v1/users/:id/status`: Cập nhật trạng thái người dùng (Khóa/Mở khóa - `Active` | `Locked`).
- `PUT /api/v1/users/:id/role`: Đổi vai trò tài khoản (`admin` | `teacher` | `student`).
- `PUT /api/v1/users/:id/reset-password`: Đặt lại mật khẩu cho người dùng.
- `DELETE /api/v1/users/:id`: Xóa vĩnh viễn tài khoản người dùng khỏi hệ thống.

### Module Quản lý Lớp học
- `GET /api/v1/classrooms/admin`: Lấy danh sách toàn bộ lớp học trên toàn hệ thống kèm theo số liệu sĩ số tổng hợp.
- `PUT /api/v1/classrooms/:id/status`: Khóa hoặc mở khóa lớp học (`Active` | `Locked`).
- `DELETE /api/v1/classrooms/:id`: Xóa vĩnh viễn lớp học.
- `GET /api/v1/classrooms/admin/:id/activities`: Lấy dữ liệu hoạt động gần nhất của một lớp học cụ thể (để hiển thị ở Quick View).

## 5. Luồng dữ liệu (Data Flow)

**1. Luồng dữ liệu Quản lý người dùng:**
- **Lấy dữ liệu (Fetch):** Khi Admin vào trang `/admin/users`, Component sẽ gọi API `GET /api/v1/users`. Backend truy vấn CSDL, áp dụng các bộ lọc (nếu có) và trả về mảng danh sách người dùng. Frontend lưu vào State (`users`), kết hợp với `useMemo` để lọc và phân trang ngay trên Client nhằm tối ưu tốc độ.
- **Thao tác dữ liệu (Mutations):** Khi Admin thực hiện thay đổi (như Khóa tài khoản, Tạo mới, hay Xóa), Frontend gửi HTTP Request tương ứng (`PUT`, `POST`, `DELETE`). Khi nhận được HTTP Status 200/201 (Thành công), Frontend có 2 cách xử lý:
  - Cập nhật trực tiếp vào State để UI phản hồi ngay lập tức (Optimistic Update).
  - Hoặc gọi lại hàm `fetchUsers()` để đồng bộ hóa danh sách mới nhất từ Database.

**2. Luồng dữ liệu Quản lý lớp học:**
- **Lấy dữ liệu (Fetch):** Ở trang `/admin/classrooms`, API `GET /api/v1/classrooms/admin` được gọi. Backend sẽ tổng hợp (aggregate) các collection trong DB để đếm số lượng học sinh (`studentCount`), liên kết với thông tin giáo viên và trả về payload tổng hợp.
- **Xem hoạt động (Quick View):** Khi nhấn vào một lớp học, State `selectedClass` được gán thành thông tin của lớp đó. Một `useEffect` lắng nghe sự thay đổi của `selectedClass` và gọi API `GET /api/v1/classrooms/admin/:id/activities` để tải thêm dữ liệu hoạt động chi tiết mà không làm chậm bảng danh sách chính.
- **Thao tác (Lock/Delete):** Các thao tác cập nhật (`PUT`, `DELETE`) sẽ kích hoạt thay đổi DB, sau đó Frontend hiển thị thông báo thành công và gọi lại `fetchClasses()` để lấy lại dữ liệu mới nhất, đảm bảo các thẻ thống kê tổng quan (Cards) cũng được cập nhật.
