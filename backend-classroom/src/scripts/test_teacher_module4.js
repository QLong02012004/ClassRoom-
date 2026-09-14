/**
 * ============================================================================
 * TÊN FILE: test_teacher_module4.js
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/test_teacher_module4.js
 * MỤC ĐÍCH:
 *   Bộ kịch bản kiểm thử tự động toàn diện cho:
 *   MODULE 4: TẠO BÀI TẬP TỰ LUẬN & CHẤM ĐIỂM (/assignments)
 *   trong docs/TEACHER_TESTING_GUIDE.md (TC-TCH-13 đến TC-TCH-14B).
 * ============================================================================
 */

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const mongoose = require('mongoose');

async function runTeacherModule4Tests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING TEACHER MODULE 4 AUTOMATED TESTS');
  console.log('Module 4: Tạo Bài tập Tự luận & Chấm điểm (/assignments)');
  console.log('====================================================\n');

  let teacherToken = '';
  let studentToken = '';
  let studentId = '';
  let studentEmail = 'student@gmail.com';
  let testClassId = '';
  const createdClassIds = [];
  const createdActivityIds = [];

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

    // Connect to Mongo for cleanups
    const mongoUri = 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';
    await mongoose.connect(mongoUri);

    // Setup a dedicated test class with enrolled student
    const cRes = await fetch(`${BASE_URL}/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        className: `Class M4 Assignments ${Date.now()}`,
        subject: 'Toán Học',
        requireApproval: false
      })
    });
    const cData = await cRes.json();
    testClassId = cData.data._id;
    createdClassIds.push(testClassId);

    // Enroll student
    await fetch(`${BASE_URL}/classrooms/${testClassId}/students/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({ studentId })
    });


    // =========================================================================
    // TC-TCH-13: GIAO BÀI TẬP TỰ LUẬN MỚI
    // =========================================================================
    console.log('\n--- TC-TCH-13: Giao Bài tập Tự luận Mới ---');

    let createdActivity1 = null;

    // 13.1 (Positive): Tạo bài tập tự luận có hạn nộp & hệ số
    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const aRes = await fetch(`${BASE_URL}/classes/${testClassId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          title: 'Bài tập chương 1',
          description: 'Làm các bài tập 1, 2, 3 trong SGK',
          dueDate: tomorrow,
          maxScore: 10,
          category: 'homework',
          allowMultipleSubmissions: true
        })
      });
      const aData = await aRes.json();
      createdActivity1 = aData;
      if (createdActivity1?._id) createdActivityIds.push(createdActivity1._id);

      // Verify in class activities list
      const listRes = await fetch(`${BASE_URL}/classes/${testClassId}/activities`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const listData = await listRes.json();
      const foundInList = (listData || []).find((act) => act._id === createdActivity1?._id);

      const passed = aRes.status === 201 && createdActivity1?.title === 'Bài tập chương 1' && !!foundInList;

      record(
        'TC-TCH-13',
        'Tạo bài tập tự luận có hạn nộp & hệ số',
        '13.1 (Positive)',
        'Status 201, assignment created and listed on Tab Bài tập',
        `Status: ${aRes.status}, Title: "${createdActivity1?.title}", MaxScore: ${createdActivity1?.maxScore}, Listed: ${!!foundInList}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-13', 'Tạo bài tập tự luận', '13.1 (Positive)', 'Status 201', err.message, false);
    }

    // 13.2 (Validation): Để trống Tiêu đề bài tập
    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const aRes = await fetch(`${BASE_URL}/classes/${testClassId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          title: '',
          description: 'Không có tiêu đề',
          dueDate: tomorrow,
          maxScore: 10
        })
      });
      const aData = await aRes.json();

      const passed = aRes.status === 400 && aData.message?.includes('tiêu đề');

      record(
        'TC-TCH-13',
        'Để trống Tiêu đề bài tập',
        '13.2 (Validation)',
        'Status 400 with "Vui lòng nhập tiêu đề bài tập!"',
        `Status: ${aRes.status}, Message: "${aData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-13', 'Để trống tiêu đề', '13.2 (Validation)', 'Status 400', err.message, false);
    }

    // 13.3 (Boundary): Chọn Deadline trong quá khứ
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const aRes = await fetch(`${BASE_URL}/classes/${testClassId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          title: 'Bài tập quá hạn',
          dueDate: yesterday,
          maxScore: 10
        })
      });
      const aData = await aRes.json();

      const passed = aRes.status === 400 && aData.message?.includes('quá khứ');

      record(
        'TC-TCH-13',
        'Chọn Deadline trong quá khứ',
        '13.3 (Boundary)',
        'Status 400 with "Hạn nộp bài không được ở trong quá khứ!"',
        `Status: ${aRes.status}, Message: "${aData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-13', 'Deadline trong quá khứ', '13.3 (Boundary)', 'Status 400', err.message, false);
    }

    // 13.4 (Positive): Giao bài tập kèm file tài liệu đính kèm
    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const aRes = await fetch(`${BASE_URL}/classes/${testClassId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          title: 'Bài tập hình học kèm hướng dẫn',
          description: 'Xem file đính kèm để làm bài',
          dueDate: tomorrow,
          maxScore: 10,
          attachments: [
            {
              name: 'huong_dan_giai_hinh.pdf',
              url: 'https://example.com/files/huong_dan_giai_hinh.pdf',
              size: '1.5MB'
            }
          ]
        })
      });
      const aData = await aRes.json();
      if (aData?._id) createdActivityIds.push(aData._id);

      const hasAttachment = aData?.attachments?.length > 0 && aData.attachments[0]?.name === 'huong_dan_giai_hinh.pdf';
      const passed = aRes.status === 201 && hasAttachment;

      record(
        'TC-TCH-13',
        'Giao bài tập kèm file tài liệu đính kèm',
        '13.4 (Positive)',
        'Status 201, assignment created with attachment download link',
        `Status: ${aRes.status}, Attachment: "${aData?.attachments?.[0]?.name}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-13', 'Giao bài tập kèm file đính kèm', '13.4 (Positive)', 'Status 201 with file', err.message, false);
    }


    // =========================================================================
    // TC-TCH-14: CHẤM BÀI TỰ LUẬN & LỜI PHÊ
    // =========================================================================
    console.log('\n--- TC-TCH-14: Chấm bài Tự luận & Lời phê ---');

    // 14.1 (Positive): Xem bài nộp -> Nhập điểm & Lời phê (Đồng bộ Sổ điểm)
    try {
      const activityId = createdActivity1._id;

      // Student submits
      const submitRes = await fetch(`${BASE_URL}/activities/${activityId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          submissionText: 'Em đã hoàn thành bài tập chương 1 ạ.',
          attachments: [
            {
              name: 'bai_lam_toan.pdf',
              url: 'https://example.com/files/bai_lam_toan.pdf',
              size: '850KB'
            }
          ]
        })
      });
      const submitData = await submitRes.json();

      // Teacher fetches submissions
      const subsRes = await fetch(`${BASE_URL}/activities/${activityId}/submissions`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const subsData = await subsRes.json();
      const studentSub = (subsData.data || []).find(
        (s) => (s.studentId?._id || s.studentId?.id || s.studentId)?.toString() === studentId.toString()
      );

      // Teacher saves score & feedback
      const gradeRes = await fetch(`${BASE_URL}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          assignmentId: activityId,
          grades: [
            {
              studentId: studentId,
              score: 9.5,
              feedback: 'Bài làm xuất sắc'
            }
          ]
        })
      });
      const gradeData = await gradeRes.json();

      // Verify gradebook sync
      const gbRes = await fetch(`${BASE_URL}/grades?classId=${testClassId}`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const gbData = await gbRes.json();
      const syncedGrade = (gbData.data?.grades || []).find(
        (g) => (g.studentId?._id || g.studentId)?.toString() === studentId.toString() && g.assignmentId?.toString() === activityId.toString()
      );

      const passed =
        gradeRes.status === 200 &&
        !!studentSub &&
        syncedGrade?.score === 9.5 &&
        syncedGrade?.feedback === 'Bài làm xuất sắc';

      record(
        'TC-TCH-14',
        'Xem bài nộp -> Nhập điểm & Lời phê',
        '14.1 (Positive)',
        'Status 200, score and feedback saved and synced 100% to Gradebook',
        `Grade Status: ${gradeRes.status}, Synced Score: ${syncedGrade?.score}, Feedback: "${syncedGrade?.feedback}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-14', 'Chấm điểm & Lời phê', '14.1 (Positive)', 'Grade saved and synced', err.message, false);
    }

    // 14.2 (Boundary): Nhập điểm vượt thang điểm tối đa (11 khi thang điểm 10)
    try {
      const activityId = createdActivity1._id;
      const overRes = await fetch(`${BASE_URL}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          assignmentId: activityId,
          grades: [
            {
              studentId: studentId,
              score: 11,
              feedback: 'Điểm vượt tối đa'
            }
          ]
        })
      });
      const overData = await overRes.json();

      const passed = overRes.status === 400 && overData.message?.includes('tối đa');

      record(
        'TC-TCH-14',
        'Nhập điểm vượt thang điểm tối đa',
        '14.2 (Boundary)',
        'Status 400 with "Điểm số không được vượt quá thang điểm tối đa!"',
        `Status: ${overRes.status}, Message: "${overData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-14', 'Điểm vượt tối đa', '14.2 (Boundary)', 'Status 400', err.message, false);
    }

    // 14.3 (Boundary): Nhập điểm âm (-1)
    try {
      const activityId = createdActivity1._id;
      const negRes = await fetch(`${BASE_URL}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          assignmentId: activityId,
          grades: [
            {
              studentId: studentId,
              score: -1,
              feedback: 'Điểm âm'
            }
          ]
        })
      });
      const negData = await negRes.json();

      const passed = negRes.status === 400 && negData.message?.includes('không được âm');

      record(
        'TC-TCH-14',
        'Nhập điểm âm',
        '14.3 (Boundary)',
        'Status 400 with "Điểm không được âm!"',
        `Status: ${negRes.status}, Message: "${negData.message}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-14', 'Điểm âm', '14.3 (Boundary)', 'Status 400', err.message, false);
    }

    // 14.4 (Positive): Chỉnh sửa điểm đã chấm (9.5 -> 8.0)
    try {
      const activityId = createdActivity1._id;
      const editRes = await fetch(`${BASE_URL}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          assignmentId: activityId,
          grades: [
            {
              studentId: studentId,
              score: 8.0,
              feedback: 'Đã chấm lại'
            }
          ]
        })
      });
      const editData = await editRes.json();

      // Verify new score in gradebook
      const gbRes = await fetch(`${BASE_URL}/grades?classId=${testClassId}`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const gbData = await gbRes.json();
      const updatedGrade = (gbData.data?.grades || []).find(
        (g) => (g.studentId?._id || g.studentId)?.toString() === studentId.toString() && g.assignmentId?.toString() === activityId.toString()
      );

      const passed = editRes.status === 200 && updatedGrade?.score === 8.0 && updatedGrade?.feedback === 'Đã chấm lại';

      record(
        'TC-TCH-14',
        'Chỉnh sửa điểm đã chấm',
        '14.4 (Positive)',
        'Status 200, score updated to 8.0 and synced to gradebook',
        `Edit Status: ${editRes.status}, New Score: ${updatedGrade?.score}, Feedback: "${updatedGrade?.feedback}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-14', 'Chỉnh sửa điểm đã chấm', '14.4 (Positive)', 'Score updated', err.message, false);
    }

    // 14.5 (Edge Case): Xem bài tập chưa có học sinh nộp
    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const emptyActRes = await fetch(`${BASE_URL}/classes/${testClassId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          title: 'Bài tập chưa ai nộp',
          dueDate: tomorrow,
          maxScore: 10
        })
      });
      const emptyAct = await emptyActRes.json();
      if (emptyAct?._id) createdActivityIds.push(emptyAct._id);

      const getSubsRes = await fetch(`${BASE_URL}/activities/${emptyAct._id}/submissions`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const getSubsData = await getSubsRes.json();

      const passed = getSubsRes.status === 200 && Array.isArray(getSubsData.data) && getSubsData.data.length === 0;

      record(
        'TC-TCH-14',
        'Xem bài tập chưa có học sinh nộp',
        '14.5 (Edge Case)',
        'Status 200, submissions array is empty',
        `Status: ${getSubsRes.status}, Submissions Count: ${getSubsData.data?.length}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-14', 'Chưa có học sinh nộp', '14.5 (Edge Case)', 'Submissions empty', err.message, false);
    }


    // =========================================================================
    // TC-TCH-14B: THẢO LUẬN VỚI HỌC SINH TRONG BÀI TẬP
    // =========================================================================
    console.log('\n--- TC-TCH-14B: Thảo luận với Học sinh trong Bài tập ---');

    // 14B.1 (Positive): Giáo viên nhắn tin trao đổi trong khung Thảo luận
    try {
      const activityId = createdActivity1._id;
      const discussRes = await fetch(`${BASE_URL}/activities/${activityId}/my-submission/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          text: 'Em kiểm tra lại bài nhé',
          studentId: studentId
        })
      });
      const discussData = await discussRes.json();

      // Student checks their submission comments
      const mySubRes = await fetch(`${BASE_URL}/activities/${activityId}/my-submission`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      const mySubData = await mySubRes.json();
      const comments = mySubData.data?.comments || [];
      const teacherComment = comments.find((c) => c.text === 'Em kiểm tra lại bài nhé' && c.isTeacher === true);

      const passed = discussRes.status === 200 && !!teacherComment;

      record(
        'TC-TCH-14B',
        'Giáo viên nhắn tin trao đổi trong khung Thảo luận',
        '14B.1 (Positive)',
        'Status 200, message appears in discussion and visible to student',
        `Comment Status: ${discussRes.status}, Teacher Comment found: ${!!teacherComment}, Text: "${teacherComment?.text}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-14B', 'Giáo viên nhắn tin trao đổi', '14B.1 (Positive)', 'Message sent', err.message, false);
    }

  } catch (err) {
    console.error('Unhandled error in Teacher Module 4 tests:', err);
  } finally {
    // Cleanup temporary test classes, activities, grades, submissions
    if (createdClassIds.length > 0) {
      await mongoose.connection.collection('classes').deleteMany({
        _id: { $in: createdClassIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
    }
    if (createdActivityIds.length > 0) {
      await mongoose.connection.collection('classactivities').deleteMany({
        _id: { $in: createdActivityIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
      await mongoose.connection.collection('submissions').deleteMany({
        assignmentId: { $in: createdActivityIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
      await mongoose.connection.collection('grades').deleteMany({
        assignmentId: { $in: createdActivityIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
    }
    await mongoose.disconnect();
    console.log('\nCleaned up temporary test data.');
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log('\n====================================================');
  console.log(`TEACHER MODULE 4 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');
}

runTeacherModule4Tests().catch(console.error);
