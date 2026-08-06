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
    LOCKED = 'Locked',
    ARCHIVED = 'Archived'
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
