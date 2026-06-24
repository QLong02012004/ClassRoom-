import React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
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
  const classId = classIdMatch ? classIdMatch[1] : null;

  const handleTabClick = (tabName: string) => {
    if (classId) {
      navigate(`/classrooms/${classId}?tab=${tabName}`);
    }
  };

  // Nếu không ở trong trang chi tiết lớp học, không cần hiển thị Header này nữa
  // vì tính năng điều hướng chính đã chuyển lên Navbar
  if (!classId) return null;

  return (
    <div className={styles.header}>
      {/* Các Tab điều hướng trong lớp học */}
      <div className={styles.navTabs}>
        <span className={styles.brandLabel}>Chi tiết lớp học</span>
        <button
          className={`${styles.tabItem} ${activeTab === "overview" ? styles.active : ""}`}
          onClick={() => handleTabClick("overview")}
        >
          Tổng quan
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === "reports" ? styles.active : ""}`}
          onClick={() => handleTabClick("reports")}
        >
          Báo cáo
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === "schedule" ? styles.active : ""}`}
          onClick={() => handleTabClick("schedule")}
        >
          Lịch trình
        </button>
        {userRole === "teacher" && (
          <>
            <button
              className={`${styles.tabItem} ${activeTab === "quizzes" ? styles.active : ""}`}
              onClick={() => handleTabClick("quizzes")}
            >
              Trắc nghiệm
            </button>
            <button
              className={`${styles.tabItem} ${isStudentsPage ? styles.active : ""}`}
              onClick={() => navigate(`/classrooms/${classId}/students`)}
            >
              Học sinh
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
