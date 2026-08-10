import React, { useState, useEffect } from "react";
import { Plus, User, DotsThreeVertical, Chalkboard, ClipboardText, Users, ChartBar, Clock, LockKey } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { getMockDb } from "../../../utils/mockDb.ts";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import styles from "./StudentClassrooms.module.scss";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton.tsx";
import { SecondaryButton } from "../../../components/ui/Buttons/SecondaryButton.tsx";
import AnimatedProgressBar from "../../../components/ui/AnimatedProgressBar.tsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export default function StudentClassrooms() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string>("Học sinh A");
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [pendingClasses, setPendingClasses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinClass = async () => {
    if (!classCode.trim()) return;
    try {
      setIsJoining(true);
      const res = await classroomService.joinClassByCode(classCode.trim());
      if (res?.data?.status === 'pending_approval') {
        toast.info(res.message || "Đã gửi yêu cầu tham gia lớp. Vui lòng chờ giáo viên duyệt!");
        setActiveTab('pending');
      } else {
        toast.success(res.message || "Tham gia lớp học thành công!");
      }
      setShowJoinModal(false);
      setClassCode("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Không thể tham gia lớp học, kiểm tra lại mã Code.");
    } finally {
      setIsJoining(false);
    }
  };

  const loadData = async () => {
    const currentUsername = user?.name || localStorage.getItem("username") || "Học sinh A";
    setUsername(currentUsername);

    try {
      // 0. Lấy danh sách các lớp đang chờ duyệt
      const pendingRes = await classroomService.getStudentPendingClasses();
      if (pendingRes?.data) {
        setPendingClasses(pendingRes.data);
      }

      // 1. Lấy dữ liệu lớp học thật từ backend
      const res = await classroomService.getStudentClassrooms();
      if (res && res.data && res.data.length > 0) {
        // Ánh xạ cấu trúc dữ liệu backend sang định dạng FE mong đợi
        const backendClasses = res.data.map((c: any) => ({
          _id: c._id,
          className: c.name || c.className,
          subject: c.subject || "",
          teacherName: c.teacherId?.name || "Thầy Nguyễn Văn A",
          studentCount: c.students?.length || 0,
          avatars: c.students?.slice(0, 3).map((s: any, idx: number) => {
            if (s.avatar) return s.avatar;
            const fallbackName = s.name || "HS";
            const colors = ["F47C20", "2F8FA3", "A9D6E5", "D8C3A5"];
            const bg = colors[idx % colors.length];
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=${bg}&color=fff&size=80`;
          }) || [],
          status: c.status,
          attendanceRate: c.attendanceRate || Math.floor(Math.random() * (100 - 85 + 1)) + 85
        }));
        setClassrooms(backendClasses);
        return;
      }
    } catch (err) {
      console.warn("Không thể tải danh sách lớp từ API, chuyển sang dùng Mock DB:", err);
    }

    // Fallback: Tìm trong Mock DB
    const db = getMockDb();
    const studentRecords = db.students.filter(
      s => s.name.toLowerCase() === currentUsername.toLowerCase()
    );
    const joinedClassIds = studentRecords.map(s => s.classId);
    const listClassrooms = db.classrooms.filter(c => joinedClassIds.includes(c._id));

    // Tính tỷ lệ chuyên cần từ attendances
    let totalAtt = 0;
    let presentAtt = 0;
    const sIds = studentRecords.map(s => s._id);
    db.attendances.forEach(att => {
      att.records.forEach(rec => {
        if (sIds.includes(rec.studentId)) {
          totalAtt++;
          if (rec.status === "present" || rec.status === "late") {
            presentAtt++;
          }
        }
      });
    });
    const globalAttendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 92;

    const mappedMockClasses = listClassrooms.map(c => {
      const classStudents = db.students.filter(s => s.classId === c._id);
      return {
        ...c,
        className: c.className,
        teacherName: c.teacherId, // Mock DB format
        studentCount: classStudents.length,
        avatars: classStudents.slice(0, 3).map((s, idx) => {
          if (s.avatar) return s.avatar;
          const colors = ["F47C20", "2F8FA3", "A9D6E5", "D8C3A5"];
          const bg = colors[idx % colors.length];
          return `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=${bg}&color=fff&size=80`;
        }),
        attendanceRate: globalAttendanceRate
      };
    });
    setClassrooms(mappedMockClasses);
  };

  useEffect(() => {
    loadData();
  }, [username, user]);

  // Avatar học sinh ngẫu nhiên cho lớp học thêm
  const mockAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=80&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
  ];

  return (
    <div className={styles.classroomsPage}>
      {/* 1. TOP HEADER SECTION */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h2>Lớp học của tôi</h2>
          <p>Quản lý và theo dõi tiến độ tham gia lớp học của bạn.</p>
        </div>
        <PrimaryButton className={`${styles.btnJoinHeader} tour-step-join-class`} onClick={() => setShowJoinModal(true)}>
          <Plus size={20} weight="bold" />
          <span>Tham gia lớp học</span>
        </PrimaryButton>
      </div>

      {/* JOIN CLASS MODAL */}
      {showJoinModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Tham gia lớp học</h3>
            <div className={styles.formGroup}>
              <label>Mã lớp học (6 ký tự)</label>
              <input
                type="text"
                placeholder="VD: REACT1"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => {
                  setShowJoinModal(false);
                  setClassCode("");
                }}
              >
                Hủy
              </button>
              <SecondaryButton
                className={styles.btnConfirm}
                onClick={handleJoinClass}
                disabled={isJoining || classCode.length < 3}
              >
                {isJoining ? "Đang xử lý..." : "Tham gia"}
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}

      {/* TAB SWITCHER */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${activeTab === 'active'
            ? 'bg-[#2f8fa3] text-white shadow-xs'
            : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
        >
          Lớp đang học ({classrooms.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${activeTab === 'pending'
            ? 'bg-orange-500 text-white shadow-xs'
            : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
        >
          <Clock size={16} weight="bold" />
          <span>Đang chờ duyệt</span>
          {pendingClasses.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-extrabold">
              {pendingClasses.length}
            </span>
          )}
        </button>
      </div>

      {/* 2. CLASSES GRID - ACTIVE TAB */}
      {activeTab === 'active' && (
        <div className={`${styles.classesGrid} tour-step-class-list`}>
          {classrooms.map((cls) => (
            <div
              key={cls._id}
              className={cls.status === 'Locked' || cls.status === 'Closed' ? `${styles.classCard} opacity-60 border-slate-300` : styles.classCard}
              onClick={(e) => {
                if (cls.status === 'Locked') {
                  e.preventDefault();
                  toast.error('Lớp học đã bị khóa bởi Quản trị viên hệ thống.');
                } else if (cls.status === 'Closed') {
                  e.preventDefault();
                  toast.warning('Lớp học đã bị đóng, không thể truy cập.');
                } else {
                  navigate(`/classrooms/${cls._id}`);
                }
              }}
              style={{ cursor: (cls.status === 'Locked' || cls.status === 'Closed') ? "not-allowed" : "pointer" }}
            >
              <div className={styles.cardTop}>
                <div className="flex items-center justify-between w-full">
                  <h3 className={styles.classTitle} style={{ margin: 0 }}>{cls.className}</h3>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className={cls.status === 'Locked' ? "px-2.5 py-1 text-[11px] font-bold text-rose-800 bg-rose-100 rounded-lg flex items-center gap-1 border border-rose-300" : styles.statusTag}>
                      {cls.status === 'Locked' ? <LockKey size={14} weight="bold" /> : null}
                      {cls.status === 'Locked' ? 'Bị khóa' : cls.status === 'Closed' ? 'Đã đóng' : 'Đang diễn ra'}
                    </span>
                    {cls.status !== 'Locked' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                            title="Tùy chọn lớp học"
                          >
                            <DotsThreeVertical size={20} weight="bold" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                          <DropdownMenuItem
                            onClick={() => navigate(`/classrooms/${cls._id}`)}
                            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-2"
                          >
                            <Chalkboard size={16} className="text-orange-500" weight="bold" />
                            <span>Vào lớp học</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/classrooms/${cls._id}?tab=activities`)}
                            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-2"
                          >
                            <ClipboardText size={16} className="text-blue-500" weight="bold" />
                            <span>Bài tập & Bài thi</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/classrooms/${cls._id}?tab=members`)}
                            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-2"
                          >
                            <Users size={16} className="text-indigo-500" weight="bold" />
                            <span>Xem thành viên</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-slate-100" />
                          <DropdownMenuItem
                            onClick={() => navigate(`/grades`)}
                            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-2"
                          >
                            <ChartBar size={16} className="text-emerald-500" weight="bold" />
                            <span>Bảng điểm cá nhân</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.cardMiddle}>
                <div className={styles.teacherInfo}>
                  <User size={16} weight="bold" />
                  <span style={{ textTransform: 'capitalize' }}>
                    {(() => {
                      const name = (cls.teacherName || cls.teacher?.name || "Nguyễn Văn A").toLowerCase();
                      if (name.startsWith("thầy") || name.startsWith("cô") || name.startsWith("gv") || name.startsWith("giáo viên")) {
                        return name;
                      }
                      return `Thầy/Cô ${name}`;
                    })()}
                  </span>
                </div>
              </div>

              <div className={styles.cardProgress}>
                <div className={styles.progressText}>
                  <span>Chuyên cần</span>
                  <span className={styles.progressVal}>{cls.attendanceRate}%</span>
                </div>
                <div className={styles.progressBarBg}>
                  <AnimatedProgressBar
                    progress={cls.attendanceRate}
                    height="100%"
                    barColor="linear-gradient(90deg, #f47c20, #d8c3a5, #A9d6e5, #2f8fa3)"
                  />
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.avatarsGroup}>
                  {cls.avatars && cls.avatars.length > 0 && (
                    cls.avatars.map((av: string, index: number) => (
                      <img
                        key={index}
                        src={av}
                        alt="Student avatar"
                        style={{ zIndex: 3 - index }}
                        onError={(e) => { (e.target as HTMLImageElement).src = mockAvatars[index % mockAvatars.length]; }}
                      />
                    ))
                  )}
                  {cls.studentCount > 3 && (
                    <span className={styles.avatarMore}>+{cls.studentCount - 3}</span>
                  )}
                </div>
                <span className={styles.studentCountText}>{cls.studentCount} học sinh</span>
              </div>
            </div>
          ))}

          {/* Placeholder if not joined any class */}
          {classrooms.length === 0 && (
            <div className={styles.emptyStateCard}>
              <div className={styles.emptyIconBox}>
                <User size={32} weight="bold" />
              </div>
              <h4>Chưa có lớp học</h4>
              <p>Tài khoản của bạn chưa được phân vào lớp học nào. Vui lòng liên hệ giáo viên hoặc nhập Mã Lớp để gia nhập.</p>
            </div>
          )}
        </div>
      )}

      {/* 2. CLASSES GRID - PENDING TAB */}
      {activeTab === 'pending' && (
        <div className={styles.classesGrid}>
          {pendingClasses.map((item) => {
            const targetCls = item.class || {};
            const teacherName = targetCls.teacherId?.name || "Giáo viên";
            return (
              <div
                key={item.requestId}
                className={`${styles.classCard} opacity-90 border-dashed border-2 border-orange-300 relative`}
                onClick={() => toast.info("Lớp học này đang chờ giáo viên phê duyệt. Bạn chưa thể truy cập bài giảng!")}
                style={{ cursor: "not-allowed" }}
              >
                <div className={styles.cardTop}>
                  <div className="flex items-center justify-between w-full">
                    <h3 className={styles.classTitle} style={{ margin: 0 }}>{targetCls.name}</h3>
                    <span className="px-2.5 py-1 text-[11px] font-bold text-orange-800 bg-orange-100 rounded-lg flex items-center gap-1 border border-orange-300">
                      <Clock size={14} weight="bold" />
                      Đang chờ duyệt
                    </span>
                  </div>
                </div>

                <div className={styles.cardMiddle}>
                  <div className={styles.teacherInfo}>
                    <User size={16} weight="bold" />
                    <span>Thầy/Cô {teacherName}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Mã lớp: <strong>{targetCls.code}</strong> • Môn: {targetCls.subject || "Khác"}
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900 flex items-center gap-2 mt-3">
                  <LockKey size={18} className="text-amber-600 shrink-0" weight="bold" />
                  <span>Vui lòng chờ giáo viên xác nhận để tham gia bài học & điểm danh.</span>
                </div>

                <div className={styles.cardFooter}>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Ngày xin gia nhập: {new Date(item.requestedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            );
          })}

          {pendingClasses.length === 0 && (
            <div className={styles.emptyStateCard}>
              <div className={styles.emptyIconBox}>
                <Clock size={32} weight="bold" className="text-slate-400" />
              </div>
              <h4>Không có yêu cầu chờ duyệt</h4>
              <p>Bạn không có lớp học nào đang trong danh sách chờ giáo viên phê duyệt.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. BOTTOM BANNER */}
      <div className={styles.bottomBanner}>
        <div className={styles.bannerContent}>
          <h3>Học tập hiệu quả hơn mỗi ngày</h3>
          <p>
            Tham gia đầy đủ các tiết học và hoàn thành bài tập đúng hạn để tích lũy điểm chuyên cần cao nhất.
          </p>
        </div>
      </div>
    </div>
  );
}
