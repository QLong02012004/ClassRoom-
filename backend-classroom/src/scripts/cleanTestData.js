/**
 * ============================================================================
 * SCRIPT: cleanTestData.js
 * MỤC ĐÍCH: Xóa toàn bộ dữ liệu giả được tạo bởi các script test tự động
 *           (test_module*.js, test_teacher_module*.js, test_admin_module*.js)
 * CÁCH CHẠY: node src/scripts/cleanTestData.js
 * ============================================================================
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';

// Các mã lớp test được tạo bởi các script test
const TEST_CLASS_CODES = ['M8K9L2', 'LOCK01'];

async function cleanTestData() {
  console.log('🔌 Đang kết nối MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Kết nối MongoDB thành công!\n');

  const db = mongoose.connection;

  // ── BƯỚC 1: Tìm ID các lớp test ──────────────────────────────────────────
  console.log('🔍 Tìm các lớp test...');
  const testClasses = await db.collection('classes').find({
    code: { $in: TEST_CLASS_CODES }
  }).toArray();

  const testClassIds = testClasses.map(c => c._id);
  const testClassIdStrings = testClassIds.map(id => id.toString());
  console.log(`   Tìm thấy ${testClasses.length} lớp test: ${testClasses.map(c => c.code + ' (' + c.name + ')').join(', ')}`);

  // ── BƯỚC 2: Xóa BankItems giả (type = assignment/essay, hoặc title chứa #xxxx) ──
  console.log('\n🗑️  Xóa BankItems giả...');
  const bankResult = await db.collection('bankitems').deleteMany({
    $or: [
      { type: 'assignment' },
      { type: 'essay' },
      // Bài có title dạng "... #1234" (4 chữ số - từ Date.now().slice(-4))
      { title: { $regex: '#\\d{4}$' } }
    ]
  });
  console.log(`   ✅ Đã xóa ${bankResult.deletedCount} BankItem giả`);

  // ── BƯỚC 3: Xóa ClassActivities trong các lớp test ───────────────────────
  if (testClassIds.length > 0) {
    console.log('\n🗑️  Xóa ClassActivities trong lớp test...');
    const actResult = await db.collection('classactivities').deleteMany({
      classId: { $in: testClassIds }
    });
    console.log(`   ✅ Đã xóa ${actResult.deletedCount} ClassActivity`);

    // ── BƯỚC 4: Xóa Submissions trong các lớp test ──────────────────────────
    console.log('\n🗑️  Xóa Submissions trong lớp test...');
    const subResult = await db.collection('submissions').deleteMany({
      classId: { $in: testClassIds }
    });
    console.log(`   ✅ Đã xóa ${subResult.deletedCount} Submission`);

    // ── BƯỚC 5: Xóa Schedules trong các lớp test ────────────────────────────
    console.log('\n🗑️  Xóa Schedules trong lớp test...');
    const schedResult = await db.collection('schedules').deleteMany({
      classId: { $in: testClassIds }
    });
    console.log(`   ✅ Đã xóa ${schedResult.deletedCount} Schedule`);

    // ── BƯỚC 6: Xóa Materials trong các lớp test ────────────────────────────
    console.log('\n🗑️  Xóa Materials trong lớp test...');
    const matResult = await db.collection('materials').deleteMany({
      classId: { $in: testClassIds }
    });
    console.log(`   ✅ Đã xóa ${matResult.deletedCount} Material`);

    // ── BƯỚC 7: Xóa QuizResults trong các lớp test ──────────────────────────
    console.log('\n🗑️  Xóa QuizResults trong lớp test...');
    const qrResult = await db.collection('quizresults').deleteMany({
      classId: { $in: testClassIds }
    });
    console.log(`   ✅ Đã xóa ${qrResult.deletedCount} QuizResult`);

    // ── BƯỚC 8: Xóa Attendances trong các lớp test ──────────────────────────
    console.log('\n🗑️  Xóa Attendances trong lớp test...');
    const attResult = await db.collection('attendances').deleteMany({
      classId: { $in: testClassIds }
    });
    console.log(`   ✅ Đã xóa ${attResult.deletedCount} Attendance`);
  }

  // ── BƯỚC 9: Xóa Notifications test (từ script module 8) ─────────────────
  console.log('\n🗑️  Xóa Notifications giả (type test)...');
  const notifResult = await db.collection('notifications').deleteMany({
    $or: [
      // Notification được insert trực tiếp từ script test (type CLASS_APPROVED giả)
      { type: 'CLASS_APPROVED', message: { $regex: 'Test|test|MODULE|module' } },
      // Notification liên quan đến lớp test
      ...(testClassIdStrings.length > 0 ? [{
        message: { $regex: testClasses.map(c => c.name).filter(Boolean).join('|') || 'NOMATCH' }
      }] : [])
    ]
  });
  console.log(`   ✅ Đã xóa ${notifResult.deletedCount} Notification giả`);

  // ── BƯỚC 10: Xóa ClassJoinRequests trong lớp test ────────────────────────
  if (testClassIds.length > 0) {
    console.log('\n🗑️  Xóa ClassJoinRequests trong lớp test...');
    const joinResult = await db.collection('classjoinrequests').deleteMany({
      classId: { $in: testClassIds }
    });
    console.log(`   ✅ Đã xóa ${joinResult.deletedCount} ClassJoinRequest`);
  }

  // ── BƯỚC 11: Xóa Grades trong lớp test ────────────────────────────────────
  if (testClassIds.length > 0) {
    console.log('\n🗑️  Xóa Grades trong lớp test...');
    const gradeResult = await db.collection('grades').deleteMany({
      classId: { $in: testClassIds }
    });
    console.log(`   ✅ Đã xóa ${gradeResult.deletedCount} Grade`);
  }

  // ── BƯỚC 12 (CUỐI CÙNG): Xóa chính các lớp test ─────────────────────────
  if (testClassIds.length > 0) {
    console.log('\n🗑️  Xóa bản thân các lớp test...');
    const classResult = await db.collection('classes').deleteMany({
      code: { $in: TEST_CLASS_CODES }
    });
    console.log(`   ✅ Đã xóa ${classResult.deletedCount} lớp test`);
  }

  console.log('\n🎉 Dọn dẹp dữ liệu test hoàn tất!');
  await mongoose.disconnect();
  console.log('🔌 Đã ngắt kết nối MongoDB.');
}

cleanTestData().catch(err => {
  console.error('❌ Lỗi khi dọn dẹp:', err);
  process.exit(1);
});
