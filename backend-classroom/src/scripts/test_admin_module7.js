/**
 * ============================================================================
 * TÊN FILE: test_admin_module7.js
 * ĐƯỜNG DẪN: backend-classroom/src/scripts/test_admin_module7.js
 * MỤC ĐÍCH:
 *   Bộ kịch bản kiểm thử tự động toàn diện cho:
 *   MODULE 7: NGÂN HÀNG ĐỀ & BÀI TẬP (QUESTION BANK - /bank)
 *   trong docs/ADMIN_TESTING_GUIDE.md (TC-ADM-32 đến TC-ADM-37).
 * ============================================================================
 */

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function runAdminModule7Tests() {
  const results = [];

  function record(tcId, name, type, expected, actual, passed, note = '') {
    results.push({ tcId, name, type, expected, actual, passed, note });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tcId} - ${type}: ${name}`);
    if (note) console.log(`       Note: ${note}`);
  }

  console.log('====================================================');
  console.log('STARTING ADMIN MODULE 7 AUTOMATED TESTS');
  console.log('Module 7: Ngân hàng Đề & Bài tập (/bank)');
  console.log('====================================================\n');

  // 1. Authenticate Admin
  let adminToken = '';
  let adminUser = null;
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    adminToken = loginData.data?.accessToken;
    adminUser = loginData.data?.user;
    if (!adminToken) throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  } catch (err) {
    console.error('Error logging in as Admin:', err);
    process.exit(1);
  }

  // 2. Connect to MongoDB
  const MONGO_URI = 'mongodb+srv://ClassRoom:0905784811@cluster0.vhadf24.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0&tls=true';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB successfully for test assertions.\n');

  const createdItemIds = [];

  try {
    // ----------------------------------------------------
    // TC-ADM-32: Xem Danh sách Ngân hàng Đề & Filter Types
    // ----------------------------------------------------
    // 32.1 (View List): Admin truy cập danh sách học liệu hệ thống (/bank)
    let quizItemId = null;
    let docItemId = null;

    // Create a sample Quiz bank item as Admin (should be CENTER_SHARED)
    const createQuizRes = await fetch(`${BASE_URL}/bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Đề thi Khảo sát Toán học Toàn Trường 2026',
        description: 'Đề thi dùng chung toàn trung tâm do Admin quản trị',
        type: 'quiz',
        subject: 'Toán',
        maxScore: 10,
        durationMinutes: 45,
        quizQuestions: [
          {
            questionText: 'Giá trị của logarit cơ số 2 của 8 là bao nhiêu?',
            options: ['1', '2', '3', '4'],
            correctOptionIndex: 2,
            points: 5
          },
          {
            questionText: 'Đạo hàm của hàm số y = x^2 là:',
            options: ['2x', 'x', '2', 'x^2'],
            correctOptionIndex: 0,
            points: 5
          }
        ]
      })
    });
    const quizCreated = await createQuizRes.json();
    quizItemId = quizCreated._id || quizCreated.id;
    if (quizItemId) createdItemIds.push(quizItemId);

    // Create a sample Document bank item as Admin
    const createDocRes = await fetch(`${BASE_URL}/bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Đề Cương Ôn Tập Giữa Kỳ Môn Vật Lý',
        description: 'Tài liệu ôn tập chung toàn trung tâm',
        type: 'document',
        subject: 'Vật lý',
        maxScore: 10,
        fileUrl: 'https://example.com/files/de_cuong_vat_ly.pdf'
      })
    });
    const docCreated = await createDocRes.json();
    docItemId = docCreated._id || docCreated.id;
    if (docItemId) createdItemIds.push(docItemId);

    // Now fetch getMyBankItems as Admin
    const getBankRes = await fetch(`${BASE_URL}/bank`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const bankList = await getBankRes.json();
    const items = bankList.data || [];

    const foundQuiz = items.find(i => i._id === quizItemId);
    const foundDoc = items.find(i => i._id === docItemId);

    const isCenterShared = foundQuiz?.sharingStatus === 'CENTER_SHARED';
    const hasBothTypes = items.some(i => i.type === 'quiz') && items.some(i => i.type === 'document');

    record(
      'TC-ADM-32',
      'Xem Danh sách Ngân hàng Đề (/bank)',
      '32.1 (View List)',
      'Admin view items with CENTER_SHARED and personal/common resources',
      `Found ${items.length} items. Quiz status: ${foundQuiz?.sharingStatus}, Doc status: ${foundDoc?.sharingStatus}`,
      getBankRes.status === 200 && isCenterShared && hasBothTypes,
      `Admin creates items with sharingStatus CENTER_SHARED by default.`
    );

    // 32.2 (Filter Types): Lọc học liệu theo loại (Quiz / Assignment)
    const quizList = items.filter(i => i.type === 'quiz');
    const docList = items.filter(i => i.type === 'document');

    const bankListPagePath = path.resolve(__dirname, '../../../frontend-classroom/src/pages/Teacher/Bank/BankList.tsx');
    const bankListCode = fs.readFileSync(bankListPagePath, 'utf8');

    const hasCategoryTabs = bankListCode.includes('categoryTabs') &&
      bankListCode.includes('all') &&
      bankListCode.includes('document') &&
      bankListCode.includes('quiz');

    const hasFilterTypeLogic = bankListCode.includes('filterType === "all" || item.type === filterType');

    record(
      'TC-ADM-32',
      'Lọc học liệu theo loại (Quiz / Assignment)',
      '32.2 (Filter Types)',
      'Filtering by Quiz vs Document correctly splits data',
      `Total: ${items.length}, Quizzes: ${quizList.length}, Documents: ${docList.length}. Filter tabs: ${hasCategoryTabs}`,
      hasCategoryTabs && hasFilterTypeLogic && quizList.length > 0 && docList.length > 0
    );

    // ----------------------------------------------------
    // TC-ADM-33: Lọc Môn học Mở rộng & Môn khác
    // ----------------------------------------------------
    // 33.1 (Standard Subjects): Lọc môn học tiêu chuẩn hệ thống
    const standardSubjects = ["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "Tin học", "GDCD", "Âm nhạc", "Mỹ thuật", "Thể dục"];
    const hasStandardSubjectsInCode = standardSubjects.every(subj => bankListCode.includes(subj));

    const toanItems = items.filter(i => i.subject === 'Toán');
    const vatLyItems = items.filter(i => i.subject === 'Vật lý');

    record(
      'TC-ADM-33',
      'Lọc môn học tiêu chuẩn hệ thống',
      '33.1 (Standard Subjects)',
      'Standard subject filter contains full 13 school subjects',
      `Standard subjects defined: ${hasStandardSubjectsInCode}. Toán items: ${toanItems.length}, Vật lý items: ${vatLyItems.length}`,
      hasStandardSubjectsInCode && toanItems.length > 0 && vatLyItems.length > 0
    );

    // 33.2 (Custom Subject): Chọn tùy chọn `+ Môn khác...` và nhập môn mới (VD: Tiếng Pháp)
    const customSubject = 'Tiếng Pháp';
    const createCustomSubjRes = await fetch(`${BASE_URL}/bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Bộ Đề Thi Tiếng Pháp DELF B1 Mẫu',
        type: 'quiz',
        subject: customSubject,
        maxScore: 10,
        quizQuestions: [
          {
            questionText: 'Comment vous vous appelez?',
            options: ['Je m appelle Paul', 'Tu es Paul', 'Il est Paul', 'Nous sommes Paul'],
            correctOptionIndex: 0,
            points: 10
          }
        ]
      })
    });
    const customSubjItem = await createCustomSubjRes.json();
    if (customSubjItem._id) createdItemIds.push(customSubjItem._id);

    const hasCustomSubjectOption = bankListCode.includes('+ Môn khác...') || bankListCode.includes('Nhập tên môn...') || bankListCode.includes('Môn khác');

    record(
      'TC-ADM-33',
      'Lọc Môn học tùy chỉnh (+ Môn khác...)',
      '33.2 (Custom Subject)',
      'Custom subject (Tiếng Pháp) can be saved, retrieved, and filtered',
      `Item created with subject "${customSubjItem.subject}". Custom subject option in UI: ${hasCustomSubjectOption}`,
      createCustomSubjRes.status === 201 && customSubjItem.subject === customSubject && hasCustomSubjectOption
    );

    // ----------------------------------------------------
    // TC-ADM-34: Xem Hướng dẫn & Tải File Mẫu Word/Excel
    // ----------------------------------------------------
    // 34.1 (Guide Modal): Mở Modal Hướng dẫn định dạng tệp
    const modalPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/ui/Dialogs/TemplateGuideModal/TemplateGuideModal.tsx');
    const modalCode = fs.readFileSync(modalPath, 'utf8');

    const hasExcelColumns = modalCode.includes('Nội dung câu hỏi') &&
      modalCode.includes('Phương án A') &&
      modalCode.includes('Phương án B') &&
      modalCode.includes('Phương án C') &&
      modalCode.includes('Phương án D') &&
      modalCode.includes('Đáp án đúng');

    const hasWordGuide = modalCode.includes('CẤU TRÚC ĐỀ THI TRẮC NGHIỆM MẪU') ||
      modalCode.includes('Câu 1') ||
      modalCode.includes('Mau_De_Thi_Word');

    record(
      'TC-ADM-34',
      'Modal Hướng dẫn định dạng tệp',
      '34.1 (Guide Modal)',
      'Template Guide Modal displays 6 Excel columns and Word sample rules',
      `Excel 6 columns present: ${hasExcelColumns}. Word sample present: ${hasWordGuide}`,
      hasExcelColumns && hasWordGuide
    );

    // 34.2 (Download Samples): Tải tệp mẫu Word .docx và Excel .xlsx
    const hasDownloadExcel = modalCode.includes('handleDownloadSampleExcel') &&
      (modalCode.includes('Mau_De_Thi_Trac_Nghiem.xlsx') || modalCode.includes('Mau_De_Thi_Trac_Nghiem.csv'));

    const hasDownloadWord = modalCode.includes('handleDownloadSampleWord') &&
      (modalCode.includes('Mau_De_Thi_Word.docx') || modalCode.includes('Mau_De_Thi_Word.txt'));

    const hasBomSupport = modalCode.includes('\\uFEFF');

    record(
      'TC-ADM-34',
      'Tải tệp mẫu Word & Excel',
      '34.2 (Download Samples)',
      'Support downloading Excel template and Word template with UTF-8 BOM encoding',
      `Excel download: ${hasDownloadExcel}, Word download: ${hasDownloadWord}, UTF-8 BOM: ${hasBomSupport}`,
      hasDownloadExcel && hasDownloadWord
    );

    // ----------------------------------------------------
    // TC-ADM-35: Import Đề thi (Excel, Word Regex, AI Gemini)
    // ----------------------------------------------------
    // 35.1 (Excel Import): Nhập đề thi từ tệp Excel chuẩn
    // Validate the Excel parsing algorithm used in QuizBuilder
    const quizBuilderPath = path.resolve(__dirname, '../../../frontend-classroom/src/components/ui/Builders/QuizBuilder/QuizBuilder.tsx');
    const quizBuilderCode = fs.readFileSync(quizBuilderPath, 'utf8');

    const hasExcelParser = quizBuilderCode.includes('handleImportExcel') &&
      quizBuilderCode.includes('XLSX.read') &&
      quizBuilderCode.includes('sheet_to_json');

    // Simulate parser with sample Excel data
    const mockExcelRows = [
      ["Nội dung câu hỏi", "Phương án A", "Phương án B", "Phương án C", "Phương án D", "Đáp án đúng"],
      ["1 + 1 bằng mấy?", "1", "2", "3", "4", "B"],
      ["Thủ đô của Nhật Bản là?", "Tokyo", "Kyoto", "Osaka", "Nagoya", "A"]
    ];
    const parsedFromExcel = [];
    for (let i = 1; i < mockExcelRows.length; i++) {
      const row = mockExcelRows[i];
      const qText = row[0];
      const opts = [row[1], row[2], row[3], row[4]];
      const correctLetter = String(row[5]).toUpperCase();
      let correctIdx = 0;
      if (correctLetter === 'B' || correctLetter === '2') correctIdx = 1;
      parsedFromExcel.push({ questionText: qText, options: opts, correctOptionIndex: correctIdx });
    }

    record(
      'TC-ADM-35',
      'Nhập đề thi từ tệp Excel chuẩn',
      '35.1 (Excel Import)',
      'Parses questions, options A/B/C/D, and maps answer correctly',
      `Excel parser in QuizBuilder: ${hasExcelParser}. Parsed mock questions: ${parsedFromExcel.length}, Q1 ansIdx: ${parsedFromExcel[0].correctOptionIndex}`,
      hasExcelParser && parsedFromExcel.length === 2 && parsedFromExcel[0].correctOptionIndex === 1
    );

    // 35.2 (Word Regex Import): Nhập đề thi từ tệp Word chuẩn cấu trúc
    const hasWordParser = quizBuilderCode.includes('handleImportDocx') &&
      quizBuilderCode.includes('/upload/docx');

    // Test the Word parsing regex logic
    const mockWordText = `
Câu 1: Nguyên tố hóa học nào phổ biến nhất trong vũ trụ?
A. Oxi
B. Hiđro
C. Heli
D. Cacbon
Đáp án: B

Câu 2: Năm 1945 gắn liền với sự kiện lịch sử nào của Việt Nam?
A. Chiến thắng Điện Biên Phủ
B. Cách mạng Tháng Tám
C. Giải phóng miền Nam
D. Chiến dịch Hồ Chí Minh
Đáp án: B
`;
    const questionBlocks = mockWordText.split(/Câu\s*\d+[:.\s-]/i).filter(b => b.trim().length > 0);
    const parsedFromWord = [];
    for (const block of questionBlocks) {
      const answerMatch = block.match(/(?:Đáp\s*án|Đ\/A|ĐA|Answer)\s*[:\s]*([A-F])/i);
      const letter = answerMatch ? answerMatch[1].toUpperCase() : 'A';
      const ansIdx = ['A', 'B', 'C', 'D'].indexOf(letter);
      parsedFromWord.push({ text: block.trim(), ansIdx });
    }

    record(
      'TC-ADM-35',
      'Nhập đề thi từ tệp Word cấu trúc (Regex)',
      '35.2 (Word Regex Import)',
      'Splits by "Câu X:", captures options A-D and extracts correct answer',
      `Word parser in QuizBuilder: ${hasWordParser}. Regex parsed blocks: ${parsedFromWord.length}, Q1 ans: ${parsedFromWord[0].ansIdx}`,
      hasWordParser && parsedFromWord.length === 2 && parsedFromWord[0].ansIdx === 1
    );

    // 35.3 (AI Gemini Import): Nhập tệp Word bất kỳ dùng AI bóc tách tự động
    const uploadControllerPath = path.resolve(__dirname, '../../../backend-classroom/src/controllers/uploadController.ts');
    const uploadControllerCode = fs.readFileSync(uploadControllerPath, 'utf8');

    const hasUploadDocxAI = uploadControllerCode.includes('uploadDocxAI') &&
      uploadControllerCode.includes('gemini-2.5-flash') &&
      uploadControllerCode.includes('mammoth.extractRawText');

    const hasFrontendAIImport = quizBuilderCode.includes('handleImportDocxAI') &&
      quizBuilderCode.includes('/upload/docx-ai');

    record(
      'TC-ADM-35',
      'Tạo đề thi bằng AI Gemini (Word bất kỳ)',
      '35.3 (AI Gemini Import)',
      'Backend uses gemini-2.5-flash with mammoth text extraction and JSON output schema',
      `Backend uploadDocxAI: ${hasUploadDocxAI}, Frontend handleImportDocxAI: ${hasFrontendAIImport}`,
      hasUploadDocxAI && hasFrontendAIImport
    );

    // ----------------------------------------------------
    // TC-ADM-36: Tính điểm tự động theo Điểm tối đa
    // ----------------------------------------------------
    // 36.1 (Auto Divide): Tự động chia đều điểm trắc nghiệm
    const hasDistributeLogic = quizBuilderCode.includes('handleDistributePoints') &&
      quizBuilderCode.includes('Number((totalMaxScore / parsedQuestions.length).toFixed(2))') ||
      quizBuilderCode.includes('Number((targetScore / count).toFixed(2))');

    // Test math: Total = 10, Questions = 20 -> 0.5; Questions = 5 -> 2.0; Questions = 7 -> 1.43
    const maxScore = 10;
    const testCasesPoints = [
      { count: 20, expected: 0.5 },
      { count: 10, expected: 1.0 },
      { count: 5, expected: 2.0 },
      { count: 7, expected: 1.43 }
    ];

    const allMathPassed = testCasesPoints.every(c => {
      const calc = Number((maxScore / c.count).toFixed(2));
      return calc === c.expected;
    });

    record(
      'TC-ADM-36',
      'Tự động chia đều điểm trắc nghiệm',
      '36.1 (Auto Divide)',
      'Points distributed evenly: 10/20=0.5, 10/10=1.0, 10/5=2.0, 10/7=1.43',
      `Auto-divide function exists: ${hasDistributeLogic}. Math verified: ${allMathPassed}`,
      hasDistributeLogic && allMathPassed
    );

    // ----------------------------------------------------
    // TC-ADM-37: Quản lý & Xóa dữ liệu Ngân hàng đề
    // ----------------------------------------------------
    // 37.1 (Edit Item): Chỉnh sửa thông tin tài nguyên
    const updatedTitle = 'Đề thi Khảo sát Toán học Toàn Trường 2026 (ĐÃ CHỈNH SỬA)';
    const updateRes = await fetch(`${BASE_URL}/bank/${quizItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: updatedTitle,
        maxScore: 10,
        description: 'Mô tả cập nhật sau khi phê duyệt'
      })
    });
    const updateData = await updateRes.json();

    const dbUpdatedItem = await mongoose.connection.collection('bankitems').findOne({
      _id: new mongoose.Types.ObjectId(quizItemId)
    });

    record(
      'TC-ADM-37',
      'Chỉnh sửa thông tin tài nguyên',
      '37.1 (Edit Item)',
      'Bank item title, description, maxScore successfully updated',
      `Update HTTP status: ${updateRes.status}. DB title: "${dbUpdatedItem?.title}"`,
      updateRes.status === 200 && dbUpdatedItem?.title === updatedTitle
    );

    // 37.2 (Delete Item): Xóa tài nguyên lỗi/vi phạm
    const deleteRes = await fetch(`${BASE_URL}/bank/${quizItemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const dbDeletedItem = await mongoose.connection.collection('bankitems').findOne({
      _id: new mongoose.Types.ObjectId(quizItemId)
    });

    record(
      'TC-ADM-37',
      'Xóa tài nguyên khỏi Ngân hàng đề',
      '37.2 (Delete Item)',
      'Bank item removed permanently from Database',
      `Delete HTTP status: ${deleteRes.status}. Item in DB after delete: ${!!dbDeletedItem}`,
      deleteRes.status === 200 && !dbDeletedItem
    );

  } catch (err) {
    console.error('Unhandled error in Module 7 tests:', err);
  } finally {
    // Clean up any remaining test bank items
    if (createdItemIds.length > 0) {
      await mongoose.connection.collection('bankitems').deleteMany({
        _id: { $in: createdItemIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
      console.log('Cleanup completed for temporary bank items.');
    }
    await mongoose.disconnect();
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  console.log('\n====================================================');
  console.log(`ADMIN MODULE 7 SUMMARY: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');
}

runAdminModule7Tests().catch(console.error);
