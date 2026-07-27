import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  Bell,
  Globe,
  User,
  CaretDown,
  SignOut,
  Chalkboard,
  ClipboardText,
  Users,
  CheckSquare,
  ChartBar
} from "phosphor-react";
import styles from "./TopHeader.module.scss";

const TopHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Trích xuất classId hiện tại từ URL
  const parts = location.pathname.split("/");
  let currentClassId = searchParams.get("classId");
  if (parts[1] === "classrooms" && parts[2] && parts[2] !== "students") {
    currentClassId = parts[2];
  }

  const activeTab = searchParams.get("tab") || "overview";
  const isStudentsPage = location.pathname.includes("/students");
  const isAttendancePage = location.pathname.includes("/attendance");
  const isGradebookPage = location.pathname.includes("/gradebook");
  const isClassroomRoute = location.pathname.startsWith("/classrooms/") || isAttendancePage || isGradebookPage;
  
  const isOverview = isClassroomRoute && !isStudentsPage && !isAttendancePage && !isGradebookPage && (activeTab === "overview" || !activeTab);
  const isActivities = isClassroomRoute && !isStudentsPage && !isAttendancePage && !isGradebookPage && (activeTab === "activities" || activeTab === "assignments" || activeTab === "quizzes");

  // Breadcrumbs mapping (hỗ trợ cả các route con)
  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Trang chủ";
    if (path.startsWith("/classrooms")) return "Lớp học";
    if (path.startsWith("/assignments")) return "Bài tập";
    if (path === "/materials") return "Tài liệu học tập";
    if (path.startsWith("/materials/")) return "Tài liệu học tập / Chi tiết";
    if (path.startsWith("/grades")) return "Bảng điểm";
    if (path.startsWith("/practice")) return "Luyện tập";
    if (path.startsWith("/bank")) return "Ngân hàng câu hỏi";
    if (path.startsWith("/schedule")) return "Lịch trình";
    if (path.startsWith("/attendance")) return "Chuyên cần";
    if (path.startsWith("/profile")) return "Hồ sơ cá nhân";
    if (path.startsWith("/chat")) return "Trợ lý học tập";
    if (path.startsWith("/admin/users")) return "Quản lý người dùng";
    if (path.startsWith("/admin/classrooms")) return "Quản lý lớp học";
    if (path.startsWith("/admin/settings")) return "Cài đặt";
    return "Trang chủ";
  };

  const currentPathName = getPageTitle(location.pathname);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogOut = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    await logout();
    navigate("/login");
  };

  return (
    <header className={styles.topHeader}>
      <div className={styles.leftSection}>
        <span className={styles.brandName}>ClassRoom</span>
        <span className={styles.divider}>/</span>
        <span className={styles.pageTitle}>{currentPathName}</span>
      </div>

      <div className={styles.rightSection}>
        {/* Cụm menu ngang vị trí Top Header khi ở trong Lớp Học (gần Chuông thông báo) */}
        {currentClassId && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 mr-2">
            <button
              type="button"
              onClick={() => navigate(`/classrooms/${currentClassId}?tab=overview`)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isOverview ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Chalkboard size={14} weight="bold" />
              <span>Tổng quan</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/classrooms/${currentClassId}?tab=activities`)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isActivities ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <ClipboardText size={14} weight="bold" />
              <span>Bài tập & Bài thi</span>
            </button>
            {(user?.role === "teacher" || user?.role === "admin") && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/classrooms/${currentClassId}/students`)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isStudentsPage ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <Users size={14} weight="bold" />
                  <span>Học sinh</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/attendance?classId=${currentClassId}`)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isAttendancePage ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <CheckSquare size={14} weight="bold" />
                  <span>Điểm danh</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/gradebook?classId=${currentClassId}`)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isGradebookPage ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <ChartBar size={14} weight="bold" />
                  <span>Sổ điểm</span>
                </button>
              </>
            )}
          </nav>
        )}

        {/* Notifications */}
        <button className={`${styles.iconBtn} tour-step-notifications`}>
          <Bell size={20} />
          <span className={styles.notifDot}></span>
        </button>

        {/* Language */}
        <div className={`${styles.languageSelect} tour-step-language`}>
          <Globe size={20} />
          <span>VN</span>
        </div>

        {/* User Profile */}
        <div className={styles.profileDropdown} ref={profileRef}>
          <button
            className={`${styles.profileBtn} tour-step-profile`}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <User size={20} />
            <CaretDown size={14} weight="bold" />
          </button>

          {isProfileOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <p className={styles.userName}>{user?.name || "Người dùng"}</p>
                <p className={styles.userRole}>{user?.role || "Học sinh"}</p>
              </div>
              <Link to="/profile" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                <User size={16} /> Hồ sơ cá nhân
              </Link>
              <button className={styles.dropdownItemLogout} onClick={handleLogOut}>
                <SignOut size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
