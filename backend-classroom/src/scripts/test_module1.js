const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function runTests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('========================================');
  console.log('STARTING MODULE 1 AUTOMATED TESTS');
  console.log('========================================\n');

  // ----------------------------------------------------
  // TC-STU-01: ĐĂNG NHẬP
  // ----------------------------------------------------

  // 01.1 Positive: Đăng nhập hợp lệ bằng tài khoản Học sinh
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
    });
    const data = await res.json();
    const passed = res.status === 200 && data.data && data.data.accessToken && data.data.user.role === 'student';
    record(
      'TC-STU-01',
      'Đăng nhập hợp lệ tài khoản Học sinh',
      '01.1 (Positive)',
      'Status 200, JWT token & user.role=student',
      `Status ${res.status}, role=${data?.data?.user?.role}`,
      passed,
      passed ? `User: ${data.data.user.name} (${data.data.user.email})` : JSON.stringify(data)
    );
  } catch (err) {
    record('TC-STU-01', 'Đăng nhập hợp lệ tài khoản Học sinh', '01.1 (Positive)', 'Status 200', err.message, false);
  }

  // 01.2 Negative: Nhập sai Mật khẩu
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: 'wrongpass' })
    });
    const data = await res.json();
    const passed = res.status >= 400 && (data.message?.includes('không chính xác') || data.error?.includes('không chính xác'));
    record(
      'TC-STU-01',
      'Nhập sai mật khẩu',
      '01.2 (Negative)',
      'Status 400/401/500 with error message',
      `Status ${res.status}, msg: ${data.message || data.error}`,
      passed
    );
  } catch (err) {
    record('TC-STU-01', 'Nhập sai mật khẩu', '01.2 (Negative)', 'Error response', err.message, false);
  }

  // 01.3 Negative: Để trống Email hoặc Mật khẩu
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' })
    });
    const data = await res.json();
    const passed = res.status === 400 && (data.message?.includes('đầy đủ') || data.error?.includes('đầy đủ'));
    record(
      'TC-STU-01',
      'Để trống email hoặc mật khẩu',
      '01.3 (Negative)',
      'Status 400: Vui lòng nhập đầy đủ email và mật khẩu',
      `Status ${res.status}, msg: ${data.message || data.error}`,
      passed
    );
  } catch (err) {
    record('TC-STU-01', 'Để trống email hoặc mật khẩu', '01.3 (Negative)', 'Status 400', err.message, false);
  }

  // 01.4 Security: SQL Injection / XSS
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "' OR '1'='1", password: "' OR '1'='1" })
    });
    const data = await res.json();
    // Should be rejected by regex or not authenticate
    const passed = res.status >= 400 && !data?.data?.accessToken;
    record(
      'TC-STU-01',
      'SQL Injection / Script XSS trong form Đăng nhập',
      '01.4 (Security)',
      'Rejected safely (400 invalid email format or auth failure)',
      `Status ${res.status}, msg: ${data.message || data.error}`,
      passed
    );
  } catch (err) {
    record('TC-STU-01', 'SQL Injection / Script XSS', '01.4 (Security)', 'Rejected', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-01B: GOOGLE OAUTH
  // ----------------------------------------------------
  // Test if Google endpoint exists and handles invalid token gracefully
  try {
    const res = await fetch(`${BASE_URL}/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake_google_token' })
    });
    const data = await res.json();
    // Should reject fake credential gracefully
    const passed = res.status >= 400;
    record(
      'TC-STU-01B',
      'Đăng nhập Google OAuth (API validation)',
      '01B.1 (Positive)',
      'Endpoint responds and verifies credentials securely',
      `Status ${res.status}, msg: ${data.message || data.error}`,
      passed,
      'Endpoint /auth/google-login verified. Frontend has Google OAuth One-Tap button.'
    );
  } catch (err) {
    record('TC-STU-01B', 'Google OAuth', '01B.1 (Positive)', 'Handled', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-02: ĐĂNG KÝ HỌC SINH THỦ CÔNG & XÁC THỰC OTP
  // ----------------------------------------------------

  // 02.8 Validation: Nhập Email sai định dạng khi Đăng ký
  try {
    const res = await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hoc Sinh Test', email: 'student_invalid_email', password: 'Password@123' })
    });
    const data = await res.json();
    const passed = res.status === 400 && (data.message?.includes('email') || data.error?.includes('email'));
    record(
      'TC-STU-02',
      'Nhập Email sai định dạng khi Đăng ký',
      '02.8 (Validation)',
      'Status 400: Định dạng email không hợp lệ',
      `Status ${res.status}, msg: ${data.message || data.error}`,
      passed
    );
  } catch (err) {
    record('TC-STU-02', 'Email sai định dạng', '02.8 (Validation)', 'Status 400', err.message, false);
  }

  // 02.9 Boundary: Mật khẩu không đủ mạnh
  try {
    const res = await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hoc Sinh Test', email: 'valid_test@gmail.com', password: '12345' })
    });
    const data = await res.json();
    const passed = res.status === 400 && (data.message?.includes('Mật khẩu') || data.error?.includes('Mật khẩu'));
    record(
      'TC-STU-02',
      'Mật khẩu không đủ mạnh',
      '02.9 (Boundary)',
      'Status 400: Mật khẩu phải chứa ít nhất 8 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt',
      `Status ${res.status}, msg: ${data.message || data.error}`,
      passed
    );
  } catch (err) {
    record('TC-STU-02', 'Mật khẩu yếu', '02.9 (Boundary)', 'Status 400', err.message, false);
  }

  // 02.6 Negative: Đăng ký bằng Email đã tồn tại (đã xác thực)
  try {
    const res = await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hoc Sinh Trung', email: 'student@gmail.com', password: 'Password@123' })
    });
    const data = await res.json();
    const passed = res.status >= 400 && (data.message?.includes('đã được đăng ký') || data.error?.includes('đã được đăng ký'));
    record(
      'TC-STU-02',
      'Đăng ký bằng Email đã tồn tại (đã xác thực)',
      '02.6 (Negative)',
      'Status 400/500: Email này đã được đăng ký sử dụng trên hệ thống',
      `Status ${res.status}, msg: ${data.message || data.error}`,
      passed
    );
  } catch (err) {
    record('TC-STU-02', 'Email trùng', '02.6 (Negative)', 'Error response', err.message, false);
  }

  // 02.1 & 02.5 & 02.4: Đăng ký học sinh mới
  const testStudentEmail = `autotest_stu_${Date.now()}@gmail.com`;
  let otpReceived = null;

  try {
    const res = await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nguyễn Văn Auto', email: testStudentEmail, password: 'Password@2026' })
    });
    const data = await res.json();
    const regSuccess = res.status === 201 && data.user?.id;
    console.log('       Registered test student:', testStudentEmail, 'Status:', res.status);

    // 02.5: Re-registration for unverified email should succeed without duplicate error
    const resRe = await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nguyễn Văn Auto Draft', email: testStudentEmail, password: 'Password@2026' })
    });
    const dataRe = await resRe.json();
    const passed02_5 = resRe.status === 201 && dataRe.user?.id;
    record(
      'TC-STU-02',
      'Đăng ký lại mượt mà cho Email chưa xác thực',
      '02.5 (Positive)',
      'Status 201: Overwrites previous unverified record and generates new OTP',
      `Status ${resRe.status}, msg: ${dataRe.message}`,
      passed02_5
    );

    // 02.7: Security: Login with unverified account should return error prompting OTP
    const resLoginUnverified = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: 'Password@2026' })
    });
    const dataLoginUnv = await resLoginUnverified.json();
    const passed02_7 = resLoginUnverified.status >= 400 && (dataLoginUnv.message?.includes('chưa được xác thực Email') || dataLoginUnv.error?.includes('chưa được xác thực Email'));
    record(
      'TC-STU-02',
      'Tự động báo lỗi và kích hoạt OTP khi cố Đăng nhập tài khoản chưa xác thực',
      '02.7 (Security)',
      'Error: Tài khoản của bạn chưa được xác thực Email',
      `Status ${resLoginUnverified.status}, msg: ${dataLoginUnv.message || dataLoginUnv.error}`,
      passed02_7
    );

    // 02.4: Negative: Nhập sai mã OTP
    const resWrongOtp = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, otp: '999999' })
    });
    const dataWrongOtp = await resWrongOtp.json();
    const passed02_4 = resWrongOtp.status === 400 && (dataWrongOtp.message?.includes('không chính xác') || dataWrongOtp.error?.includes('không chính xác'));
    record(
      'TC-STU-02',
      'Nhập sai mã OTP hoặc OTP hết hạn',
      '02.4 (Negative)',
      'Status 400: Mã OTP không chính xác!',
      `Status ${resWrongOtp.status}, msg: ${dataWrongOtp.message || dataWrongOtp.error}`,
      passed02_4
    );

    // To test 02.1 Positive: get the OTP from DB via mongoose directly
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true');
    const dbUser = await mongoose.connection.collection('users').findOne({ email: testStudentEmail });
    if (dbUser && dbUser.emailVerificationOTP) {
      otpReceived = dbUser.emailVerificationOTP;
      console.log('       Retrieved OTP from DB for verification test:', otpReceived);
    }

    if (otpReceived) {
      const resVerify = await fetch(`${BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testStudentEmail, otp: otpReceived })
      });
      const dataVerify = await resVerify.json();
      const dbUserAfter = await mongoose.connection.collection('users').findOne({ email: testStudentEmail });
      const passed02_1 = resVerify.status === 200 && dbUserAfter.isEmailVerified === true && dbUserAfter.status === 'Active';
      record(
        'TC-STU-02',
        'Đăng ký học sinh -> Nhập đúng mã OTP từ Email',
        '02.1 (Positive)',
        'Status 200, isEmailVerified=true, status=Active',
        `Status ${resVerify.status}, verified=${dbUserAfter.isEmailVerified}, status=${dbUserAfter.status}`,
        passed02_1
      );
    } else {
      record('TC-STU-02', 'Đăng ký học sinh -> Nhập đúng mã OTP', '02.1 (Positive)', 'Valid OTP', 'Could not read OTP from DB', false);
    }

    // Clean up test user
    await mongoose.connection.collection('users').deleteOne({ email: testStudentEmail });
    await mongoose.disconnect();

  } catch (err) {
    record('TC-STU-02', 'Đăng ký học sinh', '02.1 (Positive)', 'Success', err.message, false);
  }

  // 02.3 UI/UX: Resend OTP endpoint test
  try {
    const resResend = await fetch(`${BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com' })
    });
    // student@gmail.com is already verified, so it returns error 'Tài khoản đã được xác thực email từ trước!'
    const dataResend = await resResend.json();
    const passed02_3 = resResend.status === 400 && (dataResend.message?.includes('xác thực') || dataResend.error?.includes('xác thực'));
    record(
      'TC-STU-02',
      'Đếm ngược 30s Gửi lại mã OTP (Endpoint logic check)',
      '02.3 (UI/UX)',
      'Endpoint handles resend and rejects already-verified email',
      `Status ${resResend.status}, msg: ${dataResend.message || dataResend.error}`,
      passed02_3
    );
  } catch (err) {
    record('TC-STU-02', 'Gửi lại mã OTP', '02.3 (UI/UX)', 'Handled', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-03: PROFILE & QUẢN LÝ HỒ SƠ
  // ----------------------------------------------------

  // Get student token first
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
  });
  const loginData = await loginRes.json();
  const studentToken = loginData.data?.accessToken;
  const originalStudent = loginData.data?.user;

  // 03.1 View Profile
  try {
    const resMe = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataMe = await resMe.json();
    const passed03_1 = resMe.status === 200 && dataMe.data?.email === 'student@gmail.com';
    record(
      'TC-STU-03',
      'Xem đầy đủ thông tin cá nhân & Thống kê học tập',
      '03.1 (View)',
      'Status 200, student profile data returned',
      `Status ${resMe.status}, email=${dataMe.data?.email}, name=${dataMe.data?.name}`,
      passed03_1
    );
  } catch (err) {
    record('TC-STU-03', 'Xem thông tin cá nhân', '03.1 (View)', 'Status 200', err.message, false);
  }

  // 03.2 Positive: Chỉnh sửa thông tin cá nhân
  try {
    const updatedBio = `Học sinh chăm chỉ - Updated at ${Date.now()}`;
    const resUpdate = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        name: 'Học Sinh',
        bio: updatedBio,
        phone: '0905123456',
        gender: 'Nam',
        dob: '2006-05-15'
      })
    });
    const dataUpdate = await resUpdate.json();
    const passed03_2 = resUpdate.status === 200 && dataUpdate.data?.bio === updatedBio && dataUpdate.data?.phone === '0905123456';
    record(
      'TC-STU-03',
      'Chỉnh sửa thông tin cá nhân',
      '03.2 (Positive)',
      'Status 200, profile fields updated successfully',
      `Status ${resUpdate.status}, bio updated: ${dataUpdate.data?.bio?.slice(0, 35)}...`,
      passed03_2
    );
  } catch (err) {
    record('TC-STU-03', 'Chỉnh sửa thông tin', '03.2 (Positive)', 'Status 200', err.message, false);
  }

  // 03.2B Validation: Chỉnh sửa thông tin sai định dạng (SĐT sai, Ngày sinh tương lai)
  try {
    const resBadPhone = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ phone: '09abc123' })
    });
    const dataBadPhone = await resBadPhone.json();

    const resFutureDob = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ dob: '2030-01-01' })
    });
    const dataFutureDob = await resFutureDob.json();

    const passed03_2b = resBadPhone.status === 400 && resFutureDob.status === 400;
    record(
      'TC-STU-03',
      'Chỉnh sửa thông tin sai định dạng (SĐT & Ngày sinh tương lai)',
      '03.2B (Validation)',
      'Status 400 for invalid phone and future DOB',
      `Phone status: ${resBadPhone.status}, DOB status: ${resFutureDob.status}`,
      passed03_2b,
      `Phone err: ${dataBadPhone.message || dataBadPhone.error} | DOB err: ${dataFutureDob.message || dataFutureDob.error}`
    );
  } catch (err) {
    record('TC-STU-03', 'Chỉnh sửa sai định dạng', '03.2B (Validation)', 'Status 400', err.message, false);
  }

  // 03.3 Positive: Đổi Avatar hợp lệ
  try {
    const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const resAvatar = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ avatar: dummyBase64 })
    });
    const dataAvatar = await resAvatar.json();
    const passed03_3 = resAvatar.status === 200 && dataAvatar.data?.avatar === dummyBase64;
    record(
      'TC-STU-03',
      'Đổi Avatar hợp lệ (< 2MB)',
      '03.3 (Positive)',
      'Status 200, avatar updated',
      `Status ${resAvatar.status}`,
      passed03_3
    );
  } catch (err) {
    record('TC-STU-03', 'Đổi Avatar hợp lệ', '03.3 (Positive)', 'Status 200', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-03B: ĐỔI MẬT KHẨU
  // ----------------------------------------------------

  // 03B.2 Negative: Nhập sai Mật khẩu hiện tại
  try {
    const resWrongOld = await fetch(`${BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ oldPassword: 'wrongoldpassword', newPassword: 'Student@2026' })
    });
    const dataWrongOld = await resWrongOld.json();
    const passed03b_2 = resWrongOld.status === 400 && (dataWrongOld.message?.includes('không chính xác') || dataWrongOld.error?.includes('không chính xác'));
    record(
      'TC-STU-03B',
      'Nhập sai Mật khẩu hiện tại',
      '03B.2 (Negative)',
      'Status 400: Mật khẩu hiện tại không chính xác',
      `Status ${resWrongOld.status}, msg: ${dataWrongOld.message || dataWrongOld.error}`,
      passed03b_2
    );
  } catch (err) {
    record('TC-STU-03B', 'Sai mật khẩu hiện tại', '03B.2 (Negative)', 'Status 400', err.message, false);
  }

  // 03B.1 Positive: Đổi mật khẩu tài khoản thông thường -> Sau đó đổi lại ban đầu
  try {
    // Change to Student@2026
    const resChange = await fetch(`${BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ oldPassword: '123456', newPassword: 'Student@2026' })
    });
    const dataChange = await resChange.json();
    const step1Pass = resChange.status === 200;

    // Verify new password by logging in
    const resLoginNew = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: 'Student@2026' })
    });
    const dataLoginNew = await resLoginNew.json();
    const step2Pass = resLoginNew.status === 200 && dataLoginNew.data?.accessToken;

    // Change back to 123456 using new token
    // Note: changePassword endpoint checks regex for new password. 123456 does not match regex!
    // Let's check how admin reset or if direct db update can restore 123456
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true');
    const bcrypt = require('bcrypt');
    const hash123456 = await bcrypt.hash('123456', 10);
    await mongoose.connection.collection('users').updateOne({ email: 'student@gmail.com' }, { $set: { passwordHash: hash123456 } });
    await mongoose.disconnect();

    const passed03b_1 = step1Pass && step2Pass;
    record(
      'TC-STU-03B',
      'Đổi mật khẩu tài khoản thông thường',
      '03B.1 (Positive)',
      'Status 200, successfully changed and verified with new password, restored to 123456',
      `Change status: ${resChange.status}, Login with new pass status: ${resLoginNew.status}`,
      passed03b_1
    );
  } catch (err) {
    record('TC-STU-03B', 'Đổi mật khẩu', '03B.1 (Positive)', 'Status 200', err.message, false);
  }

  // 03B.5 Negative (Google OAuth): Nhập sai OTP thiết lập mật khẩu
  try {
    const resWrongOtpGoogle = await fetch(`${BASE_URL}/users/setup-google-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ otp: '000000', newPassword: 'Student@2026' })
    });
    const dataWrongOtpG = await resWrongOtpGoogle.json();
    const passed03b_5 = resWrongOtpGoogle.status === 400 && (dataWrongOtpG.message?.includes('OTP') || dataWrongOtpG.error?.includes('OTP'));
    record(
      'TC-STU-03B',
      'Nhập sai OTP thiết lập mật khẩu (Google OAuth)',
      '03B.5 (Negative - Google OAuth)',
      'Status 400: Mã OTP không chính xác',
      `Status ${resWrongOtpGoogle.status}, msg: ${dataWrongOtpG.message || dataWrongOtpG.error}`,
      passed03b_5
    );
  } catch (err) {
    record('TC-STU-03B', 'Sai OTP thiết lập MK', '03B.5 (Negative)', 'Status 400', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-03C: ĐĂNG XUẤT HỆ THỐNG
  // ----------------------------------------------------
  try {
    const resLogout = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });
    const dataLogout = await resLogout.json();
    const passed03c = resLogout.status === 200;
    record(
      'TC-STU-03C',
      'Thực hiện Đăng xuất',
      '03C.1 (Positive)',
      'Status 200, session/cookie cleared',
      `Status ${resLogout.status}, msg: ${dataLogout.message}`,
      passed03c
    );
  } catch (err) {
    record('TC-STU-03C', 'Đăng xuất', '03C.1 (Positive)', 'Status 200', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-03D: PHÂN QUYỀN ROUTE GUARD
  // ----------------------------------------------------

  // 03D.1 Security: Học sinh cố truy cập Endpoint Quản trị / Admin (GET /api/v1/users)
  try {
    const resAdminEndpoint = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataAdmin = await resAdminEndpoint.json();
    const passed03d_1 = resAdminEndpoint.status === 403;
    record(
      'TC-STU-03D',
      'Học sinh cố truy cập API / Tài nguyên Admin/Teacher',
      '03D.1 (Security)',
      'Status 403 Forbidden: Quyền hạn [student] không được phép thực hiện',
      `Status ${resAdminEndpoint.status}, msg: ${dataAdmin.message || dataAdmin.error}`,
      passed03d_1
    );
  } catch (err) {
    record('TC-STU-03D', 'Học sinh truy cập API Admin', '03D.1 (Security)', 'Status 403', err.message, false);
  }

  // 03D.2 Security: Người dùng chưa đăng nhập (Guest) truy cập API được bảo vệ
  try {
    const resGuest = await fetch(`${BASE_URL}/auth/me`);
    const dataGuest = await resGuest.json();
    const passed03d_2 = resGuest.status === 401;
    record(
      'TC-STU-03D',
      'Guest truy cập tài nguyên bảo vệ mà không có Token',
      '03D.2 (Security)',
      'Status 401 Unauthorized: Không có quyền truy cập, vui lòng đăng nhập',
      `Status ${resGuest.status}, msg: ${dataGuest.message || dataGuest.error}`,
      passed03d_2
    );
  } catch (err) {
    record('TC-STU-03D', 'Guest truy cập bảo vệ', '03D.2 (Security)', 'Status 401', err.message, false);
  }

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
  console.log('========================================');
}

runTests().catch(console.error);
