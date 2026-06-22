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
import { Button } from '@/components/ui/button';
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
  const avatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FE6747&color=fff&bold=true`;

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
    avatar: user?.avatar || ''
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userService.updateProfile(formData);
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

  return (
    <div className={styles.profileContainer}>
      {/* Header */}
      <div className={styles.profileHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.avatarWrapper}>
            <img 
              src={avatar} 
              alt={username} 
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
      </div>

      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          {/* Stat Cards */}
          {/* Stat Cards */}
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

          {user?.role === 'admin' && (
            <div className={styles.statCards}>
              <div className={styles.statCard}>
                <div className={`${styles.iconWrapper} ${styles.blue}`}>
                  <ShieldCheck size={24} weight="bold" />
                </div>
                <div className={styles.statLabel}>Quyền hạn</div>
                <div className={styles.statValue}>Tối cao</div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.iconWrapper} ${styles.green}`}>
                  <CalendarCheck size={24} weight="bold" />
                </div>
                <div className={styles.statLabel}>Trạng thái</div>
                <div className={styles.statValue}>Hoạt động</div>
              </div>
            </div>
          )}

          {user?.role === 'teacher' && (
            <div className={styles.statCards}>
              <div className={styles.statCard}>
                <div className={`${styles.iconWrapper} ${styles.blue}`}>
                  <User size={24} weight="bold" />
                </div>
                <div className={styles.statLabel}>Vai trò</div>
                <div className={styles.statValue}>Giáo viên</div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.iconWrapper} ${styles.green}`}>
                  <CalendarCheck size={24} weight="bold" />
                </div>
                <div className={styles.statLabel}>Trạng thái</div>
                <div className={styles.statValue}>Hoạt động</div>
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
      {/* Dialog Chỉnh sửa hồ sơ */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hồ sơ cá nhân</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dob">Ngày sinh</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender">Giới tính</Label>
                <select
                  id="gender"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary-hover" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog Đổi mật khẩu */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Đổi mật khẩu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 py-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showOldPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={isChangingPassword}>
                Hủy
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary-hover" disabled={isChangingPassword}>
                {isChangingPassword ? "Đang xử lý..." : "Xác nhận đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProfile;
