/**
 * ============================================================================
 * TÊN FILE: Dashboard.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/Dashboard.tsx
 * MỤC ĐÍCH:
 *   Component Điều Hướng Trang Tổng Quan Dashboard Theo Vai Trò (Dashboard Role Router).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - `student`: Render `StudentDashboard` (tiến độ bài tập, Streak, Bảng xếp hạng XP).
 *   - `admin`: Render `AdminDashboard` (tổng số người dùng, số lớp, người dùng mới).
 *   - `teacher`: Render `TeacherDashboard` (phổ điểm, bài cần chấm, học sinh nguy cơ).
 * ============================================================================
 */

import TeacherDashboard from "./Teacher/Dashboard/TeacherDashboard";
import StudentDashboard from "./Student/Dashboard/StudentDashboard";
import AdminDashboard from "./Admin/Dashboard/AdminDashboard";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'student') {
    return <StudentDashboard />;
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  return <TeacherDashboard />;
}
