/**
 * ============================================================================
 * TÊN FILE: index.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/routes/index.tsx
 * MỤC ĐÍCH:
 *   Cấu hình Hệ thống Định tuyến Client (React Router v6 - Data Router API).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Định nghĩa tất cả các routes: `/login`, `/dashboard`, `/classrooms`, `/gradebook`, `/bank`, `/admin/*`, `/practice`, `/materials`, `/chat`.
 *   - Phân tuyến thông minh theo vai trò: `RoleRedirect` (định hướng trang chủ thích hợp cho Admin/Teacher/Student), `ClassroomDetailRouter` (hiển thị trang chi tiết theo vai trò).
 *   - Bảo mật theo từng cấp độ: `ProtectedRoute`, `AdminRoute`, `TeacherOrAdminRoute`.
 * ============================================================================
 */

import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Auth/Login/Login";
import Dashboard from "../pages/Dashboard";
import Classrooms from "../pages/Classrooms";
import Assignments from "../pages/Assignments";
import AssignmentDetail from "../pages/Student/Assignments/AssignmentDetail";
import TakeExam from "../pages/Student/Exams/TakeExam";
import AdminUsers from "../pages/Admin/Users/AdminUsers";
import TeacherStudents from "../pages/Teacher/Students/TeacherStudents";
import StudentResults from "../pages/Student/Results/StudentResults";
import StudentProfile from "../pages/Student/Profile/StudentProfile";
import TeacherClassroomDetail from "../pages/Teacher/ClassroomDetail/TeacherClassroomDetail";
import StudentClassroomDetail from "../pages/Student/Classrooms/StudentClassroomDetail";
import StudentGrades from "../pages/Student/Grades/StudentGrades";
import BankList from "../pages/Teacher/Bank/BankList";
import AdminSettings from "../pages/Admin/Settings/AdminSettings";
import AdminClassrooms from "../pages/Admin/Classrooms/AdminClassrooms";
import AdminDashboard from "../pages/Admin/Dashboard/AdminDashboard";
import MainLayout from "../components/Layout/MainLayout.tsx";
import ProtectedRoute, { AdminRoute, TeacherOrAdminRoute } from "../components/Layout/ProtectedRoute.tsx";
import Gradebook from "../pages/Gradebook";
import Attendance from "../pages/Attendance";
import Schedule from "../pages/Schedule";
import Practice from "../pages/Student/Practice/Practice";
import StudentMaterials from "../pages/Student/Materials/StudentMaterials";
import StudentMaterialDetail from "../pages/Student/Materials/StudentMaterialDetail";
import AdminMaterials from "../pages/Admin/Materials/AdminMaterials";
import StudentAssistant from "../pages/Student/Chat/StudentAssistant";
import { useAuth } from "../context/AuthContext";

function MaterialsRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminMaterials />;
  return <StudentMaterials />;
}

// Redirect về trang phù hợp theo role
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/classrooms" replace />;
  if (user.role === 'student') return <Navigate to="/classrooms" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Render trang chi tiết lớp theo role
function ClassroomDetailRouter() {
  const { user } = useAuth();
  if (user?.role === 'teacher' || user?.role === 'admin') return <TeacherClassroomDetail />;
  return <StudentClassroomDetail />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Login />,
  },
  {
    // Cần phải đăng nhập mới được vào các trang bên trong
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <RoleRedirect />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "classrooms",
            element: <Classrooms />,
          },
          {
            path: "classrooms/:id",
            element: <ClassroomDetailRouter />,
          },
          {
            element: <TeacherOrAdminRoute />,
            children: [
              {
                path: "bank",
                element: <BankList />,
              },
            ],
          },
          {
            path: "assignments",
            element: <Assignments />,
          },
          {
            path: "assignments/:id",
            element: <AssignmentDetail />,
          },
          {
            path: "exams/:id",
            element: <TakeExam />,
          },
          {
            path: "gradebook",
            element: <Gradebook />,
          },
          {
            path: "profile",
            element: <StudentProfile />,
          },
          {
            path: "grades",
            element: <StudentGrades />,
          },
          {
            element: <AdminRoute />,
            children: [
              {
                path: "admin/dashboard",
                element: <AdminDashboard />,
              },
              {
                path: "admin/users",
                element: <AdminUsers />,
              },
              {
                path: "admin/classrooms",
                element: <AdminClassrooms />,
              },
              {
                path: "admin/settings",
                element: <AdminSettings />,
              },
            ],
          },
          {
            path: "classrooms/:id/students",
            element: <TeacherStudents />,
          },
          {
            path: "attendance",
            element: <Attendance />,
          },
          {
            path: "schedule",
            element: <Schedule />,
          },
          {
            path: "practice",
            element: <Practice />,
          },
          {
            path: "materials",
            element: <MaterialsRouter />,
          },
          {
            path: "materials/:id",
            element: <StudentMaterialDetail />,
          },
          {
            path: "chat",
            element: <StudentAssistant />,
          },
          // Các trang con khác sẽ thêm ở đây
        ],
      },
    ],
  },
  {
    // Nếu truy cập vào đường dẫn không tồn tại, tự động chuyển hướng về trang đăng nhập
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

