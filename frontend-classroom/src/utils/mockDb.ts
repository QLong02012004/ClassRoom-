// -------------------------------------------------------------
// HỆ THỐNG CƠ SỞ DỮ LIỆU GIẢ LẬP (MOCK DATABASE) CHO FRONTEND
// Lưu trữ trực tiếp trong LocalStorage để duy trì dữ liệu khi F5
// Cung cấp các hàm CRUD để xử lý dữ liệu dễ dàng.
// -------------------------------------------------------------

export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: "teacher" | "student" | "admin";
  createdAt: string;
}

export interface Classroom {
  _id: string;
  className: string;
  subject: string;
  classCode: string;
  teacherId: string;
  createdAt: string;
}

export interface Grades {
  mouth: number[];
  fifteenMin: number[];
  midTerm: number | null;
  finalTerm: number | null;
}

export interface Student {
  _id: string;
  name: string;
  email?: string;
  password?: string;
  studentCode: string;
  parentPhone: string;
  classId: string;
  grades: Grades;
}

export interface AttendanceRecord {
  studentId: string;
  status: "present" | "late" | "absent";
}

export interface Attendance {
  _id: string;
  classId: string;
  date: string; // Định dạng YYYY-MM-DD
  records: AttendanceRecord[];
}

export interface Comment {
  _id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  classId: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  comments: Comment[];
  type?: "announcement" | "assignment" | "reminder" | "material";
  files?: { name: string; size: string; url: string }[];
  images?: string[];
  likes?: number;
}

export interface Submission {
  studentId: string;
  studentName: string;
  submittedAt: string;
  fileUrl?: string;
  textAnswer?: string;
  grade: number | null;
  feedback: string | null;
  status: "submitted" | "graded" | "late";
}

export interface Assignment {
  _id: string;
  classId: string;
  title: string;
  description: string;
  deadline: string;
  fileUrl?: string;
  createdAt: string;
  submissions: Submission[];
}

export interface QuizQuestion {
  _id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export interface QuizResult {
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface Quiz {
  _id: string;
  classId: string;
  title: string;
  durationMinutes: number; // Thời gian làm bài (phút)
  questions: QuizQuestion[];
  results: QuizResult[];
  createdAt: string;
}

export interface DbSchema {
  users: User[];
  classrooms: Classroom[];
  students: Student[];
  attendances: Attendance[];
  announcements: Announcement[];
  assignments: Assignment[];
  quizzes: Quiz[];
}

// --- DỮ LIỆU BAN ĐẦU (INITIAL DUMMY DATA) ---
const INITIAL_DATABASE: DbSchema = {
  users: [
    {
      _id: "teacher-1",
      name: "Cô Nguyễn Thị Mai",
      email: "teacher@classroom.com",
      password: "password123",
      role: "teacher",
      createdAt: "2026-06-01T08:00:00.000Z"
    },
    {
      _id: "admin-1",
      name: "Quản trị viên",
      email: "admin@classroom.com",
      password: "admin",
      role: "admin",
      createdAt: "2026-06-01T08:00:00.000Z"
    }
  ],
  classrooms: [
    {
      _id: "class-4",
      className: "Lớp Toán - Khối 4",
      subject: "Toán học",
      classCode: "TOAN04",
      teacherId: "teacher-1",
      createdAt: "2026-06-01T09:00:00.000Z"
    },
    {
      _id: "class-5",
      className: "Lớp Toán - Khối 5",
      subject: "Toán học",
      classCode: "TOAN05",
      teacherId: "teacher-1",
      createdAt: "2026-06-01T10:00:00.000Z"
    },
    {
      _id: "class-6",
      className: "Lớp Toán - Khối 6",
      subject: "Toán học",
      classCode: "TOAN06",
      teacherId: "teacher-1",
      createdAt: "2026-06-02T09:00:00.000Z"
    },
    {
      _id: "class-7",
      className: "Lớp Toán - Khối 7",
      subject: "Toán học",
      classCode: "TOAN07",
      teacherId: "teacher-1",
      createdAt: "2026-06-02T10:00:00.000Z"
    },
    {
      _id: "class-8",
      className: "Lớp Toán - Khối 8",
      subject: "Toán học",
      classCode: "TOAN08",
      teacherId: "teacher-1",
      createdAt: "2026-06-02T11:00:00.000Z"
    }
  ],
  students: [
    {
      _id: "student-1",
      name: "Học sinh A",
      email: "student1@classroom.com",
      password: "password123",
      studentCode: "HS2026001",
      parentPhone: "0905123456",
      classId: "class-6",
      grades: {
        mouth: [8.0, 9.5],
        fifteenMin: [7.0],
        midTerm: 8.5,
        finalTerm: 9.0
      }
    },
    {
      _id: "student-2",
      name: "Lê Thị Chi",
      studentCode: "HS2026002",
      parentPhone: "0905789123",
      classId: "class-6",
      grades: {
        mouth: [6.0],
        fifteenMin: [8.0, 7.5],
        midTerm: 7.0,
        finalTerm: 8.0
      }
    },
    {
      _id: "student-3",
      name: "Nguyễn Hoàng Nam",
      studentCode: "HS2026003",
      parentPhone: "0914111222",
      classId: "class-6",
      grades: {
        mouth: [9.0],
        fifteenMin: [9.0],
        midTerm: 9.5,
        finalTerm: 9.5
      }
    },
    {
      _id: "student-4",
      name: "Phạm Minh Đức",
      studentCode: "HS2026004",
      parentPhone: "0987654321",
      classId: "class-7",
      grades: {
        mouth: [8.0],
        fifteenMin: [8.5],
        midTerm: 8.0,
        finalTerm: 9.0
      }
    }
  ],
  attendances: [
    {
      _id: "att-1",
      classId: "class-6",
      date: "2026-06-02",
      records: [
        { studentId: "student-1", status: "present" },
        { studentId: "student-2", status: "late" },
        { studentId: "student-3", status: "present" }
      ]
    },
    {
      _id: "att-2",
      classId: "class-6",
      date: "2026-06-03",
      records: [
        { studentId: "student-1", status: "present" },
        { studentId: "student-2", status: "present" },
        { studentId: "student-3", status: "absent" }
      ]
    }
  ],
  announcements: [
    {
      _id: "ann-screenshot-1",
      classId: "class-6",
      title: "Nhắc nhở nộp bài tập Toán (Chương Đạo hàm)",
      content: "🚨 Nhắc nhở quan trọng: Cả lớp nhớ nộp bài tập Toán (Chương Đạo hàm) trên hệ thống trước 23h tối nay nhé. Bài tập này sẽ lấy điểm kiểm tra 15 phút.",
      authorName: "Thầy Long",
      createdAt: "2026-06-03T12:20:00.000Z",
      comments: [
        {
          _id: "c-sc-1",
          authorName: "Nguyễn Hoàng Nam",
          content: "Dạ em nộp rồi ạ, thầy kiểm tra giúp em xem có bị lỗi file không nhé!",
          createdAt: "2026-06-03T12:33:00.000Z"
        },
        {
          _id: "c-sc-2",
          authorName: "Lê Minh Anh",
          content: "Thầy ơi câu 5 trong file pdf bị nhầm đề bài hay sao ấy ạ?",
          createdAt: "2026-06-03T12:35:00.000Z"
        }
      ],
      type: "reminder",
      files: [
        { name: "BT_Dao_Ham_Tuan_4.pdf", size: "2.4 MB", url: "#" }
      ],
      likes: 12
    },
    {
      _id: "ann-screenshot-2",
      classId: "class-6",
      title: "Tài liệu học tập: Slide bài giảng hôm nay",
      content: "Chào cả lớp, đây là slide bài giảng hôm nay. Các em xem lại để chuẩn bị cho tiết học ngày mai nhé.",
      authorName: "Thầy Long",
      createdAt: "2026-06-03T10:35:00.000Z",
      comments: [
        {
          _id: "c-sc-3",
          authorName: "Lê Thị Chi",
          content: "Slide chi tiết quá, em cảm ơn thầy ạ!",
          createdAt: "2026-06-03T10:45:00.000Z"
        },
        {
          _id: "c-sc-4",
          authorName: "Học sinh A",
          content: "Em đã tải slide về học rồi ạ.",
          createdAt: "2026-06-03T11:00:00.000Z"
        }
      ],
      type: "material",
      images: [
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"
      ],
      likes: 24
    }
  ],
  assignments: [
    {
      _id: "assign-1",
      classId: "class-6",
      title: "Bài tập về nhà: Hàm Số Lũy Thừa & Mũ",
      description: "Yêu cầu các em hoàn thành 10 câu tự luận trong file đính kèm bên dưới. Trình bày chi tiết các bước giải và nộp bài trước thời hạn Deadline quy định.",
      deadline: "2026-06-08T23:59:00.000Z",
      createdAt: "2026-06-02T08:00:00.000Z",
      submissions: [
        {
          studentId: "student-1",
          studentName: "Học sinh A",
          submittedAt: "2026-06-03T10:00:00.000Z",
          fileUrl: "/bai_lam_binh.pdf",
          textAnswer: "Em đã hoàn thành đầy đủ bài tập tự luận thầy giao ạ.",
          grade: 9.0,
          feedback: "Trình bày bài sạch sẽ, lập luận chặt chẽ. Cần chú ý thêm điều kiện xác định ở câu 4.",
          status: "graded"
        },
        {
          studentId: "student-2",
          studentName: "Lê Thị Chi",
          submittedAt: "2026-06-03T14:20:00.000Z",
          fileUrl: "/bai_lam_chi.pdf",
          grade: null,
          feedback: null,
          status: "submitted"
        }
      ]
    }
  ],
  quizzes: [
    {
      _id: "quiz-1",
      classId: "class-6",
      title: "Đề kiểm tra nhanh 15 phút - Đại Số Chương II",
      durationMinutes: 15,
      questions: [
        {
          _id: "q-1",
          questionText: "Tìm tập xác định D của hàm số y = (x^2 - 1)^(-3):",
          options: ["D = R", "D = R \\ {-1, 1}", "D = (-inf, -1) U (1, +inf)", "D = (-1, 1)"],
          correctOptionIndex: 1
        },
        {
          _id: "q-2",
          questionText: "Đạo hàm của hàm số y = ln(2x) là:",
          options: ["y' = 1/x", "y' = 1/(2x)", "y' = 2/x", "y' = e^(2x)"],
          correctOptionIndex: 0
        },
        {
          _id: "q-3",
          questionText: "Giải phương trình 2^(x - 1) = 8:",
          options: ["x = 3", "x = 4", "x = 5", "x = 2"],
          correctOptionIndex: 1
        }
      ],
      results: [
        {
          studentId: "student-1",
          studentName: "Học sinh A",
          score: 10,
          totalQuestions: 3,
          submittedAt: "2026-06-02T19:30:00.000Z"
        }
      ],
      createdAt: "2026-06-02T09:00:00.000Z"
    }
  ]
};

const LOCAL_STORAGE_KEY = "classroom_mock_db";

// --- QUẢN LÝ DB CHUNG ---
export const initMockDb = (): DbSchema => {
  const dbStr = localStorage.getItem(LOCAL_STORAGE_KEY);
  let parsedDb: DbSchema | null = null;
  try {
    if (dbStr) parsedDb = JSON.parse(dbStr);
  } catch (e) {
    parsedDb = null;
  }

  const needsReset = !parsedDb ||
    !parsedDb.classrooms ||
    parsedDb.students.some(s => s.name === "Trần Văn Bình");

  if (needsReset) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DATABASE));
    return INITIAL_DATABASE;
  }
  return parsedDb!;
};

export const getMockDb = (): DbSchema => {
  const dbStr = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!dbStr) {
    return initMockDb();
  }
  return JSON.parse(dbStr);
};

export const saveMockDb = (db: DbSchema): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
};

// --- CRUD: USERS (NGƯỜI DÙNG) ---
export const getMockTeachers = (): User[] => {
  const db = getMockDb();
  return db.users.filter(u => u.role === "teacher");
};

export const createMockTeacher = (name: string, email: string, password: string): User => {
  const db = getMockDb();
  const newTeacher: User = {
    _id: "teacher_" + Date.now(),
    name,
    email,
    password,
    role: "teacher",
    createdAt: new Date().toISOString()
  };
  db.users.push(newTeacher);
  saveMockDb(db);
  return newTeacher;
};

// --- CRUD: CLASSROOMS (LỚP HỌC) ---
export const getMockClassrooms = (): Classroom[] => {
  const db = getMockDb();
  return db.classrooms;
};

export const createMockClassroom = (className: string, subject: string): Classroom => {
  const db = getMockDb();
  // Tạo mã code ngẫu nhiên và duy nhất 6 ký tự viết hoa
  let classCode = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  do {
    classCode = "";
    for (let i = 0; i < 6; i++) {
      classCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (db.classrooms.some(c => c.classCode === classCode));

  const newClass: Classroom = {
    _id: "class_" + Date.now(),
    className,
    subject,
    classCode,
    teacherId: "teacher-1",
    createdAt: new Date().toISOString()
  };

  db.classrooms.push(newClass);
  saveMockDb(db);
  return newClass;
};

export const updateMockClassroom = (classId: string, className: string, subject: string): Classroom | null => {
  const db = getMockDb();
  const index = db.classrooms.findIndex(c => c._id === classId);
  if (index === -1) return null;
  db.classrooms[index].className = className;
  db.classrooms[index].subject = subject;
  saveMockDb(db);
  return db.classrooms[index];
};

export const deleteMockClassroom = (classId: string): boolean => {
  const db = getMockDb();
  const index = db.classrooms.findIndex(c => c._id === classId);
  if (index === -1) return false;

  db.classrooms.splice(index, 1);
  // Xóa học sinh và dữ liệu liên quan thuộc lớp này
  db.students = db.students.filter(s => s.classId !== classId);
  db.attendances = db.attendances.filter(a => a.classId !== classId);
  db.announcements = db.announcements.filter(a => a.classId !== classId);
  db.assignments = db.assignments.filter(a => a.classId !== classId);
  db.quizzes = db.quizzes.filter(q => q.classId !== classId);

  saveMockDb(db);
  return true;
};

// --- CRUD: STUDENTS (HỌC VIÊN) ---
export const getMockStudents = (classId: string): Student[] => {
  const db = getMockDb();
  return db.students.filter(s => s.classId === classId);
};

export const addMockStudent = (classId: string, name: string, parentPhone: string, email?: string, password?: string): Student => {
  const db = getMockDb();
  const studentCode = "HS" + (2026000 + db.students.length + 1);

  const newStudent: Student = {
    _id: "student_" + Date.now(),
    name,
    email,
    password,
    studentCode,
    parentPhone,
    classId,
    grades: {
      mouth: [],
      fifteenMin: [],
      midTerm: null,
      finalTerm: null
    }
  };

  db.students.push(newStudent);
  saveMockDb(db);
  return newStudent;
};

export const deleteMockStudent = (studentId: string): boolean => {
  const db = getMockDb();
  const index = db.students.findIndex(s => s._id === studentId);
  if (index === -1) return false;
  db.students.splice(index, 1);

  // Xóa bản ghi điểm danh liên quan
  db.attendances.forEach(att => {
    att.records = att.records.filter(r => r.studentId !== studentId);
  });

  saveMockDb(db);
  return true;
};

export const updateMockStudent = (
  studentId: string,
  name: string,
  parentPhone: string,
  email?: string,
  password?: string
): Student | null => {
  const db = getMockDb();
  const idx = db.students.findIndex(s => s._id === studentId);
  if (idx === -1) return null;

  db.students[idx].name = name;
  db.students[idx].parentPhone = parentPhone;
  if (email !== undefined) db.students[idx].email = email;
  if (password !== undefined) db.students[idx].password = password;

  saveMockDb(db);
  return db.students[idx];
};

// --- CRUD: ATTENDANCE (ĐIỂM DANH) ---
export const getMockAttendances = (classId: string): Attendance[] => {
  const db = getMockDb();
  return db.attendances.filter(a => a.classId === classId);
};

export const getMockAttendanceByDate = (classId: string, date: string): Attendance | null => {
  const db = getMockDb();
  return db.attendances.find(a => a.classId === classId && a.date === date) || null;
};

export const saveMockAttendance = (classId: string, date: string, records: AttendanceRecord[]): Attendance => {
  const db = getMockDb();
  const index = db.attendances.findIndex(a => a.classId === classId && a.date === date);

  if (index !== -1) {
    db.attendances[index].records = records;
    saveMockDb(db);
    return db.attendances[index];
  } else {
    const newAtt: Attendance = {
      _id: "att_" + Date.now(),
      classId,
      date,
      records
    };
    db.attendances.push(newAtt);
    saveMockDb(db);
    return newAtt;
  }
};

// --- CRUD: GRADES (SỔ ĐIỂM) ---
export const updateMockStudentGrades = (studentId: string, grades: Partial<Grades>): Student | null => {
  const db = getMockDb();
  const index = db.students.findIndex(s => s._id === studentId);
  if (index === -1) return null;

  db.students[index].grades = {
    ...db.students[index].grades,
    ...grades
  };

  saveMockDb(db);
  return db.students[index];
};

// --- CRUD: ANNOUNCEMENTS (BẢNG TIN & BÌNH LUẬN) ---
export const getMockAnnouncements = (classId: string): Announcement[] => {
  const db = getMockDb();
  return db.announcements
    .filter(a => a.classId === classId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const createMockAnnouncement = (
  classId: string,
  title: string,
  content: string,
  authorName: string,
  type?: "announcement" | "assignment" | "reminder" | "material",
  files?: { name: string; size: string; url: string }[],
  images?: string[]
): Announcement => {
  const db = getMockDb();
  const newAnn: Announcement = {
    _id: "ann_" + Date.now(),
    classId,
    title,
    content,
    authorName,
    createdAt: new Date().toISOString(),
    comments: [],
    type: type || "announcement",
    files: files || [],
    images: images || [],
    likes: 0
  };

  db.announcements.push(newAnn);
  saveMockDb(db);
  return newAnn;
};

export const addMockComment = (announcementId: string, authorName: string, content: string): Comment | null => {
  const db = getMockDb();
  const index = db.announcements.findIndex(a => a._id === announcementId);
  if (index === -1) return null;

  const newComment: Comment = {
    _id: "c_" + Date.now(),
    authorName,
    content,
    createdAt: new Date().toISOString()
  };

  db.announcements[index].comments.push(newComment);
  saveMockDb(db);
  return newComment;
};

// --- CRUD: ASSIGNMENTS (BÀI TẬP) ---
export const getMockAssignments = (classId: string): Assignment[] => {
  const db = getMockDb();
  return db.assignments.filter(a => a.classId === classId);
};

export const createMockAssignment = (classId: string, title: string, description: string, deadline: string): Assignment => {
  const db = getMockDb();
  const newAssign: Assignment = {
    _id: "assign_" + Date.now(),
    classId,
    title,
    description,
    deadline,
    createdAt: new Date().toISOString(),
    submissions: []
  };

  db.assignments.push(newAssign);
  saveMockDb(db);
  return newAssign;
};

export const submitMockAssignment = (
  assignmentId: string,
  studentId: string,
  studentName: string,
  textAnswer?: string,
  fileUrl?: string
): Submission | null => {
  const db = getMockDb();
  const index = db.assignments.findIndex(a => a._id === assignmentId);
  if (index === -1) return null;

  const assignment = db.assignments[index];
  const isLate = new Date().getTime() > new Date(assignment.deadline).getTime();

  const newSubmission: Submission = {
    studentId,
    studentName,
    submittedAt: new Date().toISOString(),
    textAnswer,
    fileUrl,
    grade: null,
    feedback: null,
    status: isLate ? "late" : "submitted"
  };

  // Nếu đã nộp trước đó thì đè lên, ngược lại thêm mới
  const subIndex = assignment.submissions.findIndex(s => s.studentId === studentId);
  if (subIndex !== -1) {
    assignment.submissions[subIndex] = newSubmission;
  } else {
    assignment.submissions.push(newSubmission);
  }

  saveMockDb(db);
  return newSubmission;
};

export const gradeMockSubmission = (
  assignmentId: string,
  studentId: string,
  grade: number,
  feedback: string
): Submission | null => {
  const db = getMockDb();
  const index = db.assignments.findIndex(a => a._id === assignmentId);
  if (index === -1) return null;

  const subIndex = db.assignments[index].submissions.findIndex(s => s.studentId === studentId);
  if (subIndex === -1) return null;

  const submission = db.assignments[index].submissions[subIndex];
  submission.grade = grade;
  submission.feedback = feedback;
  submission.status = "graded";

  saveMockDb(db);
  return submission;
};

// --- CRUD: QUIZZES (TRẮC NGHIỆM ONLINE) ---
export const getMockQuizzes = (classId: string): Quiz[] => {
  const db = getMockDb();
  return db.quizzes.filter(q => q.classId === classId);
};

export const createMockQuiz = (
  classId: string,
  title: string,
  durationMinutes: number,
  questions: QuizQuestion[]
): Quiz => {
  const db = getMockDb();
  const newQuiz: Quiz = {
    _id: "quiz_" + Date.now(),
    classId,
    title,
    durationMinutes,
    questions,
    results: [],
    createdAt: new Date().toISOString()
  };

  db.quizzes.push(newQuiz);
  saveMockDb(db);
  return newQuiz;
};

export const submitMockQuizResult = (
  quizId: string,
  studentId: string,
  studentName: string,
  score: number,
  totalQuestions: number
): QuizResult | null => {
  const db = getMockDb();
  const index = db.quizzes.findIndex(q => q._id === quizId);
  if (index === -1) return null;

  const newResult: QuizResult = {
    studentId,
    studentName,
    score,
    totalQuestions,
    submittedAt: new Date().toISOString()
  };

  db.quizzes[index].results.push(newResult);
  saveMockDb(db);
  return newResult;
};

// Khởi chạy DB giả lập ngay lập tức khi ứng dụng load
initMockDb();
