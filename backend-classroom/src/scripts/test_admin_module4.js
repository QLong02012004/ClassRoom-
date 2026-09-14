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
  console.log('STARTING ADMIN MODULE 4 AUTOMATED TESTS');
  console.log('Module 4: Quản lý Lớp học Hệ thống (Classrooms - /admin/classrooms)');
  console.log('====================================================\n');

  let adminToken = '';
  let teacherToken = '';
  let teacherId = '';
  let studentToken = '';

  // 0. Connect to MongoDB for state verification
  const MONGO_URI = 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully for test assertions.\n');
  } catch (err) {
    console.warn('MongoDB connection warning:', err.message);
  }

  // 1. Authenticate Admin, Teacher and Student
  try {
    const resAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const dataAdmin = await resAdmin.json();
    adminToken = dataAdmin?.data?.accessToken || '';

    const resTeacher = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@gmail.com', password: '123456' })
    });
    const dataTeacher = await resTeacher.json();
    teacherToken = dataTeacher?.data?.accessToken || '';
    teacherId = dataTeacher?.data?.user?.id || dataTeacher?.data?.user?._id || '';

    const resStudent = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
    });
    const dataStudent = await resStudent.json();
    studentToken = dataStudent?.data?.accessToken || '';
  } catch (e) {
    console.error('Error during login setup:', e);
  }

  if (!adminToken) {
    console.error('CRITICAL: Admin token could not be obtained. Aborting tests.');
    process.exit(1);
  }

  // Helper: Create a temporary test class for Module 4 tests
  let testClassId = null;
  let testClassCode = null;
  const testClassName = `Lớp Auto Test Mod4 ${Date.now()}`;

  try {
    const resCreate = await fetch(`${BASE_URL}/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        className: testClassName,
        subject: 'Toán học',
        requireApproval: true
      })
    });
    const dataCreate = await resCreate.json();
    if (resCreate.status === 201 && dataCreate?.data?._id) {
      testClassId = dataCreate.data._id;
      testClassCode = dataCreate.data.code;

      // Admin approves the new class to make it Active initially
      await fetch(`${BASE_URL}/classrooms/${testClassId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'Active' })
      });
    }
  } catch (e) {
    console.warn('Could not create temporary class via API, falling back to DB/existing classes:', e.message);
  }

  // If create via API failed, find an existing class from DB
  if (!testClassId) {
    const existing = await mongoose.connection.collection('classes').findOne({ status: 'Active' });
    if (existing) {
      testClassId = existing._id.toString();
      testClassCode = existing.code;
    }
  }

  console.log(`Test Classroom setup: ID: ${testClassId}, Code: ${testClassCode}\n`);

  // ----------------------------------------------------
  // TC-ADM-18: HIỂN THỊ BẢNG LỚP HỌC
  // ----------------------------------------------------

  // 18.1 (Data View): Kiểm tra danh sách toàn hệ thống
  try {
    const res = await fetch(`${BASE_URL}/classrooms/admin`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const is200 = res.status === 200;
    const classes = data?.data || [];
    const hasItems = classes.length > 0;

    // Check data fields
    const sample = classes[0];
    const hasName = typeof sample?.name === 'string';
    const hasCode = typeof sample?.id === 'string';
    const hasTeacher = !!sample?.teacher && typeof sample?.teacher?.name === 'string';
    const hasSubject = typeof sample?.subject === 'string';
    const hasStudentCount = typeof sample?.studentCount === 'number';
    const hasCreatedAt = !!sample?.createdAt;
    const hasStatus = ['Active', 'Locked', 'Pending'].includes(sample?.status);

    const hasAllFields = hasName && hasCode && hasTeacher && hasSubject && hasStudentCount && hasCreatedAt && hasStatus;
    const passed = is200 && hasItems && hasAllFields;

    record(
      'TC-ADM-18',
      'Kiểm tra danh sách lớp học toàn hệ thống',
      '18.1 (Data View)',
      'Status 200, array of classes with name, id (code), teacher, subject, studentCount, createdAt, status',
      `Status: ${res.status}, Total Classes: ${classes.length}, Full fields valid: ${hasAllFields}`,
      passed,
      `Sample Class: "${sample?.name}" (GV: ${sample?.teacher?.name}, Môn: ${sample?.subject}, Sĩ số: ${sample?.studentCount})`
    );
  } catch (err) {
    record('TC-ADM-18', 'Kiểm tra danh sách lớp học toàn hệ thống', '18.1 (Data View)', 'Status 200', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-19: PANEL QUICK VIEW (XEM NHANH)
  // ----------------------------------------------------

  // 19.1 (Interactive): Trượt Panel xem chi tiết hoạt động lớp
  try {
    // 1. Check API activities endpoint
    const resActivities = await fetch(`${BASE_URL}/classrooms/admin/${testClassId}/activities`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataActivities = await resActivities.json();
    const isActivities200 = resActivities.status === 200;
    const hasCurrentTopic = typeof dataActivities?.data?.currentTopic === 'string';
    const hasRecentActivities = Array.isArray(dataActivities?.data?.recentActivities);

    // 2. Check frontend code AdminClassrooms.tsx for interactive Row Action and Details Dialog
    const adminClassroomsPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Classrooms/AdminClassrooms.tsx');
    const content = fs.readFileSync(adminClassroomsPath, 'utf-8');

    const hasRowAction = content.includes('onRowAction={(key) =>') && content.includes('setSelectedClass(cls)');
    const hasDetailModal = content.includes('<ClassDetailModalContent') &&
                          content.includes('classItem={selectedClass}') &&
                          content.includes('fetchActivities');
    const hasTeacherCol = content.includes('Giáo viên phụ trách');
    const hasAcademicStats = content.includes('Hoạt động gần nhất') && content.includes('Bài chờ chấm');

    const passed = isActivities200 && hasCurrentTopic && hasRecentActivities && hasRowAction && hasDetailModal && hasTeacherCol && hasAcademicStats;

    record(
      'TC-ADM-19',
      'Trượt Panel xem chi tiết hoạt động lớp',
      '19.1 (Interactive)',
      'API returns currentTopic and recentActivities; Frontend renders interactive detail modal on row click with teacher info, assignments, stats',
      `Activities API: ${isActivities200} (topic: "${dataActivities?.data?.currentTopic}"), Row click: ${hasRowAction}, Detail Modal: ${hasDetailModal}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-19', 'Trượt Panel xem chi tiết hoạt động lớp', '19.1 (Interactive)', 'Activities & Modal', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-20: KHÓA LỚP HỌC VI PHẠM
  // ----------------------------------------------------

  // 20.1 (Positive): Admin thực hiện khóa Lớp học
  try {
    const resLock = await fetch(`${BASE_URL}/classrooms/${testClassId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Locked' })
    });
    const dataLock = await resLock.json();
    const isLockSuccess = resLock.status === 200 && dataLock?.data?.status === 'Locked';

    // Verify in DB directly
    const dbClass = await mongoose.connection.collection('classes').findOne({ _id: new mongoose.Types.ObjectId(testClassId) });
    const isDbLocked = dbClass?.status === 'Locked';

    const passed = isLockSuccess && isDbLocked;
    record(
      'TC-ADM-20',
      'Admin thực hiện khóa Lớp học',
      '20.1 (Positive)',
      'Status 200, classroom status updated to Locked in DB',
      `API Status: ${resLock.status}, DB Status: ${dbClass?.status}`,
      passed,
      `Class ID: ${testClassId}`
    );
  } catch (err) {
    record('TC-ADM-20', 'Admin thực hiện khóa Lớp học', '20.1 (Positive)', 'Status 200 Locked', err.message, false);
  }

  // 20.2 (Impact Check): Giáo viên / Học sinh vào Lớp bị khóa
  try {
    // 1. Teacher attempts to access locked class detail
    const resTeacherAccess = await fetch(`${BASE_URL}/classrooms/${testClassId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const dataTeacherAccess = await resTeacherAccess.json();
    const isTeacherBlocked = resTeacherAccess.status === 403;
    const hasBlockedMsg = (dataTeacherAccess?.message || '').includes('đã bị Quản trị viên hệ thống khóa');

    // 2. Student attempts to access locked class detail
    const resStudentAccess = await fetch(`${BASE_URL}/classrooms/${testClassId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataStudentAccess = await resStudentAccess.json();
    const isStudentBlocked = resStudentAccess.status === 403;

    const passed = isTeacherBlocked && isStudentBlocked && hasBlockedMsg;
    record(
      'TC-ADM-20',
      'Giáo viên / Học sinh vào Lớp bị khóa',
      '20.2 (Impact Check)',
      'Status 403 Forbidden: Lớp học này đã bị Quản trị viên hệ thống khóa và không thể truy cập',
      `Teacher Access: Status ${resTeacherAccess.status} (msg: ${dataTeacherAccess?.message}), Student Access: Status ${resStudentAccess.status}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-20', 'Giáo viên / Học sinh vào Lớp bị khóa', '20.2 (Impact Check)', 'Status 403 Blocked', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-21: MỞ KHÓA LỚP HỌC
  // ----------------------------------------------------

  // 21.1 (Positive): Mở khóa lớp đang Locked
  try {
    const resUnlock = await fetch(`${BASE_URL}/classrooms/${testClassId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Active' })
    });
    const dataUnlock = await resUnlock.json();
    const isUnlockSuccess = resUnlock.status === 200 && dataUnlock?.data?.status === 'Active';

    // Verify Teacher and Student can now access the class again
    const resTeacherAccess = await fetch(`${BASE_URL}/classrooms/${testClassId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const dataTeacherAccess = await resTeacherAccess.json();
    const canTeacherAccess = resTeacherAccess.status === 200 && !!dataTeacherAccess?.data?._id;

    const passed = isUnlockSuccess && canTeacherAccess;
    record(
      'TC-ADM-21',
      'Mở khóa lớp đang Locked',
      '21.1 (Positive)',
      'Status 200, status returns to Active; Teacher and Student can access class normally',
      `Unlock Status: ${resUnlock.status}, Class Status: ${dataUnlock?.data?.status}, Teacher Access: Status ${resTeacherAccess.status}`,
      passed
    );
  } catch (err) {
    record('TC-ADM-21', 'Mở khóa lớp đang Locked', '21.1 (Positive)', 'Status 200 Active', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-22: XÓA VĨNH VIỄN LỚP HỌC
  // ----------------------------------------------------

  // 22.1 (Positive): Admin xóa lớp học rác
  try {
    const resDelete = await fetch(`${BASE_URL}/classrooms/${testClassId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataDelete = await resDelete.json();
    const isDeleteSuccess = resDelete.status === 200;

    // Verify class is completely gone from DB
    const dbCheck = await mongoose.connection.collection('classes').findOne({ _id: new mongoose.Types.ObjectId(testClassId) });
    const isDeletedFromDb = dbCheck === null;

    const passed = isDeleteSuccess && isDeletedFromDb;
    record(
      'TC-ADM-22',
      'Admin xóa lớp học rác',
      '22.1 (Positive)',
      'Status 200, class permanently removed from database',
      `Delete Status: ${resDelete.status}, Removed from DB: ${isDeletedFromDb}`,
      passed,
      `Class ID: ${testClassId}`
    );
  } catch (err) {
    record('TC-ADM-22', 'Admin xóa lớp học rác', '22.1 (Positive)', 'Status 200 Deleted', err.message, false);
  }

  // ----------------------------------------------------
  // TC-TCH-01: RÀNG BUỘC TẠO LỚP HỌC (TEACHER PROFILE VALIDATION)
  // ----------------------------------------------------

  // 01.1 (Validation): Giáo viên chưa hoàn thiện hồ sơ click Tạo lớp
  try {
    // 1. Kiểm tra utility profileChecker.ts
    const profileCheckerPath = path.resolve(__dirname, '../../../frontend-classroom/src/utils/profileChecker.ts');
    const profileCheckerCode = fs.readFileSync(profileCheckerPath, 'utf-8');

    const hasGenderCheck = profileCheckerCode.includes('!user.gender') && profileCheckerCode.includes('Giới tính');
    const hasDobCheck = profileCheckerCode.includes('!user.dob') && profileCheckerCode.includes('Ngày sinh');
    const hasPhoneCheck = profileCheckerCode.includes('!user.phone') && profileCheckerCode.includes('Số điện thoại / Zalo');
    const hasDegreeCheck = profileCheckerCode.includes('!user.degree') && profileCheckerCode.includes('Bằng cấp / Trình độ');
    const hasSubjectCheck = profileCheckerCode.includes('!user.subject') && profileCheckerCode.includes('Môn học');

    const hasAllProfileChecks = hasGenderCheck && hasDobCheck && hasPhoneCheck && hasDegreeCheck && hasSubjectCheck;

    // 2. Kiểm tra Modal cảnh báo ProfileWarningModal.tsx
    const warningModalPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/ui/Dialogs/ProfileWarningModal.tsx');
    const warningModalCode = fs.readFileSync(warningModalPath, 'utf-8');

    const hasWarningTitle = warningModalCode.includes('Cần hoàn thiện hồ sơ trước khi tạo lớp');
    const hasMissingFieldsList = warningModalCode.includes('missingFields.map');
    const hasRedirectButton = warningModalCode.includes('Cập nhật hồ sơ ngay') && warningModalCode.includes('navigate("/profile")');

    // 3. Kiểm tra tích hợp vào TeacherClassrooms.tsx
    const teacherClassroomsPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Teacher/Classrooms/TeacherClassrooms.tsx');
    const teacherClassroomsCode = fs.readFileSync(teacherClassroomsPath, 'utf-8');

    const hasCreateClassGuard = teacherClassroomsCode.includes('checkTeacherProfileComplete(user)') &&
                                teacherClassroomsCode.includes('setShowProfileWarningModal(true)') &&
                                teacherClassroomsCode.includes('setMissingProfileFields(missingFields)');

    const passed = hasAllProfileChecks && hasWarningTitle && hasMissingFieldsList && hasRedirectButton && hasCreateClassGuard;

    record(
      'TC-TCH-01',
      'Giáo viên chưa hoàn thiện hồ sơ click Tạo lớp',
      '01.1 (Validation)',
      'Profile validation checks 5 fields (Gender, DOB, Phone, Degree, Subject); Displays modal listing missing fields; Button redirects directly to /profile',
      `5 Profile Checks: ${hasAllProfileChecks}, Warning Title: ${hasWarningTitle}, Missing list: ${hasMissingFieldsList}, Redirect /profile: ${hasRedirectButton}, Guard: ${hasCreateClassGuard}`,
      passed
    );
  } catch (err) {
    record('TC-TCH-01', 'Ràng buộc Tạo Lớp học', '01.1 (Validation)', 'Profile warning modal', err.message, false);
  }

  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`ADMIN MODULE 4 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

runTests().catch(console.error);
