import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Envelope } from "phosphor-react";
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

  // OTP Verification Modal State
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (showOTP && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOTP, countdown]);

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const lastChar = cleanVal ? cleanVal.slice(-1) : '';

    setOtpDigits(prev => {
      const updated = [...prev];
      updated[index] = lastChar;
      setOtpCode(updated.join(''));
      return updated;
    });

    if (lastChar && index < 5) {
      setTimeout(() => {
        otpInputRefs.current[index + 1]?.focus();
        otpInputRefs.current[index + 1]?.select();
      }, 10);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        e.preventDefault();
        setOtpDigits(prev => {
          const updated = [...prev];
          updated[index - 1] = '';
          setOtpCode(updated.join(''));
          return updated;
        });
        setTimeout(() => {
          otpInputRefs.current[index - 1]?.focus();
          otpInputRefs.current[index - 1]?.select();
        }, 10);
      }
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = Array(6).fill('');
      pasted.split('').forEach((char, i) => {
        newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      setOtpCode(newDigits.join(''));
      const targetFocus = Math.min(pasted.length - 1, 5);
      otpInputRefs.current[targetFocus]?.focus();
    }
  };

  const resetOtpDigits = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setOtpCode('');
  };

  const handleLogin = async (data: any) => {
    setLoading(true);

    try {
      const response = await authService.login(data.email, data.password);

      if (!response.data) throw new Error("Phản hồi từ server không hợp lệ!");
      const { accessToken, user } = response.data;

      login(accessToken, user);

      toast.success(response.message || "Đăng nhập thành công!", 3000);

      if (user.role === 'admin') {
        navigate("/admin/dashboard");
      } else if (user.role === 'teacher') {
        navigate("/classrooms");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg = err.message || "";
      toast.error(msg || "Đã xảy ra lỗi, vui lòng kiểm tra lại thông tin!");

      // Nếu tài khoản chưa xác thực Email -> Bật Modal OTP ngay tại màn hình Login!
      if (msg.includes("chưa được xác thực Email") || msg.includes("OTP")) {
        setRegisteredEmail(data.email);
        resetOtpDigits();
        setShowOTP(true);
        setCountdown(30);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: any) => {
    setLoading(true);

    try {
      if (data.role === 'teacher') {
        await authService.registerTeacher({
          name: data.name,
          email: data.email,
          password: data.password,
          subject: data.subject
        });
      } else {
        await authService.registerStudent({
          name: data.name,
          email: data.email,
          password: data.password
        });
      }

      setRegisteredEmail(data.email);
      resetOtpDigits();
      setShowOTP(true);
      setCountdown(30);
      toast.success("Vui lòng kiểm tra email để nhận mã OTP!");
    } catch (err: any) {
      toast.error(err.message || "Đăng ký thất bại, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số OTP!");
      return;
    }
    try {
      setOtpLoading(true);
      const res = await authService.verifyEmail({ email: registeredEmail, otp: otpCode });
      toast.success(res?.message || "Xác thực email thành công! Bạn có thể đăng nhập ngay.", 4000);
      setShowOTP(false);
      resetOtpDigits();
    } catch (err: any) {
      toast.error(err.message || "Xác thực thất bại!");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    try {
      setOtpLoading(true);
      await authService.resendOTP({ email: registeredEmail });
      toast.success("Mã OTP mới đã được gửi tới email của bạn!");
      setCountdown(30);
      resetOtpDigits();
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.message || "Lỗi gửi lại mã OTP!");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleLogin = async (data: { credential: string; role?: string; subject?: string }) => {
    setLoading(true);
    try {
      const response = await authService.loginWithGoogle(data);

      if (response?.isPending) {
        toast.success(response.message || "Đăng ký Giáo viên qua Google thành công! Vui lòng chờ BGH phê duyệt.", 5000);
        setLoading(false);
        return;
      }

      if (!response.data) throw new Error("Xác thực Google thất bại!");
      const { accessToken, user } = response.data;

      login(accessToken, user);
      toast.success(response.message || `Chào mừng ${user.name} trở lại!`, 3000);

      if (user.role === 'admin') {
        navigate("/admin/dashboard");
      } else if (user.role === 'teacher') {
        navigate("/classrooms");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Xác thực Google thất bại, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className={styles.authMain}>
        <div className={styles.authContainer}>
          <AuthBanner />

          <motion.div
            className={styles.authRight}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <AuthForm
              onLogin={handleLogin}
              onRegister={handleRegister}
              onGoogleLogin={handleGoogleLogin}
              isLoading={loading}
              initialMode={location.pathname === "/register" ? "register" : "login"}
            />
          </motion.div>
        </div>
      </main>

      {showOTP && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
            className="animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Nút X Đóng Modal */}
            <button
              type="button"
              onClick={() => setShowOTP(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none z-10"
              title="Đóng"
            >
              ✕
            </button>

            {/* Header */}
            <div className="pt-8 px-6 pb-4 text-center">
              <div className="w-16 h-16 bg-orange-50 text-[#f47c20] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-inner">
                <Envelope size={36} weight="duotone" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Xác thực địa chỉ Email</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Mã xác nhận 6 chữ số đã được gửi đến email:<br />
                <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-xs inline-block mt-1 border border-slate-200/80">
                  {registeredEmail}
                </span>
              </p>
            </div>

            {/* Body */}
            <div className="px-6 pb-8 space-y-6">
              {/* 6 Ô nhập OTP */}
              <div className="flex items-center justify-center gap-2 pt-2" onPaste={handleDigitPaste}>
                {otpDigits.map((digit, idx) => (
                  <React.Fragment key={idx}>
                    <input
                      ref={(el) => { otpInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onFocus={(e) => e.target.select()}
                      className="w-12 h-14 text-center text-2xl font-black text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#f47c20] focus:ring-4 focus:ring-orange-500/15 outline-none transition-all shadow-xs"
                      disabled={otpLoading}
                      autoFocus={idx === 0}
                    />
                    {idx === 2 && <span className="text-slate-300 font-bold text-xl mx-0.5">-</span>}
                  </React.Fragment>
                ))}
              </div>

              <p className="text-xs text-slate-400 text-center">
                Vui lòng kiểm tra cả Hộp thư đến và thư mục Thư rác (Spam).
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otpCode.length !== 6}
                  className="w-full bg-gradient-to-r from-orange-500 to-[#f47c20] hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer text-base border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {otpLoading ? <span className={styles.spinner} /> : "Xác thực tài khoản"}
                </button>

                <div className="text-center pt-1">
                  <span className="text-xs text-slate-500">Chưa nhận được mã? </span>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || otpLoading}
                    className="text-xs font-bold text-[#f47c20] hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer bg-transparent border-none p-0 inline-block transition-colors"
                  >
                    {countdown > 0 ? `Gửi lại mã sau (${countdown}s)` : "Gửi lại mã ngay"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;

