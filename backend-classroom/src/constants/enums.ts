/**
 * ============================================================================
 * TÊN FILE: enums.ts
 * ĐƯỜNG DẪN: backend-classroom/src/constants/enums.ts
 * MỤC ĐÍCH:
 *   Định nghĩa toàn bộ các hằng số Enumeration (Enums) trung tâm được dùng trên toàn Backend.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `UserRole`: Vai trò người dùng (ADMIN, TEACHER, STUDENT).
 *   - `UserStatus` & `ClassStatus`: Trạng thái tài khoản và lớp học (ACTIVE, PENDING, LOCKED, ARCHIVED).
 *   - `SubmissionStatus`: Trạng thái nộp bài (PENDING, SUBMITTED, LATE, GRADED).
 *   - `AttendanceStatus`: Trạng thái điểm danh (PRESENT, ABSENT, LATE, EXCUSED).
 *   - `NotificationType` & `AnnouncementType`: Loại thông báo chuông & loại bài đăng bảng tin.
 * ============================================================================
 */

export enum UserRole {
    ADMIN = 'admin',
    TEACHER = 'teacher',
    STUDENT = 'student'
}

export enum UserStatus {
    ACTIVE = 'Active',
    PENDING = 'Pending',
    LOCKED = 'Locked'
}

export enum ClassStatus {
    ACTIVE = 'Active',
    PENDING = 'Pending',
    LOCKED = 'Locked',
    ARCHIVED = 'Archived',
    CLOSED = 'Closed'
}

export enum AttendanceStatus {
    PRESENT = 'present',
    ABSENT = 'absent',
    LATE = 'late'
}

export enum SubmissionStatus {
    SUBMITTED = 'submitted',
    LATE = 'late',
    PENDING = 'pending'
}

export enum QuizStatus {
    OPEN = 'open',
    CLOSED = 'closed',
    DRAFT = 'draft'
}

export enum NotificationType {
    CLASSROOM = 'classroom',
    QUIZ = 'quiz',
    ASSIGNMENT = 'assignment',
    ANNOUNCEMENT = 'announcement',
    WARNING = 'warning'
}

export enum AssignmentCategory {
    HOMEWORK = 'homework',
    PERIODIC = 'periodic',
    MOCK_EXAM = 'mock_exam',
    ATTITUDE = 'attitude'
}

export enum AnnouncementType {
    ANNOUNCEMENT = 'announcement',
    REMINDER = 'reminder',
    MATERIAL = 'material'
}
