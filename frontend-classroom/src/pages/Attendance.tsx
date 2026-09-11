/**
 * ============================================================================
 * TÊN FILE: Attendance.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/Attendance.tsx
 * MỤC ĐÍCH:
 *   Component Điều Hướng Điểm Danh Theo Vai Trò (Attendance Role Router).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Kiểm tra `user.role` từ `AuthContext`:
 *     + Giáo viên/Admin: Render `TeacherAttendance` để lấy danh sách học sinh và điểm danh.
 *     + Học sinh: Hiển thị thông báo xem lịch sử điểm danh.
 * ============================================================================
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import TeacherAttendance from "./Teacher/Attendance/TeacherAttendance";
import { useAuth } from "../context/AuthContext.tsx";
import { BackButton } from "../components/ui/Buttons/BackButton";

export default function Attendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || "TEACHER";

  if (userRole === "STUDENT") {
    // Nếu là học sinh, có thể chuyển sang trang tổng quan điểm danh hoặc redirect
    // Tạm thời trả về 1 component cơ bản, hoặc render luôn thông báo
    return (
      <div style={{ padding: 24 }}>
        <div className="mb-4">
          <BackButton onClick={() => navigate("/classrooms")}>
            Quay lại danh sách lớp
          </BackButton>
        </div>
        <h2>Điểm danh</h2>
        <p>Tính năng xem điểm danh chi tiết của học sinh đang được phát triển.</p>
      </div>
    );
  }

  return <TeacherAttendance />;
}
