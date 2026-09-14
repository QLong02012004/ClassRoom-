const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function runTests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING ADMIN MODULE 3 AUTOMATED TESTS');
  console.log('Module 3: Quản lý Người dùng (User Management - /admin/users)');
  console.log('====================================================\n');

  let adminToken = '';
  let adminId = '';

  // 0. Connect to MongoDB for OTP verification and DB state checks
  const MONGO_URI = 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully for test assertions.\n');
  } catch (err) {
    console.warn('MongoDB connection warning:', err.message);
  }

  // 1. Authenticate Admin
  try {
    const resAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const dataAdmin = await resAdmin.json();
    adminToken = dataAdmin?.data?.accessToken || '';
    adminId = dataAdmin?.data?.user?.id || dataAdmin?.data?.user?._id || '';
  } catch (e) {
    console.error('Error during Admin login:', e);
  }

  if (!adminToken) {
    console.error('CRITICAL: Admin token could not be obtained. Aborting tests.');
    process.exit(1);
  }

  // ----------------------------------------------------
  // TC-ADM-07: TẠO GIÁO VIÊN MỚI TRỰC TIẾP
  // ----------------------------------------------------

  // 07.1 (Positive): Admin tạo tài khoản Giáo viên hợp lệ
  const teacherDirectEmail = `teacher_direct_${Date.now()}@gmail.com`;
  let createdTeacherId = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/create-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Lê Văn B',
        email: teacherDirectEmail,
        password: 'Password@2026',
        subject: 'Toán'
      })
    });
    const data = await res.json();
    const is201 = res.status === 201;
    createdTeacherId = data?.user?.id || data?.user?._id;
    const isTeacherRole = data?.user?.role === 'teacher';
    const isActive = data?.user?.status === 'Active';
    const passed = is201 && createdTeacherId && isTeacherRole && isActive;

    record(
      'TC-ADM-07',
      'Admin tạo tài khoản Giáo viên hợp lệ',
      '07.1 (Positive)',
      'Status 201, User created with role teacher and status Active',
      `Status: ${res.status}, ID: ${createdTeacherId}, Role: ${data?.user?.role}, Status: ${data?.user?.status}`,
      passed,
      `Email: ${teacherDirectEmail}`
    );
  } catch (err) {
    record('TC-ADM-07', 'Admin tạo tài khoản Giáo viên hợp lệ', '07.1 (Positive)', 'Status 201', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-07B: TỰ ĐỘNG ƯU TIÊN & PHÊ DUYỆT GIÁO VIÊN TỰ ĐĂNG KÝ
  // ----------------------------------------------------

  // 07B.1 (Positive): Tài khoản Pending tự động xếp TOP ĐẦU Trang 1 & Phê duyệt
  const pendingTeacherEmail = `teacher_pending_${Date.now()}@gmail.com`;
  let pendingTeacherId = null;
  try {
    // Bước 1: Đăng ký giáo viên
    const resReg = await fetch(`${BASE_URL}/auth/register-teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Thầy A Giáo Viên',
        email: pendingTeacherEmail,
        password: 'Password@2026',
        subject: 'Toán'
      })
    });
    const dataReg = await resReg.json();

    // Bước 2: Lấy mã OTP trong MongoDB và verify
    const dbUser = await mongoose.connection.collection('users').findOne({ email: pendingTeacherEmail });
    pendingTeacherId = dbUser?._id?.toString();
    const otp = dbUser?.emailVerificationOTP;

    const resVerify = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: pendingTeacherEmail,
        otp: otp
      })
    });
    const dataVerify = await resVerify.json();

    // Kiểm tra trạng thái trong DB lúc này là Pending
    const dbUserAfterVerify = await mongoose.connection.collection('users').findOne({ email: pendingTeacherEmail });
    const isStatusPending = dbUserAfterVerify?.status === 'Pending';

    // Bước 3: Kiểm tra code frontend AdminUsers.tsx có logic ưu tiên xếp Pending lên TOP đầu Trang 1
    const adminUsersPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Users/AdminUsers.tsx');
    const adminUsersContent = fs.readFileSync(adminUsersPath, 'utf-8');
    const hasTopPendingSorting = adminUsersContent.includes("if (a.status === 'Pending' && b.status !== 'Pending') return -1;") &&
                                 adminUsersContent.includes("if (a.status !== 'Pending' && b.status === 'Pending') return 1;");

    // Bước 4: Admin bấm phê duyệt (gọi API cập nhật trạng thái sang Active)
    const resApprove = await fetch(`${BASE_URL}/users/${pendingTeacherId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Active' })
    });
    const dataApprove = await resApprove.json();
    const isApprovedActive = dataApprove?.data?.status === 'Active';

    const passed = isStatusPending && hasTopPendingSorting && isApprovedActive;
    record(
      'TC-ADM-07B',
      'Tài khoản Pending tự động xếp TOP ĐẦU Trang 1 & Phê duyệt',
      '07B.1 (Positive)',
      'Teacher self-registers -> Pending -> Sorted to TOP 1 on frontend -> Admin approves to Active',
      `Pending state: ${isStatusPending}, Top sorting in code: ${hasTopPendingSorting}, Approved Active: ${isApprovedActive}`,
      passed,
      `Pending Teacher Email: ${pendingTeacherEmail}`
    );
  } catch (err) {
    record('TC-ADM-07B', 'Tự động Ưu tiên & Phê duyệt Giáo viên tự đăng ký', '07B.1 (Positive)', 'Pending & Approved', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-07C: ĐĂNG KÝ HỌC SINH THỦ CÔNG & XÁC THỰC OTP
  // ----------------------------------------------------

  // 07C.1 (Positive): Học sinh tự đăng ký -> Nhập OTP -> Active ngay lập tức
  const studentAutoEmail = `student_auto_${Date.now()}@gmail.com`;
  let studentAutoId = null;
  try {
    // 1. Register student
    const resReg = await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Học Sinh A',
        email: studentAutoEmail,
        password: 'Password@2026'
      })
    });

    // 2. Verify OTP
    const dbStudent = await mongoose.connection.collection('users').findOne({ email: studentAutoEmail });
    studentAutoId = dbStudent?._id?.toString();
    const otpStudent = dbStudent?.emailVerificationOTP;

    const resVerify = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentAutoEmail,
        otp: otpStudent
      })
    });

    // 3. Check status is Active immediately (no admin approval needed)
    const dbStudentAfter = await mongoose.connection.collection('users').findOne({ email: studentAutoEmail });
    const isStudentActive = dbStudentAfter?.status === 'Active';

    // 4. Student can login right away
    const resLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentAutoEmail,
        password: 'Password@2026'
      })
    });
    const dataLogin = await resLogin.json();
    const canLogin = resLogin.status === 200 && !!dataLogin?.data?.accessToken;

    const passed = isStudentActive && canLogin;
    record(
      'TC-ADM-07C',
      'Học sinh tự đăng ký -> Nhập OTP -> Active ngay lập tức',
      '07C.1 (Positive)',
      'Status becomes Active immediately upon OTP verification without admin approval; login succeeds',
      `DB Status: ${dbStudentAfter?.status}, Login Status: ${resLogin.status}, Has Token: ${canLogin}`,
      passed,
      `Student Email: ${studentAutoEmail}`
    );
  } catch (err) {
    record('TC-ADM-07C', 'Học sinh tự đăng ký -> Nhập OTP -> Active ngay lập tức', '07C.1 (Positive)', 'Active & Login', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-07D: KIỂM THỬ BẢO MẬT TÀI KHOẢN CHƯA XÁC THỰC EMAIL
  // ----------------------------------------------------

  // 07D.1 (Security Check): Đăng nhập bằng tài khoản chưa nhập OTP
  const unverifiedEmail = `unverified_${Date.now()}@gmail.com`;
  try {
    // 1. Register without entering OTP
    await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chưa Xác Thực',
        email: unverifiedEmail,
        password: 'Password@2026'
      })
    });

    // 2. Try login
    const resLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: unverifiedEmail,
        password: 'Password@2026'
      })
    });
    const dataLogin = await resLogin.json();
    const isBlocked = resLogin.status === 401;
    const hasUnverifiedMsg = (dataLogin?.message || '').includes('chưa được xác thực Email');

    // 3. Check frontend Login.tsx activates OTP Modal directly on login screen
    const loginPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Auth/Login/Login.tsx');
    const loginContent = fs.readFileSync(loginPath, 'utf-8');
    const hasAutoModalOtp = loginContent.includes('chưa được xác thực Email') &&
                            loginContent.includes('setShowOTP(true)');

    const passed = isBlocked && hasUnverifiedMsg && hasAutoModalOtp;
    record(
      'TC-ADM-07D',
      'Đăng nhập bằng tài khoản chưa nhập OTP',
      '07D.1 (Security Check)',
      'Blocked 401 with unverified email message; Login screen automatically triggers 6-digit OTP Modal',
      `Status: ${resLogin.status}, Msg: ${dataLogin?.message}, Auto OTP Modal: ${hasAutoModalOtp}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-07D', 'Đăng nhập bằng tài khoản chưa nhập OTP', '07D.1 (Security Check)', 'Blocked & OTP Modal', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-07E: ĐĂNG KÝ LẠI BẰNG EMAIL CHƯA XÁC THỰC
  // ----------------------------------------------------

  // 07E.1 (Positive): Đăng ký lại bằng Email đã tạo nhưng chưa nhập OTP
  try {
    // Re-register using the unverifiedEmail from 07D
    const resReReg = await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Đăng Ký Lại Thành Công',
        email: unverifiedEmail,
        password: 'Password@2026'
      })
    });
    const dataReReg = await resReReg.json();
    const passed = resReReg.status === 201 && dataReReg?.user?.id;

    record(
      'TC-ADM-07E',
      'Đăng ký lại bằng Email đã tạo nhưng chưa nhập OTP',
      '07E.1 (Positive)',
      'Overwrites previous unverified record, sends new OTP, does not throw duplicate email error (Status 201)',
      `Status: ${resReReg.status}, Message: ${dataReReg?.message}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-07E', 'Đăng ký lại bằng Email chưa xác thực', '07E.1 (Positive)', 'Status 201', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-08: TẠO GIÁO VIÊN (NEGATIVE & VALIDATION)
  // ----------------------------------------------------

  // 08.1 (Negative): Tạo bằng Email đã tồn tại
  try {
    const res = await fetch(`${BASE_URL}/auth/create-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Giáo Viên Trùng',
        email: 'admin@gmail.com',
        password: 'Password@2026',
        subject: 'Toán'
      })
    });
    const data = await res.json();
    const passed = res.status >= 400 && (data?.message || '').includes('đã được đăng ký');
    record(
      'TC-ADM-08',
      'Tạo bằng Email đã tồn tại',
      '08.1 (Negative)',
      'Status >= 400: Email này đã được đăng ký sử dụng trên hệ thống',
      `Status: ${res.status}, Msg: ${data?.message}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-08', 'Tạo bằng Email đã tồn tại', '08.1 (Negative)', 'Error status >= 400', err.message, false);
  }

  // 08.2 (Validation): Nhập Email sai định dạng
  try {
    const res = await fetch(`${BASE_URL}/auth/create-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Giáo Viên Sai Email',
        email: 'teacherbformat',
        password: 'Password@2026',
        subject: 'Toán'
      })
    });
    const data = await res.json();
    const passed = res.status === 400 && (data?.message || '').includes('email');
    record(
      'TC-ADM-08',
      'Nhập Email sai định dạng',
      '08.2 (Validation)',
      'Status 400: Định dạng email không hợp lệ',
      `Status: ${res.status}, Msg: ${data?.message}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-08', 'Nhập Email sai định dạng', '08.2 (Validation)', 'Status 400', err.message, false);
  }

  // 08.3 (Boundary): Mật khẩu không đủ mạnh (< 8 ký tự hoặc thiếu hoa/thường/số/ký tự đặc biệt)
  try {
    const res = await fetch(`${BASE_URL}/auth/create-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Giáo Viên Mật Khẩu Yếu',
        email: `weakpass_${Date.now()}@gmail.com`,
        password: 'Password123', // missing special char
        subject: 'Toán'
      })
    });
    const data = await res.json();
    const passed = res.status === 400 && (data?.message || '').includes('Mật khẩu phải chứa ít nhất 8 ký tự');
    record(
      'TC-ADM-08',
      'Mật khẩu không đủ mạnh',
      '08.3 (Boundary)',
      'Status 400: Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt!',
      `Status: ${res.status}, Msg: ${data?.message}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-08', 'Mật khẩu không đủ mạnh', '08.3 (Boundary)', 'Status 400', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-09: TÌM KIẾM NGƯỜI DÙNG
  // ----------------------------------------------------

  // 09.1 (Search): Tìm kiếm theo Tên chính xác hoặc tương đối
  try {
    const res = await fetch(`${BASE_URL}/users?search=Admin`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const is200 = res.status === 200;
    const users = data?.data || [];
    const allMatch = users.length > 0 && users.every(u => u.name.toLowerCase().includes('admin') || u.email.toLowerCase().includes('admin'));
    const passed = is200 && allMatch;

    record(
      'TC-ADM-09',
      'Tìm kiếm theo Tên chính xác hoặc tương đối',
      '09.1 (Search)',
      'Status 200, users list filtered with keyword in Name',
      `Found ${users.length} users, all matching query 'Admin'`,
      passed
    );
  } catch (err) {
    record('TC-ADM-09', 'Tìm kiếm theo Tên', '09.1 (Search)', 'Status 200', err.message, false);
  }

  // 09.2 (Search): Tìm kiếm theo Email
  try {
    const res = await fetch(`${BASE_URL}/users?search=teacher@gmail.com`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const is200 = res.status === 200;
    const users = data?.data || [];
    const hasTarget = users.some(u => u.email.toLowerCase() === 'teacher@gmail.com');
    const passed = is200 && hasTarget;

    record(
      'TC-ADM-09',
      'Tìm kiếm theo Email',
      '09.2 (Search)',
      'Status 200, returns user matching specified email',
      `Found ${users.length} users with email matching 'teacher@gmail.com'`,
      passed
    );
  } catch (err) {
    record('TC-ADM-09', 'Tìm kiếm theo Email', '09.2 (Search)', 'Status 200', err.message, false);
  }

  // 09.3 (Empty Result): Tìm từ khóa không tồn tại
  try {
    const res = await fetch(`${BASE_URL}/users?search=nonexistent_xyz_987654321`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const is200 = res.status === 200;
    const users = data?.data || [];
    const passed = is200 && users.length === 0;

    record(
      'TC-ADM-09',
      'Tìm từ khóa không tồn tại',
      '09.3 (Empty Result)',
      'Status 200, empty array data []',
      `Status: ${res.status}, Returned ${users.length} records`,
      passed
    );
  } catch (err) {
    record('TC-ADM-09', 'Tìm từ khóa không tồn tại', '09.3 (Empty Result)', 'Empty array []', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-10: LỌC THEO VAI TRÒ
  // ----------------------------------------------------

  // 10.1 (Filter): Lọc riêng Giáo viên / Học sinh / Admin
  try {
    const resTeacher = await fetch(`${BASE_URL}/users?role=teacher`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataTeacher = await resTeacher.json();
    const teachers = dataTeacher?.data || [];
    const allTeachers = teachers.length > 0 && teachers.every(u => u.role === 'teacher');

    const resStudent = await fetch(`${BASE_URL}/users?role=student`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataStudent = await resStudent.json();
    const students = dataStudent?.data || [];
    const allStudents = students.length > 0 && students.every(u => u.role === 'student');

    const resAdminFilter = await fetch(`${BASE_URL}/users?role=admin`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataAdminFilter = await resAdminFilter.json();
    const admins = dataAdminFilter?.data || [];
    const allAdmins = admins.length > 0 && admins.every(u => u.role === 'admin');

    const passed = allTeachers && allStudents && allAdmins;
    record(
      'TC-ADM-10',
      'Lọc riêng Giáo viên / Học sinh / Admin',
      '10.1 (Filter)',
      'Status 200, records strictly filtered by role (teacher, student, admin)',
      `Teachers: ${teachers.length} (all valid: ${allTeachers}), Students: ${students.length} (all valid: ${allStudents}), Admins: ${admins.length} (all valid: ${allAdmins})`,
      passed
    );
  } catch (err) {
    record('TC-ADM-10', 'Lọc riêng Giáo viên / Học sinh / Admin', '10.1 (Filter)', 'Status 200 by role', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-11: LỌC THEO TRẠNG THÁI
  // ----------------------------------------------------

  // 11.1 (Filter): Lọc tài khoản Active / Pending / Locked
  try {
    const resActive = await fetch(`${BASE_URL}/users?status=Active`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataActive = await resActive.json();
    const activeUsers = dataActive?.data || [];
    const allActive = activeUsers.length > 0 && activeUsers.every(u => u.status === 'Active');

    const resLocked = await fetch(`${BASE_URL}/users?status=Locked`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataLocked = await resLocked.json();
    const lockedUsers = dataLocked?.data || [];
    const allLocked = lockedUsers.every(u => u.status === 'Locked');

    const passed = allActive && allLocked;
    record(
      'TC-ADM-11',
      'Lọc tài khoản Active / Pending / Locked',
      '11.1 (Filter)',
      'Status 200, records strictly filtered by status (Active, Locked)',
      `Active: ${activeUsers.length} (all active: ${allActive}), Locked: ${lockedUsers.length} (all locked: ${allLocked})`,
      passed
    );
  } catch (err) {
    record('TC-ADM-11', 'Lọc tài khoản Active / Pending / Locked', '11.1 (Filter)', 'Status 200 by status', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-11B: XEM HỒ SƠ CHI TIẾT & TÁCH BIỆT THAO TÁC
  // ----------------------------------------------------

  // 11B.1 (Interactive Modal): Click vào dòng người dùng mở Modal Hồ Sơ Chi Tiết
  try {
    const adminUsersPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Users/AdminUsers.tsx');
    const content = fs.readFileSync(adminUsersPath, 'utf-8');

    // 1. Kiểm tra 7 trường thông tin chi tiết:
    const hasAvatar = content.includes('detailUser.avatar');
    const hasGender = content.includes('detailUser.gender');
    const hasDob = content.includes('detailUser.dob');
    const hasPhone = content.includes('detailUser.phone');
    const hasDegree = content.includes('detailUser.degree');
    const hasSubject = content.includes('detailUser.subject');
    const hasBio = content.includes('detailUser.bio');
    const hasCreatedAt = content.includes('detailUser.createdAt');

    const hasAll7Fields = hasAvatar && hasGender && hasDob && hasPhone && hasDegree && hasSubject && hasBio && hasCreatedAt;

    // 2. Tách biệt 2 nút Phê duyệt & Đóng (gap-3):
    const hasGap3 = content.includes('gap-3') && content.includes('Phê duyệt kích hoạt') && content.includes('Đóng');

    // 3. Click cell không làm dính chọn checkbox selection (stopPropagation):
    const hasStopPropagation = content.includes('e.stopPropagation()') && content.includes('handleOpenDetail(user)');

    const passed = hasAll7Fields && hasGap3 && hasStopPropagation;
    record(
      'TC-ADM-11B',
      'Click vào dòng người dùng mở Modal Hồ Sơ Chi Tiết',
      '11B.1 (Interactive Modal)',
      'Modal renders 7 fields; Approve & Close buttons separated by gap-3; Click does not toggle selection checkbox',
      `7 Fields: ${hasAll7Fields}, Separated Buttons (gap-3): ${hasGap3}, Stop Propagation: ${hasStopPropagation}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-11B', 'Xem Hồ Sơ Chi Tiết & Tách Biệt Thao Tác', '11B.1 (Interactive Modal)', 'Modal checks', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-12: KHÓA TÀI KHOẢN NGƯỜI DÙNG
  // ----------------------------------------------------

  // 12.1 (Positive): Khóa 1 tài khoản đang Active
  let testTargetUserId = createdTeacherId;
  try {
    const res = await fetch(`${BASE_URL}/users/${testTargetUserId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Locked' })
    });
    const data = await res.json();
    const passed = res.status === 200 && data?.data?.status === 'Locked';

    record(
      'TC-ADM-12',
      'Khóa 1 tài khoản đang Active',
      '12.1 (Positive)',
      'Status 200, user status updated to Locked',
      `Status: ${res.status}, Updated Status: ${data?.data?.status}`,
      passed,
      `User ID: ${testTargetUserId}`
    );
  } catch (err) {
    record('TC-ADM-12', 'Khóa 1 tài khoản đang Active', '12.1 (Positive)', 'Status 200 Locked', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-13: KIỂM THỬ BẢO MẬT TÀI KHOẢN BỊ KHÓA
  // ----------------------------------------------------

  // 13.1 (Security Check): Đăng nhập bằng tài khoản vừa bị khóa
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: teacherDirectEmail,
        password: 'Password@2026'
      })
    });
    const data = await res.json();
    const isBlocked = res.status === 401;
    const hasLockedMsg = (data?.message || '').includes('đã bị khóa');
    const passed = isBlocked && hasLockedMsg;

    record(
      'TC-ADM-13',
      'Đăng nhập bằng tài khoản vừa bị khóa',
      '13.1 (Security Check)',
      'Status 401: Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!',
      `Status: ${res.status}, Message: ${data?.message}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-13', 'Đăng nhập bằng tài khoản vừa bị khóa', '13.1 (Security Check)', 'Status 401 Locked', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-13B: KIỂM THỬ BẢO MẬT TÀI KHOẢN CHỜ DUYỆT
  // ----------------------------------------------------

  // 13B.1 (Security Check): Đăng nhập bằng Giáo viên mới đăng ký chưa được duyệt
  const unapprovedTeacherEmail = `unapproved_${Date.now()}@gmail.com`;
  try {
    // 1. Register teacher
    await fetch(`${BASE_URL}/auth/register-teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Giáo Viên Chờ Duyệt',
        email: unapprovedTeacherEmail,
        password: 'Password@2026',
        subject: 'Toán'
      })
    });

    // 2. Verify OTP -> becomes Pending
    const dbTeacher = await mongoose.connection.collection('users').findOne({ email: unapprovedTeacherEmail });
    const otp = dbTeacher?.emailVerificationOTP;
    await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: unapprovedTeacherEmail,
        otp: otp
      })
    });

    // 3. Try to login
    const resLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: unapprovedTeacherEmail,
        password: 'Password@2026'
      })
    });
    const dataLogin = await resLogin.json();
    const isBlocked = resLogin.status === 401;
    const hasPendingMsg = (dataLogin?.message || '').includes('đang chờ Ban giám hiệu phê duyệt');
    const passed = isBlocked && hasPendingMsg;

    record(
      'TC-ADM-13B',
      'Đăng nhập bằng Giáo viên mới đăng ký chưa được duyệt',
      '13B.1 (Security Check)',
      'Status 401: Tài khoản của bạn đang chờ Ban giám hiệu phê duyệt. Vui lòng liên hệ Admin!',
      `Status: ${resLogin.status}, Message: ${dataLogin?.message}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-13B', 'Đăng nhập bằng Giáo viên chưa được duyệt', '13B.1 (Security Check)', 'Status 401 Pending', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-14: MỞ KHÓA TÀI KHOẢN
  // ----------------------------------------------------

  // 14.1 (Positive): Mở khóa tài khoản Locked
  try {
    const res = await fetch(`${BASE_URL}/users/${testTargetUserId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Active' })
    });
    const data = await res.json();
    const isStatusActive = res.status === 200 && data?.data?.status === 'Active';

    // Verify user can now log in
    const resLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: teacherDirectEmail,
        password: 'Password@2026'
      })
    });
    const dataLogin = await resLogin.json();
    const canLogin = resLogin.status === 200 && !!dataLogin?.data?.accessToken;
    const passed = isStatusActive && canLogin;

    record(
      'TC-ADM-14',
      'Mở khóa tài khoản Locked',
      '14.1 (Positive)',
      'Status 200, status returns to Active; user logs in successfully',
      `Updated Status: ${data?.data?.status}, Login Status: ${resLogin.status}, Has Token: ${canLogin}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-14', 'Mở khóa tài khoản Locked', '14.1 (Positive)', 'Active & Login', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-15: PHÂN QUYỀN / ĐỔI VAI TRÒ
  // ----------------------------------------------------

  // 15.1 (Positive): Nâng quyền Giáo viên thành Admin
  try {
    const res = await fetch(`${BASE_URL}/users/${testTargetUserId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: 'admin' })
    });
    const data = await res.json();
    const isRoleAdmin = res.status === 200 && data?.data?.role === 'admin';

    // Log in with this upgraded account and try accessing Admin API
    const resLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: teacherDirectEmail,
        password: 'Password@2026'
      })
    });
    const dataLogin = await resLogin.json();
    const newAdminToken = dataLogin?.data?.accessToken;

    const resAdminAccess = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${newAdminToken}` }
    });
    const canAccessAdmin = resAdminAccess.status === 200;
    const passed = isRoleAdmin && canAccessAdmin;

    record(
      'TC-ADM-15',
      'Nâng quyền Giáo viên thành Admin',
      '15.1 (Positive)',
      'Status 200, role updated to admin, user can access Admin endpoints',
      `Updated Role: ${data?.data?.role}, Admin Access Status: ${resAdminAccess.status}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-15', 'Nâng quyền Giáo viên thành Admin', '15.1 (Positive)', 'Role updated & Admin access', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-16: RESET MẬT KHẨU
  // ----------------------------------------------------

  // 16.1 (Positive): Admin đặt lại mật khẩu cho người dùng
  const newPasswordReset = 'NewPassword@2026';
  try {
    const res = await fetch(`${BASE_URL}/users/${testTargetUserId}/reset-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ newPassword: newPasswordReset })
    });
    const data = await res.json();
    const isResetSuccess = res.status === 200;

    // Login with new password
    const resLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: teacherDirectEmail,
        password: newPasswordReset
      })
    });
    const dataLogin = await resLogin.json();
    const canLoginNewPass = resLogin.status === 200 && !!dataLogin?.data?.accessToken;
    const passed = isResetSuccess && canLoginNewPass;

    record(
      'TC-ADM-16',
      'Admin đặt lại mật khẩu cho người dùng',
      '16.1 (Positive)',
      'Status 200, user logs in successfully with new password',
      `Reset Status: ${res.status}, Login with new password Status: ${resLogin.status}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-16', 'Reset Mật khẩu', '16.1 (Positive)', 'Reset & Login success', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-17: XÓA TÀI KHOẢN VĨNH VIỄN
  // ----------------------------------------------------

  // 17.1 (Positive): Xóa 1 tài khoản phụ
  try {
    const res = await fetch(`${BASE_URL}/users/${testTargetUserId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const data = await res.json();
    const isDeleteSuccess = res.status === 200;

    // Check in database that the user is deleted
    const dbDeleted = await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(testTargetUserId) });
    const isGoneFromDb = dbDeleted === null;
    const passed = isDeleteSuccess && isGoneFromDb;

    record(
      'TC-ADM-17',
      'Xóa 1 tài khoản phụ',
      '17.1 (Positive)',
      'Status 200, record completely removed from database',
      `Delete Status: ${res.status}, Deleted from DB: ${isGoneFromDb}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-17', 'Xóa 1 tài khoản phụ', '17.1 (Positive)', 'Status 200 deleted', err.message, false);
  }

  // Cleanup test users created during testing
  try {
    const cleanupEmails = [pendingTeacherEmail, studentAutoEmail, unverifiedEmail, unapprovedTeacherEmail];
    await mongoose.connection.collection('users').deleteMany({ email: { $in: cleanupEmails } });
    console.log('Cleanup completed for temporary test accounts.');
  } catch (e) {
    // ignore cleanup errors
  }

  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`ADMIN MODULE 3 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

runTests().catch(console.error);
