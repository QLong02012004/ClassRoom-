/**
 * ============================================================================
 * TÊN FILE: test_teacher_module6.js
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/test_teacher_module6.js
 * MỤC ĐÍCH:
 *   Bộ kịch bản kiểm thử tự động toàn diện cho:
 *   MODULE 6: ĐIỂM DANH HÀNG NGÀY (/attendance)
 *   trong docs/TEACHER_TESTING_GUIDE.md (TC-TCH-25).
 * ============================================================================
 */

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const mongoose = require('mongoose');

async function runTeacherModule6Tests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING TEACHER MODULE 6 AUTOMATED TESTS');
  console.log('Module 6: Điểm danh Hàng ngày (/attendance)');
  console.log('====================================================\n');

  let teacherToken = '';
  let studentToken = '';
  let studentId = '';
  let studentEmail = 'student@gmail.com';
  let testClassId = '';
  let emptyClassId = '';
  const createdClassIds = [];

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

    // Connect to Mongo
    const mongoUri = 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';
    await mongoose.connect(mongoUri);

    // Setup class with enrolled student
    const cRes = await fetch(`${BASE_URL}/classrooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
      body: JSON.stringify({
        className: `Class M6 Attendance ${Date.now()}`,
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

    // Setup empty class without students
    const emptyCRes = await fetch(`${BASE_URL}/classrooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
      body: JSON.stringify({
        className: `Class M6 Empty ${Date.now()}`,
        subject: 'Vật Lý'
      })
    });
    const emptyCData = await emptyCRes.json();
    emptyClassId = emptyCData.data._id;
    createdClassIds.push(emptyClassId);

    // =========================================================================
    // TC-TCH-25: ĐIỂM DANH HỌC SINH THEO NGÀY
    // =========================================================================
    console.log('\n--- TC-TCH-25: Điểm danh Học sinh theo Ngày ---');

    const todayStr = new Date().toISOString().split('T')[0];

    // 25.1 (Positive): Tích chọn trạng thái chuyên cần mỗi Học sinh
    try {
      const attRes = await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
        body: JSON.stringify({
          classId: testClassId,
          date: todayStr,
          records: [
            {
              studentId: studentId,
              status: 'present'
            }
          ]
        })
      });
      const attData = await attRes.json();
      const savedRecord = attData.data?.records?.find(
        (r) => (r.studentId?._id || r.studentId)?.toString() === studentId.toString()
      );

      const passed = attRes.status === 200 && savedRecord?.status === 'present';

      record(
        'TC-TCH-25',
        'Tích chọn trạng thái chuyên cần mỗi Học sinh',
        '25.1 (Positive)',
        'Status 200, attendance status saved as present',
        `Status: ${attRes.status}, Record status: "${savedRecord?.status}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-25', 'Tích chọn chuyên cần', '25.1 (Positive)', 'Status 200', err.message, false);
    }

    // 25.2 (Positive): Thêm ghi chú lý do vắng cho Học sinh
    try {
      const noteReason = 'Bị sốt xuất huyết, phụ huynh có đơn xin phép';
      const attRes = await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
        body: JSON.stringify({
          classId: testClassId,
          date: todayStr,
          records: [
            {
              studentId: studentId,
              status: 'absent',
              note: noteReason
            }
          ]
        })
      });
      const attData = await attRes.json();
      const savedRecord = attData.data?.records?.find(
        (r) => (r.studentId?._id || r.studentId)?.toString() === studentId.toString()
      );

      const passed = attRes.status === 200 && savedRecord?.status === 'absent' && savedRecord?.note === noteReason;

      record(
        'TC-TCH-25',
        'Thêm ghi chú lý do vắng cho Học sinh',
        '25.2 (Positive)',
        'Status 200, status absent and reason note saved successfully',
        `Status: ${attRes.status}, Attendance: "${savedRecord?.status}", Note: "${savedRecord?.note}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-25', 'Thêm ghi chú vắng', '25.2 (Positive)', 'Note saved', err.message, false);
    }

    // 25.3 (Positive): Chỉnh sửa điểm danh ngày cũ
    try {
      const pastDateStr = '2026-09-01';
      // First save old date as absent
      await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
        body: JSON.stringify({
          classId: testClassId,
          date: pastDateStr,
          records: [{ studentId: studentId, status: 'absent' }]
        })
      });

      // Now edit old date to late
      const editRes = await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
        body: JSON.stringify({
          classId: testClassId,
          date: pastDateStr,
          records: [{ studentId: studentId, status: 'late', note: 'Đi muộn 10 phút' }]
        })
      });
      const editData = await editRes.json();

      // Verify via GET
      const getRes = await fetch(`${BASE_URL}/attendance?classId=${testClassId}&date=${pastDateStr}`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const getData = await getRes.json();
      const checkRecord = getData.data?.records?.find(
        (r) => (r.studentId?._id || r.studentId)?.toString() === studentId.toString()
      );

      const passed = editRes.status === 200 && checkRecord?.status === 'late' && checkRecord?.note === 'Đi muộn 10 phút';

      record(
        'TC-TCH-25',
        'Chỉnh sửa điểm danh ngày cũ',
        '25.3 (Positive)',
        'Status 200, past date attendance updated to late with note',
        `Edit Status: ${editRes.status}, Updated status: "${checkRecord?.status}", Note: "${checkRecord?.note}"`,
        passed
      );
    } catch (err) {
      record('TC-TCH-25', 'Chỉnh sửa ngày cũ', '25.3 (Positive)', 'Updated', err.message, false);
    }

    // 25.4 (View): Xem tổng kết tỷ lệ chuyên cần cả lớp
    try {
      const histRes = await fetch(`${BASE_URL}/attendance/history/${testClassId}`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const histData = await histRes.json();
      const historyList = histData.data || [];

      const passed = histRes.status === 200 && Array.isArray(historyList) && historyList.length >= 2;

      record(
        'TC-TCH-25',
        'Xem tổng kết tỷ lệ chuyên cần cả lớp',
        '25.4 (View)',
        'Status 200, returns attendance history list across sessions',
        `Status: ${histRes.status}, Sessions count: ${historyList.length}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-25', 'Xem tổng kết chuyên cần', '25.4 (View)', 'History retrieved', err.message, false);
    }

    // 25.5 (Edge Case): Điểm danh lớp không có học sinh nào
    try {
      // Query attendance for empty class
      const emptyGetRes = await fetch(`${BASE_URL}/attendance?classId=${emptyClassId}&date=${todayStr}`, {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      const emptyGetData = await emptyGetRes.json();

      // Save empty attendance
      const emptyPostRes = await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${teacherToken}` },
        body: JSON.stringify({
          classId: emptyClassId,
          date: todayStr,
          records: []
        })
      });
      const emptyPostData = await emptyPostRes.json();

      const passed = emptyGetRes.status === 200 && emptyPostRes.status === 200 && emptyPostData.data?.records?.length === 0;

      record(
        'TC-TCH-25',
        'Điểm danh lớp không có học sinh nào',
        '25.5 (Edge Case)',
        'Status 200, handles empty student classroom without crashing',
        `Get Status: ${emptyGetRes.status}, Post Status: ${emptyPostRes.status}, Records: ${emptyPostData.data?.records?.length}`,
        passed
      );
    } catch (err) {
      record('TC-TCH-25', 'Lớp không có học sinh', '25.5 (Edge Case)', 'Status 200', err.message, false);
    }

  } catch (err) {
    console.error('Unhandled error in Teacher Module 6 tests:', err);
  } finally {
    // Cleanup temporary test classes and attendance records
    if (createdClassIds.length > 0) {
      await mongoose.connection.collection('classes').deleteMany({
        _id: { $in: createdClassIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
      await mongoose.connection.collection('attendances').deleteMany({
        classId: { $in: createdClassIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
    }
    await mongoose.disconnect();
    console.log('\nCleaned up temporary test data.');
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log('\n====================================================');
  console.log(`TEACHER MODULE 6 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');
}

runTeacherModule6Tests().catch(console.error);
