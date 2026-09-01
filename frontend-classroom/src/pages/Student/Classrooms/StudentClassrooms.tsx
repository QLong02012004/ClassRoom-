import React, { useState, useEffect, useMemo } from "react";
import { Plus, User, List, Chalkboard, ClipboardText, Users, ChartBar, Clock, LockKey, Key, XCircle, MagnifyingGlass } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { getMockDb } from "../../../utils/mockDb.ts";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import styles from "./StudentClassrooms.module.scss";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton.tsx";
import { SecondaryButton } from "../../../components/ui/Buttons/SecondaryButton.tsx";
import AnimatedProgressBar from "../../../components/ui/AnimatedProgressBar.tsx";
import { StudentActionMenu } from "../../../components/ui/ActionMenus/StudentActionMenu.tsx";
import { SaveButton } from "../../../components/ui/Buttons/SaveButton.tsx";
import { SmartSearchBar, type SearchSuggestionItem } from "../../../components/ui/Inputs/SmartSearchBar.tsx";
import { DropdownFilter } from "../../../components/ui/Dropdowns/DropdownFilter.tsx";
import { Pagination } from "@heroui/react";

const removeAccents = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 6;

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
      let mappedPending: any[] = [];
      // 0. Lấy danh sách các lớp đang chờ duyệt
      const pendingRes = await classroomService.getStudentPendingClasses();
      if (pendingRes?.data) {
        setPendingClasses(pendingRes.data);
        mappedPending = pendingRes.data.map((item: any) => ({
          _id: item.requestId || item.class?._id,
          className: item.class?.name || "Lớp học",
          subject: item.class?.subject || "Môn học chung",
          teacherName: item.class?.teacherId?.name || "Giáo viên",
          studentCount: 0,
          status: 'Pending',
          isPending: true,
          code: item.class?.code,
          requestedAt: item.requestedAt
        }));
      }

      // 1. Lấy dữ liệu lớp học thật từ backend
      const res = await classroomService.getStudentClassrooms();
      if (res && Array.isArray(res.data)) {
        // Ánh xạ cấu trúc dữ liệu backend sang định dạng FE mong đợi
        const backendClasses = res.data.map((c: any) => {
          const present = c.presentSessions !== undefined ? c.presentSessions : 0;
          const total = c.totalSessions !== undefined ? c.totalSessions : 0;
          const rate = total > 0 ? Math.round((present / total) * 100) : 100;

          return {
            _id: c._id,
            className: c.name || c.className,
            subject: c.subject || "Môn học chung",
            teacherName: c.teacherId?.name || "Thầy Nguyễn Văn A",
            studentCount: c.students?.length || 0,
            avatars: c.students?.slice(0, 3).map((s: any, idxArr: number) => {
              if (s.avatar) return s.avatar;
              const fallbackName = s.name || "HS";
              const colors = ["F47C20", "2F8FA3", "A9D6E5", "D8C3A5"];
              const bg = colors[idxArr % colors.length];
              return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=${bg}&color=fff&size=80`;
            }) || [],
            status: c.status,
            isPending: false,
            presentSessions: present,
            totalSessions: total,
            attendanceRate: rate
          };
        });

        // Loại bỏ các lớp chờ duyệt đã được chấp nhận và nằm trong backendClasses
        const joinedClassIds = new Set(backendClasses.map((c: any) => c._id.toString()));
        const filteredPending = mappedPending.filter((p: any) => {
          const pId = p.classId ? p.classId.toString() : p._id.toString();
          return !joinedClassIds.has(pId);
        });

        setClassrooms([...filteredPending, ...backendClasses]);
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

    const sIds = studentRecords.map(s => s._id);

    const mappedMockClasses = listClassrooms.map((c, idx) => {
      const classStudents = db.students.filter(s => s.classId === c._id);

      let classTotal = 0;
      let classPresent = 0;
      db.attendances.filter(att => att.classId === c._id).forEach(att => {
        att.records.forEach(rec => {
          if (sIds.includes(rec.studentId)) {
            classTotal++;
            if (rec.status === "present" || rec.status === "late") {
              classPresent++;
            }
          }
        });
      });

      const finalTotal = classTotal > 0 ? classTotal : (12 - idx * 2);
      const finalPresent = classTotal > 0 ? classPresent : (12 - idx * 2);
      const rate = finalTotal > 0 ? Math.round((finalPresent / finalTotal) * 100) : 100;

      return {
        ...c,
        className: c.className,
        teacherName: c.teacherId, // Mock DB format
        studentCount: classStudents.length,
        avatars: classStudents.slice(0, 3).map((s, idxArr) => {
          if (s.avatar) return s.avatar;
          const colors = ["F47C20", "2F8FA3", "A9D6E5", "D8C3A5"];
          const bg = colors[idxArr % colors.length];
          return `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=${bg}&color=fff&size=80`;
        }),
        isPending: false,
        presentSessions: finalPresent,
        totalSessions: finalTotal,
        attendanceRate: rate
      };
    });
    setClassrooms(mappedMockClasses);
  };

  useEffect(() => {
    loadData();

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true });

    socket.on('student_classrooms_update', () => {
      console.log('📡 [Socket.io] Cập nhật danh sách lớp học sinh realtime...');
      loadData();
    });

    socket.on('notification_update', () => {
      loadData();
    });

    return () => {
      socket.disconnect();
    };
  }, [username, user]);

  const searchSuggestions = useMemo<SearchSuggestionItem[]>(() => {
    if (!searchQuery.trim()) return [];
    const qNormalized = removeAccents(searchQuery.toLowerCase().trim());
    return classrooms
      .filter(cls => {
        const nameNormalized = removeAccents((cls.className || "").toLowerCase());
        const codeNormalized = removeAccents((cls.code || "").toLowerCase());
        return nameNormalized.includes(qNormalized) || codeNormalized.includes(qNormalized);
      })
      .slice(0, 5)
      .map(cls => ({
        id: cls._id,
        title: cls.className,
        subtitle: cls.subject || "Môn học chung",
        tag: cls.code || (cls.isPending ? "Đang chờ duyệt" : "Lớp học"),
        rawData: cls
      }));
  }, [classrooms, searchQuery]);

  const filteredClassrooms = useMemo(() => {
    const qNormalized = removeAccents(searchQuery.toLowerCase().trim());
    const filtered = classrooms.filter((cls) => {
      // 1. Search Query Filter
      if (qNormalized) {
        const nameNormalized = removeAccents((cls.className || "").toLowerCase());
        const codeNormalized = removeAccents((cls.code || "").toLowerCase());
        const subjectNormalized = removeAccents((cls.subject || "").toLowerCase());
        const matchesSearch = nameNormalized.includes(qNormalized) ||
          codeNormalized.includes(qNormalized) ||
          subjectNormalized.includes(qNormalized);
        if (!matchesSearch) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "all") {
        if (statusFilter === 'Pending') {
          if (!cls.isPending && cls.status !== 'Pending') return false;
        } else {
          if (cls.isPending || cls.status !== statusFilter) return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const aPending = a.isPending || a.status === 'Pending';
      const bPending = b.isPending || b.status === 'Pending';
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      return 0;
    });
  }, [classrooms, searchQuery, statusFilter]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredClassrooms.length / ROWS_PER_PAGE) || 1;
  const startIdx = filteredClassrooms.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const endIdx = Math.min(page * ROWS_PER_PAGE, filteredClassrooms.length);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const paginatedClassrooms = useMemo(() => {
    return filteredClassrooms.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  }, [filteredClassrooms, page, ROWS_PER_PAGE]);

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
          <h2>LỚP HỌC CỦA TÔI</h2>
          <p>Quản lý và theo dõi tiến độ tham gia lớp học của bạn.</p>
        </div>
        <PrimaryButton className={`${styles.btnJoinHeader} tour-step-join-class`} onClick={() => setShowJoinModal(true)}>
          <Plus size={20} weight="bold" />
          <span>Tham gia lớp học</span>
        </PrimaryButton>
      </div>

      {/* JOIN CLASS MODAL */}
      {showJoinModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]"
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="max-w-md w-full p-0 overflow-hidden shadow-2xl bg-white rounded-2xl border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-white border-b border-slate-200 p-5 flex items-start justify-between shrink-0">
              <div className="flex flex-col gap-1">
                <h3 className="flex items-center gap-2 text-xl font-extrabold m-0 text-[#f47c20]">
                  <Chalkboard size={24} weight="duotone" className="text-[#f47c20]" />
                  Tham gia lớp học
                </h3>
                <p className="text-slate-500 text-xs m-0">Nhập mã Code (6 ký tự) do Giáo viên cung cấp để gia nhập lớp</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 border border-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-rose-50 shrink-0"
                onClick={() => {
                  setShowJoinModal(false);
                  setClassCode("");
                }}
              >
                <XCircle size={20} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="studentClassCodeInput" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mã lớp học (6 ký tự)
                </label>
                <div className="relative">
                  <Key size={20} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="studentClassCodeInput"
                    type="text"
                    placeholder="VD: REACT1"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 tracking-widest outline-none focus:bg-white focus:border-[#2f8fa3] focus:ring-2 focus:ring-[#2f8fa3]/20 uppercase transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
                  💡 Mã lớp gồm 6 ký tự chữ và số do Giáo viên cấp (Ví dụ: <span className="font-mono font-bold text-slate-700">REACT1</span>, <span className="font-mono font-bold text-slate-700">TOAN12</span>).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/80 border-t border-slate-200 rounded-b-2xl">
              <button
                type="button"
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-all cursor-pointer hover:bg-slate-100"
                onClick={() => {
                  setShowJoinModal(false);
                  setClassCode("");
                }}
              >
                Hủy bỏ
              </button>
              <SaveButton
                type="button"
                onClick={handleJoinClass}
                disabled={isJoining || classCode.length < 3}
                style={{ padding: '0.55em 1.3em', fontSize: '0.8rem' }}
              >
                <Plus size={16} weight="bold" />
                <span>{isJoining ? "Đang xử lý..." : "Tham gia lớp học"}</span>
              </SaveButton>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR & DROPDOWN FILTER */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap mt-4">
        <div className="flex items-center gap-3 flex-wrap">
          <SmartSearchBar
            placeholder="Tìm theo tên lớp, môn học, mã lớp... (Ấn /)"
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={searchSuggestions}
            onSelectSuggestion={(item) => {
              const cls = item.rawData;
              if (cls.isPending || cls.status === 'Pending') {
                toast.info('Lớp học này đang chờ giáo viên phê duyệt!');
              } else if (cls.status === 'Locked') {
                toast.error('Lớp học đã bị khóa bởi Quản trị viên hệ thống.');
              } else if (cls.status === 'Closed') {
                toast.warning('Lớp học đã bị đóng, không thể truy cập.');
              } else {
                navigate(`/classrooms/${cls._id}`);
              }
            }}
            recentSearchesKey="studentClassroomSearches"
            widthClass="w-full md:w-[380px]"
          />

          <DropdownFilter
            label="Trạng thái"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: "all", label: "Tất cả trạng thái" },
              { id: "Active", label: "Đang hoạt động" },
              { id: "Pending", label: "Chờ duyệt" },
              { id: "Closed", label: "Đã đóng" },
              { id: "Locked", label: "Đã khóa" }
            ]}
            minWidthClass="min-w-[170px]"
          />
        </div>

        <div className={styles.headerStats}>
          <div className={styles.statPill}>
            <Chalkboard size={16} weight="duotone" className="text-[#f47c20]" />
            <span>{classrooms.length} Lớp học</span>
          </div>
          {pendingClasses.length > 0 && (
            <div className={styles.statPill}>
              <Clock size={16} weight="duotone" className="text-[#f47c20]" />
              <span>{pendingClasses.length} Chờ duyệt</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. UNIFIED CLASSES GRID */}
      <div className={`${styles.classesGrid} tour-step-class-list`}>
        {paginatedClassrooms.map((cls) => {
          const isPending = cls.isPending || cls.status === 'Pending';
          const isLocked = cls.status === 'Locked';
          const isClosed = cls.status === 'Closed';

          return (
            <div
              key={cls._id}
              className={`${styles.classCard} ${isPending
                ? 'border-dashed border-2 border-orange-300 bg-amber-50/20'
                : isLocked || isClosed
                  ? 'opacity-60 border-slate-300'
                  : ''
                }`}
              onClick={(e) => {
                if (isPending) {
                  toast.info('Lớp học này đang chờ giáo viên phê duyệt. Vui lòng chờ giáo viên xác nhận!');
                } else if (isLocked) {
                  e.preventDefault();
                  toast.error('Lớp học đã bị khóa bởi Quản trị viên hệ thống.');
                } else if (isClosed) {
                  e.preventDefault();
                  toast.warning('Lớp học đã bị đóng, không thể truy cập.');
                } else {
                  navigate(`/classrooms/${cls._id}`);
                }
              }}
              style={{ cursor: (isPending || isLocked || isClosed) ? "not-allowed" : "pointer" }}
            >
              <div className={styles.cardTop}>
                <div className="flex items-center gap-2">
                  <span className={styles.subjectTag}>{cls.subject || 'Môn học chung'}</span>
                  {isPending ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f47c20]/10 border border-[#f47c20]/30 text-[#d66b1a] font-bold text-[10px] shadow-[0_0_8px_rgba(244,124,32,0.25)]">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f47c20] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f47c20]"></span>
                      </span>
                      <span className="uppercase tracking-wider whitespace-nowrap">Chờ duyệt</span>
                    </div>
                  ) : isLocked ? (
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 uppercase whitespace-nowrap">Đã khóa</span>
                  ) : isClosed ? (
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-300 uppercase whitespace-nowrap">Đã đóng</span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 uppercase whitespace-nowrap">Hoạt động</span>
                  )}
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {!isPending && !isLocked && (
                    <StudentActionMenu
                      onEnterClass={() => navigate(`/classrooms/${cls._id}`)}
                      onViewActivities={() => navigate(`/classrooms/${cls._id}?tab=activities`)}
                      onViewMembers={() => navigate(`/classrooms/${cls._id}?tab=members`)}
                      onViewGrades={() => navigate(`/grades`)}
                    />
                  )}
                </div>
              </div>

              <div className={styles.cardMiddle}>
                <h3 className={styles.classTitle} title={cls.className}>{cls.className}</h3>
                <div className={styles.teacherInfo}>
                  <User size={15} weight="bold" className="text-[#2f8fa3]" />
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

              {isPending ? (
                <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900 flex items-center gap-2 my-2">
                  <LockKey size={16} className="text-amber-600 shrink-0" weight="bold" />
                  <span>Vui lòng chờ giáo viên xác nhận để tham gia bài học.</span>
                </div>
              ) : (
                <div className={styles.cardProgress}>
                  <div className={styles.progressText}>
                    <span>Số buổi có mặt</span>
                    <span className={styles.progressVal}>
                      {cls.totalSessions > 0 ? `${cls.presentSessions}/${cls.totalSessions} buổi` : "Chưa có buổi nào"}
                    </span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <AnimatedProgressBar
                      progress={cls.attendanceRate}
                      height="100%"
                      barColor="linear-gradient(90deg, #2f8fa3, #43a3b7)"
                    />
                  </div>
                </div>
              )}

              {isPending ? (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 text-[11px] text-slate-400 font-mono">
                  <span>Mã: {cls.code || 'N/A'}</span>
                  <span>Xin vào: {cls.requestedAt ? new Date(cls.requestedAt).toLocaleDateString("vi-VN") : 'Gần đây'}</span>
                </div>
              ) : (
                <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.enterBtn}
                    onClick={() => {
                      if (isLocked || isClosed) return;
                      navigate(`/classrooms/${cls._id}`);
                    }}
                    title="Vào lớp"
                  >
                    <Chalkboard size={15} weight="bold" />
                    <span>Vào lớp</span>
                  </button>
                  <button
                    type="button"
                    className={styles.quickActionBtn}
                    onClick={() => {
                      if (isLocked || isClosed) return;
                      navigate(`/classrooms/${cls._id}?tab=activities`);
                    }}
                    title="Bài tập"
                  >
                    <ClipboardText size={15} weight="bold" />
                    <span>Bài tập</span>
                  </button>
                  <button
                    type="button"
                    className={styles.quickActionBtn}
                    onClick={() => {
                      if (isLocked || isClosed) return;
                      navigate(`/classrooms/${cls._id}?tab=members`);
                    }}
                    title="Thành viên"
                  >
                    <Users size={15} weight="bold" />
                    <span>Thành viên ({cls.studentCount || 0})</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredClassrooms.length === 0 && (
          <div className={styles.emptyStateCard}>
            <div className={styles.emptyIconBox}>
              <MagnifyingGlass size={32} weight="bold" className="text-slate-400" />
            </div>
            <h4>Không tìm thấy lớp học</h4>
            <p>Không tìm thấy lớp học nào khớp với từ khóa tìm kiếm hoặc bộ lọc của bạn.</p>
          </div>
        )}
      </div>

      {/* PAGINATION TOOLBAR */}
      {totalPages > 0 && filteredClassrooms.length > 0 && (
        <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-transparent mt-6 mb-8">
          <Pagination.Summary className="text-sm text-slate-500 font-medium">
            Hiển thị {startIdx} đến {endIdx} trong số {filteredClassrooms.length} lớp học
          </Pagination.Summary>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Pagination.PreviousIcon />
                Trang trước
              </Pagination.Previous>
            </Pagination.Item>
            {pages.map((p) => (
              <Pagination.Item key={p}>
                <Pagination.Link
                  isActive={p === page}
                  onPress={() => setPage(p)}
                  className={p === page ? "bg-primary text-white font-bold border-primary" : "text-slate-600 font-medium hover:bg-slate-100"}
                >
                  {p}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={page === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Trang sau
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
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
