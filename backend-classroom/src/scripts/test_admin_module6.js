const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function runTests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING ADMIN MODULE 6 AUTOMATED TESTS');
  console.log('Module 6: Quản lý Hồ sơ Cá nhân & Bảo mật (/profile)');
  console.log('====================================================\n');

  let adminToken = '';
  let adminData = null;

  // 0. Connect to MongoDB
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
    adminData = dataAdmin?.data?.user || null;
  } catch (e) {
    console.error('Error during Admin login:', e);
  }

  if (!adminToken) {
    console.error('CRITICAL: Admin token could not be obtained. Aborting tests.');
    process.exit(1);
  }

  // ----------------------------------------------------
  // TC-ADM-26: XEM HỒ SƠ ADMIN
  // ----------------------------------------------------

  // 26.1 (View): Kiểm tra thông tin thông số cá nhân
  try {
    const resMe = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataMe = await resMe.json();
    const is200 = resMe.status === 200;
    const user = dataMe?.data || dataMe?.user;

    const hasName = typeof user?.name === 'string' && user?.name.length > 0;
    const hasEmail = user?.email === 'admin@gmail.com';
    const isAdminRole = user?.role === 'admin';

    const passed = is200 && hasName && hasEmail && isAdminRole;
    record(
      'TC-ADM-26',
      'Xem Hồ sơ Admin',
      '26.1 (View)',
      'Status 200: Returns admin profile info (Name, Email: admin@gmail.com, Role: admin)',
      `Status: ${resMe.status}, Name: ${user?.name}, Email: ${user?.email}, Role: ${user?.role}`,
      passed,
      `User: ${user?.name} (${user?.email})`
    );
  } catch (err) {
    record('TC-ADM-26', 'Xem Hồ sơ Admin', '26.1 (View)', 'Status 200', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-27: CẬP NHẬT THÔNG TIN CÁ NHÂN & VALIDATION
  // ----------------------------------------------------

  // 27.1 (Positive): Chỉnh sửa Họ tên, SĐT, Địa chỉ
  const originalName = adminData?.name || 'Administrator';
  const updatedName = 'Admin Nguyễn Văn Long';
  const updatedPhone = '0901234567';
  const updatedAddress = 'Hà Nội, Việt Nam';

  try {
    const resUpdate = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: updatedName,
        phone: updatedPhone,
        address: updatedAddress
      })
    });
    const dataUpdate = await resUpdate.json();
    const isSuccess = resUpdate.status === 200;
    const isNameUpdated = dataUpdate?.data?.name === updatedName;
    const isPhoneUpdated = dataUpdate?.data?.phone === updatedPhone;

    const passed = isSuccess && isNameUpdated && isPhoneUpdated;
    record(
      'TC-ADM-27',
      'Chỉnh sửa Họ tên, SĐT, Địa chỉ',
      '27.1 (Positive)',
      'Status 200: Profile updated with new name, phone and address',
      `Status: ${resUpdate.status}, Name: ${dataUpdate?.data?.name}, Phone: ${dataUpdate?.data?.phone}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-27', 'Chỉnh sửa thông tin cá nhân', '27.1 (Positive)', 'Status 200', err.message, false);
  }

  // 27.1B (Validation): Chỉnh sửa thông tin không hợp lệ
  try {
    // 1. Tên chứa số:
    const resBadName = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'Admin123' })
    });
    const dataBadName = await resBadName.json();
    const isBadNameBlocked = resBadName.status === 400 && (dataBadName?.message || '').includes('chữ số');

    // 2. SĐT sai định dạng:
    const resBadPhone = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ phone: '123' })
    });
    const dataBadPhone = await resBadPhone.json();
    const isBadPhoneBlocked = resBadPhone.status === 400 && (dataBadPhone?.message || '').includes('định dạng');

    // 3. Ngày sinh trong tương lai:
    const nextYear = new Date().getFullYear() + 1;
    const resFutureDob = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ dob: `${nextYear}-01-01` })
    });
    const dataFutureDob = await resFutureDob.json();
    const isFutureDobBlocked = resFutureDob.status === 400 && ((dataFutureDob?.message || '').includes('ngày hiện tại') || (dataFutureDob?.message || '').includes('Năm sinh không hợp lệ'));

    const passed = isBadNameBlocked && isBadPhoneBlocked && isFutureDobBlocked;
    record(
      'TC-ADM-27',
      'Validation thông tin không hợp lệ (Tên chứa số, SĐT sai, Ngày sinh tương lai)',
      '27.1B (Validation)',
      'Status 400 for all invalid input cases with explicit validation error messages',
      `Bad Name (400): ${isBadNameBlocked}, Bad Phone (400): ${isBadPhoneBlocked}, Future DOB (400): ${isFutureDobBlocked}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-27', 'Validation thông tin không hợp lệ', '27.1B (Validation)', 'Status 400', err.message, false);
  }

  // Restore original name
  try {
    await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: originalName })
    });
  } catch (e) {
    // ignore
  }

  // ----------------------------------------------------
  // TC-ADM-28: ĐỔI AVATAR
  // ----------------------------------------------------

  // 28.1 (Positive): Tải tệp ảnh hợp lệ (< 2MB)
  const validBase64Avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  try {
    const resAvatar = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ avatar: validBase64Avatar })
    });
    const dataAvatar = await resAvatar.json();
    const passed = resAvatar.status === 200 && dataAvatar?.data?.avatar === validBase64Avatar;

    record(
      'TC-ADM-28',
      'Tải tệp ảnh hợp lệ (< 2MB)',
      '28.1 (Positive)',
      'Status 200: Avatar updated successfully with base64 image',
      `Status: ${resAvatar.status}, Avatar updated: ${passed}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-28', 'Tải tệp ảnh hợp lệ (< 2MB)', '28.1 (Positive)', 'Status 200', err.message, false);
  }

  // 28.2 (Negative): Chọn tệp sai định dạng hoặc quá lớn
  try {
    const profilePagePath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Student/Profile/StudentProfile.tsx');
    const profileCode = fs.readFileSync(profilePagePath, 'utf-8');

    const hasFileSizeLimit = profileCode.includes('2 * 1024 * 1024') &&
                             profileCode.includes('Kích thước ảnh không được vượt quá 2MB');
    const hasImageAcceptOnly = profileCode.includes('accept="image/*"');

    const passed = hasFileSizeLimit && hasImageAcceptOnly;
    record(
      'TC-ADM-28',
      'Chọn tệp sai định dạng hoặc quá lớn',
      '28.2 (Negative)',
      'Frontend restricts file types to images (accept="image/*") and rejects files > 2MB with explicit error message',
      `Size limit guard (2MB): ${hasFileSizeLimit}, Image type restriction: ${hasImageAcceptOnly}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-28', 'Chọn tệp sai định dạng hoặc quá lớn', '28.2 (Negative)', 'Validation error', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-29: ĐỔI MẬT KHẨU THÀNH CÔNG
  // ----------------------------------------------------

  // 29.1 (Positive): Nhập đúng Mật khẩu cũ & Mật khẩu mới chuẩn
  const tempNewPass = 'Admin@2026';
  try {
    // 1. Change password to Admin@2026
    const resChange = await fetch(`${BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        oldPassword: 'admin123',
        newPassword: tempNewPass
      })
    });
    const dataChange = await resChange.json();
    const isChangeSuccess = resChange.status === 200;

    // 2. Login with new password
    const resNewLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: tempNewPass })
    });
    const dataNewLogin = await resNewLogin.json();
    const canLoginNewPass = resNewLogin.status === 200 && !!dataNewLogin?.data?.accessToken;

    // 3. Restore password back to admin123 via DB
    const salt = await bcrypt.genSalt(10);
    const hashAdmin123 = await bcrypt.hash('admin123', salt);
    await mongoose.connection.collection('users').updateOne(
      { email: 'admin@gmail.com' },
      { $set: { passwordHash: hashAdmin123 } }
    );

    // Refresh adminToken with original password
    const resRelogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const dataRelogin = await resRelogin.json();
    adminToken = dataRelogin?.data?.accessToken || adminToken;

    const passed = isChangeSuccess && canLoginNewPass;
    record(
      'TC-ADM-29',
      'Đổi mật khẩu thành công',
      '29.1 (Positive)',
      'Status 200: Password changed; Login with new password Admin@2026 succeeds; Password safely restored',
      `Change Status: ${resChange.status}, Login with new password Status: ${resNewLogin.status}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-29', 'Đổi mật khẩu thành công', '29.1 (Positive)', 'Status 200 & Login', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-30: ĐỔI MẬT KHẨU THẤT BẠI
  // ----------------------------------------------------

  // 30.1 (Negative): Nhập sai Mật khẩu hiện tại
  try {
    const resWrongOld = await fetch(`${BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        oldPassword: 'wrongPassword123',
        newPassword: 'ValidNewPass@2026'
      })
    });
    const dataWrongOld = await resWrongOld.json();
    const passed = resWrongOld.status === 400 && (dataWrongOld?.message || '').includes('không chính xác');

    record(
      'TC-ADM-30',
      'Nhập sai Mật khẩu hiện tại',
      '30.1 (Negative)',
      'Status 400: Mật khẩu hiện tại không chính xác',
      `Status: ${resWrongOld.status}, Message: ${dataWrongOld?.message}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-30', 'Nhập sai Mật khẩu hiện tại', '30.1 (Negative)', 'Status 400', err.message, false);
  }

  // 30.2 (Negative): Mật khẩu xác nhận không khớp
  try {
    const profilePagePath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Student/Profile/StudentProfile.tsx');
    const profileCode = fs.readFileSync(profilePagePath, 'utf-8');

    const hasConfirmCheck = profileCode.includes('passwordForm.newPassword !== passwordForm.confirmPassword') &&
                            profileCode.includes('Mật khẩu xác nhận không khớp');

    record(
      'TC-ADM-30',
      'Mật khẩu xác nhận không khớp',
      '30.2 (Negative)',
      'Client validates password confirmation match; Displays error: "Mật khẩu xác nhận không khớp"',
      `Confirmation check in code: ${hasConfirmCheck}`,
      hasConfirmCheck
    );
  } catch (err) {
    record('TC-ADM-30', 'Mật khẩu xác nhận không khớp', '30.2 (Negative)', 'Validation error', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-31: ĐĂNG XUẤT HỆ THỐNG
  // ----------------------------------------------------

  // 31.1 (Positive): Thực hiện Đăng xuất
  try {
    const resLogout = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const isLogout200 = resLogout.status === 200;

    // Check frontend TopHeader and Navbar handles token removal and logout
    const topHeaderPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/Layout/TopHeader/TopHeader.tsx');
    const topHeaderCode = fs.readFileSync(topHeaderPath, 'utf-8');
    const hasTopHeaderLogout = (topHeaderCode.includes('handleLogOut') || topHeaderCode.includes('handleLogout')) &&
                               topHeaderCode.includes('logout()');

    const passed = isLogout200 && hasTopHeaderLogout;
    record(
      'TC-ADM-31',
      'Thực hiện Đăng xuất',
      '31.1 (Positive)',
      'Status 200: Refresh token cleared; Client clears session and redirects to /login',
      `API Logout Status: ${resLogout.status}, Client Logout Handler: ${hasTopHeaderLogout}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-31', 'Thực hiện Đăng xuất', '31.1 (Positive)', 'Status 200', err.message, false);
  }

  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`ADMIN MODULE 6 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

runTests().catch(console.error);
