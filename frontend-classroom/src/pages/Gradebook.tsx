/**
 * ============================================================================
 * TÊN FILE: Gradebook.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/Gradebook.tsx
 * MỤC ĐÍCH:
 *   Component Điều Hướng Sổ Điểm Theo Vai Trò (Gradebook Role Router).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `STUDENT`: Render `StudentResults` (bảng kết quả điểm cá nhân).
 *   - Giáo viên/Admin: Render `TeacherGradebook` (bảng điểm ma trận lớp học & xuất/nhập Excel).
 * ============================================================================
 */

import StudentResults from "./Student/Results/StudentResults";
import TeacherGradebook from "./Teacher/Gradebook/TeacherGradebook";
import { useAuth } from "../context/AuthContext.tsx";

export default function Gradebook() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || "TEACHER";

  if (userRole === "STUDENT") {
    return <StudentResults />;
  }

  return <TeacherGradebook />;
}
