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
