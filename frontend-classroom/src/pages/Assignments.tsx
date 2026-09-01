/**
 * ============================================================================
 * TÊN FILE: Assignments.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/Assignments.tsx
 * MỤC ĐÍCH:
 *   Component Điều Hướng Bài Tập Theo Vai Trò (Assignments Role Router).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Kiểm tra `user.role` từ `AuthContext`:
 *     + Vai trò Học sinh (`STUDENT`): Hiển thị `StudentAssignments`.
 *     + Vai trò Giáo viên/Admin: Hiển thị `TeacherAssignments`.
 * ============================================================================
 */

import StudentAssignments from "./Student/Assignments/StudentAssignments";
import TeacherAssignments from "./Teacher/Assignments/TeacherAssignments";
import { useAuth } from "../context/AuthContext.tsx";

export default function Assignments() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || "TEACHER";

  if (userRole === "STUDENT") {
    return <StudentAssignments />;
  }

  return <TeacherAssignments />;
}
