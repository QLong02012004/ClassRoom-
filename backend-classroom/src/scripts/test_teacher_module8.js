/**
 * ============================================================================
 * TÊN FILE: test_teacher_module8.js
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/test_teacher_module8.js
 * MỤC ĐÍCH:
 *   Bộ kịch bản kiểm thử tự động toàn diện cho:
 *   MODULE 8: CHUÔNG THÔNG BÁO & TIỆN ÍCH GIÁO VIÊN
 *   trong docs/TEACHER_TESTING_GUIDE.md (TC-TCH-27 và TC-TCH-28).
 * ============================================================================
 */

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const mongoose = require('mongoose');
const fs = require('fs');

async function runTeacherModule8Tests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING TEACHER MODULE 8 AUTOMATED TESTS');
  console.log('Module 8: Chuông Thông báo & Tiện ích Giáo viên');
  console.log('====================================================\n');

  let teacherToken = '';
  let adminToken = '';
  let studentToken = '';
  let teacherId = '';
  let studentId = '';
  let testClassId = '';
  let testActivityId = '';
  const createdClassIds = [];
  const createdNotificationIds = [];

  try {
    // 1. Authenticate Teacher, Admin & Student
    const tRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@gmail.com', password: '123456' })
    });
    const tData = await tRes.json();
    teacherToken = tData?.data?.accessToken;
    teacherId = tData?.data?.user?.id || tData?.data?.user?._id;
    if (!teacherToken || !teacherId) throw new Error('Cannot login as Teacher');

    const aRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const aData = await aRes.json();
    adminToken = aData?.data?.accessToken;
    if (!adminToken) throw new Error('Cannot login as Admin');

    const sRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
    });
    const sData = await sRes.json();
    studentToken = sData?.data?.accessToken;
    studentId = sData?.data?.user?.id || sData?.data?.user?._id;
    if (!studentToken || !studentId) throw new Error('Cannot login as Student');

    // Connect to Mongo
    const mongoUri = 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';
    await mongoose.connect(mongoUri);

    // Setup class with student
    const cRes = await fetch(`${BASE_URL}/classrooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
      body: JSON.stringify({
        className: `Class M8 Notifs ${Date.now()}`,
        subject: 'Toán Học'
      })
    });
    const cData = await cRes.json();
    testClassId = cData.data._id;
    createdClassIds.push(testClassId);

    // Enroll student
    await fetch(`${BASE_URL}/classrooms/${testClassId}/students/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
      body: JSON.stringify({ studentId })
    });

    // Create assignment
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const actRes = await fetch(`${BASE_URL}/classes/${testClassId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
      body: JSON.stringify({
        title: 'Bài tập M8 Submit Test',
        dueDate: tomorrow,
        maxScore: 10
      })
    });
    const actData = await actRes.json();
    testActivityId = actData._id;

    // =========================================================================
    // TC-TCH-27: CHUÔNG THÔNG BÁO GIÁO VIÊN (NOTIFICATION POPOVER)
    // =========================================================================
    console.log('\n--- TC-TCH-27: Chuông Thông báo Giáo viên ---');

    // 27.1 (Real-time): Nhận thông báo khi Admin khóa/mở khóa lớp
    try {
      // Admin locks class
      await fetch(`${BASE_URL}/classrooms/${testClassId}/lock`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      // Teacher checks notifications
      const notifRes = await fetch(`${BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const notifData = await notifRes.json();
      const notifs = notifData.data || [];
      const lockNotif = notifs.find(
        (n) => n.title?.includes('khóa') || n.message?.includes('khóa')
      );
      if (lockNotif?._id) createdNotificationIds.push(lockNotif._id);

      const passed = notifRes.status === 200 && !!lockNotif;

      record(
        'TC-TCH-27',
        'Nhận thông báo khi Admin khóa/mở khóa lớp',
        '27.1 (Real-time)',
        'Status 200, teacher receives notification about class locking',
        `Status: ${notifRes.status}, Lock notification found: ${!!lockNotif}, Title: "${lockNotif?.title}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-27', 'Thông báo Admin khóa lớp', '27.1 (Real-time)', 'Received notif', err.message, false);
    }

    // Unlock class for next tests
    await fetch(`${BASE_URL}/classrooms/${testClassId}/unlock`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    // 27.2 (Real-time): Nhận thông báo khi Học sinh nộp bài
    let submitNotifId = null;
    try {
      // Student submits
      await fetch(`${BASE_URL}/activities/${testActivityId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
        body: JSON.stringify({
          submissionText: 'Em đã nộp bài tập M8 ạ'
        })
      });

      // Teacher checks notifications
      const notifRes = await fetch(`${BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const notifData = await notifRes.json();
      const notifs = notifData.data || [];
      const subNotif = notifs.find(
        (n) => n.title?.includes('nộp bài') || n.message?.includes('vừa nộp bài')
      );
      if (subNotif?._id) {
        submitNotifId = subNotif._id;
        createdNotificationIds.push(subNotif._id);
      }

      const passed = notifRes.status === 200 && !!subNotif;

      record(
        'TC-TCH-27',
        'Nhận thông báo khi Học sinh nộp bài',
        '27.2 (Real-time)',
        'Status 200, teacher receives submission notification with student details',
        `Submit notification found: ${!!subNotif}, Title: "${subNotif?.title}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-27', 'Thông báo nộp bài', '27.2 (Real-time)', 'Notification received', err.message, false);
    }

    // 27.3 (Interactive): Đánh dấu đã đọc thông báo
    try {
      let markPassed = false;
      const targetNotifId = submitNotifId || createdNotificationIds[0];
      if (targetNotifId) {
        const readRes = await fetch(`${BASE_URL}/notifications/${targetNotifId}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        const readData = await readRes.json();

        // Verify status is read
        const checkRes = await fetch(`${BASE_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        const checkData = await checkRes.json();
        const updated = (checkData.data || []).find((n) => n._id.toString() === targetNotifId.toString());

        markPassed = readRes.status === 200 && updated?.isRead === true;
      }

      record(
        'TC-TCH-27',
        'Đánh dấu đã đọc thông báo',
        '27.3 (Interactive)',
        'Status 200, notification marked as read (isRead: true)',
        `Mark as read OK: ${markPassed}`,
        markPassed
      );
    } catch (err) {
      record('TC-TCH-27', 'Đánh dấu đã đọc', '27.3 (Interactive)', 'Marked read', err.message, false);
    }


    // =========================================================================
    // TC-TCH-28: MENU SIDEBAR GIÁO VIÊN
    // =========================================================================
    console.log('\n--- TC-TCH-28: Menu Sidebar Giáo viên ---');

    // 28.1 (Navigation): Chuyển đổi qua lại giữa các menu
    try {
      const sidebarCode = fs.readFileSync('d:/ClassRoom-/frontend-classroom/src/components/Layout/Sidebar/Sidebar.tsx', 'utf8');
      const hasClassrooms = sidebarCode.includes('path: "/classrooms"');
      const hasAttendance = sidebarCode.includes('path: "/attendance"');
      const hasGradebook = sidebarCode.includes('path: "/gradebook"');
      const hasBank = sidebarCode.includes('path: "/bank"');
      const hasActiveStyle = sidebarCode.includes('active ? styles.active : \'\'');

      const passed = hasClassrooms && hasAttendance && hasGradebook && hasBank && hasActiveStyle;

      record(
        'TC-TCH-28',
        'Chuyển đổi qua lại giữa các menu',
        '28.1 (Navigation)',
        'Sidebar defines teacher routes /classrooms, /bank, /attendance, /gradebook with active styling',
        `Classrooms: ${hasClassrooms}, Attendance: ${hasAttendance}, Gradebook: ${hasGradebook}, Bank: ${hasBank}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-28', 'Menu navigation', '28.1 (Navigation)', 'Routes verified', err.message, false);
    }

    // 28.2 (UI/UX): Thu gọn & Mở rộng Sidebar
    try {
      const sidebarCode = fs.readFileSync('d:/ClassRoom-/frontend-classroom/src/components/Layout/Sidebar/Sidebar.tsx', 'utf8');
      const hasHoverState = sidebarCode.includes('isHovered') &&
                            sidebarCode.includes('onMouseEnter={() => setIsHovered(true)}') &&
                            sidebarCode.includes('onMouseLeave={() => setIsHovered(false)}') &&
                            sidebarCode.includes('styles.expanded');

      record(
        'TC-TCH-28',
        'Thu gọn & Mở rộng Sidebar',
        '28.2 (UI/UX)',
        'Sidebar expands on mouse enter and collapses on mouse leave via styles.expanded',
        `Hover state and expanded style configured: ${hasHoverState}`,
        hasHoverState
      );
    } catch (err) {
      record('TC-TCH-28', 'Thu gọn mở rộng sidebar', '28.2 (UI/UX)', 'Hover verified', err.message, false);
    }

  } catch (err) {
    console.error('Unhandled error in Teacher Module 8 tests:', err);
  } finally {
    // Cleanup temporary test classes, activities, notifications
    if (createdClassIds.length > 0) {
      await mongoose.connection.collection('classes').deleteMany({
        _id: { $in: createdClassIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
      await mongoose.connection.collection('classactivities').deleteMany({
        classId: { $in: createdClassIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
    }
    if (createdNotificationIds.length > 0) {
      await mongoose.connection.collection('notifications').deleteMany({
        _id: { $in: createdNotificationIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
    }
    await mongoose.disconnect();
    console.log('\nCleaned up temporary test data.');
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log('\n====================================================');
  console.log(`TEACHER MODULE 8 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');
}

runTeacherModule8Tests().catch(console.error);
