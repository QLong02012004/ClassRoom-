import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  Bell,
  Lightning,
  Globe,
  User,
  CaretDown,
  SignOut
} from "phosphor-react";
import styles from "./TopHeader.module.scss";

const TopHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
