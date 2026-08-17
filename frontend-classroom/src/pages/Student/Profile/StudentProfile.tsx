import React, { useState, useRef } from 'react';
import {
  PencilSimple,
  TrendUp,
  BookBookmark,
  Fire,
  CalendarCheck,
  User,
  Medal,
  CaretRight,
  CaretDown,
  Password,
  BellRinging,
  ShieldCheck,
  SignOut,
  CircleWavyCheck,
  Star,
  UsersThree,
  GraduationCap,
  IdentificationBadge,
  Eye,
  EyeSlash
} from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/Styles/ToastContext';
import { userService } from '../../../service/user.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { PrimaryButton } from "@/components/ui/Buttons/PrimaryButton";
import { SaveButton } from "@/components/ui/Buttons/SaveButton";
import { SecondaryButton } from "@/components/ui/Buttons/SecondaryButton";
import styles from './StudentProfile.module.scss';

const StudentProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const username = user?.name || "Người dùng";
  const email = user?.email || "Chưa cập nhật email";
  const avatar = (user?.avatar && user.avatar.trim() !== '')
    ? user.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FE6747&color=fff&bold=true`;

  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || '',
    degree: (user as any)?.degree || '',
    subject: (user as any)?.subject || '',
    bio: (user as any)?.bio || ''
  });

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Google password states
  const [showGooglePasswordDialog, setShowGooglePasswordDialog] = useState(false);
  const [googlePasswordStep, setGooglePasswordStep] = useState<'request' | 'verify'>('request');
  const [googlePasswordForm, setGooglePasswordForm] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [googleShowNewPassword, setGoogleShowNewPassword] = useState(false);
  const [googleShowConfirmPassword, setGoogleShowConfirmPassword] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      setFormData((prev) => ({ ...prev, avatar: base64String }));

      try {
        await userService.updateProfile({ avatar: base64String });
        toast.success('Đã cập nhật ảnh đại diện', 3000);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error: any) {
        toast.error(error.message || 'Lỗi tải ảnh lên');
      }
    };
    reader.readAsDataURL(file);
  };

  const capitalizeWords = (str: string) => {
    if (!str) return "";
    return str
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Xác thực thông tin đầu vào ở client
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error('Họ và tên không được để trống!');
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      toast.error('Họ và tên phải có độ dài từ 2 đến 50 ký tự!');
      return;
    }
    const nameRegex = /^[\p{L}\s]+$/u;
    if (!nameRegex.test(trimmedName)) {
      toast.error('Họ và tên không được chứa chữ số hoặc ký tự đặc biệt!');
      return;
    }

    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        toast.error('Số điện thoại không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09)!');
        return;
      }
    }

    if (formData.dob && formData.dob.trim() !== '') {
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobRegex.test(formData.dob.trim())) {
        toast.error('Ngày sinh không hợp lệ!');
        return;
      }

      const [yearStr] = formData.dob.trim().split('-');
      const year = parseInt(yearStr, 10);
      const currentYear = new Date().getFullYear();

      if (year < 1900 || year > currentYear) {
        toast.error(`Năm sinh không hợp lệ (phải từ 1900 đến ${currentYear})!`);
        return;
      }

      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate > today) {
        toast.error('Ngày sinh không được vượt quá ngày hiện tại!');
        return;
      }
    }

    if (formData.bio && formData.bio.length > 500) {
      toast.error('Giới thiệu bản thân không được vượt quá 500 ký tự!');
      return;
    }

    if (formData.degree && formData.degree.length > 100) {
      toast.error('Bằng cấp không được vượt quá 100 ký tự!');
      return;
    }

    setIsSubmitting(true);
    const formattedName = capitalizeWords(trimmedName);
    try {
      await userService.updateProfile({
        ...formData,
        name: formattedName
      });
      toast.success('Cập nhật hồ sơ thành công', 3000);
      setShowEdit(false);
      // Reload trang để AuthContext cập nhật lại (lấy thông tin mới)
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      toast.error('Mật khẩu mới phải chứa ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường, chữ số và ký tự đặc biệt!');
      return;
    }
    if (passwordForm.oldPassword === passwordForm.newPassword) {
      toast.error('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setIsChangingPassword(true);
    try {
      await userService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Đổi mật khẩu thành công', 3000);
      setShowPasswordDialog(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestGooglePasswordOtp = async () => {
    setIsSendingOtp(true);
    try {
      await userService.sendPasswordOTP();
      toast.success('Mã OTP xác thực đã được gửi về email của bạn!', 4000);
      setGooglePasswordStep('verify');
    } catch (error: any) {
      toast.error(error.message || 'Lỗi gửi mã OTP. Vui lòng thử lại!');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSetupGooglePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
    if (!passwordRegex.test(googlePasswordForm.newPassword)) {
      toast.error('Mật khẩu mới phải chứa ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường, chữ số và ký tự đặc biệt!');
      return;
    }
    if (googlePasswordForm.newPassword !== googlePasswordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (!googlePasswordForm.otp || googlePasswordForm.otp.trim().length !== 6) {
      toast.error('Vui lòng nhập đúng mã OTP 6 chữ số!');
      return;
    }

    setIsSettingPassword(true);
    try {
      await userService.setupGooglePassword({
        otp: googlePasswordForm.otp.trim(),
        newPassword: googlePasswordForm.newPassword
      });
      toast.success('Thiết lập mật khẩu thành công! Bạn có thể đăng nhập bằng cả email & mật khẩu từ bây giờ.', 5000);
      setShowGooglePasswordDialog(false);
      setGooglePasswordForm({ otp: '', newPassword: '', confirmPassword: '' });
      setGooglePasswordStep('request');

      // Reload profile to refresh user settings
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi thiết lập mật khẩu!');
    } finally {
      setIsSettingPassword(false);
    }
  };

  return (
    <div className={styles.profileContainer}>
      {/* Header */}
      <div className={styles.profileHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.avatarWrapper}>
            <img
              src={avatar}
              alt="Avatar"
              onError={(e) => {
                const target = e.currentTarget;
                const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FE6747&color=fff&bold=true`;
                if (target.src !== fallbackUrl) {
                  target.src = fallbackUrl;
                }
              }}
              style={{ objectFit: 'cover' }}
            />
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
            <button className={styles.editAvatarBtn} onClick={() => fileInputRef.current?.click()}>
              <PencilSimple size={16} />
            </button>
          </div>
          <div className={styles.userInfo}>
            <h1>{username}</h1>
            <div className={styles.infoRow}>
              <div className={styles.infoItem}>
                <GraduationCap size={16} />
                {user?.role === 'admin' ? 'Quản trị viên hệ thống' : user?.role === 'teacher' ? 'Giáo viên trường' : 'Lớp 12A1 • THPT Chuyên Lê Hồng Phong'}
              </div>
              <div className={styles.infoItem}>
                <IdentificationBadge size={16} />
                ID: {user?.role === 'admin' ? 'AD' : user?.role === 'teacher' ? 'GV' : 'HS'}{(user as any)?._id ? (user as any)._id.slice(-6).toUpperCase() : (user as any)?.id ? (user as any).id.slice(-6).toUpperCase() : '2024'}
              </div>
            </div>
          </div>
        </div>

        {/* Khối Vai trò & Trạng thái nằm gọn gàng bên phải Header */}
        <div className={styles.headerRight}>
          <div className={styles.headerBadgeCard}>
            <div className={`${styles.badgeIcon} ${styles.blue}`}>
              {user?.role === 'admin' ? <ShieldCheck size={20} weight="bold" /> : <User size={20} weight="bold" />}
            </div>
            <div className={styles.badgeMeta}>
              <span className={styles.bLabel}>VAI TRÒ</span>
              <span className={styles.bVal}>
                {user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
              </span>
            </div>
          </div>
          <div className={styles.headerBadgeCard}>
            <div className={`${styles.badgeIcon} ${styles.green}`}>
              <CalendarCheck size={20} weight="bold" />
            </div>
            <div className={styles.badgeMeta}>
              <span className={styles.bLabel}>TRẠNG THÁI</span>
              <span className={styles.bValActive}>Hoạt động</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          {/* Stat Cards cho Học sinh */}
          {user?.role === 'student' && (
            <div className={styles.statCards}>
              <div className={styles.statCard}>
                <div className={`${styles.iconWrapper} ${styles.green}`}>
                  <TrendUp size={24} weight="bold" />
                </div>
                <div className={styles.statLabel}>Hạng lớp</div>
                <div className={styles.statValue}>05<span>/40</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.iconWrapper} ${styles.red}`}>
                  <BookBookmark size={24} weight="bold" />
                </div>
                <div className={styles.statLabel}>Tín chỉ</div>
                <div className={styles.statValue}>124</div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.iconWrapper} ${styles.blue}`}>
                  <Fire size={24} weight="bold" />
                </div>
                <div className={styles.statLabel}>Chuỗi học</div>
                <div className={styles.statValue}>12<span> ngày</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.iconWrapper} ${styles.gray}`}>
                  <CalendarCheck size={24} weight="bold" />
                </div>
                <div className={styles.statLabel}>Chuyên cần</div>
                <div className={styles.statValue}>98<span>%</span></div>
              </div>
            </div>
          )}

          {/* Thông tin hồ sơ */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <div className={styles.headerTitle}>
                <div className={styles.titleIcon}><User size={20} weight="bold" /></div>
                Thông tin hồ sơ
              </div>
              <button className={styles.editBtn} onClick={() => setShowEdit(true)}><PencilSimple size={16} weight="bold" /> Chỉnh sửa</button>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.groupTitle}>Thông tin cơ bản</div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Họ và tên</span>
                  <span className={styles.value}>{username}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Ngày sinh</span>
                  <span className={styles.value}>{user?.dob ? user.dob.split('-').reverse().join('/') : 'Chưa cập nhật'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Giới tính</span>
                  <span className={styles.value}>{user?.gender || 'Chưa cập nhật'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Dân tộc</span>
                  <span className={styles.value}>Kinh</span>
                </div>
              </div>
            </div>

            {user?.role !== 'admin' && (
              <div className={styles.infoGroup}>
                <div className={styles.groupTitle}>Chuyên môn & Trình độ</div>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Bằng cấp / Trình độ</span>
                    <span className={styles.value}>{(user as any)?.degree || (user?.role === 'teacher' ? 'Đại học Sư phạm' : 'Chưa cập nhật')}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Môn học chuyên môn</span>
                    <span className={styles.value}>{(user as any)?.subject || 'Chưa chọn môn'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.infoGroup}>
              <div className={styles.groupTitle}>Giới thiệu bản thân (Bio)</div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <p className="font-medium text-slate-700 text-sm leading-relaxed italic">
                  {(user as any)?.bio || 'Chưa có thông tin giới thiệu bản thân.'}
                </p>
              </div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.groupTitle}>Liên lạc & Địa chỉ</div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Email tài khoản</span>
                  <span className={styles.value}>{email}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Số điện thoại</span>
                  <span className={styles.value}>{user?.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <span className={styles.label}>Địa chỉ thường trú</span>
                  <span className={styles.value}>{user?.address || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </div>

            {user?.role === 'student' && (
              <div className={styles.infoGroup}>
                <div className={styles.groupTitle}>Nền tảng học thuật</div>
                <div className={styles.tagsGrid}>
                  <div className={styles.tagBox}>
                    <div className={styles.tagLabel}>Khối lớp</div>
                    <div className={styles.tagValue}>Lớp 12 - THPT</div>
                  </div>
                  <div className={styles.tagBox}>
                    <div className={styles.tagLabel}>Chuyên ngành</div>
                    <div className={styles.tagValue}>Khoa học Tự nhiên</div>
                  </div>
                  <div className={styles.tagBox}>
                    <div className={styles.tagLabel}>Năm nhập học</div>
                    <div className={styles.tagValue}>Niên khóa 2021</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Huy hiệu thành tích */}
          {user?.role === 'student' && (
            <div className={styles.sectionBox}>
              <div className={styles.sectionHeader}>
                <div className={styles.headerTitle}>
                  <div className={styles.titleIcon}><Medal size={20} weight="bold" /></div>
                  Huy hiệu thành tích
                </div>
                <button className={styles.seeAllBtn}>Xem tất cả</button>
              </div>
              <div className={styles.badgesGrid}>
                <div className={styles.badgeItem}>
                  <div className={`${styles.badgeCircle} ${styles.green}`}>
                    <CircleWavyCheck size={36} weight="fill" />
                  </div>
                  <div className={styles.badgeName}>Chuyên cần</div>
                </div>
                <div className={styles.badgeItem}>
                  <div className={`${styles.badgeCircle} ${styles.orange}`}>
                    <Star size={36} weight="fill" />
                  </div>
                  <div className={styles.badgeName}>Điểm tuyệt đối</div>
                </div>
                <div className={styles.badgeItem}>
                  <div className={`${styles.badgeCircle} ${styles.blue}`}>
                    <UsersThree size={36} weight="fill" />
                  </div>
                  <div className={styles.badgeName}>Sôi nổi</div>
                </div>
                <div className={styles.badgeItem}>
                  <div className={`${styles.badgeCircle} ${styles.gray}`}>
                    <Medal size={36} weight="fill" />
                  </div>
                  <div className={styles.badgeName}>Lãnh đạo</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          {/* Tiến độ học tập */}
          {user?.role === 'student' && (
            <div className={styles.sectionBox}>
              <div className={styles.sectionHeader}>
                <div className={styles.headerTitle}>
                  <TrendUp size={20} weight="bold" color="#1fb98f" />
                  Tiến độ học tập
                </div>
              </div>
              <div className={styles.progressList}>
                <div className={styles.progressItem}>
                  <div className={`${styles.pHeader} ${styles.green}`}>
                    <span className={styles.pLabel}>Mục tiêu học kỳ 1</span>
                    <span className={styles.pVal}>9.2 / 10.0</span>
                  </div>
                  <div className={`${styles.pBarWrap} ${styles.green}`}>
                    <div className={styles.pBar} style={{ width: '92%' }}></div>
                  </div>
                  <div className={styles.pSub}>Đã đạt 92% kế hoạch học tập đề ra</div>
                </div>
                <div className={styles.progressItem}>
                  <div className={`${styles.pHeader} ${styles.orange}`}>
                    <span className={styles.pLabel}>Hoàn thành bài tập</span>
                    <span className={styles.pVal}>88%</span>
                  </div>
                  <div className={`${styles.pBarWrap} ${styles.orange}`}>
                    <div className={styles.pBar} style={{ width: '88%' }}></div>
                  </div>
                  <div className={styles.pSub}>Chỉ còn 12 bài tập chưa nộp</div>
                </div>
                <div className={styles.progressItem}>
                  <div className={`${styles.pHeader} ${styles.blue}`}>
                    <span className={styles.pLabel}>Dự án cuối năm</span>
                    <span className={styles.pVal}>45%</span>
                  </div>
                  <div className={`${styles.pBarWrap} ${styles.blue}`}>
                    <div className={styles.pBar} style={{ width: '45%' }}></div>
                  </div>
                  <div className={styles.pSub}>Đang trong giai đoạn thu thập dữ liệu</div>
                </div>
              </div>
            </div>
          )}

          {/* Quản lý tài khoản */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
              <div className={styles.headerTitle} style={{ fontSize: '16px' }}>
                Quản lý tài khoản
              </div>
            </div>
            <div className={styles.accountMenu}>
              {((user as any)?.isGoogleAccount || user?.avatar?.includes('googleusercontent.com')) ? (
                <div className={styles.menuItem} onClick={() => {
                  setShowGooglePasswordDialog(true);
                  setGooglePasswordStep('request');
                }} style={{ cursor: 'pointer' }}>
                  <div className={styles.menuLeft}>
                    <div className={styles.menuIcon}><Password size={18} weight="bold" /></div>
                    <div className={styles.menuText}>
                      <span className={styles.mTitle}>Đổi mật khẩu</span>
                      <span className={styles.mSub} style={{ color: '#0284c7', fontWeight: 600 }}>Thiết lập mật khẩu đăng nhập</span>
                    </div>
                  </div>
                  <CaretRight size={16} weight="bold" className={styles.menuArrow} />
                </div>
              ) : (
                <div className={styles.menuItem} onClick={() => setShowPasswordDialog(true)} style={{ cursor: 'pointer' }}>
                  <div className={styles.menuLeft}>
                    <div className={styles.menuIcon}><Password size={18} weight="bold" /></div>
                    <div className={styles.menuText}>
                      <span className={styles.mTitle}>Đổi mật khẩu</span>
                      <span className={styles.mSub}>Cập nhật mật khẩu định kỳ</span>
                    </div>
                  </div>
                  <CaretRight size={16} weight="bold" className={styles.menuArrow} />
                </div>
              )}
              <div className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={styles.menuIcon}><BellRinging size={18} weight="bold" /></div>
                  <div className={styles.menuText}>
                    <span className={styles.mTitle}>Thông báo</span>
                    <span className={styles.mSub}>Email, Mobile & Web</span>
                  </div>
                </div>
                <CaretRight size={16} weight="bold" className={styles.menuArrow} />
              </div>
              <div className={styles.menuItem}>
                <div className={styles.menuLeft}>
                  <div className={styles.menuIcon}><ShieldCheck size={18} weight="bold" /></div>
                  <div className={styles.menuText}>
                    <span className={styles.mTitle}>Quyền riêng tư</span>
                    <span className={styles.mSub}>Quản lý hiển thị hồ sơ</span>
                  </div>
                </div>
                <CaretRight size={16} weight="bold" className={styles.menuArrow} />
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <SignOut size={18} weight="bold" />
                Đăng xuất tài khoản
              </button>
            </div>
            {((user as any)?.isGoogleAccount || user?.avatar?.includes('googleusercontent.com')) && (
              <div className="mt-3 p-3.5 bg-sky-50/50 border border-sky-100 rounded-2xl text-[11px] text-sky-700 leading-relaxed font-semibold flex items-start gap-2 shadow-3xs">
                <span className="shrink-0 text-sm leading-none mt-0.5">💡</span>
                <span>Tài khoản của bạn đăng nhập qua Google. Bạn có thể thiết lập mật khẩu bằng cách bấm vào "Đổi mật khẩu" để tạo mật khẩu đăng nhập trực tiếp trên mọi thiết bị.</span>
              </div>
            )}
          </div>

          {/* Tổng kết năm học */}
          {user?.role === 'student' && (
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>Tổng kết năm học</div>
              <div className={styles.summaryStats}>
                <div className={styles.sStat}>
                  <div className={styles.sVal}>0</div>
                  <div className={styles.sLabel}>Số ngày vắng</div>
                </div>
                <div className={styles.sStat}>
                  <div className={`${styles.sVal} ${styles.orange}`}>12</div>
                  <div className={styles.sLabel}>Khen thưởng</div>
                </div>
              </div>
              <div className={styles.gpaBox}>
                <div className={styles.gpaTop}>
                  <span className={styles.gpaLabel}>ĐIỂM TRUNG BÌNH (GPA)</span>
                  <span className={styles.gpaVal}>9.2</span>
                </div>
                <div className={styles.gpaBarWrap}>
                  <div className={styles.gpaBar}></div>
                </div>
                <div className={styles.gpaSub}>Xếp loại: <strong>XUẤT SẮC</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ================================ */}
      {/* Dialog Chỉnh sửa hồ sơ cá nhân  */}
      {/* ================================ */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-[860px] p-0 overflow-hidden rounded-2xl gap-0">

          <form onSubmit={handleUpdateProfile}>

            {/* Body 2 cột */}
            <div className="p-6 grid grid-cols-2 gap-x-7 gap-y-5">

              {/* ── CỘT TRÁI ── */}
              <div className="space-y-5">

                {/* Thông tin cơ bản */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 bg-[#f47c20] rounded-full" />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Thông tin cơ bản</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label htmlFor="name" className="text-xs font-bold text-slate-600">Họ và tên <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="h-9 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-[#f47c20]/20 text-sm font-medium"
                        placeholder="Nhập họ và tên đầy đủ..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="grid gap-1">
                        <Label htmlFor="dob" className="text-xs font-bold text-slate-600">Ngày sinh</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="h-9 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-[#f47c20]/20 text-sm"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="gender" className="text-xs font-bold text-slate-600">Giới tính</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              id="gender"
                              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 flex items-center justify-between hover:border-[#f47c20] focus:outline-none focus:ring-2 focus:ring-[#f47c20]/30 transition-colors cursor-pointer"
                            >
                              <span className={formData.gender ? "text-slate-800 font-bold" : "text-slate-400"}>
                                {formData.gender || "Chọn giới tính"}
                              </span>
                              <CaretDown size={14} className="text-slate-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[180px] bg-white border border-slate-100 shadow-xl rounded-xl p-1 z-[100]">
                            {["Nam", "Nữ", "Khác"].map((val) => (
                              <DropdownMenuItem
                                key={val}
                                onClick={() => setFormData({ ...formData, gender: val })}
                                className={`cursor-pointer text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors ${formData.gender === val
                                    ? "bg-orange-50 text-[#f47c20] font-bold"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                  }`}
                              >
                                {val}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liên lạc & Địa chỉ */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Liên lạc & Địa chỉ</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label htmlFor="phone" className="text-xs font-bold text-slate-600">Số điện thoại / Zalo</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="VD: 0901 234 567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-9 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="address" className="text-xs font-bold text-slate-600">Địa chỉ thường trú</Label>
                      <Input
                        id="address"
                        placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="h-9 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CỘT PHẢI ── */}
              <div className="space-y-5">

                {/* Chuyên môn (teacher) hoặc placeholder cho student */}
                {user?.role === 'teacher' ? (
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-1 h-3.5 bg-[#2f8fa3] rounded-full" />
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Chuyên môn & Trình độ</span>
                    </div>
                    <div className="space-y-3">
                      <div className="grid gap-1">
                        <Label htmlFor="degree" className="text-xs font-bold text-slate-600">Bằng cấp / Trình độ chuyên môn</Label>
                        <Input
                          id="degree"
                          placeholder="VD: Cử nhân Sư phạm, Thạc sĩ Giáo dục..."
                          value={formData.degree}
                          onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                          className="h-9 rounded-xl border-slate-200 focus:border-[#2f8fa3] focus:ring-[#2f8fa3]/20 text-sm"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="subject" className="text-xs font-bold text-slate-600">Môn học chuyên môn</Label>
                        <Input
                          id="subject"
                          value={formData.subject || "Chưa phân môn"}
                          disabled
                          className="h-9 rounded-xl border-slate-200 bg-slate-100 text-slate-500 font-bold text-sm cursor-not-allowed"
                          title="Chỉ Admin mới có quyền thay đổi môn học chuyên môn"
                        />
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                          💡 Chỉ Admin mới có quyền thay đổi môn học chuyên môn.
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Placeholder cho Student: không có section chuyên môn */
                  <div className="h-[102px]" />
                )}

                {/* Bio */}
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 bg-violet-500 rounded-full" />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Giới thiệu bản thân (Bio)</span>
                  </div>
                  <div className="grid gap-1 flex-1">
                    <textarea
                      id="bio"
                      rows={user?.role === 'teacher' ? 4 : 7}
                      placeholder="Nhập lời giới thiệu ngắn gọn về bản thân, kinh nghiệm, sở thích..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors resize-none"
                      value={formData.bio}
                      onChange={(e) => {
                        const val = e.target.value;
                        const capitalized = val.length > 0 ? val.charAt(0).toUpperCase() + val.slice(1) : val;
                        setFormData({ ...formData, bio: capitalized });
                      }}
                    />
                    <p className="text-right text-[10px] text-slate-400 font-medium">{formData.bio?.length || 0} ký tự</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400 font-medium">
                <span className="text-red-500">*</span> Trường thông tin bắt buộc
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  disabled={isSubmitting}
                  className="h-9 px-5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors disabled:opacity-60"
                >
                  Hủy bỏ
                </button>
                <SaveButton
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang lưu...
                    </span>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </SaveButton>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Đổi mật khẩu */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-orange-50 text-[#f47c20] rounded-lg">
                <Password size={20} weight="bold" />
              </span>
              Đổi mật khẩu
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
            <div className="grid gap-1.5 relative">
              <Label htmlFor="oldPassword" className="text-xs font-extrabold text-slate-700">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="pr-10 h-10 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-[#f47c20]/20 text-sm font-medium"
                  placeholder="Nhập mật khẩu hiện tại..."
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none cursor-pointer"
                >
                  {showOldPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="grid gap-1.5 relative">
              <Label htmlFor="newPassword" className="text-xs font-extrabold text-slate-700">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="pr-10 h-10 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-[#f47c20]/20 text-sm font-medium"
                  placeholder="Tối thiểu 8 ký tự..."
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none cursor-pointer"
                >
                  {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="grid gap-1.5 relative">
              <Label htmlFor="confirmPassword" className="text-xs font-extrabold text-slate-700">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="pr-10 h-10 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-[#f47c20]/20 text-sm font-medium"
                  placeholder="Nhập lại mật khẩu mới..."
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <DialogFooter className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPasswordDialog(false)}
                disabled={isChangingPassword}
                className="h-10 px-5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 font-extrabold text-sm hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer bg-white"
              >
                Hủy
              </button>
              <SaveButton type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  <span>Xác nhận đổi</span>
                )}
              </SaveButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Thiết lập mật khẩu cho tài khoản Google */}
      <Dialog open={showGooglePasswordDialog} onOpenChange={setShowGooglePasswordDialog}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-[#2f8fa3]/10 text-[#2f8fa3] rounded-lg">
                <Password size={20} weight="bold" />
              </span>
              Thiết lập mật khẩu liên kết
            </DialogTitle>
          </DialogHeader>

          {googlePasswordStep === 'request' ? (
            <div className="py-4 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                Chúng tôi sẽ gửi một mã xác thực OTP gồm 6 chữ số tới email của bạn để xác minh danh tính trước khi thiết lập mật khẩu đăng nhập trực tiếp:
              </p>
              <div className="p-3.5 bg-orange-50/40 border border-orange-100 rounded-2xl text-center shadow-3xs">
                <span className="font-bold text-[#f47c20] text-sm tracking-wide">{user?.email}</span>
              </div>
              <DialogFooter className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGooglePasswordDialog(false)}
                  disabled={isSendingOtp}
                  className="h-10 px-5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 font-extrabold text-sm hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer bg-white"
                >
                  Hủy
                </button>
                <SaveButton type="button" onClick={handleRequestGooglePasswordOtp} disabled={isSendingOtp}>
                  {isSendingOtp ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang gửi...
                    </span>
                  ) : (
                    <span>Nhận mã OTP</span>
                  )}
                </SaveButton>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSetupGooglePassword} className="space-y-5 pt-4">
              <div className="p-3 bg-[#2f8fa3]/10 border border-[#2f8fa3]/20 rounded-2xl text-xs text-[#2f8fa3] font-bold text-center flex items-center justify-center gap-2">
                <span>🔑</span>
                <span>Đã gửi mã OTP. Vui lòng kiểm tra email của bạn!</span>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="googleOtp" className="text-xs font-extrabold text-slate-700">Mã xác thực OTP (6 chữ số)</Label>
                <Input
                  id="googleOtp"
                  type="text"
                  required
                  placeholder="Nhập 6 số..."
                  maxLength={6}
                  value={googlePasswordForm.otp}
                  onChange={(e) => setGooglePasswordForm({ ...googlePasswordForm, otp: e.target.value })}
                  className="text-left px-4 font-bold text-sm h-11 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-4 focus:ring-[#f47c20]/10 placeholder:font-semibold placeholder:text-slate-400"
                />
              </div>

              <div className="grid gap-1.5 relative">
                <Label htmlFor="googleNewPassword" className="text-xs font-extrabold text-slate-700">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="googleNewPassword"
                    type={googleShowNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={googlePasswordForm.newPassword}
                    onChange={(e) => setGooglePasswordForm({ ...googlePasswordForm, newPassword: e.target.value })}
                    className="pr-10 h-10 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-4 focus:ring-[#f47c20]/10 text-sm font-medium"
                    placeholder="Tối thiểu 8 ký tự..."
                  />
                  <button
                    type="button"
                    onClick={() => setGoogleShowNewPassword(!googleShowNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none cursor-pointer"
                  >
                    {googleShowNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid gap-1.5 relative">
                <Label htmlFor="googleConfirmPassword" className="text-xs font-extrabold text-slate-700">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="googleConfirmPassword"
                    type={googleShowConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={googlePasswordForm.confirmPassword}
                    onChange={(e) => setGooglePasswordForm({ ...googlePasswordForm, confirmPassword: e.target.value })}
                    className="pr-10 h-10 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-4 focus:ring-[#f47c20]/10 text-sm font-medium"
                    placeholder="Nhập lại mật khẩu..."
                  />
                  <button
                    type="button"
                    onClick={() => setGoogleShowConfirmPassword(!googleShowConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none cursor-pointer"
                  >
                    {googleShowConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <DialogFooter className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGooglePasswordStep('request')}
                  disabled={isSettingPassword}
                  className="h-10 px-5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 font-extrabold text-sm hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer bg-white"
                >
                  Quay lại
                </button>
                <SaveButton type="submit" disabled={isSettingPassword}>
                  {isSettingPassword ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    <span>Thiết lập mật khẩu</span>
                  )}
                </SaveButton>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProfile;
