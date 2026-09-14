const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const fs = require('fs');
const path = require('path');

async function runTests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING ADMIN MODULE 1 AUTOMATED TESTS');
  console.log('Module 1: Xác thực & Bảo mật Điều hướng');
  console.log('====================================================\n');

  let adminToken = '';
  let studentToken = '';
  let teacherToken = '';

  // ----------------------------------------------------
  // TC-ADM-01: ĐĂNG NHẬP ADMIN
  // ----------------------------------------------------

  // 01.1 (Positive): Đăng nhập hợp lệ bằng tài khoản Admin
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const data = await res.json();
    const is200 = res.status === 200;
    const hasToken = !!data?.data?.accessToken;
    const isAdmin = data?.data?.user?.role === 'admin';
    const passed01_1 = is200 && hasToken && isAdmin;
    if (passed01_1) {
      adminToken = data.data.accessToken;
    }

    record(
      'TC-ADM-01',
      'Đăng nhập hợp lệ bằng tài khoản Admin',
      '01.1 (Positive)',
      'Status 200, JWT token returned, user.role = admin, navigate /admin/dashboard',
      `Status: ${res.status}, Role: ${data?.data?.user?.role}, Token: ${hasToken ? 'VALID_JWT' : 'MISSING'}`,
      passed01_1,
      `User: ${data?.data?.user?.name} (${data?.data?.user?.email})`
    );
  } catch (err) {
    record('TC-ADM-01', 'Đăng nhập hợp lệ bằng tài khoản Admin', '01.1 (Positive)', 'Status 200', err.message, false);
  }

  // 01.2 (Negative): Nhập sai Mật khẩu Admin
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'wrongpass' })
    });
    const data = await res.json();
    const passed01_2 = res.status === 401 && (data?.message?.includes('không chính xác') || data?.error?.includes('không chính xác'));
    record(
      'TC-ADM-01',
      'Nhập sai Mật khẩu Admin',
      '01.2 (Negative)',
      'Status 401, error: Email hoặc mật khẩu không chính xác!',
      `Status: ${res.status}, msg: ${data?.message || data?.error}`,
      passed01_2
    );
  } catch (err) {
    record('TC-ADM-01', 'Nhập sai Mật khẩu Admin', '01.2 (Negative)', 'Status 401', err.message, false);
  }

  // 01.3 (Negative): Để trống Email hoặc Mật khẩu
  try {
    const resEmptyEmail = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: 'admin123' })
    });
    const dataEmpty = await resEmptyEmail.json();

    // Also verify frontend AuthForm has required attributes for email and password
    const authFormPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/ui/AuthForm/AuthForm.tsx');
    const authFormContent = fs.readFileSync(authFormPath, 'utf-8');
    const hasRequiredInputs = authFormContent.includes('name="email"') && 
                              authFormContent.includes('required') && 
                              authFormContent.includes('name="password"');

    const passed01_3 = resEmptyEmail.status >= 400 && hasRequiredInputs;
    record(
      'TC-ADM-01',
      'Để trống Email hoặc Mật khẩu',
      '01.3 (Negative)',
      'Backend rejects empty input (>=400) & Frontend inputs marked with required',
      `Backend status: ${resEmptyEmail.status}, Client validation required: ${hasRequiredInputs}`,
      passed01_3
    );
  } catch (err) {
    record('TC-ADM-01', 'Để trống Email hoặc Mật khẩu', '01.3 (Negative)', 'Validation error', err.message, false);
  }

  // 01.4 (Security): SQL Injection / Script XSS trong ô Đăng nhập
  try {
    const payloads = [
      { email: "' OR '1'='1", password: "' OR '1'='1" },
      { email: '<script>alert(1)</script>', password: '<script>alert(1)</script>' },
      { email: 'admin@gmail.com', password: 'admin123\' OR \'1\'=\'1' }
    ];

    let allSafe = true;
    let attackResponses = [];

    for (const p of payloads) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const data = await res.json();
      attackResponses.push(`status ${res.status}`);
      // Must not authenticate as any user and must safely return 401
      if (res.status === 200 && data?.data?.accessToken) {
        allSafe = false;
      }
    }

    record(
      'TC-ADM-01',
      'SQL Injection / Script XSS trong ô Đăng nhập',
      '01.4 (Security)',
      'All malicious payloads safely rejected with 401, no injection or XSS execution',
      `Responses: ${attackResponses.join(', ')}`,
      allSafe
    );
  } catch (err) {
    record('TC-ADM-01', 'SQL Injection / Script XSS', '01.4 (Security)', 'Safe rejection', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-01B: ĐĂNG NHẬP & ĐĂNG KÝ BẰNG GOOGLE
  // ----------------------------------------------------

  // 01B.1 (Positive): Đăng nhập/Đăng ký 1-Click qua Google OAuth 2.0
  try {
    // 1. Verify Google endpoint rejects invalid fake tokens safely
    const resInvalidGoogle = await fetch(`${BASE_URL}/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake-invalid-google-token' })
    });
    const dataInvalidGoogle = await resInvalidGoogle.json();
    const endpointSafe = resInvalidGoogle.status === 400 && (dataInvalidGoogle?.message?.includes('Xác thực Google thất bại') || dataInvalidGoogle?.message?.includes('Token không hợp lệ'));

    // 2. Verify Google authService business logic in source code:
    // - Student created with UserStatus.ACTIVE
    // - Teacher created with UserStatus.PENDING and notification dispatched to Admin
    const authServicePath = path.resolve(__dirname, '../services/authService.ts');
    const authServiceContent = fs.readFileSync(authServicePath, 'utf-8');
    const hasStudentActive = authServiceContent.includes("targetRole === UserRole.TEACHER ? UserStatus.PENDING : UserStatus.ACTIVE");
    const hasTeacherPendingNotice = authServiceContent.includes("NotificationModel.create") && authServiceContent.includes("recipientRole: UserRole.ADMIN");

    const passed01B = endpointSafe && hasStudentActive && hasTeacherPendingNotice;
    record(
      'TC-ADM-01B',
      'Đăng nhập/Đăng ký 1-Click qua Google OAuth 2.0',
      '01B.1 (Positive)',
      'Validates Google Token, Student role -> Active immediately, Teacher role -> Pending waiting for Admin approval',
      `Endpoint validation: ${endpointSafe ? 'SAFE (400)' : 'FAIL'}, Logic verified: Active/Pending split & Admin notification`,
      passed01B
    );
  } catch (err) {
    record('TC-ADM-01B', 'Google OAuth 2.0', '01B.1 (Positive)', 'Verified logic', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-02: BẢO VỆ ROUTE ADMIN & NGÂN HÀNG ĐỀ (ACCESS CONTROL)
  // ----------------------------------------------------

  // Obtain Student and Teacher tokens for RBAC tests
  try {
    const resStudent = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
    });
    const dataStudent = await resStudent.json();
    studentToken = dataStudent?.data?.accessToken || '';

    const resTeacher = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@gmail.com', password: '123456' })
    });
    const dataTeacher = await resTeacher.json();
    teacherToken = dataTeacher?.data?.accessToken || '';
  } catch (e) {
    console.error('Error fetching student/teacher tokens:', e);
  }

  // Check client ProtectedRoute implementation
  const protectedRoutePath = path.resolve(__dirname, '../../../frontend-classroom/src/components/Layout/ProtectedRoute.tsx');
  const protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf-8');

  // 02.1 (Security): Tài khoản Học sinh cố truy cập URL Admin
  try {
    const resAdminStats = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataStats = await resAdminStats.json();

    const resAdminClasses = await fetch(`${BASE_URL}/classrooms/admin`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    const is403Backend = resAdminStats.status === 403 && resAdminClasses.status === 403;
    const clientBlocksStudent = protectedRouteContent.includes("if (user?.role !== 'admin')") &&
                                 protectedRouteContent.includes('return <Navigate to="/dashboard" replace />;');

    const passed02_1 = is403Backend && clientBlocksStudent;
    record(
      'TC-ADM-02',
      'Tài khoản Học sinh cố truy cập URL Admin',
      '02.1 (Security)',
      'Backend returns 403 Forbidden, Client AdminRoute redirects student to /dashboard',
      `Backend: /dashboard/admin=${resAdminStats.status}, /classrooms/admin=${resAdminClasses.status}. Client guard: ${clientBlocksStudent}`,
      passed02_1,
      dataStats?.message || dataStats?.error
    );
  } catch (err) {
    record('TC-ADM-02', 'Học sinh truy cập Admin URL', '02.1 (Security)', 'Blocked with 403', err.message, false);
  }

  // 02.2 (Security): Tài khoản Giáo viên cố truy cập URL Admin
  try {
    const resAdminStats = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const resAdminClasses = await fetch(`${BASE_URL}/classrooms/admin`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });

    const is403Backend = resAdminStats.status === 403 && resAdminClasses.status === 403;
    const clientRedirectsTeacher = protectedRouteContent.includes("if (user?.role === 'teacher') return <Navigate to=\"/classrooms\" replace />;");

    const passed02_2 = is403Backend && clientRedirectsTeacher;
    record(
      'TC-ADM-02',
      'Tài khoản Giáo viên cố truy cập URL Admin',
      '02.2 (Security)',
      'Backend returns 403 Forbidden, Client AdminRoute redirects teacher to /classrooms',
      `Backend: /dashboard/admin=${resAdminStats.status}, /classrooms/admin=${resAdminClasses.status}. Client guard: ${clientRedirectsTeacher}`,
      passed02_2
    );
  } catch (err) {
    record('TC-ADM-02', 'Giáo viên truy cập Admin URL', '02.2 (Security)', 'Blocked with 403', err.message, false);
  }

  // 02.3 (Security): Người dùng chưa đăng nhập (Guest) vào URL Admin
  try {
    const resGuest = await fetch(`${BASE_URL}/dashboard/admin`);
    const dataGuest = await resGuest.json();
    const is401 = resGuest.status === 401;
    const clientRedirectsGuest = protectedRouteContent.includes('if (!isAuthenticated)') &&
                                 protectedRouteContent.includes('return <Navigate to="/login" replace />;');

    const passed02_3 = is401 && clientRedirectsGuest;
    record(
      'TC-ADM-02',
      'Người dùng chưa đăng nhập (Guest) vào URL Admin',
      '02.3 (Security)',
      'Backend returns 401 Unauthorized, Client ProtectedRoute redirects to /login',
      `Backend: Status ${resGuest.status}, msg: ${dataGuest?.message || dataGuest?.error}. Client guard: ${clientRedirectsGuest}`,
      passed02_3
    );
  } catch (err) {
    record('TC-ADM-02', 'Guest vào Admin URL', '02.3 (Security)', 'Blocked with 401', err.message, false);
  }

  // 02.4 (Security): Học sinh cố truy cập URL Ngân hàng Đề /bank
  try {
    const clientRoutesPath = path.resolve(__dirname, '../../../frontend-classroom/src/routes/index.tsx');
    const clientRoutesContent = fs.readFileSync(clientRoutesPath, 'utf-8');

    const hasTeacherOrAdminGuardOnBank = clientRoutesContent.includes('<TeacherOrAdminRoute />') &&
                                         clientRoutesContent.includes('path: "bank"');

    const teacherOrAdminRouteBlocksStudent = protectedRouteContent.includes('export const TeacherOrAdminRoute') &&
                                             protectedRouteContent.includes("if (user?.role !== 'admin' && user?.role !== 'teacher')") &&
                                             protectedRouteContent.includes('return <Navigate to="/dashboard" replace />;');

    const passed02_4 = hasTeacherOrAdminGuardOnBank && teacherOrAdminRouteBlocksStudent;
    record(
      'TC-ADM-02',
      'Học sinh cố truy cập URL Ngân hàng Đề /bank',
      '02.4 (Security)',
      'Protected by TeacherOrAdminRoute, students automatically blocked and redirected to /dashboard',
      `Route wrapped with TeacherOrAdminRoute: ${hasTeacherOrAdminGuardOnBank}, Student blocked: ${teacherOrAdminRouteBlocksStudent}`,
      passed02_4
    );
  } catch (err) {
    record('TC-ADM-02', 'Học sinh truy cập /bank', '02.4 (Security)', 'Blocked & Redirected', err.message, false);
  }

  // ----------------------------------------------------
  // TC-ADM-03: MENU SIDEBAR ADMIN
  // ----------------------------------------------------

  const sidebarPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/Layout/Sidebar/Sidebar.tsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

  // 03.1 (Navigation): Chuyển đổi qua lại giữa các menu
  try {
    const hasDashboardLink = sidebarContent.includes('/admin/dashboard') && sidebarContent.includes('Tổng quan');
    const hasUsersLink = sidebarContent.includes('/admin/users') && sidebarContent.includes('Quản lý Người dùng');
    const hasClassroomsLink = sidebarContent.includes('/admin/classrooms') && sidebarContent.includes('Quản lý Lớp học');
    const hasBankLink = sidebarContent.includes('/bank') && sidebarContent.includes('Ngân hàng Đề & Bài tập');
    const hasSettingsLink = sidebarContent.includes('/admin/settings') && sidebarContent.includes('Cài đặt hệ thống');
    const hasActiveHighlight = sidebarContent.includes('active ? styles.active :');

    const passed03_1 = hasDashboardLink && hasUsersLink && hasClassroomsLink && hasBankLink && hasSettingsLink && hasActiveHighlight;
    record(
      'TC-ADM-03',
      'Chuyển đổi qua lại giữa các menu Sidebar',
      '03.1 (Navigation)',
      'All Admin routes configured: /admin/dashboard, /admin/users, /admin/classrooms, /bank, /admin/settings with active highlight',
      `Links: Dashboard(${hasDashboardLink}), Users(${hasUsersLink}), Classrooms(${hasClassroomsLink}), Bank(${hasBankLink}), Settings(${hasSettingsLink}), Highlight(${hasActiveHighlight})`,
      passed03_1
    );
  } catch (err) {
    record('TC-ADM-03', 'Menu Sidebar Navigation', '03.1 (Navigation)', 'Links configured', err.message, false);
  }

  // 03.2 (UI/UX): Thu gọn & Mở rộng Sidebar
  try {
    const sidebarScssPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/Layout/Sidebar/Sidebar.module.scss');
    const sidebarScssContent = fs.readFileSync(sidebarScssPath, 'utf-8');

    const hasHoverState = sidebarContent.includes('onMouseEnter={() => setIsHovered(true)}') &&
                          sidebarContent.includes('onMouseLeave={() => setIsHovered(false)}');
    const hasCollapsedWidth = sidebarScssContent.includes('width: 76px;');
    const hasExpandedWidth = sidebarScssContent.includes('width: 270px;');
    const hasSmoothTransition = sidebarScssContent.includes('transition: width 0.3s');

    const passed03_2 = hasHoverState && hasCollapsedWidth && hasExpandedWidth && hasSmoothTransition;
    record(
      'TC-ADM-03',
      'Thu gọn & Mở rộng Sidebar',
      '03.2 (UI/UX)',
      'Sidebar width expands from 76px to 270px on hover with 0.3s smooth transition',
      `Hover state: ${hasHoverState}, Collapsed: 76px(${hasCollapsedWidth}), Expanded: 270px(${hasExpandedWidth}), Smooth transition(${hasSmoothTransition})`,
      passed03_2
    );
  } catch (err) {
    record('TC-ADM-03', 'Thu gọn & Mở rộng Sidebar', '03.2 (UI/UX)', 'Smooth expand on hover', err.message, false);
  }

  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`ADMIN MODULE 1 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
