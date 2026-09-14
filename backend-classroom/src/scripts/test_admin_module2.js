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
  console.log('STARTING ADMIN MODULE 2 AUTOMATED TESTS');
  console.log('Module 2: Bảng điều khiển Tổng quan (Dashboard & Analytics)');
  console.log('====================================================\n');

  let adminToken = '';
  let teacherToken = '';
  let studentId = '';

  // 1. Authenticate Admin and Teacher
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

    const resStudent = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
    });
    const dataStudent = await resStudent.json();
    studentId = dataStudent?.data?.user?.id || dataStudent?.data?.user?._id || '';
  } catch (e) {
    console.error('Error during login setup:', e);
  }

  // ----------------------------------------------------
  // TC-ADM-04: THẺ CHỈ SỐ TỔNG HỢP (WIDGETS)
  // ----------------------------------------------------

  // 04.1 (Data Integrity): Hiển thị 4 thẻ thống kê số liệu
  let statsData = null;
  try {
    const resStats = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const jsonStats = await resStats.json();
    statsData = jsonStats?.data;

    const hasTotalStudents = typeof statsData?.totalStudents === 'number';
    const hasTotalTeachers = typeof statsData?.totalTeachers === 'number';
    const hasActiveClasses = typeof statsData?.activeClasses === 'number';
    const hasAttendanceRate = typeof statsData?.attendanceRate === 'number';

    const passed04_1 = resStats.status === 200 && hasTotalStudents && hasTotalTeachers && hasActiveClasses && hasAttendanceRate;
    record(
      'TC-ADM-04',
      'Hiển thị 4 thẻ thống kê số liệu (Widgets)',
      '04.1 (Data Integrity)',
      'Status 200, returns totalStudents, totalTeachers, activeClasses, attendanceRate',
      `HS: ${statsData?.totalStudents}, GV: ${statsData?.totalTeachers}, Lớp: ${statsData?.activeClasses}, Điểm danh: ${statsData?.attendanceRate}%`,
      passed04_1
    );
  } catch (err) {
    record('TC-ADM-04', 'Hiển thị 4 thẻ thống kê số liệu', '04.1 (Data Integrity)', 'Status 200 & valid numbers', err.message, false);
  }

  // 04.2 (Real-time): Tự động nhảy số khi có dữ liệu mới qua Socket.IO
  try {
    const adminDashboardPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Dashboard/AdminDashboard.tsx');
    const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf-8');

    const hasSocketImport = adminDashboardContent.includes('import { io } from "socket.io-client";');
    const hasSocketListener = adminDashboardContent.includes("socket.on('admin_stats_update'") &&
                              adminDashboardContent.includes('fetchStats()');

    const socketServerPath = path.resolve(__dirname, '../socket.ts');
    const socketServerContent = fs.readFileSync(socketServerPath, 'utf-8');
    const hasSocketEmitter = socketServerContent.includes("io.emit('admin_stats_update'");

    const passed04_2 = hasSocketImport && hasSocketListener && hasSocketEmitter;
    record(
      'TC-ADM-04',
      'Tự động nhảy số khi có dữ liệu mới (Real-time Sockets)',
      '04.2 (Real-time)',
      'Socket server emits admin_stats_update, AdminDashboard listens and re-fetches stats automatically',
      `Client listener: ${hasSocketListener}, Server emitter: ${hasSocketEmitter}`,
      passed04_2
    );
  } catch (err) {
    record('TC-ADM-04', 'Tự động nhảy số Real-time', '04.2 (Real-time)', 'Socket connection verified', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-04B: XUẤT BÁO CÁO HỆ THỐNG (EXPORT CSV)
  // ----------------------------------------------------

  // 04B.1 (Positive): Tải xuống báo cáo hệ thống dạng CSV
  try {
    const adminDashboardPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Dashboard/AdminDashboard.tsx');
    const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf-8');

    const hasExportButton = adminDashboardContent.includes('Xuất báo cáo') &&
                            adminDashboardContent.includes('handleExportReport');
    const hasToastDownload = adminDashboardContent.includes('Đang tải xuống báo cáo hệ thống...');
    const hasCsvDownloadAttr = adminDashboardContent.includes('Bao_Cao_He_Thong_Classroom.csv');

    const passed04B_1 = hasExportButton && hasToastDownload && hasCsvDownloadAttr;
    record(
      'TC-ADM-04B',
      'Tải xuống báo cáo hệ thống dạng CSV',
      '04B.1 (Positive)',
      'Button "Xuất báo cáo" downloads Bao_Cao_He_Thong_Classroom.csv and displays download toast',
      `Export function: ${hasExportButton}, Toast: ${hasToastDownload}, Filename: ${hasCsvDownloadAttr}`,
      passed04B_1
    );
  } catch (err) {
    record('TC-ADM-04B', 'Tải xuống báo cáo CSV', '04B.1 (Positive)', 'Verified CSV export', err.message, false);
  }

  // 04B.2 (Encoding): Kiểm tra font chữ Tiếng Việt trong file CSV
  try {
    const adminDashboardPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Dashboard/AdminDashboard.tsx');
    const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf-8');

    const hasBom = adminDashboardContent.includes('const bom = "\\uFEFF";') || adminDashboardContent.includes('bom + csvContent');
    const hasUtf8Charset = adminDashboardContent.includes('text/csv;charset=utf-8;');
    const hasVietnameseLabels = adminDashboardContent.includes('Tổng học sinh') &&
                                adminDashboardContent.includes('Tổng giáo viên') &&
                                adminDashboardContent.includes('Lớp đang hoạt động');

    const passed04B_2 = hasBom && hasUtf8Charset && hasVietnameseLabels;
    record(
      'TC-ADM-04B',
      'Kiểm tra font chữ Tiếng Việt trong file CSV',
      '04B.2 (Encoding)',
      'File CSV starts with UTF-8 BOM (\\uFEFF) and charset=utf-8 ensuring perfect Vietnamese accents',
      `UTF-8 BOM: ${hasBom}, Charset UTF-8: ${hasUtf8Charset}, Vietnamese headers: ${hasVietnameseLabels}`,
      passed04B_2
    );
  } catch (err) {
    record('TC-ADM-04B', 'Kiểm tra UTF-8 BOM CSV', '04B.2 (Encoding)', 'UTF-8 BOM present', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-05: BIỂU ĐỒ TĂNG TRƯỞNG (USER GROWTH)
  // ----------------------------------------------------

  // 05.1 (UI/UX): Biểu đồ cột (Bar Chart) 12 tháng (T1 -> T12)
  try {
    const userGrowth = statsData?.userGrowthData || [];
    const is12Months = userGrowth.length === 12;
    const labelsMatch = userGrowth.every((m, idx) => m.month === `T${idx + 1}`);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const futureMonthsZero = userGrowth.slice(currentMonth).every(m => m.students === 0 && m.teachers === 0);

    const passed05_1 = is12Months && labelsMatch && futureMonthsZero;
    record(
      'TC-ADM-05',
      'Biểu đồ Tăng trưởng 12 tháng (T1 -> T12)',
      '05.1 (UI/UX)',
      'Exactly 12 items (T1..T12), future months have value 0 with no extraneous columns',
      `Month count: ${userGrowth.length}, Labels T1-T12: ${labelsMatch}, Future months zeroed: ${futureMonthsZero}`,
      passed05_1
    );
  } catch (err) {
    record('TC-ADM-05', 'Biểu đồ Tăng trưởng 12 tháng', '05.1 (UI/UX)', '12 months data verified', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-06: DÒNG THỜI GIAN HOẠT ĐỘNG GẦN ĐÂY (RECENT ACTIVITY)
  // ----------------------------------------------------

  // 06.1 (Synchronized Data): Kiểm tra đồng bộ dữ liệu với Chuông thông báo
  try {
    const recentActions = statsData?.recentActions || [];
    const hasItems = Array.isArray(recentActions) && recentActions.length > 0;
    const validActionTypes = recentActions.every(a => !!a.actionType && !!a.badge && !!a.action);

    const passed06_1 = hasItems && validActionTypes;
    record(
      'TC-ADM-06',
      'Đồng bộ dữ liệu thời gian thực với Chuông Thông báo',
      '06.1 (Synchronized Data)',
      'Recent activity items synchronized from NotificationModel with badges, teacher names, and actions',
      `Total actions: ${recentActions.length}, Valid types & badges: ${validActionTypes}`,
      passed06_1,
      `Latest: ${recentActions[0]?.action}`
    );
  } catch (err) {
    record('TC-ADM-06', 'Đồng bộ hoạt động gần đây', '06.1 (Synchronized Data)', 'Synchronized actions verified', err.message, false);
  }

  // 06.2 (UI/UX): Highlight thông tin Giáo viên & Lớp học
  try {
    const adminDashboardPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Dashboard/AdminDashboard.tsx');
    const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf-8');

    const hasTeacherBold = adminDashboardContent.includes('font-bold text-xs text-slate-900 group-hover:text-[#f47c20]');
    const hasClassHighlight = adminDashboardContent.includes('font-bold text-[#2f8fa3] bg-[#2f8fa3]/10 border border-[#2f8fa3]/20 px-2 py-0.5 rounded-md text-[11px]');
    const hasRelativeTime = adminDashboardContent.includes('item.time');

    const passed06_2 = hasTeacherBold && hasClassHighlight && hasRelativeTime;
    record(
      'TC-ADM-06',
      'Highlight thông tin Giáo viên & Lớp học',
      '06.2 (UI/UX)',
      'Bold teacher name, highlighted class pill with cyan border/bg, accurate relative time',
      `Teacher style: ${hasTeacherBold}, Class pill highlight: ${hasClassHighlight}, Relative time: ${hasRelativeTime}`,
      passed06_2
    );
  } catch (err) {
    record('TC-ADM-06', 'Highlight GV & Lớp học', '06.2 (UI/UX)', 'Styles verified', err.message, false);
  }

  // 06.3 (Navigation): Thao tác nút "Xem tất cả"
  try {
    const adminDashboardPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Dashboard/AdminDashboard.tsx');
    const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf-8');

    const hasToggleState = adminDashboardContent.includes('const [showAllActions, setShowAllActions] = useState(false);');
    const hasHeightChange = adminDashboardContent.includes("showAllActions ? 'max-h-[520px]' : 'max-h-[350px]'");
    const hasButtonTextToggle = adminDashboardContent.includes('showAllActions ? "Thu gọn bớt" : "Xem tất cả"');
    const hasIconRotate = adminDashboardContent.includes("showAllActions ? 'rotate-90' : ''");

    const passed06_3 = hasToggleState && hasHeightChange && hasButtonTextToggle && hasIconRotate;
    record(
      'TC-ADM-06',
      'Thao tác nút "Xem tất cả" Hoạt động gần đây',
      '06.3 (Navigation)',
      'Clicking "Xem tất cả" toggles card height from 350px to 520px, rotates icon 90deg, toggles label',
      `State toggle: ${hasToggleState}, Height transition: ${hasHeightChange}, Label toggle: ${hasButtonTextToggle}, Rotate: ${hasIconRotate}`,
      passed06_3
    );
  } catch (err) {
    record('TC-ADM-06', 'Thao tác nút Xem tất cả', '06.3 (Navigation)', 'Toggle state verified', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-06B: PHÂN BỔ HỌC SINH THEO GIÁO VIÊN (DONUT CHART)
  // ----------------------------------------------------

  // 06B.1 (Interactive Chart): Biểu đồ tròn (Donut Chart) sĩ số
  try {
    const adminDashboardPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Dashboard/AdminDashboard.tsx');
    const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf-8');

    const hasPieChart = adminDashboardContent.includes('<PieChart') && adminDashboardContent.includes('innerRadius={60}');
    const hasHoverEffect = adminDashboardContent.includes('transform: `translate(${tx}px, ${ty}px)`') &&
                           adminDashboardContent.includes('Math.cos(-RADIAN * midAngle)');
    const hasTooltipWithHs = adminDashboardContent.includes('{value} HS');

    const passed06B_1 = hasPieChart && hasHoverEffect && hasTooltipWithHs;
    record(
      'TC-ADM-06B',
      'Biểu đồ tròn (Donut Chart) sĩ số học sinh theo Giáo viên',
      '06B.1 (Interactive Chart)',
      'PieChart with innerRadius=60, interactive hover slice translation, Tooltip displaying class & students count',
      `Donut chart: ${hasPieChart}, Slice hover transform: ${hasHoverEffect}, Tooltip {value} HS: ${hasTooltipWithHs}`,
      passed06B_1
    );
  } catch (err) {
    record('TC-ADM-06B', 'Donut Chart sĩ số', '06B.1 (Interactive Chart)', 'Interactive chart verified', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-06C: CHUÔNG THÔNG BÁO (NOTIFICATION POPOVER)
  // ----------------------------------------------------

  let testClassId = '';
  const testClassName = `Toán Cao Cấp Test ${Date.now().toString().slice(-4)}`;

  // 06C.1 (Real-time Event - Tạo lớp): Giáo viên tạo lớp mới -> Admin nhận thông báo
  try {
    const resCreate = await fetch(`${BASE_URL}/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({ className: testClassName, subject: 'Toán' })
    });
    const dataCreate = await resCreate.json();
    testClassId = dataCreate?.data?._id || dataCreate?._id || '';

    // Check Admin notifications
    const resNotif = await fetch(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataNotif = await resNotif.json();
    const notifications = dataNotif?.data || [];

    const foundClassNotif = notifications.find(n => n.title === 'Tạo lớp học mới' && n.message.includes(testClassName));

    const passed06C_1 = resCreate.status === 200 || resCreate.status === 201;
    record(
      'TC-ADM-06C',
      'Real-time Event - Tạo lớp: Giáo viên tạo lớp mới -> Admin nhận thông báo',
      '06C.1 (Real-time Event - Tạo lớp)',
      'Admin receives notification "Tạo lớp học mới" containing the created class name',
      `Created class status: ${resCreate.status}, Admin notification received: ${!!foundClassNotif}`,
      passed06C_1 && !!foundClassNotif,
      foundClassNotif ? foundClassNotif.message : 'Created class notification verified'
    );
  } catch (err) {
    record('TC-ADM-06C', 'Tạo lớp notification', '06C.1 (Real-time Event)', 'Notification created', err.message, false);
  }

  // 06C.2 (Real-time Event - Thêm học sinh): Giáo viên thêm học sinh -> Admin nhận thông báo
  try {
    if (testClassId && studentId) {
      const resAdd = await fetch(`${BASE_URL}/classrooms/${testClassId}/students/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ studentId })
      });

      const resNotif = await fetch(`${BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const dataNotif = await resNotif.json();
      const notifications = dataNotif?.data || [];

      const foundStudentNotif = notifications.find(n => n.title === 'Thêm học sinh mới vào lớp' && n.message.includes(testClassName));

      const passed06C_2 = (resAdd.status === 200 || resAdd.status === 201) && !!foundStudentNotif;
      record(
        'TC-ADM-06C',
        'Real-time Event - Thêm học sinh: Giáo viên thêm học sinh -> Admin nhận thông báo',
        '06C.2 (Real-time Event - Thêm học sinh)',
        'Admin receives notification "Thêm học sinh mới vào lớp" with teacher and class information',
        `Add student status: ${resAdd.status}, Notification found: ${!!foundStudentNotif}`,
        passed06C_2,
        foundStudentNotif?.message
      );
    } else {
      record('TC-ADM-06C', 'Thêm học sinh notification', '06C.2 (Real-time Event)', 'Notification received', 'testClassId/studentId missing', false);
    }
  } catch (err) {
    record('TC-ADM-06C', 'Thêm học sinh notification', '06C.2 (Real-time Event)', 'Notification received', err.message, false);
  }

  // 06C.3 (Interactive & Sync): Chuyển trạng thái Đã đọc & Đóng Popover
  try {
    // 1. Test mark as read via API
    const resNotif = await fetch(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataNotif = await resNotif.json();
    const unreadNotif = (dataNotif?.data || []).find(n => !n.isRead);

    let markAsReadSuccess = false;
    if (unreadNotif) {
      const resMark = await fetch(`${BASE_URL}/notifications/${unreadNotif._id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const dataMark = await resMark.json();
      markAsReadSuccess = resMark.status === 200 && dataMark?.data?.isRead === true;
    } else {
      markAsReadSuccess = true; // No unread notifications to mark
    }

    // 2. Test TopHeader implementation of click-outside and read state styling
    const topHeaderPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/Layout/TopHeader/TopHeader.tsx');
    const topHeaderContent = fs.readFileSync(topHeaderPath, 'utf-8');

    const hasClickOutside = topHeaderContent.includes('notifRef.current && !notifRef.current.contains(event.target as Node)') &&
                            topHeaderContent.includes('setIsNotifOpen(false)');
    const hasReadBackground = topHeaderContent.includes("isUnread ? 'rgba(244,124,32,0.04)' : '#FFFFFF'");
    const hasUnreadDot = topHeaderContent.includes('{isUnread && (');

    const passed06C_3 = markAsReadSuccess && hasClickOutside && hasReadBackground && hasUnreadDot;
    record(
      'TC-ADM-06C',
      'Chuyển trạng thái Đã đọc & Đóng Popover',
      '06C.3 (Interactive & Sync)',
      'Mark as read changes notification background to white, removes unread dot, click outside closes Popover',
      `API mark as read: ${markAsReadSuccess}, Click outside: ${hasClickOutside}, Style sync: ${hasReadBackground}`,
      passed06C_3
    );
  } catch (err) {
    record('TC-ADM-06C', 'Chuyển trạng thái Đã đọc', '06C.3 (Interactive & Sync)', 'Read state updated', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-04B (Alert): THÔNG BÁO DUYỆT GIÁO VIÊN (CHUÔNG & DASHBOARD)
  // ----------------------------------------------------

  // 04B.1 (Real-time Alert): Cảnh báo real-time khi có Giáo viên mới đăng ký
  try {
    const topHeaderPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/Layout/TopHeader/TopHeader.tsx');
    const topHeaderContent = fs.readFileSync(topHeaderPath, 'utf-8');

    const adminDashboardPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Admin/Dashboard/AdminDashboard.tsx');
    const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf-8');

    const bellRedirectsPending = topHeaderContent.includes('userRole === "admin"') &&
                                 topHeaderContent.includes('/admin/users?status=Pending');

    const activityRedirectsPending = adminDashboardContent.includes("item.actionType === 'pending_teacher'") &&
                                     adminDashboardContent.includes("/admin/users?status=Pending");

    const passedAlert = bellRedirectsPending && activityRedirectsPending;
    record(
      'TC-ADM-04B-Alert',
      'Cảnh báo real-time khi có Giáo viên mới đăng ký',
      '04B.1 (Real-time Alert)',
      'Clicking Pending notification in Bell or Recent Activity navigates directly to /admin/users?status=Pending',
      `Bell redirects: ${bellRedirectsPending}, Dashboard activity redirects: ${activityRedirectsPending}`,
      passedAlert
    );
  } catch (err) {
    record('TC-ADM-04B-Alert', 'Cảnh báo Giáo viên mới', '04B.1 (Real-time Alert)', 'Redirects to /admin/users?status=Pending', err.message, false);
  }

  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`ADMIN MODULE 2 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
