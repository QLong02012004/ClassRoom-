import React from "react";
import TeacherAttendance from "./Teacher/Attendance/TeacherAttendance";
import { useAuth } from "../context/AuthContext.tsx";

export default function Attendance() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || "TEACHER";

  if (userRole === "STUDENT") {
    // Nếu là học sinh, có thể chuyển sang trang tổng quan điểm danh hoặc redirect
    // Tạm thời trả về 1 component cơ bản, hoặc render luôn thông báo
    return (
      <div style={{ padding: 24 }}>
        <h2>Điểm danh</h2>
        <p>Tính năng xem điểm danh chi tiết của học sinh đang được phát triển.</p>
      </div>
    );
  }

  return <TeacherAttendance />;
}
