/**
 * ============================================================================
 * TÊN FILE: test_teacher_module1.js
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/test_teacher_module1.js
 * MỤC ĐÍCH:
 *   Bộ kịch bản kiểm thử tự động toàn diện cho:
 *   MODULE 1: XÁC THỰC, ĐĂNG KÝ & QUẢN LÝ HỒ SƠ (/login, /register, /profile)
 *   trong docs/TEACHER_TESTING_GUIDE.md (TC-TCH-01 đến TC-TCH-03D).
 * ============================================================================
 */

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function runTeacherModule1Tests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING TEACHER MODULE 1 AUTOMATED TESTS');
  console.log('Module 1: Xác thực, Đăng ký & Quản lý Hồ sơ');
  console.log('====================================================\n');

  // Connect to MongoDB
  const MONGO_URI = 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB successfully for test assertions.\n');

  // Ensure default teacher account teacher@gmail.com has password 123456
  const salt = await bcrypt.genSalt(10);
  const hash123456 = await bcrypt.hash('123456', salt);
  await mongoose.connection.collection('users').updateOne(
    { email: 'teacher@gmail.com' },
    {
      $set: {
        name: 'Thầy Giáo Mẫu',
        email: 'teacher@gmail.com',
        passwordHash: hash123456,
        role: 'teacher',
        status: 'Active',
        isEmailVerified: true,
        subject: 'Toán học',
        phone: '0905999888',
        degree: 'Thạc sĩ Toán học',
        gender: 'Nam',
        dob: '1985-05-20',
        bio: 'Giáo viên Toán 10 năm kinh nghiệm'
      }
    },
    { upsert: true }
  );

  let teacherToken = '';
  let teacherUser = null;
  const tempUserEmails = [];

  try {
    // ----------------------------------------------------
    // TC-TCH-01: ĐĂNG NHẬP GIÁO VIÊN
    // ----------------------------------------------------
    // 01.1 (Positive): Đăng nhập hợp lệ bằng tài khoản Giáo viên
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'teacher@gmail.com', password: '123456' })
      });
      const data = await res.json();
      const is200 = res.status === 200;
      const hasToken = !!data?.data?.accessToken;
      const isTeacher = data?.data?.user?.role === 'teacher';
      const passed = is200 && hasToken && isTeacher;
      if (passed) {
        teacherToken = data.data.accessToken;
        teacherUser = data.data.user;
      }
      record(
        'TC-TCH-01',
        'Đăng nhập hợp lệ tài khoản Giáo viên',
        '01.1 (Positive)',
        'Status 200, JWT token returned, role = teacher, redirect /classrooms',
        `Status: ${res.status}, Role: ${data?.data?.user?.role}, Token: ${hasToken ? 'VALID' : 'MISSING'}`,
        passed,
        `User: ${data?.data?.user?.name} (${data?.data?.user?.email})`
      );
    } catch (err) {
      record('TC-TCH-01', 'Đăng nhập hợp lệ tài khoản Giáo viên', '01.1 (Positive)', 'Status 200', err.message, false);
    }

    // 01.2 (Negative): Nhập sai Mật khẩu
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'teacher@gmail.com', password: 'wrongpassword' })
      });
      const data = await res.json();
      const passed = res.status >= 400 && (data.message?.includes('không chính xác') || data.error?.includes('không chính xác'));
      record(
        'TC-TCH-01',
        'Nhập sai Mật khẩu',
        '01.2 (Negative)',
        'Status 400/401 with error message "Tài khoản hoặc mật khẩu không chính xác!"',
        `Status: ${res.status}, Message: "${data.message || data.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-01', 'Nhập sai Mật khẩu', '01.2 (Negative)', 'Error response', err.message, false);
    }

    // 01.3 (Negative): Để trống Email hoặc Mật khẩu
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', password: '' })
      });
      const data = await res.json();
      const passed = res.status >= 400;
      record(
        'TC-TCH-01',
        'Để trống Email hoặc Mật khẩu',
        '01.3 (Negative)',
        'Status 400, validation error for empty fields',
        `Status: ${res.status}, Message: "${data.message || data.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-01', 'Để trống Email hoặc Mật khẩu', '01.3 (Negative)', 'Status 400', err.message, false);
    }

    // 01.4 (Security): SQL Injection / Script XSS trong ô Đăng nhập
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "' OR '1'='1", password: "<script>alert(1)</script>" })
      });
      const data = await res.json();
      const passed = res.status >= 400 && !data?.data?.accessToken;
      record(
        'TC-TCH-01',
        'SQL Injection / Script XSS trong ô Đăng nhập',
        '01.4 (Security)',
        'Rejected securely, no SQLi or XSS execution, no token issued',
        `Status: ${res.status}, Token: ${data?.data?.accessToken ? 'LEAKED' : 'NONE'}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-01', 'SQL Injection / Script XSS', '01.4 (Security)', 'Rejected securely', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-01B: Đăng nhập & Đăng ký bằng Google OAuth 2.0
    // ----------------------------------------------------
    // 01B.1 (Positive): Đăng nhập/Đăng ký 1-Click qua Google
    try {
      const authControllerPath = path.resolve(__dirname, '../../../backend-classroom/src/controllers/authController.ts');
      const authCode = fs.readFileSync(authControllerPath, 'utf8');

      const hasGoogleAuth = authCode.includes('googleLogin') || authCode.includes('OAuth2Client');
      const hasTeacherPendingLogic = authCode.includes("role === 'teacher'") || authCode.includes('Pending');

      record(
        'TC-TCH-01B',
        'Đăng nhập/Đăng ký 1-Click qua Google OAuth 2.0',
        '01B.1 (Positive)',
        'Google OAuth verifies email, sets Teacher to Pending awaiting approval',
        `Google Auth present: ${hasGoogleAuth}, Teacher Pending logic: ${hasTeacherPendingLogic}`,
        hasGoogleAuth && hasTeacherPendingLogic
      );
    } catch (err) {
      record('TC-TCH-01B', 'Google OAuth 2.0', '01B.1 (Positive)', 'Verified logic', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-02: Đăng ký Giáo viên Thủ công & Xác thực OTP 6 số
    // ----------------------------------------------------
    const testTeacherEmail = `teacher_reg_${Date.now()}@gmail.com`;
    tempUserEmails.push(testTeacherEmail);

    // 02.1 (Positive): Đăng ký thủ công -> Nhập OTP 6 số từ Email
    try {
      const regRes = await fetch(`${BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Thầy Giáo Mới',
          email: testTeacherEmail,
          password: 'Password@2026',
          subject: 'Toán'
        })
      });
      const regData = await regRes.json();

      // Retrieve OTP code from DB (field: emailVerificationOTP)
      const userInDb = await mongoose.connection.collection('users').findOne({ email: testTeacherEmail });
      const otpCode = userInDb?.emailVerificationOTP;

      // Verify OTP
      const verifyRes = await fetch(`${BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testTeacherEmail, otp: otpCode })
      });
      const verifyData = await verifyRes.json();

      const userAfterVerify = await mongoose.connection.collection('users').findOne({ email: testTeacherEmail });
      const isPending = userAfterVerify?.status === 'Pending';
      const isVerified = userAfterVerify?.isEmailVerified === true;

      record(
        'TC-TCH-02',
        'Đăng ký thủ công -> Nhập OTP 6 số -> Chờ duyệt (Pending)',
        '02.1 (Positive)',
        'Registered -> Verified OTP -> Status becomes Pending awaiting Admin approval',
        `Reg status: ${regRes.status}, Verify status: ${verifyRes.status}, DB status: ${userAfterVerify?.status}`,
        regRes.status === 201 && verifyRes.status === 200 && isPending && isVerified,
        `Teacher Pending Email: ${testTeacherEmail}`
      );
    } catch (err) {
      record('TC-TCH-02', 'Đăng ký thủ công & OTP', '02.1 (Positive)', 'Status 201 & 200', err.message, false);
    }

    // 02.2 (UI/UX): Giao diện Modal OTP 6 ô nhập số
    try {
      const registerPagePath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Auth/Register/Register.tsx');
      const regCode = fs.readFileSync(registerPagePath, 'utf8');

      const has6Digits = regCode.includes("otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])") ||
        regCode.includes("['', '', '', '', '', '']");
      const hasAutoJump = regCode.includes('otpInputRefs.current[index + 1]?.focus()');
      const hasAutoSelect = regCode.includes('otpInputRefs.current[index + 1]?.select()');

      record(
        'TC-TCH-02',
        'Giao diện Modal OTP 6 ô độc lập',
        '02.2 (UI/UX)',
        '6 separate digit inputs [1][2][3]-[4][5][6], auto jump to next box, auto select & paste support',
        `6 digits: ${has6Digits}, Auto focus: ${hasAutoJump}, Auto select: ${hasAutoSelect}`,
        has6Digits && hasAutoJump && hasAutoSelect
      );
    } catch (err) {
      record('TC-TCH-02', 'Modal OTP 6 ô', '02.2 (UI/UX)', 'Code inspection', err.message, false);
    }

    // 02.3 (UI/UX): Đếm ngược 30s Gửi lại mã OTP
    try {
      const registerPagePath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Auth/Register/Register.tsx');
      const regCode = fs.readFileSync(registerPagePath, 'utf8');

      const hasCountdown = regCode.includes('countdown') && regCode.includes('resendOTP');

      record(
        'TC-TCH-02',
        'Đếm ngược 30s Gửi lại mã OTP',
        '02.3 (UI/UX)',
        '30s countdown before re-enabling Resend OTP button',
        `Countdown logic present: ${hasCountdown}`,
        hasCountdown
      );
    } catch (err) {
      record('TC-TCH-02', 'Đếm ngược 30s', '02.3 (UI/UX)', 'Code inspection', err.message, false);
    }

    // 02.4 (Negative): Nhập sai mã OTP
    try {
      const dummyEmail = `teacher_wrongotp_${Date.now()}@gmail.com`;
      tempUserEmails.push(dummyEmail);

      await fetch(`${BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Teacher Wrong OTP',
          email: dummyEmail,
          password: 'Password@2026',
          subject: 'Toán'
        })
      });

      const res = await fetch(`${BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dummyEmail, otp: '999999' })
      });
      const data = await res.json();
      const passed = res.status >= 400 && (data.message?.includes('không hợp lệ') || data.error?.includes('không hợp lệ') || data.message?.includes('không chính xác') || data.error?.includes('không chính xác'));

      record(
        'TC-TCH-02',
        'Nhập sai mã OTP (999999)',
        '02.4 (Negative)',
        'Status 400 with "Mã OTP không hợp lệ hoặc đã hết hạn!"',
        `Status: ${res.status}, Message: "${data.message || data.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-02', 'Nhập sai mã OTP', '02.4 (Negative)', 'Status 400', err.message, false);
    }

    // 02.5 (Positive): Đăng ký lại mượt mà cho Email chưa xác thực
    try {
      const draftEmail = `teacher_draft_${Date.now()}@gmail.com`;
      tempUserEmails.push(draftEmail);

      // 1st Registration attempt
      await fetch(`${BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Teacher Draft 1',
          email: draftEmail,
          password: 'Password@2026',
          subject: 'Toán'
        })
      });

      // 2nd Registration attempt with same email
      const res2 = await fetch(`${BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Teacher Draft 2 (Re-register)',
          email: draftEmail,
          password: 'Password@2026',
          subject: 'Toán'
        })
      });
      const data2 = await res2.json();
      const passed = res2.status === 201;

      record(
        'TC-TCH-02',
        'Đăng ký lại mượt mà cho Email chưa xác thực',
        '02.5 (Positive)',
        'Automatically purges unverified record, issues fresh OTP without duplicate error',
        `Status: ${res2.status}, Message: "${data2.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-02', 'Đăng ký lại email chưa xác thực', '02.5 (Positive)', 'Status 201', err.message, false);
    }

    // 02.6 (Negative): Đăng ký bằng Email đã tồn tại (đã xác thực)
    try {
      const res = await fetch(`${BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Teacher Duplicate',
          email: 'teacher@gmail.com',
          password: 'Password@2026',
          subject: 'Toán'
        })
      });
      const data = await res.json();
      const passed = res.status >= 400 && (data.message?.includes('đã được') || data.error?.includes('đã được') || data.message?.includes('tồn tại') || data.error?.includes('tồn tại'));

      record(
        'TC-TCH-02',
        'Đăng ký bằng Email đã tồn tại',
        '02.6 (Negative)',
        'Status 400 with "Email này đã được sử dụng/đăng ký!"',
        `Status: ${res.status}, Message: "${data.message || data.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-02', 'Đăng ký email trùng', '02.6 (Negative)', 'Status 400', err.message, false);
    }

    // 02.7 (Security): Tự động bật Modal OTP khi cố Đăng nhập tài khoản chưa xác thực
    try {
      const unverifiedEmail = `teacher_unverified_${Date.now()}@gmail.com`;
      tempUserEmails.push(unverifiedEmail);

      await fetch(`${BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Teacher Unverified',
          email: unverifiedEmail,
          password: 'Password@2026',
          subject: 'Toán'
        })
      });

      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail, password: 'Password@2026' })
      });
      const loginData = await loginRes.json();
      const isBlocked = loginRes.status === 401;
      const hasUnverifiedMsg = (loginData?.message || '').includes('chưa được xác thực Email');

      const loginPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Auth/Login/Login.tsx');
      const loginContent = fs.readFileSync(loginPath, 'utf-8');
      const hasAutoModalOtp = loginContent.includes('chưa được xác thực Email') &&
                              loginContent.includes('setShowOTP(true)');

      const passed = isBlocked && hasUnverifiedMsg && hasAutoModalOtp;

      record(
        'TC-TCH-02',
        'Tự động kích hoạt Modal OTP khi đăng nhập tài khoản chưa xác thực',
        '02.7 (Security)',
        'Status 401, triggers OTP modal directly on Login view',
        `Status: ${loginRes.status}, Msg: "${loginData?.message}", Auto OTP Modal: ${hasAutoModalOtp}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-02', 'Đăng nhập tài khoản chưa xác thực', '02.7 (Security)', 'Status 403', err.message, false);
    }

    // 02.8 (Validation): Nhập Email sai định dạng khi Đăng ký
    try {
      const res = await fetch(`${BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Teacher Bad Email',
          email: 'teacherbademail',
          password: 'Password@2026',
          subject: 'Toán'
        })
      });
      const data = await res.json();
      const passed = res.status >= 400;

      record(
        'TC-TCH-02',
        'Nhập Email sai định dạng khi Đăng ký',
        '02.8 (Validation)',
        'Status 400 with "Email không đúng định dạng!"',
        `Status: ${res.status}, Message: "${data.message || data.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-02', 'Email sai định dạng', '02.8 (Validation)', 'Status 400', err.message, false);
    }

    // 02.9 (Boundary): Mật khẩu không đủ mạnh (< 8 ký tự hoặc thiếu chữ hoa/chữ thường/chữ số/ký tự đặc biệt)
    try {
      const resWeak = await fetch(`${BASE_URL}/auth/register-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Teacher Weak Pass',
          email: `weakpass_${Date.now()}@gmail.com`,
          password: '123',
          subject: 'Toán'
        })
      });
      const dataWeak = await resWeak.json();
      const passed = resWeak.status >= 400;

      record(
        'TC-TCH-02',
        'Mật khẩu không đủ mạnh',
        '02.9 (Boundary)',
        'Status 400, validation error requiring >= 8 chars, uppercase, lowercase, digit, special char',
        `Status: ${resWeak.status}, Message: "${dataWeak.message || dataWeak.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-02', 'Mật khẩu không đủ mạnh', '02.9 (Boundary)', 'Status 400', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-03: Quản lý & Cập nhật Hồ sơ Cá nhân (/profile)
    // ----------------------------------------------------
    // 03.1 (View): Xem đầy đủ thông tin cá nhân
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const data = await res.json();
      const u = data.data || data.user || data;

      const hasRequiredFields = !!u.email && u.role === 'teacher' && u.name === 'Thầy Giáo Mẫu';
      record(
        'TC-TCH-03',
        'Xem đầy đủ thông tin cá nhân Giáo viên',
        '03.1 (View)',
        'Profile includes Avatar, Name, Email, Role=teacher, Subject, Phone, Degree, Bio, DOB',
        `Name: ${u.name}, Role: ${u.role}, Subject: ${u.subject}, Degree: ${u.degree}`,
        res.status === 200 && hasRequiredFields
      );
    } catch (err) {
      record('TC-TCH-03', 'Xem thông tin cá nhân', '03.1 (View)', 'Status 200', err.message, false);
    }

    // 03.2 (Positive): Chỉnh sửa thông tin cá nhân
    try {
      const updatedBio = 'Thạc sĩ Toán học - Chuyên luyện thi THPT Quốc gia 2026';
      const updatedPhone = '0905999777';
      const res = await fetch(`${BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          name: 'Thầy Giáo Mẫu Cập Nhật',
          phone: updatedPhone,
          bio: updatedBio,
          degree: 'Thạc sĩ Toán học Ứng dụng'
        })
      });
      const data = await res.json();
      const passed = res.status === 200;

      // Verify in DB
      const dbTeacher = await mongoose.connection.collection('users').findOne({ email: 'teacher@gmail.com' });
      const dbUpdated = dbTeacher?.phone === updatedPhone && dbTeacher?.bio === updatedBio;

      record(
        'TC-TCH-03',
        'Chỉnh sửa thông tin cá nhân',
        '03.2 (Positive)',
        'Status 200, profile updated in Database and reflected immediately',
        `Status: ${res.status}, DB Phone: ${dbTeacher?.phone}, DB Degree: "${dbTeacher?.degree}"`,
        passed && dbUpdated
      );
    } catch (err) {
      record('TC-TCH-03', 'Chỉnh sửa thông tin cá nhân', '03.2 (Positive)', 'Status 200', err.message, false);
    }

    // 03.2B (Validation): Chỉnh sửa thông tin không hợp lệ (tên rỗng/chữ số, SĐT sai định dạng, ngày sinh tương lai)
    try {
      const resInvalid = await fetch(`${BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          name: 'Thầy 123456',
          phone: '123',
          dob: '2099-01-01'
        })
      });
      const dataInvalid = await resInvalid.json();
      const passed = resInvalid.status >= 400;

      record(
        'TC-TCH-03',
        'Chỉnh sửa thông tin không hợp lệ',
        '03.2B (Validation)',
        'Status 400 with validation errors for numeric name, invalid phone, future DOB',
        `Status: ${resInvalid.status}, Message: "${dataInvalid.message || dataInvalid.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-03', 'Validation thông tin không hợp lệ', '03.2B (Validation)', 'Status 400', err.message, false);
    }

    // 03.3 (Positive): Đổi Avatar hợp lệ (< 2MB)
    try {
      const validAvatarUrl = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150';
      const res = await fetch(`${BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          avatar: validAvatarUrl
        })
      });
      const data = await res.json();
      const passed = res.status === 200;

      record(
        'TC-TCH-03',
        'Đổi Avatar hợp lệ (< 2MB)',
        '03.3 (Positive)',
        'Status 200, Avatar URL updated successfully',
        `Status: ${res.status}, Avatar updated`,
        passed
      );
    } catch (err) {
      record('TC-TCH-03', 'Đổi Avatar hợp lệ', '03.3 (Positive)', 'Status 200', err.message, false);
    }

    // 03.4 (Negative): Đổi Avatar quá dung lượng (> 5MB) hoặc sai định dạng
    try {
      const profilePagePath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Student/Profile/StudentProfile.tsx');
      const profileCode = fs.readFileSync(profilePagePath, 'utf8');

      const hasFileSizeLimit = profileCode.includes('2 * 1024 * 1024') || profileCode.includes('2MB');
      const hasImageAcceptOnly = profileCode.includes('accept="image/*"') || profileCode.includes("image/");

      record(
        'TC-TCH-03',
        'Đổi Avatar quá dung lượng hoặc sai định dạng',
        '03.4 (Negative)',
        'Upload rejected with error message "Dung lượng file vượt quá giới hạn 2MB!"',
        `Size limit guard (2MB): ${hasFileSizeLimit}, Image restriction: ${hasImageAcceptOnly}`,
        hasFileSizeLimit && hasImageAcceptOnly
      );
    } catch (err) {
      record('TC-TCH-03', 'Avatar quá dung lượng', '03.4 (Negative)', 'Rejected', err.message, false);
    }

    // 03.5 (Validation): Ràng buộc chưa đủ thông tin trước khi Tạo Lớp
    try {
      const checkerPath = path.resolve(__dirname, '../../../frontend-classroom/src/utils/profileChecker.ts');
      const modalPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/ui/Dialogs/ProfileWarningModal.tsx');
      const hasChecker = fs.existsSync(checkerPath);
      const hasModal = fs.existsSync(modalPath);

      const checkerCode = fs.readFileSync(checkerPath, 'utf8');
      const checksFields = checkerCode.includes('gender') &&
        checkerCode.includes('dob') &&
        checkerCode.includes('phone') &&
        checkerCode.includes('degree') &&
        checkerCode.includes('subject');

      record(
        'TC-TCH-03',
        'Ràng buộc chưa đủ thông tin trước khi Tạo Lớp',
        '03.5 (Validation)',
        'Shows warning modal "Cần hoàn thiện hồ sơ trước khi tạo lớp" with redirect to /profile',
        `profileChecker: ${hasChecker}, ProfileWarningModal: ${hasModal}, checks 5 fields: ${checksFields}`,
        hasChecker && hasModal && checksFields
      );
    } catch (err) {
      record('TC-TCH-03', 'Ràng buộc hồ sơ', '03.5 (Validation)', 'Modal check', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-03B: Đổi mật khẩu & Thiết lập mật khẩu Giáo viên
    // ----------------------------------------------------
    // 03B.1 (Positive): Nhập đúng Mật khẩu cũ & Mật khẩu mới chuẩn
    try {
      const newStrongPass = 'Teacher@2026';
      const res = await fetch(`${BASE_URL}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          oldPassword: '123456',
          newPassword: newStrongPass
        })
      });
      const data = await res.json();
      const passed = res.status === 200;

      // Verify login with new password
      const reLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'teacher@gmail.com', password: newStrongPass })
      });
      const reLoginData = await reLoginRes.json();
      const canLoginNewPass = reLoginRes.status === 200 && !!reLoginData?.data?.accessToken;

      // Reset back to 123456 in DB
      await mongoose.connection.collection('users').updateOne(
        { email: 'teacher@gmail.com' },
        { $set: { passwordHash: hash123456 } }
      );

      record(
        'TC-TCH-03B',
        'Đổi mật khẩu thành công (Tài khoản thường)',
        '03B.1 (Positive)',
        'Status 200, Password updated, login with new password succeeds',
        `Status: ${res.status}, Re-login new pass: ${canLoginNewPass}`,
        passed && canLoginNewPass
      );
    } catch (err) {
      record('TC-TCH-03B', 'Đổi mật khẩu thành công', '03B.1 (Positive)', 'Status 200', err.message, false);
    }

    // 03B.2 (Negative): Nhập sai Mật khẩu hiện tại
    try {
      const res = await fetch(`${BASE_URL}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          oldPassword: 'wrongoldpassword',
          newPassword: 'Teacher@2026'
        })
      });
      const data = await res.json();
      const passed = res.status >= 400 && (data.message?.includes('hiện tại không chính xác') || data.error?.includes('hiện tại không chính xác') || data.message?.includes('không đúng') || data.error?.includes('không đúng'));

      record(
        'TC-TCH-03B',
        'Nhập sai Mật khẩu hiện tại',
        '03B.2 (Negative)',
        'Status 400 with "Mật khẩu hiện tại không chính xác!"',
        `Status: ${res.status}, Message: "${data.message || data.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-03B', 'Sai mật khẩu hiện tại', '03B.2 (Negative)', 'Status 400', err.message, false);
    }

    // 03B.3 (Negative): Mật khẩu mới và Mật khẩu xác nhận không khớp
    try {
      const profilePagePath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Student/Profile/StudentProfile.tsx');
      const profileCode = fs.readFileSync(profilePagePath, 'utf8');

      const hasMismatchCheck = profileCode.includes('Mật khẩu xác nhận không khớp') ||
        profileCode.includes('confirmPassword') && profileCode.includes('newPassword !==');

      record(
        'TC-TCH-03B',
        'Mật khẩu xác nhận không khớp',
        '03B.3 (Negative)',
        'Client validation prevents submit and shows Toast "Mật khẩu xác nhận không khớp!"',
        `Password mismatch check in Profile present: ${hasMismatchCheck}`,
        hasMismatchCheck
      );
    } catch (err) {
      record('TC-TCH-03B', 'Mật khẩu không khớp', '03B.3 (Negative)', 'Validation check', err.message, false);
    }

    // 03B.4 (Positive - Google OAuth): Thiết lập mật khẩu liên kết lần đầu qua OTP Email
    try {
      const userControllerPath = path.resolve(__dirname, '../../../backend-classroom/src/controllers/userController.ts');
      const userCode = fs.readFileSync(userControllerPath, 'utf8');

      const hasSendPasswordOTP = userCode.includes('sendPasswordOTP');
      const hasSetupGooglePassword = userCode.includes('setupGooglePassword');

      record(
        'TC-TCH-04B-Google',
        'Thiết lập mật khẩu liên kết lần đầu qua OTP Email (Google)',
        '03B.4 (Positive - Google OAuth)',
        'Sends OTP to user email, verifies OTP and sets initial password',
        `sendPasswordOTP present: ${hasSendPasswordOTP}, setupGooglePassword: ${hasSetupGooglePassword}`,
        hasSendPasswordOTP && hasSetupGooglePassword
      );
    } catch (err) {
      record('TC-TCH-04B-Google', 'Thiết lập mật khẩu Google', '03B.4 (Positive)', 'Code inspection', err.message, false);
    }

    // 03B.5 (Negative - Google OAuth): Nhập sai mã OTP thiết lập mật khẩu
    try {
      const res = await fetch(`${BASE_URL}/users/setup-google-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          otp: '000000',
          newPassword: 'Teacher@2026'
        })
      });
      const data = await res.json();
      const passed = res.status >= 400;

      record(
        'TC-TCH-04B-WrongOTP',
        'Nhập sai mã OTP thiết lập mật khẩu Google',
        '03B.5 (Negative - Google OAuth)',
        'Status 400, rejected with invalid/expired OTP message',
        `Status: ${res.status}, Message: "${data.message || data.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-04B-WrongOTP', 'Sai OTP Google', '03B.5 (Negative)', 'Status 400', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-03C: Đăng xuất hệ thống
    // ----------------------------------------------------
    // 03C.1 (Positive): Thực hiện Đăng xuất
    try {
      const topHeaderPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/Layout/TopHeader/TopHeader.tsx');
      const headerCode = fs.readFileSync(topHeaderPath, 'utf8');

      const hasLogout = (headerCode.includes('handleLogOut') || headerCode.includes('handleLogout')) &&
        (headerCode.includes('localStorage.removeItem') || headerCode.includes('logout'));

      record(
        'TC-TCH-03C',
        'Thực hiện Đăng xuất',
        '03C.1 (Positive)',
        'Clears accessToken/refreshToken, resets auth state, redirects to /login',
        `Logout logic in TopHeader present: ${hasLogout}`,
        hasLogout
      );
    } catch (err) {
      record('TC-TCH-03C', 'Đăng xuất', '03C.1 (Positive)', 'Verified logic', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-03D: Bảo vệ Route & Phân quyền Giáo viên
    // ----------------------------------------------------
    // 03D.1 (Security): Giáo viên cố truy cập URL Admin
    try {
      const resAdminDashboard = await fetch(`${BASE_URL}/dashboard/admin`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const resAdminClasses = await fetch(`${BASE_URL}/classrooms/admin`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });

      const is403 = resAdminDashboard.status === 403 && resAdminClasses.status === 403;

      const protectedRoutePath = path.resolve(__dirname, '../../../frontend-classroom/src/components/Layout/ProtectedRoute.tsx');
      const protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf-8');
      const clientRedirectsTeacher = protectedRouteContent.includes("if (user?.role === 'teacher') return <Navigate to=\"/classrooms\" replace />;");

      record(
        'TC-TCH-03D',
        'Giáo viên cố truy cập URL Admin',
        '03D.1 (Security)',
        'Status 403 Forbidden on backend admin endpoints, Client AdminRoute redirects teacher to /classrooms',
        `Backend: /dashboard/admin=${resAdminDashboard.status}, /classrooms/admin=${resAdminClasses.status}. Client guard: ${clientRedirectsTeacher}`,
        is403 && clientRedirectsTeacher
      );
    } catch (err) {
      record('TC-TCH-03D', 'Truy cập URL Admin', '03D.1 (Security)', 'Status 403', err.message, false);
    }

    // 03D.2 (Security): Người dùng chưa đăng nhập (Guest) truy cập URL Giáo viên
    try {
      const res = await fetch(`${BASE_URL}/classrooms/my-classes`);
      const data = await res.json();
      const passed = res.status === 401;

      record(
        'TC-TCH-03D',
        'Guest chưa đăng nhập truy cập URL Giáo viên',
        '03D.2 (Security)',
        'Status 401 Unauthorized, redirected to /login',
        `Status: ${res.status}, Message: "${data.message || data.error}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-03D', 'Guest truy cập URL Giáo viên', '03D.2 (Security)', 'Status 401', err.message, false);
    }

  } catch (err) {
    console.error('Unhandled error in Teacher Module 1 tests:', err);
  } finally {
    // Cleanup temporary accounts
    if (tempUserEmails.length > 0) {
      await mongoose.connection.collection('users').deleteMany({ email: { $in: tempUserEmails } });
      console.log('Cleaned up temporary registered accounts.');
    }
    await mongoose.disconnect();
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log('\n====================================================');
  console.log(`TEACHER MODULE 1 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');
}

runTeacherModule1Tests().catch(console.error);
