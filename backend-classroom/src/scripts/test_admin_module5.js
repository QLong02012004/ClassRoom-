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
  console.log('STARTING ADMIN MODULE 5 AUTOMATED TESTS');
  console.log('Module 5: Cài đặt Hệ thống (Settings - /admin/settings)');
  console.log('====================================================\n');

  let adminToken = '';

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
  } catch (e) {
    console.error('Error during Admin login:', e);
  }

  if (!adminToken) {
    console.error('CRITICAL: Admin token could not be obtained. Aborting tests.');
    process.exit(1);
  }

  // Backup original settings to restore at the end
  let originalSettings = null;
  try {
    const resOrig = await fetch(`${BASE_URL}/settings`);
    const dataOrig = await resOrig.json();
    originalSettings = dataOrig?.data;
  } catch (e) {
    console.warn('Could not fetch original settings:', e.message);
  }

  // ----------------------------------------------------
  // TC-ADM-23: CẬP NHẬT CẤU HÌNH CHUNG
  // ----------------------------------------------------

  // 23.1 (Positive): Đổi tên Hệ thống / Múi giờ
  const newSystemName = `Classroom Enterprise ${Date.now()}`;
  const newTimezone = 'gmt7';
  const newDateFormat = 'ddmm';

  try {
    const resUpdate = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        systemName: newSystemName,
        timezone: newTimezone,
        dateFormat: newDateFormat
      })
    });
    const dataUpdate = await resUpdate.json();
    const isUpdateSuccess = resUpdate.status === 200 && dataUpdate?.data?.systemName === newSystemName;

    // Verify GET endpoint returns updated settings
    const resGet = await fetch(`${BASE_URL}/settings`);
    const dataGet = await resGet.json();
    const isNameMatched = dataGet?.data?.systemName === newSystemName;
    const isTimezoneMatched = dataGet?.data?.timezone === newTimezone;

    // Verify frontend code AdminSettings.tsx handles save and toast
    const settingsPagePath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Settings/AdminSettings.tsx');
    const settingsCode = fs.readFileSync(settingsPagePath, 'utf-8');
    const hasSaveHandler = settingsCode.includes('settingsService.updateSettings') &&
                           settingsCode.includes('Cập nhật cài đặt hệ thống thành công');

    const passed = isUpdateSuccess && isNameMatched && isTimezoneMatched && hasSaveHandler;
    record(
      'TC-ADM-23',
      'Đổi tên Hệ thống / Múi giờ',
      '23.1 (Positive)',
      'Status 200, systemName and timezone updated; GET returns new settings; UI displays success toast',
      `API Update Status: ${resUpdate.status}, Updated Name: "${dataGet?.data?.systemName}", Frontend Toast Support: ${hasSaveHandler}`,
      passed,
      `New System Name: "${newSystemName}"`
    );
  } catch (err) {
    record('TC-ADM-23', 'Đổi tên Hệ thống / Múi giờ', '23.1 (Positive)', 'Status 200', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-24: BẬT CHẾ ĐỘ BẢO TRÌ (MAINTENANCE MODE)
  // ----------------------------------------------------

  // 24.1 (Impact Check): Bật Bảo trì -> Học sinh/Giáo viên bị chặn
  try {
    // 1. Admin turns Maintenance Mode ON
    const resEnable = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        maintenanceMode: true
      })
    });
    const dataEnable = await resEnable.json();
    const isMaintActive = resEnable.status === 200 && dataEnable?.data?.maintenanceMode === true;

    // 2. Student attempts login -> Should be blocked with 503
    const resStudentLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
    });
    const dataStudentLogin = await resStudentLogin.json();
    const isStudentBlocked = resStudentLogin.status === 503;
    const hasStudentMaintMsg = (dataStudentLogin?.message || '').includes('chế độ bảo trì');

    // 3. Teacher attempts login -> Should also be blocked with 503
    const resTeacherLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@gmail.com', password: '123456' })
    });
    const dataTeacherLogin = await resTeacherLogin.json();
    const isTeacherBlocked = resTeacherLogin.status === 503;

    // 4. Admin attempts login -> Allowed
    const resAdminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const dataAdminLogin = await resAdminLogin.json();
    const isAdminAllowed = resAdminLogin.status === 200 && !!dataAdminLogin?.data?.accessToken;

    // 5. Check frontend ProtectedRoute.tsx route guard for MaintenancePage
    const protectedRoutePath = path.resolve(__dirname, '../../../frontend-classroom/src/components/Layout/ProtectedRoute.tsx');
    const protectedRouteCode = fs.readFileSync(protectedRoutePath, 'utf-8');
    const hasClientRouteGuard = protectedRouteCode.includes('isMaintenance && user?.role !== \'admin\'') &&
                                protectedRouteCode.includes('<MaintenancePage />');

    const passed = isMaintActive && isStudentBlocked && isTeacherBlocked && isAdminAllowed && hasClientRouteGuard;

    record(
      'TC-ADM-24',
      'Bật Bảo trì -> Học sinh/Giáo viên bị chặn',
      '24.1 (Impact Check)',
      'Status 503 for Student & Teacher; Admin login allowed 200; ProtectedRoute displays MaintenancePage for non-admins',
      `Maintenance ON: ${isMaintActive}, Student Blocked: ${isStudentBlocked} (503), Teacher Blocked: ${isTeacherBlocked} (503), Admin Allowed: ${isAdminAllowed}, Client Route Guard: ${hasClientRouteGuard}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-24', 'Bật Chế độ Bảo trì', '24.1 (Impact Check)', 'Blocked 503', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-25: TẮT CHẾ ĐỘ BẢO TRÌ
  // ----------------------------------------------------

  // 25.1 (Impact Check): Tắt Bảo trì -> Mở lại bình thường
  try {
    // 1. Admin turns Maintenance Mode OFF
    const resDisable = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        maintenanceMode: false
      })
    });
    const dataDisable = await resDisable.json();
    const isMaintDisabled = resDisable.status === 200 && dataDisable?.data?.maintenanceMode === false;

    // 2. Student attempts login again -> Should succeed (200)
    const resStudentLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
    });
    const dataStudentLogin = await resStudentLogin.json();
    const canStudentLogin = resStudentLogin.status === 200 && !!dataStudentLogin?.data?.accessToken;

    // 3. Teacher attempts login again -> Should succeed (200)
    const resTeacherLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@gmail.com', password: '123456' })
    });
    const dataTeacherLogin = await resTeacherLogin.json();
    const canTeacherLogin = resTeacherLogin.status === 200 && !!dataTeacherLogin?.data?.accessToken;

    const passed = isMaintDisabled && canStudentLogin && canTeacherLogin;
    record(
      'TC-ADM-25',
      'Tắt Bảo trì -> Mở lại bình thường',
      '25.1 (Impact Check)',
      'Status 200, maintenanceMode disabled; Student and Teacher login successfully',
      `Maintenance OFF: ${isMaintDisabled}, Student Login: Status ${resStudentLogin.status}, Teacher Login: Status ${resTeacherLogin.status}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-25', 'Tắt Chế độ Bảo trì', '25.1 (Impact Check)', 'Normal access restored', err.message, false);
  }

  // Restore original settings
  if (originalSettings) {
    try {
      await fetch(`${BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          systemName: originalSettings.systemName,
          timezone: originalSettings.timezone,
          dateFormat: originalSettings.dateFormat,
          maintenanceMode: false
        })
      });
      console.log('Original system settings restored.');
    } catch (e) {
      // ignore
    }
  }

  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`ADMIN MODULE 5 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

runTests().catch(console.error);
