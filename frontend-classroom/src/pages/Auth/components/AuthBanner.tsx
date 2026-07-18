import React from 'react';
import { CalendarCheck, GraduationCap, Notebook, ShieldCheck, UsersThree, Student } from 'phosphor-react';
import { motion } from 'framer-motion';
import styles from '../Login/Login.module.scss';

interface AuthBannerProps {
  mode?: 'login' | 'register';
}

const AuthBanner: React.FC<AuthBannerProps> = ({ mode = 'login' }) => {
  const isRegister = mode === 'register';

  return (
    <motion.div 
      className={styles.authLeft}
      initial={{ opacity: 0, x: isRegister ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className={styles.leftContentBox}>
        <div className={styles.logo}>
          <span>
            Classroom<span className={styles.accentText}>Manager</span>
          </span>
        </div>
        
        <div className={styles.fadeContainer}>
          <h1 className={styles.gradientText}>
            {isRegister ? (
              <>Bắt đầu hành trình <br /> Học tập mới.</>
            ) : (
              <>Hệ thống Quản lý <br /> Lớp học.</>
            )}
          </h1>
          <p className={styles.description}>
            {isRegister 
              ? "Tạo tài khoản miễn phí để tham gia các lớp học, nộp bài tập đúng hạn và theo dõi kết quả học tập của bản thân."
              : "Kênh liên lạc học tập, điểm danh chuyên cần, giao nộp bài tập và tra cứu điểm số giữa Giáo viên và Học sinh."}
          </p>
          <ul className={styles.authFeatures}>
            {isRegister ? (
              <>
                <li>
                  <div className={styles.featureIcon}><Student weight="duotone" /></div>
                  <span>Tham gia lớp học dễ dàng qua mã Code</span>
                </li>
                <li>
                  <div className={styles.featureIcon}><UsersThree weight="duotone" /></div>
                  <span>Tương tác và kết nối với Giáo viên</span>
                </li>
                <li>
                  <div className={styles.featureIcon}><ShieldCheck weight="duotone" /></div>
                  <span>Bảo mật thông tin và lịch sử học tập</span>
                </li>
              </>
            ) : (
              <>
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
              </>
            )}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthBanner;
