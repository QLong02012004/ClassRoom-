import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { authService } from "../../../service/auth.service.ts";
import { motion } from 'framer-motion';
import AuthBanner from "../components/AuthBanner";
import AuthForm from "../../../components/ui/AuthForm/AuthForm";
import styles from "./Login.module.scss";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (data: any) => {
    setLoading(true);

    try {
      // Gọi API đăng nhập thật
      const response = await authService.login(data.email, data.password);

      // Thành công, lấy accessToken và thông tin user từ response.data
      if (!response.data) throw new Error("Phản hồi từ server không hợp lệ!");
      const { accessToken, user } = response.data;

      // Lưu vào Context
      login(accessToken, user);

      toast.success(response.message || "Đăng nhập thành công!", 3000);

      // Redirect theo role
      if (user.role === 'admin') {
        navigate("/admin/dashboard");
      } else if (user.role === 'teacher') {
        navigate("/classrooms");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) { console.log('CATCH BLOCK REACHED', err);
      toast.error(err.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại thông tin!");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: any) => {
    setLoading(true);

    try {
      // Gọi API đăng ký
      await authService.registerStudent({
        name: data.name,
        email: data.email,
        password: data.password
      });

      toast.success("Đăng ký thành công! Đang tự động đăng nhập...", 3000);
      
      // Đăng nhập tự động sau khi đăng ký
      await handleLogin({ email: data.email, password: data.password });
    } catch (err: any) {
      toast.error(err.message || "Đăng ký thất bại, vui lòng thử lại!");
      setLoading(false); // Only stop loading if it fails, otherwise let handleLogin finish it
    }
  };

  return (
    <main className={styles.authMain}>
      <div className={styles.authContainer}>
        {/* Cánh trái: Đã được tách thành component riêng để tái sử dụng */}
        <AuthBanner />

        {/* Cánh phải: Form Đăng nhập/Đăng ký */}
        <motion.div 
          className={styles.authRight}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <AuthForm 
            onLogin={handleLogin}
            onRegister={handleRegister}
            isLoading={loading}
            initialMode={location.pathname === "/register" ? "register" : "login"}
          />
        </motion.div>
      </div>
    </main>
  );
};

export default Login;

