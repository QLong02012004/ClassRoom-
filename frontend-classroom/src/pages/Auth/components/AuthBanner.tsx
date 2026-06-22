import React from 'react';
import { CalendarCheck, GraduationCap, Notebook } from 'phosphor-react';
import styles from '../Login/Login.module.scss'; // Tạm thời dùng chung style với Login

const AuthBanner: React.FC = () => {
  return (
    <div className={styles.authLeft}>
      <div className={styles.leftContentBox}>
        <div className={styles.logo}>
          <span>
            Classroom<span className={styles.accentText}>Manager</span>
          </span>
        </div>
        
        <div className={styles.fadeContainer}>
          <h1 className={styles.gradientText}>Hệ thống Quản lý <br /> Lớp học.</h1>
          <p className={styles.description}>
            Kênh liên lạc học tập, điểm danh chuyên cần, giao nộp bài tập và tra cứu điểm số giữa Giáo viên và Học sinh.
          </p>
          <ul className={styles.authFeatures}>
            <li>
              <div className={styles.featureIcon}><CalendarCheck weight="duotone" /></div>
              <span>Xem lịch sử điểm danh chuyên cần hàng tuần</span>
            </li>
            <li>
              <div className={styles.featureIcon}><GraduationCap weight="duotone" /></div>
              <span>Tra cứu điểm số & nhận xét của giáo viên</span>
            </li>
            <li>
              <div className={styles.featureIcon}><Notebook weight="duotone" /></div>
              <span>Theo dõi bài tập & thông báo lớp học thêm</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthBanner;
