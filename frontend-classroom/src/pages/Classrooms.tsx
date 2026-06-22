import StudentClassrooms from "./Student/Classrooms/StudentClassrooms.tsx";
import TeacherClassrooms from "./Teacher/Classrooms/TeacherClassrooms.tsx";
import { useAuth } from "../context/AuthContext.tsx";

export default function Classrooms() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || "TEACHER";

  if (userRole === "STUDENT") {
    return <StudentClassrooms />;
  }

  return <TeacherClassrooms />;
}
