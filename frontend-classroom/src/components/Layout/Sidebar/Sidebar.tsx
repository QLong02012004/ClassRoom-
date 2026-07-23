import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  House,
  GraduationCap,
  BookOpen,
  Headphones,
  Trophy,
  Microphone,
  Pencil,
  Bookmark,
  ChatCircle,
  Lightning,
  Newspaper,
  Medal,
  Lightbulb,
  Notebook,
  ChartBar,
  Books,
  Sparkle
} from "phosphor-react";
import styles from "./Sidebar.module.scss";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const userRole = user?.role || "student";
  const isActive = (path: string) => location.pathname === path;

  const getNavLinks = (role: string) => {
    const baseLinks = [
      { name: "Trang chủ", path: "/dashboard", icon: House, tourClass: "tour-step-dashboard" },
      { name: "Lớp học", path: "/classrooms", icon: GraduationCap, tourClass: "tour-step-classrooms" },
    ];

    if (role === "student") {
      return [
        ...baseLinks,
        { name: "Bài tập", path: "/assignments", icon: Notebook, tourClass: "tour-step-assignments" },
        { name: "Bảng điểm", path: "/grades", icon: ChartBar, tourClass: "tour-step-grades" },
        { name: "Tài liệu", path: "/materials", icon: Books, tourClass: "tour-step-materials" },
        { name: "Trợ lý học tập", path: "/chat", icon: Sparkle, tourClass: "tour-step-chat" },
      ];
    } else if (role === "teacher") {
      return [
        ...baseLinks,
        { name: "Lịch dạy", path: "/schedule", icon: BookOpen },
        { name: "Ngân hàng", path: "/bank", icon: Bookmark },
      ];
    } else if (role === "admin") {
      return [
        ...baseLinks,
        { name: "Người dùng", path: "/admin/users", icon: BookOpen },
        { name: "Quản lý Lớp", path: "/admin/classrooms", icon: GraduationCap },
      ];
    }
    return baseLinks;
  };

  const navLinks = getNavLinks(userRole);

  return (
    <aside
      className={`${styles.sidebar} ${isHovered ? styles.expanded : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          {/* Thay thế bằng Logo SVG/Image thật nếu có */}
          <span className="text-2xl">🐧</span>
        </div>
        <span className={styles.logoText}>ClassRoom</span>
      </div>

      <div className={styles.navContainer}>
        {navLinks.map((link) => {
          const active = isActive(link.path);
          const IconComponent = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`${styles.navItem} ${active ? styles.active : ''} ${(link as any).tourClass || ''}`}
            >
              <div className={styles.iconWrapper}>
                <IconComponent size={24} weight={active ? "fill" : "regular"} />
              </div>
              <span className={styles.navLabel}>{link.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
