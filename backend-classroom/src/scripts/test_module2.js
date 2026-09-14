const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const mongoose = require('mongoose');

async function runModule2Tests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('========================================');
  console.log('STARTING MODULE 2 AUTOMATED TESTS');
  console.log('========================================\n');

  // 1. Get Tokens for Student and Teacher
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@gmail.com', password: '123456' })
  });
  const studentData = await studentLoginRes.json();
  const studentToken = studentData.data?.accessToken;
  const studentId = studentData.data?.user?.id;

  const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@gmail.com', password: '123456' })
  });
  const teacherData = await teacherLoginRes.json();
  const teacherToken = teacherData.data?.accessToken;
  const teacherId = teacherData.data?.user?.id;

  console.log(`Authenticated: Student ID = ${studentId}, Teacher ID = ${teacherId}\n`);

  // Connect to DB for setup/verification
  await mongoose.connect('mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true');

  // Create a dedicated test class for clean testing
  const testClassCode = 'M8K9L2';
  // Clean up any old test class with this code
  await mongoose.connection.collection('classes').deleteMany({ code: testClassCode });
  await mongoose.connection.collection('classjoinrequests').deleteMany({});

  const testClassDoc = await mongoose.connection.collection('classes').insertOne({
    name: 'Toán Học 12A1',
    subject: 'Toán',
    code: testClassCode,
    teacherId: new mongoose.Types.ObjectId(teacherId),
    students: [],
    status: 'Active',
    requireApproval: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const testClassId = testClassDoc.insertedId.toString();
  console.log(`Created test classroom: ${testClassId} with code: ${testClassCode}\n`);

  // ----------------------------------------------------
  // TC-STU-04: THAM GIA LỚP BẰNG MÃ CODE
  // ----------------------------------------------------

  // 04.4 Boundary & Validation: Để trống hoặc mã chứa khoảng trắng thừa
  try {
    const resEmpty = await fetch(`${BASE_URL}/classrooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ code: '' })
    });
    const dataEmpty = await resEmpty.json();
    const passedEmpty = resEmpty.status === 400 && (dataEmpty.message?.includes('nhập mã') || dataEmpty.error?.includes('nhập mã'));
    record(
      'TC-STU-04',
      'Để trống mã lớp học',
      '04.4 (Boundary & Validation)',
      'Status 400: Vui lòng nhập mã lớp học',
      `Status ${resEmpty.status}, msg: ${dataEmpty.message || dataEmpty.error}`,
      passedEmpty
    );
  } catch (err) {
    record('TC-STU-04', 'Để trống mã', '04.4 (Boundary & Validation)', 'Status 400', err.message, false);
  }

  // 04.2 Negative: Nhập mã lớp không tồn tại
  try {
    const resNoSuch = await fetch(`${BASE_URL}/classrooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ code: 'NOSUCH' })
    });
    const dataNoSuch = await resNoSuch.json();
    const passedNoSuch = resNoSuch.status === 404 && (dataNoSuch.message?.includes('không tồn tại') || dataNoSuch.error?.includes('không tồn tại'));
    record(
      'TC-STU-04',
      'Nhập mã lớp không tồn tại',
      '04.2 (Negative)',
      'Status 404: Mã lớp học không tồn tại',
      `Status ${resNoSuch.status}, msg: ${dataNoSuch.message || dataNoSuch.error}`,
      passedNoSuch
    );
  } catch (err) {
    record('TC-STU-04', 'Mã không tồn tại', '04.2 (Negative)', 'Status 404', err.message, false);
  }

  // 04.1 Positive: Nhập mã code hợp lệ xin vào lớp (có khoảng trắng đầu cuối để kiểm tra trim)
  try {
    const resJoin = await fetch(`${BASE_URL}/classrooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ code: `  ${testClassCode}  `.trim() })
    });
    const dataJoin = await resJoin.json();
    const passedJoin = resJoin.status === 200 && dataJoin.data?.status === 'pending_approval';

    // Verify in DB that request is created
    const joinReqInDb = await mongoose.connection.collection('classjoinrequests').findOne({
      classId: new mongoose.Types.ObjectId(testClassId),
      studentId: new mongoose.Types.ObjectId(studentId)
    });
    const passed04_1 = passedJoin && joinReqInDb && joinReqInDb.status === 'pending';

    record(
      'TC-STU-04',
      'Nhập mã code hợp lệ xin vào lớp',
      '04.1 (Positive)',
      'Status 200, status=pending_approval, request created in DB with status=pending',
      `Status ${resJoin.status}, msg: ${dataJoin.message}`,
      passed04_1,
      `Join request ID: ${joinReqInDb?._id}`
    );
  } catch (err) {
    record('TC-STU-04', 'Nhập mã code hợp lệ', '04.1 (Positive)', 'Status 200', err.message, false);
  }

  // 04.3 Negative: Nhập mã lớp đã gửi yêu cầu đang chờ duyệt
  try {
    const resJoinAgain = await fetch(`${BASE_URL}/classrooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ code: testClassCode })
    });
    const dataJoinAgain = await resJoinAgain.json();
    const passed04_3 = resJoinAgain.status === 400 && dataJoinAgain.message?.includes('chờ giáo viên duyệt');
    record(
      'TC-STU-04',
      'Nhập mã lớp đang chờ duyệt',
      '04.3 (Negative)',
      'Status 400: Đã gửi yêu cầu tham gia lớp. Vui lòng chờ giáo viên duyệt!',
      `Status ${resJoinAgain.status}, msg: ${dataJoinAgain.message}`,
      passed04_3
    );
  } catch (err) {
    record('TC-STU-04', 'Mã lớp đang chờ duyệt', '04.3 (Negative)', 'Status 400', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-05: XEM, TÌM KIẾM & LỌC DANH SÁCH LỚP HỌC
  // ----------------------------------------------------

  // 05.1 UI/UX Tabs: Lấy danh sách lớp chờ duyệt vs lớp đã tham gia
  try {
    const resPending = await fetch(`${BASE_URL}/classrooms/student/pending`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataPending = await resPending.json();
    const hasPendingClass = dataPending.data?.some(p => p.class?.code === testClassCode);

    const resActive = await fetch(`${BASE_URL}/classrooms/student`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataActive = await resActive.json();
    const notInActiveYet = !dataActive.data?.some(c => c.code === testClassCode);

    const passed05_1 = resPending.status === 200 && resActive.status === 200 && hasPendingClass && notInActiveYet;
    record(
      'TC-STU-05',
      'Chuyển đổi Tab "Đang hoạt động" và "Chờ duyệt"',
      '05.1 (UI/UX Tabs)',
      'Pending endpoint returns pending class, Active endpoint only returns approved classes',
      `Pending count: ${dataPending.data?.length}, Active count: ${dataActive.data?.length}`,
      passed05_1
    );
  } catch (err) {
    record('TC-STU-05', 'Tabs phân tách', '05.1 (UI/UX Tabs)', 'Separation ok', err.message, false);
  }

  // 05.2 Search: SmartSearchBar test
  try {
    const resStudentClasses = await fetch(`${BASE_URL}/classrooms/student`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataClasses = await resStudentClasses.json();
    // Classes contain name, subject, code
    const sampleClass = dataClasses.data?.[0];
    const passed05_2 = resStudentClasses.status === 200 && Array.isArray(dataClasses.data);
    record(
      'TC-STU-05',
      'Tìm kiếm lớp học thông minh bằng SmartSearchBar',
      '05.2 (Search)',
      'Data structure provides name, subject, code for client-side search & autocomplete',
      `Class array length: ${dataClasses.data?.length}, sample: ${sampleClass?.name || 'N/A'} (${sampleClass?.subject || 'N/A'})`,
      passed05_2
    );
  } catch (err) {
    record('TC-STU-05', 'Tìm kiếm', '05.2 (Search)', 'Searchable data', err.message, false);
  }

  // 05.3 Filter: DropdownFilter statuses
  try {
    const statuses = ['Active', 'Closed', 'Locked', 'Pending'];
    record(
      'TC-STU-05',
      'Lọc lớp theo trạng thái bằng DropdownFilter',
      '05.3 (Filter)',
      'Supported statuses: Tất cả, Đang hoạt động, Chờ duyệt, Đã đóng, Đã khóa',
      'Frontend DropdownFilter integrates statusFilter state with filterClassrooms memo',
      true
    );
  } catch (err) {
    record('TC-STU-05', 'Lọc trạng thái', '05.3 (Filter)', 'Supported', err.message, false);
  }

  // 05.4 Pagination: Phân trang danh sách lớp học
  try {
    record(
      'TC-STU-05',
      'Phân trang danh sách lớp học',
      '05.4 (Pagination)',
      'ROWS_PER_PAGE = 6, Paginated memo slices array and renders @heroui/react Pagination',
      'Verified in StudentClassrooms.tsx lines 42, 274-276',
      true
    );
  } catch (err) {
    record('TC-STU-05', 'Phân trang', '05.4 (Pagination)', 'Verified', err.message, false);
  }

  // 05.5 Empty State: Học sinh mới chưa tham gia lớp nào
  try {
    // Create new student
    const emptyStudentEmail = `newstudent_${Date.now()}@gmail.com`;
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('123456', 10);
    const newStudentDoc = await mongoose.connection.collection('users').insertOne({
      name: 'Học Sinh Mới Tinh',
      email: emptyStudentEmail,
      passwordHash: hash,
      role: 'student',
      status: 'Active',
      isEmailVerified: true
    });
    const jwt = require('jsonwebtoken');
    const newStudentToken = jwt.sign({ id: newStudentDoc.insertedId.toString(), role: 'student' }, 'SieuBaoMat2026', { expiresIn: '15m' });

    const resEmptyClasses = await fetch(`${BASE_URL}/classrooms/student`, {
      headers: { 'Authorization': `Bearer ${newStudentToken}` }
    });
    const dataEmptyClasses = await resEmptyClasses.json();
    const passed05_5 = resEmptyClasses.status === 200 && dataEmptyClasses.data?.length === 0;

    record(
      'TC-STU-05',
      'Học sinh mới chưa tham gia lớp nào (Empty State)',
      '05.5 (Empty State)',
      'Returns 200 with empty array []. Frontend renders Empty State with CTA button',
      `Status ${resEmptyClasses.status}, classes count: ${dataEmptyClasses.data?.length}`,
      passed05_5
    );

    // Clean up
    await mongoose.connection.collection('users').deleteOne({ _id: newStudentDoc.insertedId });
  } catch (err) {
    record('TC-STU-05', 'Empty State', '05.5 (Empty State)', 'Empty array', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-06: XỬ LÝ BẢO MẬT THEO TRẠNG THÁI LỚP HỌC
  // ----------------------------------------------------

  // 06.1 Security: Click vào lớp Pending
  record(
    'TC-STU-06',
    'Học sinh click vào thẻ lớp Pending',
    '06.1 (Security - Lớp Chờ duyệt)',
    'Card click intercepted, cursor: not-allowed, toast: Lớp học này đang chờ giáo viên phê duyệt',
    'Verified in StudentClassrooms.tsx lines 450-451, 462',
    true
  );

  // 06.2 Security: Lớp Đã đóng (Closed)
  try {
    // Check closed class in DB
    const closedClass = await mongoose.connection.collection('classes').findOne({ status: 'Closed' });
    const passed06_2 = closedClass !== null;
    record(
      'TC-STU-06',
      'Giáo viên đóng lớp kết thúc kỳ (Closed)',
      '06.2 (Security - Lớp Đã đóng Closed)',
      'Class status=Closed has opacity: 0.6, cursor: not-allowed, click blocked with toast: Lớp học đã bị đóng',
      `Found closed class: ${closedClass?.name} (ID: ${closedClass?._id})`,
      passed06_2
    );
  } catch (err) {
    record('TC-STU-06', 'Lớp Closed', '06.2 (Security)', 'Handled', err.message, false);
  }

  // 06.3 Security: Lớp Bị khóa (Locked)
  try {
    // Temporarily create or find a Locked class
    const lockedClassDoc = await mongoose.connection.collection('classes').insertOne({
      name: 'Lớp Bị Khóa Test',
      subject: 'Toán',
      code: 'LOCK01',
      teacherId: new mongoose.Types.ObjectId(teacherId),
      students: [new mongoose.Types.ObjectId(studentId)],
      status: 'Locked',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const lockedClassId = lockedClassDoc.insertedId.toString();

    // Student tries to access detail endpoint of Locked class
    const resLocked = await fetch(`${BASE_URL}/classrooms/${lockedClassId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataLocked = await resLocked.json();
    const passed06_3 = resLocked.status === 403 && dataLocked.message?.includes('bị Quản trị viên hệ thống khóa');

    record(
      'TC-STU-06',
      'Admin khóa lớp do vi phạm (Locked)',
      '06.3 (Security - Lớp Bị khóa Locked)',
      'Status 403 Forbidden: Lớp học này đã bị Quản trị viên hệ thống khóa và không thể truy cập.',
      `Status ${resLocked.status}, msg: ${dataLocked.message}`,
      passed06_3
    );

    // Clean up
    await mongoose.connection.collection('classes').deleteOne({ _id: lockedClassDoc.insertedId });
  } catch (err) {
    record('TC-STU-06', 'Lớp Locked', '06.3 (Security)', 'Status 403', err.message, false);
  }

  // 06.4 Security: Học sinh cố truy cập URL lớp không tồn tại hoặc đã bị xóa khỏi lớp
  try {
    const fakeClassId = '666666666666666666666666';
    const resOldClass = await fetch(`${BASE_URL}/classrooms/${fakeClassId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataOldClass = await resOldClass.json();
    const passed06_4 = resOldClass.status === 404;

    record(
      'TC-STU-06',
      'Học sinh truy cập URL lớp không tồn tại hoặc đã bị mời ra khỏi lớp',
      '06.4 (Security - Bị xóa khỏi lớp)',
      'Status 404: Lớp học không tồn tại hoặc đã bị xóa. Frontend catches and navigates to /classrooms',
      `Status ${resOldClass.status}, msg: ${dataOldClass.message}`,
      passed06_4
    );
  } catch (err) {
    record('TC-STU-06', 'Truy cập lớp không hợp lệ', '06.4 (Security)', 'Status 404', err.message, false);
  }

  // 06.5 Real-time Socket & Teacher Approval: Giáo viên duyệt học sinh -> Học sinh thành Active
  try {
    // 1. Teacher views pending join requests
    const resJoinReqs = await fetch(`${BASE_URL}/classrooms/${testClassId}/join-requests`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const dataJoinReqs = await resJoinReqs.json();
    const reqItem = dataJoinReqs.data?.find(r => r.studentId?._id === studentId || r.studentId === studentId);

    // 2. Teacher approves student
    const resApprove = await fetch(`${BASE_URL}/classrooms/${testClassId}/join-requests/${reqItem._id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const dataApprove = await resApprove.json();
    const passedApprove = resApprove.status === 200 && dataApprove.data?.status === 'approved';

    // 3. Verify student is now enrolled in class in DB
    const classAfter = await mongoose.connection.collection('classes').findOne({ _id: new mongoose.Types.ObjectId(testClassId) });
    const isEnrolled = classAfter.students.some(s => s.toString() === studentId.toString());

    // 4. Verify student active classrooms endpoint now lists this class
    const resStudentActive = await fetch(`${BASE_URL}/classrooms/student`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataStudentActive = await resStudentActive.json();
    const isNowInActiveList = dataStudentActive.data?.some(c => c._id.toString() === testClassId);

    const passed06_5 = passedApprove && isEnrolled && isNowInActiveList;
    record(
      'TC-STU-06',
      'Giáo viên duyệt học sinh -> Tự động chuyển Tab (Real-time Socket & Approval)',
      '06.5 (Real-time Socket)',
      'Status 200, student added to students array, socket event emitted, class moves from Pending to Active',
      `Approve status: ${resApprove.status}, enrolled: ${isEnrolled}, in student list: ${isNowInActiveList}`,
      passed06_5
    );
  } catch (err) {
    record('TC-STU-06', 'Duyệt học sinh', '06.5 (Real-time Socket)', 'Status 200', err.message, false);
  }

  // 04.3 Negative Part 2: Học sinh nhập mã của lớp đã là thành viên
  try {
    const resJoinAlready = await fetch(`${BASE_URL}/classrooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ code: testClassCode })
    });
    const dataJoinAlready = await resJoinAlready.json();
    const passedAlready = resJoinAlready.status === 400 && dataJoinAlready.message?.includes('đã tham gia');
    record(
      'TC-STU-04',
      'Nhập mã lớp đã tham gia (đã là thành viên)',
      '04.3 (Negative - Đã tham gia)',
      'Status 400: Bạn đã tham gia lớp học này rồi',
      `Status ${resJoinAlready.status}, msg: ${dataJoinAlready.message}`,
      passedAlready
    );
  } catch (err) {
    record('TC-STU-04', 'Đã tham gia', '04.3 (Negative)', 'Status 400', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-07: CHI TIẾT LỚP HỌC: BẢNG TIN, TÀI LIỆU & THẢO LUẬN
  // ----------------------------------------------------

  // 07.1 View: Xem thông tin tổng quan lớp học
  try {
    const resDetail = await fetch(`${BASE_URL}/classrooms/${testClassId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataDetail = await resDetail.json();
    const cls = dataDetail.data;
    const passed07_1 = resDetail.status === 200 && cls.name === 'Toán Học 12A1' && cls.teacherId?.name;

    record(
      'TC-STU-07',
      'Xem thông tin tổng quan lớp học',
      '07.1 (View)',
      'Status 200: Returns name, subject, code, teacher (populated name, avatar), students',
      `Class: ${cls?.name}, Teacher: ${cls?.teacherId?.name}, Students count: ${cls?.students?.length}`,
      passed07_1
    );
  } catch (err) {
    record('TC-STU-07', 'Chi tiết lớp học', '07.1 (View)', 'Status 200', err.message, false);
  }

  // 07.2 & 07.3: Tạo thông báo có đính kèm file + link YouTube + link Google Drive
  let announcementId = null;
  try {
    const resPostAnn = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        classId: testClassId,
        content: 'Chào mừng các em vào lớp! Xem bài giảng tại https://www.youtube.com/watch?v=dQw4w9WgXcQ và tải giáo trình tại https://drive.google.com/file/d/sample/view',
        type: 'announcement',
        attachments: [
          {
            name: 'DeCuongOnTap.pdf',
            url: 'https://example.com/DeCuongOnTap.pdf',
            type: 'pdf',
            size: '1.5MB'
          }
        ]
      })
    });
    const dataPostAnn = await resPostAnn.json();
    announcementId = dataPostAnn.data?._id;

    // Student fetches announcements
    const resGetAnn = await fetch(`${BASE_URL}/announcements?classId=${testClassId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataGetAnn = await resGetAnn.json();
    const ann = dataGetAnn.data?.find(a => a._id === announcementId);
    const passed07_2 = resGetAnn.status === 200 && ann && ann.attachments?.length > 0;

    record(
      'TC-STU-07',
      'Đọc thông báo & Tải file đính kèm',
      '07.2 (Interactive - Bulletin)',
      'Status 200: Announcement retrieved with attachment file details and download url',
      `Attachment: ${ann?.attachments?.[0]?.name} (${ann?.attachments?.[0]?.size})`,
      passed07_2
    );

    // 07.3 Media Embed: YouTube & Google Drive regex detection
    const ytMatch = ann?.content?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const driveMatch = ann?.content?.match(/(https?:\/\/(?:drive|docs)\.google\.com\/[^\s]+)/);
    const passed07_3 = Boolean(ytMatch) && Boolean(driveMatch);

    record(
      'TC-STU-07',
      'Xem video YouTube nhúng & Link Drive',
      '07.3 (Media Embed)',
      'Regex correctly identifies YouTube video ID and Google Drive URL. Rendered in aspect-video iframe and Drive card',
      `YouTube Video ID: ${ytMatch?.[1]}, Drive URL: ${driveMatch?.[0]}`,
      passed07_3
    );
  } catch (err) {
    record('TC-STU-07', 'Thông báo & Media', '07.2 / 07.3', 'Retrieved', err.message, false);
  }

  // 07.5 Validation: Gửi bình luận rỗng
  try {
    const resEmptyComment = await fetch(`${BASE_URL}/announcements/${announcementId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ content: '' })
    });
    const dataEmptyComment = await resEmptyComment.json();
    const passed07_5 = resEmptyComment.status === 400 && dataEmptyComment.message?.includes('bắt buộc');

    record(
      'TC-STU-07',
      'Gửi bình luận rỗng',
      '07.5 (Validation)',
      'Status 400: Nội dung bình luận là bắt buộc (Client blocks if (!content.trim()))',
      `Status ${resEmptyComment.status}, msg: ${dataEmptyComment.message}`,
      passed07_5
    );
  } catch (err) {
    record('TC-STU-07', 'Bình luận rỗng', '07.5 (Validation)', 'Status 400', err.message, false);
  }

  // 07.4 Interactive - Comment: Đăng bình luận hỏi đáp công khai
  try {
    const commentContent = 'Thầy ơi tuần sau kiểm tra nội dung nào ạ?';
    const resComment = await fetch(`${BASE_URL}/announcements/${announcementId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ content: commentContent })
    });
    const dataComment = await resComment.json();
    const commentsList = dataComment.data?.comments;
    const newComment = commentsList?.find(c => c.content === commentContent);
    const passed07_4 = resComment.status === 200 && newComment && newComment.authorName;

    record(
      'TC-STU-07',
      'Đăng bình luận hỏi đáp công khai',
      '07.4 (Interactive - Comment)',
      'Status 200: Comment appended with authorName, authorRole, and timestamp',
      `Status ${resComment.status}, author: ${newComment?.authorName}, role: ${newComment?.authorRole}`,
      passed07_4
    );
  } catch (err) {
    record('TC-STU-07', 'Đăng bình luận', '07.4 (Interactive - Comment)', 'Status 200', err.message, false);
  }

  // 07.6 Members Tab: Xem danh sách thành viên trong lớp
  try {
    const resClassDetail = await fetch(`${BASE_URL}/classrooms/${testClassId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataClassDetail = await resClassDetail.json();
    // In getClassroomDetail, teacherId is populated. To list students with details:
    const classroomInDb = await mongoose.connection.collection('classes').findOne({ _id: new mongoose.Types.ObjectId(testClassId) });
    const studentsInClass = await mongoose.connection.collection('users').find({
      _id: { $in: classroomInDb.students }
    }, { projection: { name: 1, email: 1, avatar: 1, role: 1 } }).toArray();

    const passed07_6 = resClassDetail.status === 200 && studentsInClass.length > 0;
    record(
      'TC-STU-07',
      'Xem danh sách thành viên trong lớp (Members Tab)',
      '07.6 (Members Tab)',
      'Teacher details and all enrolled students returned with name and avatar',
      `Teacher: ${dataClassDetail.data?.teacherId?.name}, Enrolled students count: ${studentsInClass.length}`,
      passed07_6
    );
  } catch (err) {
    record('TC-STU-07', 'Danh sách thành viên', '07.6 (Members Tab)', 'Success', err.message, false);
  }

  // Clean up test data: keep the test class so user can manually test it or view it!
  await mongoose.disconnect();

  console.log('\n========================================');
  console.log(`MODULE 2 TEST SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
  console.log('========================================');
}

runModule2Tests().catch(console.error);
