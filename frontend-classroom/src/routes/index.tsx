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
import AdminSettings from "../pages/Admin/Settings/AdminSettings";
import AdminClassrooms from "../pages/Admin/Classrooms/AdminClassrooms";
import MainLayout from "../components/Layout/MainLayout.tsx";
import ProtectedRoute from "../components/Layout/ProtectedRoute.tsx";
import Gradebook from "../pages/Gradebook";
import Attendance from "../pages/Attendance";
import Schedule from "../pages/Schedule";
import { useAuth } from "../context/AuthContext";

// Redirect về trang phù hợp theo role
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/users" replace />;
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

