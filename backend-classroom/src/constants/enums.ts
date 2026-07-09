export enum UserRole {
    ADMIN = 'admin',
    TEACHER = 'teacher',
    STUDENT = 'student'
}

export enum UserStatus {
    ACTIVE = 'Active',
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
    LATE = 'late'
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
    MIENG = 'mieng',
    MIN15 = '15phut',
    MIDTERM = 'giuaky',
    FINAL = 'cuoiky'
}

export enum AnnouncementType {
    ANNOUNCEMENT = 'announcement',
    REMINDER = 'reminder',
    MATERIAL = 'material'
}
