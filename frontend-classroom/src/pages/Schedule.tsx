/**
 * ============================================================================
 * TÊN FILE: Schedule.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/pages/Schedule.tsx
 * MỤC ĐÍCH:
 *   Component Thời Khóa Biểu Giảng Dạy & Lịch Học (Schedule Wrapper Component).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Render `TeacherSchedule` hiển thị lịch dạy hàng tuần và tiến độ bài học.
 * ============================================================================
 */

import React from "react";
import TeacherSchedule from "./Teacher/Schedule/TeacherSchedule";

export default function Schedule() {
  return <TeacherSchedule />;
}
