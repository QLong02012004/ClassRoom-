/**
 * ============================================================================
 * TÊN FILE: test_teacher_module3.js
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/test_teacher_module3.js
 * MỤC ĐÍCH:
 *   Bộ kịch bản kiểm thử tự động toàn diện cho:
 *   MODULE 3: KHÔNG GIAN LỚP HỌC, QUẢN LÝ HỌC SINH & BẢNG TIN (/classrooms/:id, /classrooms/:id/students, /announcements)
 *   trong docs/TEACHER_TESTING_GUIDE.md (TC-TCH-10 đến TC-TCH-12B).
 * ============================================================================
 */

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const mongoose = require('mongoose');

async function runTeacherModule3Tests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING TEACHER MODULE 3 AUTOMATED TESTS');
  console.log('Module 3: Không gian Lớp học, Quản lý Học sinh & Bảng tin');
  console.log('====================================================\n');

  let teacherToken = '';
  let studentToken = '';
  let studentId = '';
  let studentEmail = 'student@gmail.com';
  const createdClassIds = [];
  const createdAnnouncementIds = [];

  try {
    // 1. Authenticate Teacher & Student
    const tRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@gmail.com', password: '123456' })
    });
    const tData = await tRes.json();
    teacherToken = tData?.data?.accessToken;
    if (!teacherToken) throw new Error('Cannot login as Teacher');

    const sRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: '123456' })
    });
    const sData = await sRes.json();
    studentToken = sData?.data?.accessToken;
    studentId = sData?.data?.user?.id || sData?.data?.user?._id;
    if (!studentToken || !studentId) throw new Error('Cannot login as Student');

    // Connect to Mongo for helper queries and cleanups
    const mongoUri = 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';
    await mongoose.connect(mongoUri);

    // =========================================================================
    // TC-TCH-10: PHÊ DUYỆT YÊU CẦU XIN VÀO LỚP CỦA HỌC SINH
    // =========================================================================
    console.log('\n--- TC-TCH-10: Phê duyệt Yêu cầu Xin vào Lớp của Học sinh ---');

    // 10.1 (Positive): Duyệt đơn lẻ 1 học sinh
    try {
      const cRes = await fetch(`${BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: `Test M3 Join Single ${Date.now()}`,
          subject: 'Toán',
          requireApproval: true
        })
      });
      const cData = await cRes.json();
      const testClass1 = cData.data;
      createdClassIds.push(testClass1._id);

      // Student joins via code
      await fetch(`${BASE_URL}/classrooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify({ code: testClass1.code })
      });

      // Teacher gets pending requests
      const getReqRes = await fetch(`${BASE_URL}/classrooms/${testClass1._id}/join-requests`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const getReqData = await getReqRes.json();
      const pendingReq = (getReqData.data || []).find(r =>
        (r.studentId?._id || r.studentId?.id || r.studentId)?.toString() === studentId.toString()
      );

      let approveOk = false;
      if (pendingReq) {
        // Teacher approves single request
        const appRes = await fetch(`${BASE_URL}/classrooms/${testClass1._id}/join-requests/${pendingReq._id}/approve`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        const appData = await appRes.json();

        // Check classroom updated
        const checkClassRes = await fetch(`${BASE_URL}/classrooms/${testClass1._id}`, {
          headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        const checkClassData = await checkClassRes.json();
        const isEnrolled = checkClassData.data?.students?.some(s => (s._id || s.id || s).toString() === studentId.toString());

        approveOk = appRes.status === 200 && appData.data?.status === 'approved' && isEnrolled;
      }

      record(
        'TC-TCH-10',
        'Duyệt đơn lẻ 1 học sinh xin vào lớp',
        '10.1 (Positive)',
        'Status 200, request approved, student officially enrolled, class size increases',
        `Approve OK: ${approveOk}`,
        approveOk
      );
    } catch (err) {
      record('TC-TCH-10', 'Duyệt đơn lẻ 1 học sinh', '10.1 (Positive)', 'Approved successfully', err.message, false);
    }

    // 10.2 (Positive): Duyệt tất cả (Approve All)
    try {
      const cRes = await fetch(`${BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: `Test M3 Approve All ${Date.now()}`,
          subject: 'Lý',
          requireApproval: true
        })
      });
      const cData = await cRes.json();
      const testClass2 = cData.data;
      createdClassIds.push(testClass2._id);

      // Fetch 2 different student IDs from DB
      const otherStudents = await mongoose.connection.collection('users').find({ role: 'student' }).limit(3).toArray();
      const s1 = otherStudents[0];
      const s2 = otherStudents[1] || otherStudents[0];

      // Insert 2 pending requests directly to ensure multi-student approve all
      await mongoose.connection.collection('classjoinrequests').insertMany([
        {
          classId: new mongoose.Types.ObjectId(testClass2._id),
          studentId: s1._id,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          classId: new mongoose.Types.ObjectId(testClass2._id),
          studentId: s2._id,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      const appAllRes = await fetch(`${BASE_URL}/classrooms/${testClass2._id}/join-requests/approve-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const appAllData = await appAllRes.json();

      // Verify pending requests status
      const remainingPending = await mongoose.connection.collection('classjoinrequests').countDocuments({
        classId: new mongoose.Types.ObjectId(testClass2._id),
        status: 'pending'
      });

      // Verify students enrolled in classroom
      const checkClassRes = await fetch(`${BASE_URL}/classrooms/${testClass2._id}`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const checkClassData = await checkClassRes.json();
      const enrolledCount = checkClassData.data?.students?.length || 0;

      const passed = appAllRes.status === 200 && remainingPending === 0 && enrolledCount >= 2;

      record(
        'TC-TCH-10',
        'Duyệt tất cả (Approve All) nhiều học sinh',
        '10.2 (Positive)',
        'Status 200, all pending approved, class size updated correctly',
        `Status: ${appAllRes.status}, ApprovedCount: ${appAllData.data?.approvedCount}, Remaining Pending: ${remainingPending}, Enrolled: ${enrolledCount}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-10', 'Duyệt tất cả', '10.2 (Positive)', 'All approved', err.message, false);
    }

    // 10.3 (Positive): Từ chối học sinh xin vào lớp
    try {
      const cRes = await fetch(`${BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: `Test M3 Reject ${Date.now()}`,
          subject: 'Hóa',
          requireApproval: true
        })
      });
      const cData = await cRes.json();
      const testClass3 = cData.data;
      createdClassIds.push(testClass3._id);

      // Student joins via code
      await fetch(`${BASE_URL}/classrooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify({ code: testClass3.code })
      });

      // Teacher gets pending requests
      const getReqRes = await fetch(`${BASE_URL}/classrooms/${testClass3._id}/join-requests`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const getReqData = await getReqRes.json();
      const pendingReq = (getReqData.data || []).find(r =>
        (r.studentId?._id || r.studentId?.id || r.studentId)?.toString() === studentId.toString()
      );

      let rejectOk = false;
      if (pendingReq) {
        const rejRes = await fetch(`${BASE_URL}/classrooms/${testClass3._id}/join-requests/${pendingReq._id}/reject`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        const rejData = await rejRes.json();

        // Verify request is rejected and student is NOT in classroom
        const checkClassRes = await fetch(`${BASE_URL}/classrooms/${testClass3._id}`, {
          headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        const checkClassData = await checkClassRes.json();
        const isEnrolled = checkClassData.data?.students?.some(s => (s._id || s.id || s).toString() === studentId.toString());

        rejectOk = rejRes.status === 200 && rejData.data?.status === 'rejected' && !isEnrolled;
      }

      record(
        'TC-TCH-10',
        'Từ chối học sinh xin vào lớp',
        '10.3 (Positive)',
        'Status 200, request status rejected, student not added to classroom',
        `Reject OK: ${rejectOk}`,
        rejectOk
      );
    } catch (err) {
      record('TC-TCH-10', 'Từ chối học sinh xin vào lớp', '10.3 (Positive)', 'Rejected successfully', err.message, false);
    }

    // 10.4 (Edge Case): Không có yêu cầu nào chờ duyệt
    try {
      const cRes = await fetch(`${BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: `Test M3 Empty Pending ${Date.now()}`,
          subject: 'Sinh',
          requireApproval: true
        })
      });
      const cData = await cRes.json();
      const testClass4 = cData.data;
      createdClassIds.push(testClass4._id);

      // Get pending requests when none exist
      const getReqRes = await fetch(`${BASE_URL}/classrooms/${testClass4._id}/join-requests`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const getReqData = await getReqRes.json();

      // Try approve-all when empty
      const appAllRes = await fetch(`${BASE_URL}/classrooms/${testClass4._id}/join-requests/approve-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const appAllData = await appAllRes.json();

      const passed = getReqData.data?.length === 0 && appAllData.data?.approvedCount === 0;

      record(
        'TC-TCH-10',
        'Không có yêu cầu nào chờ duyệt',
        '10.4 (Edge Case)',
        'Pending list empty, approve-all reports 0 approved',
        `Pending count: ${getReqData.data?.length}, Message: "${appAllData.message}", Approved: ${appAllData.data?.approvedCount}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-10', 'Không có yêu cầu chờ duyệt', '10.4 (Edge Case)', 'Pending list empty', err.message, false);
    }


    // =========================================================================
    // TC-TCH-11: QUẢN LÝ DANH SÁCH HỌC SINH TRONG LỚP
    // =========================================================================
    console.log('\n--- TC-TCH-11: Quản lý Danh sách Học sinh trong Lớp ---');

    let classForStudentManage = null;
    try {
      const cRes = await fetch(`${BASE_URL}/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          className: `Test M3 Student Manage ${Date.now()}`,
          subject: 'Tin Học',
          requireApproval: false
        })
      });
      const cData = await cRes.json();
      classForStudentManage = cData.data;
      createdClassIds.push(classForStudentManage._id);
    } catch (e) {
      console.error('Error creating class for TC-TCH-11:', e);
    }

    // 11.1 (Positive): Thêm trực tiếp Học sinh vào lớp bằng Email / ID
    try {
      const addRes = await fetch(`${BASE_URL}/classrooms/${classForStudentManage._id}/students/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ studentId: studentId })
      });
      const addData = await addRes.json();

      const checkClassRes = await fetch(`${BASE_URL}/classrooms/${classForStudentManage._id}`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const checkClassData = await checkClassRes.json();
      const isEnrolled = checkClassData.data?.students?.some(s => (s._id || s.id || s).toString() === studentId.toString());

      const passed = addRes.status === 200 && isEnrolled;

      record(
        'TC-TCH-11',
        'Thêm trực tiếp Học sinh vào lớp',
        '11.1 (Positive)',
        'Status 200, student added without pending approval, class size increases',
        `Status: ${addRes.status}, Enrolled: ${isEnrolled}, Message: "${addData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-11', 'Thêm trực tiếp Học sinh', '11.1 (Positive)', 'Student added', err.message, false);
    }

    // 11.2 (Negative): Thêm học sinh bằng Email không tồn tại trên hệ thống
    try {
      // 1. Search non-existent email in user service
      const searchRes = await fetch(`${BASE_URL}/users?role=student&search=notexist@gmail.com`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const searchData = await searchRes.json();
      const searchEmpty = (searchData.data || []).length === 0;

      // 2. Attempt to add missing / non-existent studentId
      const addRes = await fetch(`${BASE_URL}/classrooms/${classForStudentManage._id}/students/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ studentId: '' })
      });
      const addData = await addRes.json();

      const passed = searchEmpty && addRes.status === 400 && addData.message?.includes('Thiếu ID học sinh');

      record(
        'TC-TCH-11',
        'Thêm học sinh bằng Email không tồn tại trên hệ thống',
        '11.2 (Negative)',
        'Search returns empty, add endpoint rejects with 400',
        `Search empty: ${searchEmpty}, Add Status: ${addRes.status}, Message: "${addData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-11', 'Thêm học sinh email không tồn tại', '11.2 (Negative)', 'Validation error / not found', err.message, false);
    }

    // 11.3 (Negative): Thêm học sinh đã có trong lớp
    try {
      const addDupRes = await fetch(`${BASE_URL}/classrooms/${classForStudentManage._id}/students/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ studentId: studentId })
      });
      const addDupData = await addDupRes.json();

      const passed = addDupRes.status === 400 && addDupData.message?.includes('đã có trong lớp');

      record(
        'TC-TCH-11',
        'Thêm học sinh đã có trong lớp',
        '11.3 (Negative)',
        'Status 400 with "Học sinh này đã có trong lớp học rồi!"',
        `Status: ${addDupRes.status}, Message: "${addDupData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-11', 'Thêm học sinh đã có trong lớp', '11.3 (Negative)', 'Status 400 duplicate', err.message, false);
    }

    // 11.4 (Positive): Mời học sinh ra khỏi lớp (Xóa khỏi lớp)
    try {
      const delRes = await fetch(`${BASE_URL}/classrooms/${classForStudentManage._id}/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const delData = await delRes.json();

      // Check classroom no longer contains student
      const checkClassRes = await fetch(`${BASE_URL}/classrooms/${classForStudentManage._id}`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const checkClassData = await checkClassRes.json();
      const isStillEnrolled = checkClassData.data?.students?.some(s => (s._id || s.id || s).toString() === studentId.toString());

      const passed = delRes.status === 200 && !isStillEnrolled;

      record(
        'TC-TCH-11',
        'Mời học sinh ra khỏi lớp (Xóa khỏi lớp)',
        '11.4 (Positive)',
        'Status 200, student removed from classroom, class size decreases',
        `Status: ${delRes.status}, Enrolled: ${isStillEnrolled}, Message: "${delData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-11', 'Mời học sinh ra khỏi lớp', '11.4 (Positive)', 'Student removed', err.message, false);
    }

    // 11.5 (View): Xem danh sách đầy đủ thành viên
    try {
      // Re-add student so the member list has members
      await fetch(`${BASE_URL}/classrooms/${classForStudentManage._id}/students/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ studentId: studentId })
      });

      const getStudentsRes = await fetch(`${BASE_URL}/classrooms/${classForStudentManage._id}/students`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const getStudentsData = await getStudentsRes.json();
      const studentList = getStudentsData.data || [];
      const hasStudentDetails = studentList.length > 0 && !!studentList[0].name && !!studentList[0].email;

      const passed = getStudentsRes.status === 200 && hasStudentDetails;

      record(
        'TC-TCH-11',
        'Xem danh sách đầy đủ thành viên',
        '11.5 (View)',
        'Status 200, member list returns avatar, name, email, id',
        `Status: ${getStudentsRes.status}, Member Count: ${studentList.length}, Has Details: ${hasStudentDetails}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-11', 'Xem danh sách đầy đủ thành viên', '11.5 (View)', 'Member list returned', err.message, false);
    }


    // =========================================================================
    // TC-TCH-12: ĐĂNG THÔNG BÁO & CHIA SẺ TÀI LIỆU BẢNG TIN
    // =========================================================================
    console.log('\n--- TC-TCH-12: Đăng Thông báo & Chia sẻ Tài liệu Bảng tin ---');

    let textAnnouncement = null;

    // 12.1 (Positive): Đăng thông báo dạng text thuần
    try {
      const postRes = await fetch(`${BASE_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          classId: classForStudentManage._id,
          content: 'Tuần sau thi giữa kỳ',
          type: 'announcement'
        })
      });
      const postData = await postRes.json();
      textAnnouncement = postData.data;
      if (textAnnouncement) createdAnnouncementIds.push(textAnnouncement._id);

      const passed = postRes.status === 201 && postData.data?.content === 'Tuần sau thi giữa kỳ' && postData.data?.authorId?.name;

      record(
        'TC-TCH-12',
        'Đăng thông báo dạng text thuần',
        '12.1 (Positive)',
        'Status 201, announcement appears on stream feed with teacher name & timestamp',
        `Status: ${postRes.status}, Author: "${postData.data?.authorId?.name}", Content: "${postData.data?.content}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-12', 'Đăng thông báo text thuần', '12.1 (Positive)', 'Announcement created', err.message, false);
    }

    // 12.2 (Positive): Đăng thông báo kèm file PDF/Word
    try {
      const fileRes = await fetch(`${BASE_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          classId: classForStudentManage._id,
          content: 'Tài liệu cương ôn tập học kỳ 1 đính kèm',
          type: 'material',
          attachments: [
            {
              name: 'de_cuong_toan_hk1.pdf',
              url: 'https://example.com/files/de_cuong_toan_hk1.pdf',
              type: 'file'
            }
          ]
        })
      });
      const fileData = await fileRes.json();
      if (fileData.data) createdAnnouncementIds.push(fileData.data._id);

      const hasAttachment = fileData.data?.attachments?.length > 0 && fileData.data?.attachments[0]?.name === 'de_cuong_toan_hk1.pdf';
      const passed = fileRes.status === 201 && hasAttachment;

      record(
        'TC-TCH-12',
        'Đăng thông báo kèm file PDF/Word',
        '12.2 (Positive)',
        'Status 201, announcement displays attachment with download link',
        `Status: ${fileRes.status}, Attachment: "${fileData.data?.attachments?.[0]?.name}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-12', 'Đăng thông báo kèm file PDF/Word', '12.2 (Positive)', 'Announcement with attachment created', err.message, false);
    }

    // 12.3 (Positive): Đăng thông báo kèm Link Youtube/Drive
    try {
      const linkRes = await fetch(`${BASE_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          classId: classForStudentManage._id,
          content: 'Video bài giảng số học: https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          type: 'announcement'
        })
      });
      const linkData = await linkRes.json();
      if (linkData.data) createdAnnouncementIds.push(linkData.data._id);

      const passed = linkRes.status === 201 && linkData.data?.content?.includes('https://www.youtube.com');

      record(
        'TC-TCH-12',
        'Đăng thông báo kèm Link Youtube/Drive',
        '12.3 (Positive)',
        'Status 201, video link displayed for preview / clicking',
        `Status: ${linkRes.status}, Content contains URL: ${linkData.data?.content?.includes('youtube.com')}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-12', 'Đăng thông báo kèm Link Youtube/Drive', '12.3 (Positive)', 'Announcement with video link created', err.message, false);
    }

    // 12.4 (Validation): Đăng bài trống nội dung
    try {
      const emptyRes = await fetch(`${BASE_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          classId: classForStudentManage._id,
          content: '',
          type: 'announcement'
        })
      });
      const emptyData = await emptyRes.json();

      const passed = emptyRes.status === 400 && emptyData.message?.includes('nội dung thông báo');

      record(
        'TC-TCH-12',
        'Đăng bài trống nội dung',
        '12.4 (Validation)',
        'Status 400 with "Thiếu classId hoặc nội dung thông báo"',
        `Status: ${emptyRes.status}, Message: "${emptyData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-12', 'Đăng bài trống nội dung', '12.4 (Validation)', 'Status 400 empty content', err.message, false);
    }


    // =========================================================================
    // TC-TCH-12B: BÌNH LUẬN & QUẢN LÝ BÌNH LUẬN CÔNG KHAI
    // =========================================================================
    console.log('\n--- TC-TCH-12B: Bình luận & Quản lý bình luận công khai ---');

    let createdCommentId = null;

    // 12B.1 (Positive): Giáo viên gõ bình luận trả lời Học sinh
    try {
      const targetAnnouncementId = textAnnouncement?._id || createdAnnouncementIds[0];
      const commentRes = await fetch(`${BASE_URL}/announcements/${targetAnnouncementId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ content: 'Thầy đã nhận được thắc mắc và sẽ giải đáp sớm.' })
      });
      const commentData = await commentRes.json();
      const comments = commentData.data?.comments || [];
      const addedComment = comments.find(c => c.content === 'Thầy đã nhận được thắc mắc và sẽ giải đáp sớm.');
      if (addedComment) createdCommentId = addedComment._id;

      const passed = commentRes.status === 200 && !!addedComment && addedComment.authorRole === 'teacher';

      record(
        'TC-TCH-12B',
        'Giáo viên gõ bình luận trả lời',
        '12B.1 (Positive)',
        'Status 200, comment appears instantly with author name, role & timestamp',
        `Status: ${commentRes.status}, Comment found: ${!!addedComment}, AuthorRole: "${addedComment?.authorRole}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-12B', 'Giáo viên gõ bình luận', '12B.1 (Positive)', 'Comment added', err.message, false);
    }

    // 12B.2 (Positive): Giáo viên xóa bình luận không phù hợp
    try {
      const targetAnnouncementId = textAnnouncement?._id || createdAnnouncementIds[0];
      let passed = false;
      if (createdCommentId) {
        const delCommentRes = await fetch(`${BASE_URL}/announcements/${targetAnnouncementId}/comments/${createdCommentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        const delCommentData = await delCommentRes.json();

        // Verify comment is gone
        const commentsAfter = delCommentData.data?.comments || [];
        const isStillThere = commentsAfter.some(c => c._id.toString() === createdCommentId.toString());

        passed = delCommentRes.status === 200 && !isStillThere;

        record(
          'TC-TCH-12B',
          'Giáo viên xóa bình luận không phù hợp',
          '12B.2 (Positive)',
          'Status 200, comment removed from stream announcement',
          `Status: ${delCommentRes.status}, Still present: ${isStillThere}, Message: "${delCommentData.message}"`,
          passed
        );
      } else {
        record('TC-TCH-12B', 'Xóa bình luận', '12B.2 (Positive)', 'Comment deleted', 'No commentId found', false);
      }
    } catch (err) {
      record('TC-TCH-12B', 'Giáo viên xóa bình luận', '12B.2 (Positive)', 'Comment deleted', err.message, false);
    }

    // 12B.3 (Validation): Gửi bình luận trống
    try {
      const targetAnnouncementId = textAnnouncement?._id || createdAnnouncementIds[0];
      const emptyCommentRes = await fetch(`${BASE_URL}/announcements/${targetAnnouncementId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ content: '' })
      });
      const emptyCommentData = await emptyCommentRes.json();

      const passed = emptyCommentRes.status === 400 && emptyCommentData.message?.includes('bắt buộc');

      record(
        'TC-TCH-12B',
        'Gửi bình luận trống',
        '12B.3 (Validation)',
        'Status 400 with "Nội dung bình luận là bắt buộc"',
        `Status: ${emptyCommentRes.status}, Message: "${emptyCommentData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-12B', 'Gửi bình luận trống', '12B.3 (Validation)', 'Status 400 empty comment', err.message, false);
    }

  } catch (err) {
    console.error('Unhandled error in Teacher Module 3 tests:', err);
  } finally {
    // Cleanup temporary test classes and announcements
    if (createdClassIds.length > 0) {
      await mongoose.connection.collection('classes').deleteMany({
        _id: { $in: createdClassIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
      await mongoose.connection.collection('classjoinrequests').deleteMany({
        classId: { $in: createdClassIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
    }
    if (createdAnnouncementIds.length > 0) {
      await mongoose.connection.collection('announcements').deleteMany({
        _id: { $in: createdAnnouncementIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
    }
    await mongoose.disconnect();
    console.log('\nCleaned up temporary test data.');
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log('\n====================================================');
  console.log(`TEACHER MODULE 3 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');
}

runTeacherModule3Tests().catch(console.error);
