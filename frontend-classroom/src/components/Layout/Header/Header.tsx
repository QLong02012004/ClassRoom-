import React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Chalkboard, ChartBar, CalendarBlank, FileText, Users, CheckSquare, ClipboardText } from "phosphor-react";
import styles from "./Header.module.scss";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const userRole = user?.role || "teacher";
  const isStudentsPage = location.pathname.includes("/students");
  const activeTab = isStudentsPage ? "" : (searchParams.get("tab") || "overview");

  // Trích xuất classId từ URL
  const classIdMatch = location.pathname.match(/^\/classrooms\/([^/]+)/);
  const classId = classIdMatch ? classIdMatch[1] : searchParams.get("classId");

  const handleTabClick = (tabName: string) => {
    if (classId) {
      navigate(`/classrooms/${classId}?tab=${tabName}`);
    }
  };

  // Nếu không ở trong trang chi tiết lớp học, không cần hiển thị Header này nữa
  // vì tính năng điều hướng chính đã chuyển lên Navbar
  if (!classId) return null;

  return (
    <div className={styles.sidebar}>
      {/* Các Tab điều hướng trong lớp học */}
      <div className={styles.navMenu}>
        <span className={styles.brandLabel}>Menu lớp học</span>
        <button
          className={`${styles.menuItem} ${activeTab === "overview" ? styles.active : ""}`}
          onClick={() => handleTabClick("overview")}
        >
          <Chalkboard size={20} weight={activeTab === "overview" ? "fill" : "regular"} />
          Tổng quan
        </button>

        <button
          className={`${styles.menuItem} ${activeTab === "schedule" ? styles.active : ""}`}
          onClick={() => handleTabClick("schedule")}
        >
          <CalendarBlank size={20} weight={activeTab === "schedule" ? "fill" : "regular"} />
          Lịch trình
        </button>
        {userRole === "teacher" && (
          <>
            <button
              className={`${styles.menuItem} ${activeTab === "quizzes" ? styles.active : ""}`}
              onClick={() => handleTabClick("quizzes")}
            >
              <FileText size={20} weight={activeTab === "quizzes" ? "fill" : "regular"} />
              Trắc nghiệm
            </button>
            <button
              className={`${styles.menuItem} ${isStudentsPage ? styles.active : ""}`}
              onClick={() => navigate(`/classrooms/${classId}/students`)}
            >
              <Users size={20} weight={isStudentsPage ? "fill" : "regular"} />
              Học sinh
            </button>
            <button
              className={`${styles.menuItem} ${location.pathname.includes("/attendance") ? styles.active : ""}`}
              onClick={() => navigate(`/attendance?classId=${classId}`)}
            >
              <CheckSquare size={20} weight={location.pathname.includes("/attendance") ? "fill" : "regular"} />
              Điểm danh
            </button>
            <button
              className={`${styles.menuItem} ${location.pathname.includes("/gradebook") ? styles.active : ""}`}
              onClick={() => navigate(`/gradebook?classId=${classId}`)}
            >
              <ClipboardText size={20} weight={location.pathname.includes("/gradebook") ? "fill" : "regular"} />
              Sổ điểm
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
