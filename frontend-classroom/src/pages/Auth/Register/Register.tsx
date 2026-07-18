import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeSlash, Envelope, Lock, User, Phone, UserPlus } from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { authService } from "../../../service/auth.service.ts";
import { motion } from 'framer-motion';
import AuthBanner from "../components/AuthBanner";
import styles from "../Login/Login.module.scss";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    parentPhone: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu!");
      return;
    }

    try {
      setLoading(true);
      await authService.registerStudent(formData);
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Đăng ký thất bại, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authMain}>
      <div className={`${styles.authContainer} ${styles.reverse}`}>
        {/* Cánh trái: Banner */}
        <AuthBanner mode="register" />

        {/* Cánh phải: Form Đăng ký */}
        <motion.div 
          className={styles.authRight}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <div className={styles.formWrapper}>
            <div className={styles.formContainer}>
              <div className={styles.header}>
                <h2>Tạo tài khoản mới</h2>
                <p>Đăng ký để tham gia lớp học ngay hôm nay</p>
              </div>

              <form onSubmit={handleRegister} className={styles.form}>
                {/* Tên */}
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Họ và tên</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><User size={18} /></span>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Nguyễn Văn A"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className={styles.inputGroup}>
                  <label htmlFor="email">Địa chỉ Email</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><Envelope size={18} /></span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="example@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div className={styles.passwordGroupWrap}>
                  <div className={styles.labelRow}>
                    <label htmlFor="password">Mật khẩu</label>
                  </div>
                  <div className={styles.inputWrapper} style={{ position: 'relative' }}>
                    <span className={styles.inputIcon}><Lock size={18} /></span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#64748b',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* SĐT Phụ huynh */}
                <div className={styles.inputGroup}>
                  <label htmlFor="parentPhone">SĐT phụ huynh (Tùy chọn)</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><Phone size={18} /></span>
                    <input
                      type="text"
                      id="parentPhone"
                      name="parentPhone"
                      placeholder="0987654321"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.btnSubmit} disabled={loading}>
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : (
                    <>
                      <UserPlus size={18} weight="bold" />
                      Đăng ký ngay
                    </>
                  )}
                </button>
              </form>

              <div className={styles.footer}>
                Đã có tài khoản?{" "}
                <Link to="/login" className={styles.forgotPass} style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
                  Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default Register;
