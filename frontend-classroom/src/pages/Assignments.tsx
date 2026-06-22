import StudentAssignments from "./Student/Assignments/StudentAssignments";
import TeacherAssignments from "./Teacher/Assignments/TeacherAssignments";
import { useAuth } from "../context/AuthContext.tsx";

export default function Assignments() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || "TEACHER";

  if (userRole === "STUDENT") {
    return <StudentAssignments />;
  }

  return <TeacherAssignments />;
}
