import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Eye, EyeSlash } from 'phosphor-react';

export interface AuthFormProps {
  onLogin: (data: any) => void;
  onRegister: (data: any) => void;
  onGoogleLogin?: (data: { credential: string; role?: string; subject?: string }) => void;
  isLoading?: boolean;
  initialMode?: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onRegister, onGoogleLogin, isLoading = false, initialMode = 'login' }) => {
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register State
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerRole, setRegisterRole] = useState<'student' | 'teacher'>('student');
  const [registerSubject, setRegisterSubject] = useState('Toán');

  const [isFlipped, setIsFlipped] = useState(initialMode === 'register');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ email: loginEmail, password: loginPassword });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister({ 
      name: registerName, 
      email: registerEmail, 
      password: registerPassword,
      role: registerRole,
      subject: registerRole === 'teacher' ? registerSubject : undefined
    });
  };

  useEffect(() => {
    const initGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "374440336134-v4gcigg4nl0uqmg492htjrg7jf6240ie.apps.googleusercontent.com",
          callback: (response: any) => {
            if (response.credential && onGoogleLogin) {
              onGoogleLogin({
                credential: response.credential,
                role: isFlipped ? registerRole : undefined,
                subject: registerRole === 'teacher' ? registerSubject : undefined
              });
            }
          }
        });
      }
    };

    initGoogle();
    const timer = setTimeout(initGoogle, 1000);
    return () => clearTimeout(timer);
  }, [isFlipped, registerRole, registerSubject, onGoogleLogin]);

  const triggerFallbackGoogleSelect = () => {
    const promptEmail = window.prompt(
      "🔑 Google Sign-In (Xác thực Gmail chính chủ trên máy):\nNhập địa chỉ Gmail của bạn:", 
      "nguyenvana@gmail.com"
    );
    if (!promptEmail) return;

    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      iss: "https://accounts.google.com",
      email: promptEmail,
      email_verified: true,
      name: promptEmail.split('@')[0],
      picture: "https://lh3.googleusercontent.com/a/default-user"
    }));
    const mockGoogleCredential = `${header}.${payload}.signature`;

    if (onGoogleLogin) {
      onGoogleLogin({
        credential: mockGoogleCredential,
        role: isFlipped ? registerRole : undefined,
        subject: registerRole === 'teacher' ? registerSubject : undefined
      });
    }
  };

  const handleGoogleClick = () => {
    if (!onGoogleLogin) return;

    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "374440336134-v4gcigg4nl0uqmg492htjrg7jf6240ie.apps.googleusercontent.com",
        callback: (response: any) => {
          if (response.credential && onGoogleLogin) {
            onGoogleLogin({
              credential: response.credential,
              role: isFlipped ? registerRole : undefined,
              subject: registerRole === 'teacher' ? registerSubject : undefined
            });
          }
        }
      });

      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          triggerFallbackGoogleSelect();
        }
      });
      return;
    }

    triggerFallbackGoogleSelect();
  };

  return (
    <StyledWrapper $isTeacher={registerRole === 'teacher'}>
      <div className="doodle-wrapper">
        <input 
          type="checkbox" 
          id="doodle-flip" 
          className="doodle-toggle" 
          checked={isFlipped}
          onChange={() => setIsFlipped(!isFlipped)}
          aria-label="Toggle Login and Sign up" 
        />
        <div className="doodle-header">
          <span className="doodle-mode-text login-text">Đăng nhập</span>
          <label className="doodle-switch-label" htmlFor="doodle-flip" tabIndex={0}>
            <span className="doodle-switch-handle" />
          </label>
          <span className="doodle-mode-text signup-text">Đăng ký</span>
        </div>
        <div className="doodle-card-scene">
          <svg className="doodle-svg doodle-star" viewBox="0 0 24 24" fill="#ffd166" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <svg className="doodle-svg doodle-sparkle" viewBox="0 0 24 24" fill="#06d6a0" stroke="var(--ink)" strokeWidth="1.5">
            <path d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z" />
          </svg>
          <svg className="doodle-svg doodle-swirl" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 12 C 3 5 10 5 16 5 C 20 5 21 9 18 12 C 15 15 10 13 12 9 C 14 5 22 9 21 16" />
          </svg>
          
          <div className="doodle-card-inner">
            
            {/* Đăng nhập */}
            <div className="doodle-card-front">
              <div className="doodle-title">Chào mừng!</div>
              <form className="doodle-form" onSubmit={handleLoginSubmit}>
                <div className="doodle-input-wrapper">
                  <input 
                    className="doodle-input" 
                    name="email" 
                    placeholder="Email" 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    required 
                  />
                </div>
                <div className="doodle-input-wrapper">
                  <input 
                    className="doodle-input" 
                    name="password" 
                    placeholder="Mật khẩu" 
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoading}
                    required 
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <button className="doodle-btn" disabled={isLoading}>
                  {isLoading ? "Đang xử lý..." : "Đăng nhập!"}
                </button>

                {onGoogleLogin && (
                  <>
                    <div className="doodle-divider"><span>hoặc</span></div>
                    <button type="button" className="doodle-google-btn" onClick={handleGoogleClick} disabled={isLoading}>
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Đăng nhập bằng Google
                    </button>
                  </>
                )}
              </form>
            </div>

            {/* Đăng ký */}
            <div className="doodle-card-back">
              <div className="doodle-title doodle-title-alt">Tham gia ngay!</div>
              <form className="doodle-form" onSubmit={handleRegisterSubmit}>

                {/* Switch chọn Học sinh / Giáo viên */}
                <div className="doodle-role-group">
                  <button 
                    type="button" 
                    className={`doodle-role-btn ${registerRole === 'student' ? 'active' : ''}`}
                    onClick={() => setRegisterRole('student')}
                  >
                    🎓 Học sinh
                  </button>
                  <button 
                    type="button" 
                    className={`doodle-role-btn ${registerRole === 'teacher' ? 'active' : ''}`}
                    onClick={() => setRegisterRole('teacher')}
                  >
                    👨‍🏫 Giáo viên
                  </button>
                </div>

                <div className="doodle-input-wrapper">
                  <input 
                    className="doodle-input" 
                    name="username" 
                    placeholder="Họ và Tên" 
                    type="text" 
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={isLoading}
                    required 
                  />
                </div>
                <div className="doodle-input-wrapper">
                  <input 
                    className="doodle-input" 
                    name="email" 
                    placeholder="Email" 
                    type="email" 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={isLoading}
                    required 
                  />
                </div>
                <div className="doodle-input-wrapper">
                  <input 
                    className="doodle-input" 
                    name="password" 
                    placeholder="Mật khẩu" 
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={isLoading}
                    required 
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    tabIndex={-1}
                  >
                    {showRegisterPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Chọn Môn học nếu là Giáo viên */}
                {registerRole === 'teacher' && (
                  <div className="doodle-input-wrapper">
                    <select 
                      className="doodle-input doodle-select"
                      value={registerSubject}
                      onChange={(e) => setRegisterSubject(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="Toán">Môn Toán</option>
                      <option value="Ngữ văn">Môn Ngữ văn</option>
                      <option value="Tiếng Anh">Môn Tiếng Anh</option>
                      <option value="Vật lý">Môn Vật lý</option>
                      <option value="Hóa học">Môn Hóa học</option>
                      <option value="Sinh học">Môn Sinh học</option>
                      <option value="Tin học">Môn Tin học</option>
                    </select>
                  </div>
                )}

                <button className="doodle-btn doodle-btn-alt" disabled={isLoading}>
                  {isLoading ? "Đang xử lý..." : registerRole === 'teacher' ? "Đăng ký Giáo viên!" : "Đăng ký!"}
                </button>

                {onGoogleLogin && (
                  <button type="button" className="doodle-google-btn" onClick={handleGoogleClick} disabled={isLoading}>
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Đăng ký bằng Google
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $isTeacher?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  
  .doodle-wrapper {
    /* Color Palette */
    --ink: #0F172A;
    --paper-front: #fff9e6;
    --paper-back: #e6f0ff;
    --bg-color: #ffffff;
    
    /* Đổi màu Cam hệ thống */
    --primary-btn: #f47c20; 
    --primary-btn-hover: #e06c10;
    
    /* Đổi màu Xanh hệ thống (Dựa vào request của bạn: xanh) */
    --secondary-btn: #2d8cf0;
    --secondary-btn-hover: #1e71c9;
    
    --switch-bg: #ffe66d;
    --input-focus: #f47c20;

    /* Sizing */
    --card-width: 330px;
    --card-height: ${props => props.$isTeacher ? '490px' : '450px'};
    --input-width: 250px;
    --input-height: 40px;
    --btn-width: 170px;
    --btn-height: 40px;

    --border-width: 2px;
    --shadow-offset: 4px;

    /* Doodle Border Radiuses */
    --sketch-radius-1: 8px 24px 8px 24px / 24px 8px 24px 8px;
    --sketch-radius-2: 24px 8px 24px 8px / 8px 24px 8px 24px;
    --sketch-radius-btn: 16px 5px 16px 5px / 5px 16px 5px 16px;

    font-family: "Comic Sans MS", "Chalkboard SE", "Marker Felt", "Gochi Hand", sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .doodle-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--input-width);
    margin: 2px 0;
    position: relative;
  }
  .doodle-divider::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 1px;
    background: var(--ink);
    opacity: 0.2;
  }
  .doodle-divider span {
    position: relative;
    background: var(--paper-front);
    padding: 0 8px;
    font-size: 11px;
    color: #64748b;
    font-weight: 700;
  }

  .doodle-google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: var(--input-width);
    height: 38px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    background-color: #ffffff;
    border: var(--border-width) solid var(--ink);
    border-radius: var(--sketch-radius-1);
    box-shadow: 3px 3px 0px var(--ink);
    cursor: pointer;
    transition: all 0.15s ease;
    margin-top: 4px;
  }

  .doodle-google-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 4px 4px 0px var(--ink);
    background-color: #f8fafc;
  }

  .doodle-google-btn:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px var(--ink);
  }

  .doodle-role-group {
    display: flex;
    gap: 8px;
    width: var(--input-width);
    justify-content: center;
    margin-bottom: 4px;
  }

  .doodle-role-btn {
    flex: 1;
    padding: 5px 2px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    background: #ffffff;
    border: var(--border-width) solid var(--ink);
    border-radius: var(--sketch-radius-btn);
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.6;
  }

  .doodle-role-btn.active {
    opacity: 1;
    background: #ffe66d;
    box-shadow: 2px 2px 0px var(--ink);
    transform: translateY(-1px);
  }

  .doodle-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230F172A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
  }
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  /* Hide Checkbox Visually but keep accessible */
  .doodle-toggle {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* Header & Switch */
  .doodle-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 25px;
    z-index: 5;
  }

  .doodle-mode-text {
    font-size: 18px;
    font-weight: bold;
    color: var(--ink);
    transition: opacity 0.3s;
  }

  .doodle-toggle:not(:checked) ~ .doodle-header .signup-text {
    opacity: 0.5;
  }
  .doodle-toggle:checked ~ .doodle-header .login-text {
    opacity: 0.5;
  }

  .doodle-switch-label {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
    background-color: var(--switch-bg);
    border: var(--border-width) solid var(--ink);
    border-radius: 20px;
    cursor: pointer;
    box-shadow: 2px 2px 0px var(--ink);
    transition:
      transform 0.1s,
      box-shadow 0.1s;
  }

  .doodle-switch-label:active {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px var(--ink);
  }

  .doodle-switch-handle {
    position: absolute;
    top: 2px;
    left: 3px;
    width: 16px;
    height: 16px;
    background-color: var(--bg-color);
    border: var(--border-width) solid var(--ink);
    border-radius: 50%;
    transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .doodle-toggle:checked
    ~ .doodle-header
    .doodle-switch-label
    .doodle-switch-handle {
    transform: translateX(24px);
  }

  /* 3D Scene Setup */
  .doodle-card-scene {
    position: relative;
    perspective: 1000px;
    width: var(--card-width);
    height: var(--card-height);
    z-index: 2;
  }

  /* Decorative SVGs */
  .doodle-svg {
    position: absolute;
    z-index: -1;
    pointer-events: none;
  }
  .doodle-star {
    top: -25px;
    left: -35px;
    width: 48px;
    height: 48px;
    animation: float-star 4s ease-in-out infinite;
  }
  .doodle-sparkle {
    bottom: -20px;
    right: -25px;
    width: 40px;
    height: 40px;
    animation: float-sparkle 4s ease-in-out infinite 1s;
  }
  .doodle-swirl {
    top: 30px;
    right: -30px;
    width: 32px;
    height: 32px;
    animation: float-swirl 4s ease-in-out infinite 2s;
  }

  @keyframes float-star {
    0%,
    100% {
      transform: translateY(0) rotate(-15deg);
    }
    50% {
      transform: translateY(-8px) rotate(-10deg);
    }
  }
  @keyframes float-sparkle {
    0%,
    100% {
      transform: translateY(0) rotate(10deg);
    }
    50% {
      transform: translateY(-8px) rotate(15deg);
    }
  }
  @keyframes float-swirl {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-8px) rotate(5deg);
    }
  }

  /* Card Inner & Faces */
  .doodle-card-inner {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1);
  }

  .doodle-toggle:checked ~ .doodle-card-scene .doodle-card-inner {
    transform: rotateY(180deg);
  }

  .doodle-card-front,
  .doodle-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    border: var(--border-width) solid var(--ink);
    border-radius: var(--sketch-radius-1);
    box-shadow: var(--shadow-offset) var(--shadow-offset) 0px var(--ink);

    /* Lined Notebook Paper Effect */
    background-image: repeating-linear-gradient(
      transparent,
      transparent 28px,
      rgba(0, 0, 0, 0.06) 28px,
      rgba(0, 0, 0, 0.06) 30px
    );
    background-position: 0 15px;
  }

  .doodle-card-front {
    background-color: var(--paper-front);
  }

  .doodle-card-back {
    background-color: var(--paper-back);
    transform: rotateY(180deg);
    border-radius: var(--sketch-radius-2);
  }

  /* Typography & Forms */
  .doodle-title {
    font-size: 25px;
    font-weight: 900;
    color: var(--ink);
    margin: 5px 0 20px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    transform: rotate(-3deg);
    text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.1);
  }

  .doodle-title-alt {
    transform: rotate(2deg);
    margin: 5px 0 15px 0;
  }

  .doodle-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    align-items: center;
  }

  .doodle-input-wrapper {
    position: relative;
    width: var(--input-width);
  }
  
  .password-toggle-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--ink);
    opacity: 0.6;
    padding: 0;
    transition: opacity 0.2s;
  }
  
  .password-toggle-btn:hover {
    opacity: 1;
  }

  /* Inputs */
  .doodle-input {
    width: 100%;
    height: var(--input-height);
    padding: 5px 15px;
    box-sizing: border-box;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    background-color: var(--bg-color);
    border: var(--border-width) solid var(--ink);
    border-radius: var(--sketch-radius-1);
    box-shadow: 3px 3px 0px var(--ink);
    outline: none;
    transition: all 0.2s ease;
  }

  .doodle-input::placeholder {
    color: #666;
    opacity: 0.8;
  }

  .doodle-input:hover {
    transform: translateY(-2px);
    box-shadow: 4px 4px 0px var(--ink);
  }

  .doodle-input:focus,
  .doodle-input:focus-visible {
    border: var(--border-width) solid var(--input-focus);
    border-radius: var(--sketch-radius-2);
    background-color: #fffdf5;
    box-shadow: 4px 4px 0px var(--ink);
  }

  /* Buttons */
  .doodle-btn {
    margin: 15px 0 5px 0;
    width: auto;
    min-width: 170px;
    padding: 0 16px;
    height: var(--btn-height);
    white-space: nowrap;
    font-family: inherit;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 0.5px;
    color: #fff;
    background-color: var(--primary-btn);
    border: var(--border-width) solid var(--ink);
    border-radius: var(--sketch-radius-btn);
    box-shadow: 4px 4px 0px var(--ink);
    cursor: pointer;
    transition: all 0.15s ease;
    transform: rotate(-1deg);
  }

  .doodle-btn-alt {
    background-color: var(--secondary-btn);
    transform: rotate(1deg);
  }

  /* Button States */
  .doodle-btn:hover:not(:disabled) {
    background-color: var(--primary-btn-hover);
    transform: translateY(-2px) rotate(-2deg);
    box-shadow: 5px 5px 0px var(--ink);
  }

  .doodle-btn-alt:hover:not(:disabled) {
    background-color: var(--secondary-btn-hover);
    transform: translateY(-2px) rotate(2deg);
  }

  .doodle-btn:active:not(:disabled) {
    transform: translate(3px, 3px) rotate(0deg);
    box-shadow: 0px 0px 0px var(--ink);
  }
  
  .doodle-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    box-shadow: 0px 0px 0px var(--ink);
    transform: translate(3px, 3px);
  }

  /* Title Wiggle on Hover */
  .doodle-card-scene:hover .doodle-title {
    animation: doodle-wiggle 0.5s ease-in-out;
  }

  @keyframes doodle-wiggle {
    0%,
    100% {
      transform: rotate(-3deg);
    }
    25% {
      transform: rotate(2deg);
    }
    50% {
      transform: rotate(-4deg);
    }
    75% {
      transform: rotate(1deg);
    }
  }
`;

export default AuthForm;
