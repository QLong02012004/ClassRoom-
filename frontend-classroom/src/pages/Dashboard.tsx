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
