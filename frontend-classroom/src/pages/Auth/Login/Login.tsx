import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Envelope, Lock, SignIn, Eye, EyeSlash } from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { authService } from "../../../service/auth.service.ts";
import AuthBanner from "../components/AuthBanner";
import styles from "./Login.module.scss";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, emailSet] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Gọi API đăng nhập thật
      const response = await authService.login(email, password);
      
      // Thành công, lấy accessToken và thông tin user từ response.data
      if (!response.data) throw new Error("Phản hồi từ server không hợp lệ!");
      const { accessToken, user } = response.data;
      
      // Lưu vào Context
      login(accessToken, user);
      
      toast.success(response.message || "Đăng nhập thành công!", 3000);

      // Redirect theo role
      if (user.role === 'admin') {
        navigate("/admin/users");
      } else if (user.role === 'teacher') {
        navigate("/classrooms");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại thông tin!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authMain}>
      <div className={styles.authContainer}>
        {/* Cánh trái: Đã được tách thành component riêng để tái sử dụng */}
        <AuthBanner />

        {/* Cánh phải: Form Đăng nhập/Đăng ký */}
        <div className={styles.authRight}>
          <div className={styles.formWrapper}>
            <div className={styles.formContainer}>
              <div className={styles.header}>
                <h2>Đăng nhập</h2>
                  <p>Nhập thông tin đăng nhập của bạn do Giáo viên hoặc Admin cung cấp</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="email">Địa chỉ Email</label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.inputIcon}><Envelope size={18} /></span>
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="student@classroom.com"
                        value={email}
                        onChange={(e) => emailSet(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className={styles.passwordGroupWrap}>
                    <div className={styles.labelRow}>
                      <label htmlFor="password">Mật khẩu</label>
                      <a href="#" className={styles.forgotPass}>Quên mật khẩu?</a>
                    </div>
                    <div className={styles.inputWrapper} style={{ position: 'relative' }}>
                      <span className={styles.inputIcon}><Lock size={18} /></span>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  <button type="submit" className={styles.btnSubmit} disabled={loading}>
                    {loading ? (
                      <span className={styles.spinner} />
                    ) : (
                      <>
                        <SignIn size={18} weight="bold" />
                        Đăng nhập ngay
                      </>
                    )}
                  </button>
                </form>

                <div className={styles.footer}>
                  Bạn chưa có tài khoản?{" "}
                  <span className={styles.forgotPass} style={{ cursor: "pointer", color: "#64748b" }}>
                    Vui lòng liên hệ Giáo viên
                  </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
