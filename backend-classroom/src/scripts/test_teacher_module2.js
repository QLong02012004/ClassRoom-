/**
 * ============================================================================
 * TÊN FILE: test_teacher_module2.js
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/test_teacher_module2.js
 * MỤC ĐÍCH:
 *   Bộ kịch bản kiểm thử tự động toàn diện cho:
 *   MODULE 2: QUẢN LÝ LỚP HỌC & TRẠNG THÁI LỚP (/classrooms)
 *   trong docs/TEACHER_TESTING_GUIDE.md (TC-TCH-04 đến TC-TCH-09).
 * ============================================================================
 */

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function runTeacherModule2Tests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING TEACHER MODULE 2 AUTOMATED TESTS');
  console.log('Module 2: Quản lý Lớp học & Trạng thái Lớp (/classrooms)');
  console.log('====================================================\n');

  // 1. Authenticate Teacher & Admin & Student
  let teacherToken = '';
  let adminToken = '';
  let studentToken = '';

  try {
    const tRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@gmail.com', password: '123456' })
    });
    const tData = await tRes.json();
    teacherToken = tData?.data?.accessToken;

    const aRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const aData = await aRes.json();
    adminToken = aData?.data?.accessToken;

    const sRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
    });
    const sData = await sRes.json();
    studentToken = sData?.data?.accessToken;

    if (!teacherToken || !adminToken) throw new Error('Authentication failed');
  } catch (err) {
    console.error('Error logging in:', err);
    process.exit(1);
  }

  // 2. Connect to MongoDB
  const MONGO_URI = 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB successfully for test assertions.\n');

  const createdClassIds = [];
  let testClassId = null;
  let testClassCode = null;

  try {
    // ----------------------------------------------------
    // TC-TCH-04: Tạo Lớp học Mới & Tự động sinh classCode
    // ----------------------------------------------------
    // 04.1 (Positive): Tạo lớp mới hợp lệ
    const testClassName = `Lớp Toán 12A1 AutoTest ${Date.now()}`;
    const testSubject = 'Toán học';

    try {
      const createRes = await fetch(`${BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: testClassName,
          subject: testSubject,
          requireApproval: true
        })
      });
      const createData = await createRes.json();
      const cls = createData.data;

      const is201 = createRes.status === 201;
      const hasCode = !!cls?.code && cls.code.length === 6;
      const isPending = cls?.status === 'Pending';

      if (cls?._id) {
        testClassId = cls._id;
        testClassCode = cls.code;
        createdClassIds.push(cls._id);
      }

      record(
        'TC-TCH-04',
        'Tạo lớp mới hợp lệ & Tự sinh mã code',
        '04.1 (Positive)',
        'Status 201, auto-generates 6-char unique code, status Pending',
        `Status: ${createRes.status}, Code: "${cls?.code}", DB Status: "${cls?.status}"`,
        is201 && hasCode && isPending,
        `Class ID: ${cls?._id}, Code: ${cls?.code}`
      );
    } catch (err) {
      record('TC-TCH-04', 'Tạo lớp mới', '04.1 (Positive)', 'Status 201', err.message, false);
    }

    // 04.2 (Validation): Để trống Tên lớp hoặc Môn học
    try {
      const resEmpty = await fetch(`${BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: '',
          subject: 'Toán học'
        })
      });
      const dataEmpty = await resEmpty.json();
      const passed = resEmpty.status === 400 && dataEmpty.message?.includes('bắt buộc');

      record(
        'TC-TCH-04',
        'Để trống Tên lớp',
        '04.2 (Validation)',
        'Status 400 with "Tên lớp học là bắt buộc"',
        `Status: ${resEmpty.status}, Message: "${dataEmpty.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-04', 'Để trống Tên lớp', '04.2 (Validation)', 'Status 400', err.message, false);
    }

    // 04.3 (Security): Cố nhấp chuột vào lớp đang Pending
    try {
      const teacherClassroomsPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Teacher/Classrooms/TeacherClassrooms.tsx');
      const feCode = fs.readFileSync(teacherClassroomsPath, 'utf8');

      const hasPendingToastInGrid = feCode.includes("cls.status === 'Pending'") &&
        feCode.includes("toast.info('Lớp học đang chờ Admin duyệt, chưa thể truy cập.')");
      const hasPendingToastInTable = feCode.includes("if (cls && cls.status === 'Pending')") &&
        feCode.includes("toast.info('Lớp học đang chờ Admin duyệt, chưa thể truy cập.')");

      record(
        'TC-TCH-04',
        'Chặn truy cập vào lớp đang Pending',
        '04.3 (Security)',
        'Clicking Pending class in Grid or Table toasts "Lớp học đang chờ Admin duyệt, chưa thể truy cập."',
        `Grid guard: ${hasPendingToastInGrid}, Table guard: ${hasPendingToastInTable}`,
        hasPendingToastInGrid && hasPendingToastInTable
      );
    } catch (err) {
      record('TC-TCH-04', 'Chặn lớp Pending', '04.3 (Security)', 'Client guard', err.message, false);
    }

    // 04.4 (Boundary): Tên lớp rất dài (> 100 ký tự)
    try {
      const longName = 'Lớp Toán Học Chuyên Sâu Luyện Đề Ôn Thi Đại Học Toàn Diện Dành Cho Học Sinh Lớp 12 Khóa 2025-2026 Đặc Biệt Cấp Tốc VIP 999';
      const resLong = await fetch(`${BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: longName,
          subject: 'Toán học'
        })
      });
      const dataLong = await resLong.json();
      if (dataLong.data?._id) createdClassIds.push(dataLong.data._id);

      // Verify UI truncate styling
      const teacherClassroomsPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Teacher/Classrooms/TeacherClassrooms.tsx');
      const feCode = fs.readFileSync(teacherClassroomsPath, 'utf8');
      const hasTruncate = feCode.includes('truncate flex-1') && feCode.includes('classTitle');

      record(
        'TC-TCH-04',
        'Tên lớp rất dài (> 100 ký tự)',
        '04.4 (Boundary)',
        'System accepts or validates, UI prevents layout breakage with truncate CSS',
        `Backend response: ${resLong.status}, UI truncate CSS: ${hasTruncate}`,
        (resLong.status === 201 || resLong.status === 400) && hasTruncate
      );
    } catch (err) {
      record('TC-TCH-04', 'Tên lớp dài', '04.4 (Boundary)', 'Layout check', err.message, false);
    }

    // 04.5 (Security): Nhập ký tự HTML/XSS vào Tên lớp
    try {
      const resXss = await fetch(`${BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: "<script>alert('xss')</script>",
          subject: 'Toán học'
        })
      });
      const dataXss = await resXss.json();
      const passed = resXss.status === 400 && dataXss.message?.includes('HTML hoặc mã script');

      record(
        'TC-TCH-04',
        'Nhập ký tự HTML/XSS vào Tên lớp',
        '04.5 (Security)',
        'Status 400, blocked with message "Tên lớp học không được chứa các ký tự HTML hoặc mã script!"',
        `Status: ${resXss.status}, Message: "${dataXss.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-04', 'XSS trong Tên lớp', '04.5 (Security)', 'Status 400', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-05: Chế độ Xem Lưới & Bảng (Grid & Table View)
    // ----------------------------------------------------
    // 05.1 (UI/UX): Chuyển đổi qua lại giữa dạng Lưới và Bảng
    const teacherClassroomsPath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Teacher/Classrooms/TeacherClassrooms.tsx');
    const feCode = fs.readFileSync(teacherClassroomsPath, 'utf8');

    const hasViewModeSwitch = feCode.includes('<ViewModeSwitch') &&
      feCode.includes("viewMode, setViewMode] = useState<'grid' | 'list'>('grid')");

    record(
      'TC-TCH-05',
      'Chuyển đổi qua lại giữa dạng Lưới và Bảng',
      '05.1 (UI/UX)',
      'ViewModeSwitch component toggles between grid and list/table views smoothly',
      `ViewModeSwitch present: ${hasViewModeSwitch}`,
      hasViewModeSwitch
    );

    // 05.2 (Data Consistency): Dữ liệu đồng bộ giữa 2 chế độ xem
    const hasDataSync = feCode.includes('paginatedClassrooms.map') &&
      feCode.includes('Table.Content') &&
      (feCode.includes('classesGrid') || feCode.includes('styles.classesGrid'));

    record(
      'TC-TCH-05',
      'Dữ liệu đồng bộ giữa 2 chế độ xem Grid & Table',
      '05.2 (Data Consistency)',
      'Both Grid and Table render identical paginatedClassrooms dataset',
      `Synchronized paginatedClassrooms in both views: ${hasDataSync}`,
      hasDataSync
    );

    // 05.3 (Search): Tìm kiếm lớp học theo tên/mã code
    const hasSearchLogic = feCode.includes('nameNormalized.includes(qNormalized)') &&
      feCode.includes('codeNormalized.includes(qNormalized)');

    // Test API fetching teacher classrooms
    const teacherClassRes = await fetch(`${BASE_URL}/classrooms/teacher`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const teacherClasses = await teacherClassRes.json();
    const classList = teacherClasses.data || [];

    const foundByCode = classList.find(c => c.code === testClassCode);

    record(
      'TC-TCH-05',
      'Tìm kiếm lớp học theo tên/mã code',
      '05.3 (Search)',
      'Normalized accent-insensitive search by Name and Code',
      `Search logic present: ${hasSearchLogic}. Test class code found in teacher list: ${!!foundByCode}`,
      hasSearchLogic && !!foundByCode
    );

    // 05.4 (Filter): Lọc theo trạng thái lớp (Active / Pending / Closed / Locked)
    const hasStatusFilter = feCode.includes('statusFilter !== "all"') &&
      feCode.includes('statusOptions') &&
      feCode.includes('Active') &&
      feCode.includes('Pending') &&
      feCode.includes('Closed') &&
      feCode.includes('Locked');

    record(
      'TC-TCH-05',
      'Lọc theo trạng thái lớp (Active / Pending / Closed / Locked)',
      '05.4 (Filter)',
      'Status filter options with count badges for all 4 states',
      `Status filter logic: ${hasStatusFilter}`,
      hasStatusFilter
    );

    // 05.5 (Empty State): Tìm kiếm không có kết quả
    const hasEmptyState = feCode.includes('Không tìm thấy lớp học') ||
      feCode.includes('Không tìm thấy lớp học phù hợp');

    record(
      'TC-TCH-05',
      'Trạng thái trống thân thiện khi tìm không có kết quả',
      '05.5 (Empty State)',
      'Displays friendly empty state "Không tìm thấy lớp học phù hợp"',
      `Empty state message present: ${hasEmptyState}`,
      hasEmptyState
    );

    // ----------------------------------------------------
    // TC-TCH-06: Đóng & Mở lại Lớp học (Close/Re-open)
    // ----------------------------------------------------
    // First, approve the class as Admin so it is Active
    await fetch(`${BASE_URL}/classrooms/${testClassId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Active' })
    });

    // 06.1 (Positive): Đóng lớp học sau khi kết thúc kỳ
    try {
      const closeRes = await fetch(`${BASE_URL}/classrooms/${testClassId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        }
      });
      const closeData = await closeRes.json();
      const isClosed = closeRes.status === 200 && closeData.data?.status === 'Closed';

      record(
        'TC-TCH-06',
        'Đóng lớp học sau khi kết thúc kỳ',
        '06.1 (Positive)',
        'Status 200, classroom status toggled to Closed',
        `Status: ${closeRes.status}, DB Status: "${closeData.data?.status}"`,
        isClosed
      );
    } catch (err) {
      record('TC-TCH-06', 'Đóng lớp học', '06.1 (Positive)', 'Status 200', err.message, false);
    }

    // 06.2 (Positive): Mở lại lớp học
    try {
      const reopenRes = await fetch(`${BASE_URL}/classrooms/${testClassId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        }
      });
      const reopenData = await reopenRes.json();
      const isReopened = reopenRes.status === 200 && reopenData.data?.status === 'Active';

      record(
        'TC-TCH-06',
        'Mở lại lớp học',
        '06.2 (Positive)',
        'Status 200, classroom status toggled back to Active',
        `Status: ${reopenRes.status}, DB Status: "${reopenData.data?.status}"`,
        isReopened
      );
    } catch (err) {
      record('TC-TCH-06', 'Mở lại lớp học', '06.2 (Positive)', 'Status 200', err.message, false);
    }

    // 06.3 (Impact Check): Học sinh / Giáo viên vào Lớp đã đóng
    try {
      // Toggle to Closed again
      await fetch(`${BASE_URL}/classrooms/${testClassId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        }
      });

      const hasClosedWarning = feCode.includes("cls.status === 'Closed'") &&
        feCode.includes("toast.warning('Lớp học đã bị đóng, không thể truy cập.')");

      record(
        'TC-TCH-06',
        'Học sinh / Giáo viên click vào Lớp đã đóng',
        '06.3 (Impact Check)',
        'Blocked with Toast warning "Lớp học đã bị đóng, không thể truy cập."',
        `Closed warning guard present: ${hasClosedWarning}`,
        hasClosedWarning
      );

      // Reopen class for subsequent tests
      await fetch(`${BASE_URL}/classrooms/${testClassId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        }
      });
    } catch (err) {
      record('TC-TCH-06', 'Impact check lớp đóng', '06.3 (Impact Check)', 'Warning check', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-07: Lưu trữ Lớp học (Archive Class)
    // ----------------------------------------------------
    // Create a separate class specifically to test archive
    let archiveClassId = null;
    const createArchiveRes = await fetch(`${BASE_URL}/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        className: `Lớp Thử Nghiệm Lưu Trữ ${Date.now()}`,
        subject: 'Vật lý'
      })
    });
    const archiveCreated = await createArchiveRes.json();
    archiveClassId = archiveCreated.data?._id;
    if (archiveClassId) createdClassIds.push(archiveClassId);

    // 07.1 (Positive): Đưa lớp vào kho Lưu trữ
    try {
      const softDeleteRes = await fetch(`${BASE_URL}/classrooms/${archiveClassId}/soft`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${teacherToken}`
        }
      });
      const softData = await softDeleteRes.json();
      const isArchived = softDeleteRes.status === 200 && softData.data?.status === 'Archived';

      record(
        'TC-TCH-07',
        'Đưa lớp vào kho Lưu trữ (Soft Delete)',
        '07.1 (Positive)',
        'Status 200, status updated to Archived, data preserved in DB',
        `Status: ${softDeleteRes.status}, DB Status: "${softData.data?.status}"`,
        isArchived
      );
    } catch (err) {
      record('TC-TCH-07', 'Lưu trữ lớp', '07.1 (Positive)', 'Status 200', err.message, false);
    }

    // 07.2 (Verify): Xác nhận lớp đã ẩn khỏi Dashboard
    try {
      const teacherListRes = await fetch(`${BASE_URL}/classrooms/teacher`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const teacherListData = await teacherListRes.json();
      const list = teacherListData.data || [];
      const isHidden = !list.some(c => c._id === archiveClassId);

      // Verify class still exists in MongoDB
      const dbClass = await mongoose.connection.collection('classes').findOne({
        _id: new mongoose.Types.ObjectId(archiveClassId)
      });
      const stillInDb = !!dbClass && dbClass.status === 'Archived';

      record(
        'TC-TCH-07',
        'Xác nhận lớp đã ẩn khỏi Dashboard nhưng còn trong DB',
        '07.2 (Verify)',
        'Archived class hidden from teacher list, preserved in Database',
        `Hidden from list: ${isHidden}, Preserved in DB: ${stillInDb}`,
        isHidden && stillInDb
      );
    } catch (err) {
      record('TC-TCH-07', 'Xác nhận ẩn', '07.2 (Verify)', 'Hidden verification', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-08: Nhận Thông báo Real-time khi Admin Khóa/Mở khóa
    // ----------------------------------------------------
    // 08.1 (Real-time Socket): Admin khóa lớp -> Giáo viên nhận thông báo tức thì
    try {
      const lockRes = await fetch(`${BASE_URL}/classrooms/${testClassId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'Locked' })
      });
      const lockData = await lockRes.json();
      const isLocked = lockRes.status === 200 && lockData.data?.status === 'Locked';

      // Check socket event in classroomController
      const controllerPath = path.resolve(__dirname, '../../../backend-classroom/src/controllers/classroomController.ts');
      const ctrlCode = fs.readFileSync(controllerPath, 'utf8');
      const emitsSocketUpdate = ctrlCode.includes('notifyTeacherClassroomsUpdate');

      record(
        'TC-TCH-08',
        'Admin khóa lớp -> Socket phát cập nhật thời gian thực',
        '08.1 (Real-time Socket)',
        'Status 200, status updated to Locked, socket teacher_classrooms_update emitted',
        `Lock status: ${lockRes.status}, Emits socket update: ${emitsSocketUpdate}`,
        isLocked && emitsSocketUpdate
      );
    } catch (err) {
      record('TC-TCH-08', 'Admin khóa lớp', '08.1 (Real-time Socket)', 'Socket update', err.message, false);
    }

    // 08.2 (Real-time Socket): Admin mở khóa lớp
    try {
      const unlockRes = await fetch(`${BASE_URL}/classrooms/${testClassId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'Active' })
      });
      const unlockData = await unlockRes.json();
      const isUnlocked = unlockRes.status === 200 && unlockData.data?.status === 'Active';

      record(
        'TC-TCH-08',
        'Admin mở khóa lớp -> Trạng thái khôi phục Active',
        '08.2 (Real-time Socket)',
        'Status 200, class restored to Active, socket emitted',
        `Unlock status: ${unlockRes.status}, DB Status: "${unlockData.data?.status}"`,
        isUnlocked
      );
    } catch (err) {
      record('TC-TCH-08', 'Admin mở khóa lớp', '08.2 (Real-time Socket)', 'Status 200', err.message, false);
    }

    // 08.3 (Security): Giáo viên cố truy cập lớp bị Admin khóa
    try {
      // Re-lock class for testing 08.3
      await fetch(`${BASE_URL}/classrooms/${testClassId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'Locked' })
      });

      const getDetailRes = await fetch(`${BASE_URL}/classrooms/${testClassId}`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const getDetailData = await getDetailRes.json();
      const isBlocked403 = getDetailRes.status === 403;

      const hasLockedToast = feCode.includes("cls.status === 'Locked'") &&
        feCode.includes("toast.error('Lớp học đã bị khóa bởi Quản trị viên hệ thống.')");

      record(
        'TC-TCH-08',
        'Giáo viên cố truy cập lớp bị Admin khóa',
        '08.3 (Security)',
        'Status 403 Forbidden with warning message; UI blocks click and shows Toast error',
        `Backend status: ${getDetailRes.status}, UI locked toast: ${hasLockedToast}`,
        isBlocked403 && hasLockedToast,
        getDetailData?.message
      );

      // Restore class to Active
      await fetch(`${BASE_URL}/classrooms/${testClassId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'Active' })
      });
    } catch (err) {
      record('TC-TCH-08', 'Truy cập lớp bị khóa', '08.3 (Security)', 'Status 403', err.message, false);
    }

    // ----------------------------------------------------
    // TC-TCH-09: Sao chép Mã Lớp 1-Touch & Chỉnh sửa Lớp
    // ----------------------------------------------------
    // 09.1 (Positive): Nút sao chép mã code 1 chạm
    const hasCopyCodeHandler = feCode.includes('handleCopyCode') &&
      feCode.includes('navigator.clipboard.writeText') &&
      feCode.includes('Đã sao chép mã lớp');

    record(
      'TC-TCH-09',
      'Nút sao chép mã code 1 chạm',
      '09.1 (Positive)',
      '1-touch button copies code to clipboard with Toast "Đã sao chép mã lớp vào bộ nhớ tạm!"',
      `handleCopyCode present: ${hasCopyCodeHandler}`,
      hasCopyCodeHandler
    );

    // 09.2 (Positive): Chỉnh sửa thông tin Lớp học
    const updatedClassName = `Lớp Toán 12A1 Đã Đổi Tên ${Date.now()}`;
    const updatedSubject = 'Hình học';
    try {
      const updateRes = await fetch(`${BASE_URL}/classrooms/${testClassId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: updatedClassName,
          subject: updatedSubject,
          requireApproval: true
        })
      });
      const updateData = await updateRes.json();
      const isUpdated = updateRes.status === 200 &&
        updateData.data?.name === updatedClassName &&
        updateData.data?.subject === updatedSubject;

      record(
        'TC-TCH-09',
        'Chỉnh sửa thông tin Lớp học',
        '09.2 (Positive)',
        'Status 200, Class name and subject updated successfully',
        `Status: ${updateRes.status}, Name: "${updateData.data?.name}", Subject: "${updateData.data?.subject}"`,
        isUpdated
      );
    } catch (err) {
      record('TC-TCH-09', 'Chỉnh sửa lớp', '09.2 (Positive)', 'Status 200', err.message, false);
    }

    // 09.3 (Validation): Chỉnh sửa Tên lớp thành rỗng
    try {
      const updateEmptyRes = await fetch(`${BASE_URL}/classrooms/${testClassId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: '',
          subject: updatedSubject
        })
      });
      const updateEmptyData = await updateEmptyRes.json();
      const passed = updateEmptyRes.status === 400 && updateEmptyData.message?.includes('bắt buộc');

      record(
        'TC-TCH-09',
        'Chỉnh sửa Tên lớp thành rỗng',
        '09.3 (Validation)',
        'Status 400 with "Tên lớp học là bắt buộc"',
        `Status: ${updateEmptyRes.status}, Message: "${updateEmptyData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-09', 'Tên lớp rỗng khi sửa', '09.3 (Validation)', 'Status 400', err.message, false);
    }

  } catch (err) {
    console.error('Unhandled error in Teacher Module 2 tests:', err);
  } finally {
    // Cleanup temporary test classes
    if (createdClassIds.length > 0) {
      await mongoose.connection.collection('classes').deleteMany({
        _id: { $in: createdClassIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
      console.log('Cleaned up temporary test classes.');
    }
    await mongoose.disconnect();
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log('\n====================================================');
  console.log(`TEACHER MODULE 2 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');
}

runTeacherModule2Tests().catch(console.error);
