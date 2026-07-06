import React, { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Chalkboard, ChartBar, CalendarBlank, FileText, Users, CheckSquare, ClipboardText, List, CaretLeft } from "phosphor-react";
import styles from "./Header.module.scss";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userRole = user?.role || "teacher";
  const isStudentsPage = location.pathname.includes("/students");
  const isAttendancePage = location.pathname.includes("/attendance");
  const isGradebookPage = location.pathname.includes("/gradebook");
  
  const isOtherPage = isStudentsPage || isAttendancePage || isGradebookPage;
  const activeTab = isOtherPage ? "" : (searchParams.get("tab") || "overview");

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
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      {/* Các Tab điều hướng trong lớp học */}
      <div className={styles.navMenu}>
        <span className={styles.brandLabel}>Menu lớp học</span>
        <button
          className={`${styles.menuItem} ${activeTab === "overview" ? styles.active : ""}`}
          onClick={() => handleTabClick("overview")}
          title={isCollapsed ? "Tổng quan" : undefined}
        >
          <Chalkboard size={20} weight={activeTab === "overview" ? "fill" : "regular"} />
          <span className={styles.menuText}>Tổng quan</span>
        </button>


        {userRole === "teacher" && (
          <>
            <button
              className={`${styles.menuItem} ${activeTab === "quizzes" ? styles.active : ""}`}
              onClick={() => handleTabClick("quizzes")}
              title={isCollapsed ? "Trắc nghiệm" : undefined}
            >
              <FileText size={20} weight={activeTab === "quizzes" ? "fill" : "regular"} />
              <span className={styles.menuText}>Trắc nghiệm</span>
            </button>
            <button
              className={`${styles.menuItem} ${isStudentsPage ? styles.active : ""}`}
              onClick={() => navigate(`/classrooms/${classId}/students`)}
              title={isCollapsed ? "Học sinh" : undefined}
            >
              <Users size={20} weight={isStudentsPage ? "fill" : "regular"} />
              <span className={styles.menuText}>Học sinh</span>
            </button>
            <button
              className={`${styles.menuItem} ${location.pathname.includes("/attendance") ? styles.active : ""}`}
              onClick={() => navigate(`/attendance?classId=${classId}`)}
              title={isCollapsed ? "Điểm danh" : undefined}
            >
              <CheckSquare size={20} weight={location.pathname.includes("/attendance") ? "fill" : "regular"} />
              <span className={styles.menuText}>Điểm danh</span>
            </button>
            <button
              className={`${styles.menuItem} ${location.pathname.includes("/gradebook") ? styles.active : ""}`}
              onClick={() => navigate(`/gradebook?classId=${classId}`)}
              title={isCollapsed ? "Sổ điểm" : undefined}
            >
              <ClipboardText size={20} weight={location.pathname.includes("/gradebook") ? "fill" : "regular"} />
              <span className={styles.menuText}>Sổ điểm</span>
            </button>
          </>
        )}
      </div>

      {/* Footer Toggle Button */}
      <div className={styles.sidebarFooter}>
        <button className={styles.toggleBtn} onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <List size={20} /> : (
            <>
              <CaretLeft size={20} />
              <span className={styles.menuText}>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Header;
