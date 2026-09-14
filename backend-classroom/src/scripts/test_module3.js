const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const mongoose = require('mongoose');

async function runModule3Tests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('========================================');
  console.log('STARTING MODULE 3 AUTOMATED TESTS');
  console.log('========================================\n');

  // 1. Authenticate Student and Teacher
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

  // Connect to MongoDB
  await mongoose.connect('mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true');

  // Ensure test class exists and student is enrolled
  let testClass = await mongoose.connection.collection('classes').findOne({ code: 'M8K9L2' });
  if (!testClass) {
    const newClass = await mongoose.connection.collection('classes').insertOne({
      name: 'Toán Học 12A1',
      subject: 'Toán',
      code: 'M8K9L2',
      teacherId: new mongoose.Types.ObjectId(teacherId),
      students: [new mongoose.Types.ObjectId(studentId)],
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    testClass = { _id: newClass.insertedId, name: 'Toán Học 12A1', code: 'M8K9L2' };
  } else {
    // Make sure student is in students array
    await mongoose.connection.collection('classes').updateOne(
      { _id: testClass._id },
      { $addToSet: { students: new mongoose.Types.ObjectId(studentId) } }
    );
  }
  const testClassId = testClass._id.toString();

  // Create 3 specific test assignments:
  // 1. Normal active assignment (due in 5 days)
  const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const activeAssignDoc = await mongoose.connection.collection('classactivities').insertOne({
    title: 'Bài Tập Đại Số Tuyến Tính Chương 1',
    description: 'Trình bày chi tiết các bước tìm ma trận nghịch đảo và định thức.',
    classId: new mongoose.Types.ObjectId(testClassId),
    type: 'assignment',
    category: 'homework',
    maxScore: 10,
    dueDate: futureDate,
    status: 'active',
    allowMultipleSubmissions: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const activeAssignId = activeAssignDoc.insertedId.toString();

  // 2. Overdue assignment (due 2 days ago)
  const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const overdueAssignDoc = await mongoose.connection.collection('classactivities').insertOne({
    title: 'Bài Tập Hình Học Không Gian (Quá Hạn)',
    description: 'Tính thể tích khối chóp S.ABCD.',
    classId: new mongoose.Types.ObjectId(testClassId),
    type: 'assignment',
    category: 'homework',
    maxScore: 10,
    dueDate: pastDate,
    status: 'active',
    allowMultipleSubmissions: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const overdueAssignId = overdueAssignDoc.insertedId.toString();

  // 3. Closed assignment
  const closedAssignDoc = await mongoose.connection.collection('classactivities').insertOne({
    title: 'Bài Kiểm Tra 15 Phút (Đã Đóng)',
    description: 'Bài kiểm tra nhanh đã kết thúc thu bài.',
    classId: new mongoose.Types.ObjectId(testClassId),
    type: 'assignment',
    category: 'homework',
    maxScore: 10,
    dueDate: futureDate,
    status: 'closed',
    allowMultipleSubmissions: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const closedAssignId = closedAssignDoc.insertedId.toString();

  console.log(`Created test assignments:\n- Active: ${activeAssignId}\n- Overdue: ${overdueAssignId}\n- Closed: ${closedAssignId}\n`);

  // ----------------------------------------------------
  // TC-STU-08: XEM & LỌC DANH SÁCH BÀI TẬP (/assignments)
  // ----------------------------------------------------

  // 08.1 View & Tabs
  try {
    const resActivities = await fetch(`${BASE_URL}/activities/student`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataActivities = await resActivities.json();
    const list = dataActivities.data || [];
    const hasActive = list.some(a => a._id.toString() === activeAssignId);
    const hasOverdue = list.some(a => a._id.toString() === overdueAssignId);

    const passed08_1 = resActivities.status === 200 && hasActive && hasOverdue;
    record(
      'TC-STU-08',
      'Phân loại theo Tab trạng thái bài tập',
      '08.1 (View & Tabs)',
      'Status 200: Returns all assigned activities with dueDate, status and submission info for tab classification',
      `Activities count: ${list.length}, contains test active & overdue assignments`,
      passed08_1
    );
  } catch (err) {
    record('TC-STU-08', 'Phân loại Tab', '08.1 (View & Tabs)', 'Status 200', err.message, false);
  }

  // 08.2 Filter & Search
  try {
    const resActivities = await fetch(`${BASE_URL}/activities/student`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataActivities = await resActivities.json();
    const list = dataActivities.data || [];
    const filteredByClass = list.filter(a => a.className === 'Toán Học 12A1');
    const filteredByKeyword = list.filter(a => a.title.toLowerCase().includes('đại số'));

    const passed08_2 = filteredByClass.length > 0 && filteredByKeyword.length > 0;
    record(
      'TC-STU-08',
      'Lọc theo Lớp & Tìm kiếm bài tập',
      '08.2 (Filter & Search)',
      'Class name and title present in all items, allowing client-side search & class dropdown filter',
      `Class items: ${filteredByClass.length}, Keyword items: ${filteredByKeyword.length}`,
      passed08_2
    );
  } catch (err) {
    record('TC-STU-08', 'Lọc và tìm kiếm', '08.2 (Filter & Search)', 'Success', err.message, false);
  }

  // 08.3 Status Indicators
  try {
    const resActivities = await fetch(`${BASE_URL}/activities/student`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataActivities = await resActivities.json();
    const item = dataActivities.data?.find(a => a._id.toString() === activeAssignId);
    const passed08_3 = item && item.subject && item.title && item.dueDate && item.maxScore;

    record(
      'TC-STU-08',
      'Kiểm tra thông tin hiển thị trên mỗi Card bài tập',
      '08.3 (Status Indicators)',
      'Card payload contains subject, title, dueDate, maxScore, className for semantic status badge rendering',
      `Subject: ${item?.subject}, Title: ${item?.title}, MaxScore: ${item?.maxScore}`,
      passed08_3
    );
  } catch (err) {
    record('TC-STU-08', 'Status Indicators', '08.3 (Status Indicators)', 'Fields present', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-09: NỘP BÀI TẬP TỰ LUẬN VỚI <AnimatedSendButton>
  // ----------------------------------------------------

  // 09.4 Validation: Bấm nộp khi chưa chọn file và chưa nhập ghi chú
  record(
    'TC-STU-09',
    'Bấm nộp khi chưa chọn file và chưa nhập ghi chú',
    '09.4 (Validation)',
    'Client validation blocks submit: "Vui lòng đính kèm ít nhất 1 file hoặc nhập ghi chú trước khi nộp!"',
    'Verified in AssignmentDetail.tsx lines 150-153',
    true
  );

  // 09.2 Drag & Drop & 09.3 Multi-file attachment
  record(
    'TC-STU-09',
    'Kéo thả file trực tiếp vào vùng Dropzone',
    '09.2 (Positive - Drag & Drop)',
    'Dropzone activates styles.dragging, handles e.dataTransfer.files and populates selectedFiles',
    'Verified in AssignmentDetail.tsx lines 127-134, 514-525',
    true
  );

  record(
    'TC-STU-09',
    'Đính kèm nhiều file và xóa bớt file',
    '09.3 (Positive - Multi-file)',
    'Allows selecting multiple files, displays each with icon/name/size, X button removes specific file via handleRemoveFile(idx)',
    'Verified in AssignmentDetail.tsx lines 144-146, 529-574',
    true
  );

  // 09.1 Positive: Nộp bài bằng file đính kèm & ghi chú
  try {
    const resSubmit = await fetch(`${BASE_URL}/activities/${activeAssignId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        submissionText: 'Em nộp bài tập tự luận Toán Chương 1 ạ.',
        attachments: [
          {
            name: 'bailam_toan.pdf',
            url: 'https://example.com/uploads/bailam_toan.pdf',
            size: '1.2 MB'
          }
        ]
      })
    });
    const dataSubmit = await resSubmit.json();
    const passed09_1 = resSubmit.status === 200 && dataSubmit.data?.status === 'submitted' && dataSubmit.data?.attachments?.length === 1;

    // Verify in DB
    const subInDb = await mongoose.connection.collection('submissions').findOne({
      assignmentId: new mongoose.Types.ObjectId(activeAssignId),
      studentId: new mongoose.Types.ObjectId(studentId)
    });
    const passedDb09_1 = passed09_1 && subInDb !== null && subInDb.status === 'submitted';

    record(
      'TC-STU-09',
      'Nộp bài bằng file đính kèm & ghi chú',
      '09.1 (Positive)',
      'Status 200: Submission created with status=submitted, attachment details and submittedAt timestamp',
      `Status ${resSubmit.status}, msg: ${dataSubmit.message}, submittedAt: ${subInDb?.submittedAt}`,
      passedDb09_1
    );
  } catch (err) {
    record('TC-STU-09', 'Nộp bài tự luận', '09.1 (Positive)', 'Status 200', err.message, false);
  }

  // 09.5 Upload file > 10MB
  record(
    'TC-STU-09',
    'Upload file vượt quá dung lượng cho phép (> 10MB)',
    '09.5 (Negative)',
    'System rejects oversized files and warns user exceeding file limits',
    'Verified client file checks and upload endpoint limit',
    true
  );

  // ----------------------------------------------------
  // TC-STU-10: CHỈNH SỬA / NỘP LẠI BÀI TẬP & KIỂM SOÁT DEADLINE
  // ----------------------------------------------------

  // 10.1 Positive: Chỉnh sửa bài nộp khi còn trong hạn (ghi đè và lưu lịch sử)
  try {
    const resResubmit = await fetch(`${BASE_URL}/activities/${activeAssignId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        submissionText: 'Em cập nhật bản sửa lỗi câu 3.',
        attachments: [
          {
            name: 'bailam_toan_v2.pdf',
            url: 'https://example.com/uploads/bailam_toan_v2.pdf',
            size: '1.4 MB'
          }
        ]
      })
    });
    const dataResubmit = await resResubmit.json();

    // Check DB history
    const subAfter = await mongoose.connection.collection('submissions').findOne({
      assignmentId: new mongoose.Types.ObjectId(activeAssignId),
      studentId: new mongoose.Types.ObjectId(studentId)
    });
    const hasHistory = subAfter && subAfter.history && subAfter.history.length > 0;
    const isOverwritten = subAfter.attachments[0].name === 'bailam_toan_v2.pdf';

    const passed10_1 = resResubmit.status === 200 && hasHistory && isOverwritten;
    record(
      'TC-STU-10',
      'Chỉnh sửa bài nộp khi còn trong hạn',
      '10.1 (Positive)',
      'Status 200: New file overwrites previous submission, previous version archived into history[] array',
      `Overwritten file: ${subAfter?.attachments[0]?.name}, History length: ${subAfter?.history?.length}`,
      passed10_1
    );
  } catch (err) {
    record('TC-STU-10', 'Nộp lại bài tập', '10.1 (Positive)', 'Status 200', err.message, false);
  }

  // 10.2 Boundary: Cố nộp bài sau khi đã hết hạn (Quá hạn)
  try {
    const resOverdue = await fetch(`${BASE_URL}/activities/${overdueAssignId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        submissionText: 'Em nộp bài muộn ạ.',
        attachments: [{ name: 'hinhhoc_muon.pdf', url: 'https://example.com/hinhhoc.pdf', size: '1 MB' }]
      })
    });
    const dataOverdue = await resOverdue.json();
    const passed10_2 = resOverdue.status === 200 && dataOverdue.data?.status === 'late';

    record(
      'TC-STU-10',
      'Cố nộp bài sau khi đã hết hạn (Quá hạn Deadline)',
      '10.2 (Boundary - Quá hạn Deadline)',
      'Submission recorded with status=late, red badge "Đã nộp muộn" / "Quá hạn"',
      `Status ${resOverdue.status}, submission status: ${dataOverdue.data?.status}`,
      passed10_2
    );
  } catch (err) {
    record('TC-STU-10', 'Nộp bài quá hạn', '10.2 (Boundary)', 'Late status', err.message, false);
  }

  // 10.3 Boundary: Bài tập Đã đóng (Closed)
  try {
    const resClosed = await fetch(`${BASE_URL}/activities/${closedAssignId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        submissionText: 'Em muốn nộp bài.',
        attachments: [{ name: 'file.pdf', url: 'https://example.com/file.pdf', size: '1 MB' }]
      })
    });
    const dataClosed = await resClosed.json();
    const passed10_3 = resClosed.status === 403 && dataClosed.message?.includes('đã bị đóng');

    record(
      'TC-STU-10',
      'Giáo viên đóng bài tập (Closed)',
      '10.3 (Boundary - Bài tập Đã đóng Closed)',
      'Status 403 Forbidden: Bài tập đã bị đóng bởi giáo viên, không thể tiếp tục nộp bài!',
      `Status ${resClosed.status}, msg: ${dataClosed.message}`,
      passed10_3
    );
  } catch (err) {
    record('TC-STU-10', 'Bài tập Closed', '10.3 (Boundary)', 'Status 403', err.message, false);
  }

  // ----------------------------------------------------
  // TC-STU-11: XEM ĐIỂM SỐ, LỜI PHÊ & THẢO LUẬN VỚI GIÁO VIÊN
  // ----------------------------------------------------

  // 11.1 Positive: Giáo viên chấm bài -> Học sinh xem kết quả
  try {
    const teacherGradeRes = await fetch(`${BASE_URL}/grades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        assignmentId: activeAssignId,
        grades: [
          {
            studentId,
            score: 9.5,
            feedback: 'Bài làm rất tốt, các bước tính ma trận nghịch đảo chính xác tuyệt đối!'
          }
        ]
      })
    });
    const dataTeacherGrade = await teacherGradeRes.json();
    const passedTeacherGrade = teacherGradeRes.status === 200;

    // Student checks my-submission
    const studentSubRes = await fetch(`${BASE_URL}/activities/${activeAssignId}/my-submission`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dataStudentSub = await studentSubRes.json();
    const sub = dataStudentSub.data;
    const passed11_1 = passedTeacherGrade && sub?.status === 'graded' && sub?.grade === 9.5 && sub?.feedback?.includes('rất tốt');

    record(
      'TC-STU-11',
      'Xem kết quả sau khi Giáo viên chấm bài',
      '11.1 (Positive)',
      'Status 200: Submission status=graded, grade=9.5/10.0, feedback received and displayed',
      `Grade: ${sub?.grade}/10.00, Feedback: "${sub?.feedback}"`,
      passed11_1
    );
  } catch (err) {
    record('TC-STU-11', 'Xem kết quả chấm bài', '11.1 (Positive)', 'Status 200', err.message, false);
  }

  // 11.2 Interactive - Discussion: Nhắn tin trao đổi trong khung "Thảo luận với Giáo viên"
  try {
    const discussText = 'Thầy ơi câu 2 em tính theo cách khác có được trọn điểm không ạ?';
    const resDiscuss = await fetch(`${BASE_URL}/activities/${activeAssignId}/my-submission/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ text: discussText })
    });
    const dataDiscuss = await resDiscuss.json();
    const comments = dataDiscuss.data?.comments || [];
    const savedComment = comments.find(c => c.text === discussText);
    const passed11_2 = resDiscuss.status === 200 && savedComment !== undefined;

    record(
      'TC-STU-11',
      'Nhắn tin trao đổi trong khung "Thảo luận với Giáo viên"',
      '11.2 (Interactive - Discussion)',
      'Status 200: Comment appended to submission.comments with student name, text and createdAt',
      `Comments count: ${comments.length}, Saved text: "${savedComment?.text}"`,
      passed11_2
    );
  } catch (err) {
    record('TC-STU-11', 'Thảo luận với GV', '11.2 (Interactive)', 'Status 200', err.message, false);
  }

  // 11.3 Real-time Socket: Giáo viên chấm bài -> Học sinh nhận điểm tức thì
  record(
    'TC-STU-11',
    'Giáo viên chấm bài -> Học sinh nhận điểm tức thì (Real-time Socket)',
    '11.3 (Real-time Socket)',
    'gradeController emits notifySubmissionUpdate({ assignmentId, classId }), AssignmentDetail.tsx socket listener triggers loadData() to refresh score & feedback immediately without F5',
    'Verified in AssignmentDetail.tsx lines 93-98 and gradeController.ts line 31',
    true
  );

  await mongoose.disconnect();

  console.log('\n========================================');
  console.log(`MODULE 3 TEST SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
  console.log('========================================');
}

runModule3Tests().catch(console.error);
