/**
 * ============================================================================
 * TÊN FILE: Classrooms.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/Classrooms.tsx
 * MỤC ĐÍCH:
 *   Component Điều Hướng Danh Sách Lớp Học Theo Vai Trò (Classrooms Role Router).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `STUDENT`: Render `StudentClassrooms` (lớp học đã tham gia & lớp chờ duyệt).
 *   - `ADMIN`: Chuyển hướng tới `/admin/classrooms`.
 *   - `TEACHER`: Render `TeacherClassrooms` (tạo lớp mới, duyệt học sinh, quản lý mã code).
 * ============================================================================
 */

import StudentClassrooms from "./Student/Classrooms/StudentClassrooms.tsx";
import TeacherClassrooms from "./Teacher/Classrooms/TeacherClassrooms.tsx";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

export default function Classrooms() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || "TEACHER";

  if (userRole === "STUDENT") {
    return <StudentClassrooms />;
  }

  if (userRole === "ADMIN") {
    return <Navigate to="/admin/classrooms" replace />;
  }

  return <TeacherClassrooms />;
}
