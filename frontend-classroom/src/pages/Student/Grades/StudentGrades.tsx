import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@heroui/react";
import { io } from "socket.io-client";
import {
  ChartBar,
  Notebook,
  Star,
  Trophy,
  Target,
  CaretDown,
  CaretUp,
  ChatTeardropText,
  ArrowRight,
  CalendarCheck,
  Warning,
  MagnifyingGlass,
  Medal,
  Sparkle,
  TrendUp,
  TrendDown,
  BookOpen
} from "phosphor-react";
import { gradebookService } from "../../../service/gradebook.service.ts";
import { classroomService, type ITeacherClassroom } from "../../../service/classroom.service.ts";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import styles from "./StudentGrades.module.scss";
import vars from "../../../components/Styles/variables.module.scss";

export default function StudentGrades() {
  const navigate = useNavigate();
  const toast = useToast();
  const [gradedAssignments, setGradedAssignments] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<ITeacherClassroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [newlyGradedIds, setNewlyGradedIds] = useState<Set<string>>(new Set());

  // Filter & Pagination States
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClassId, activeFilter, statusFilter, searchTerm]);

  // Tải danh sách lớp học sinh tham gia
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await classroomService.getStudentClassrooms();
        if (res && res.data) {
          setClassrooms(res.data);
        }
      } catch (e) {
        console.error("Không thể tải danh sách lớp học sinh", e);
      }
    };
    fetchClassrooms();
  }, []);

  const fetchGrades = useCallback(async (isRealtimeUpdate = false) => {
    try {
      const res = await gradebookService.getStudentAssignments();
      if (res && res.data) {
        const sorted = [...res.data].sort((a: any, b: any) => {
          const timeA = new Date(a.createdAt || a.dueDate || 0).getTime();
          const timeB = new Date(b.createdAt || b.dueDate || 0).getTime();
          return timeB - timeA;
        });
        setAllAssignments(sorted);
        const graded = sorted.filter((assign: any) => assign.submission?.status === "graded");
        graded.sort(
          (a: any, b: any) => new Date(b.submission?.gradedAt || 0).getTime() - new Date(a.submission?.gradedAt || 0).getTime()
        );
        setGradedAssignments(graded);

        if (isRealtimeUpdate) {
          toast.success("⚡ Bài tập của bạn vừa được giáo viên chấm điểm!");
        }
      }
    } catch (err) {
      console.error("Không thể tải bảng điểm", err);
    }
  }, [toast]);

  useEffect(() => {
    fetchGrades();

    // Socket.io Realtime Listener
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const socket = io(backendUrl, { withCredentials: true });

    socket.on("submission_update", (data?: { assignmentId?: string }) => {
      console.log("⚡ [Socket.io Realtime] Cập nhật bảng điểm học sinh...");
      if (data?.assignmentId) {
        setNewlyGradedIds((prev) => new Set(prev).add(data.assignmentId!));
      }
      fetchGrades(true);
    });

    socket.on("classroom_feed_update", () => {
      fetchGrades();
    });

    socket.on("student_classrooms_update", () => {
      fetchGrades();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchGrades]);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  // Lọc bài tập theo Lớp học được chọn
  const selectedClass = classrooms.find(c => c._id === selectedClassId);
  const classFilteredAssignments = allAssignments.filter((a: any) => {
    if (selectedClassId === "all") return true;
    const cId = typeof a.classId === 'object' ? a.classId?._id : a.classId;
    return String(cId) === selectedClassId || a.className === selectedClass?.name;
  });

  const classGradedAssignments = classFilteredAssignments.filter((assign: any) => assign.submission?.status === "graded");

  // Tính toán GPA & Thống kê theo Lớp
  const totalScore = classGradedAssignments.reduce((sum, curr) => sum + (curr.submission?.grade || 0), 0);
  const totalMaxScore = classGradedAssignments.reduce((sum, curr) => sum + (curr.maxScore || 10), 0);
  const gpa10Scale = classGradedAssignments.length > 0 ? (totalScore / totalMaxScore) * 10 : 0;

  let gpaColor = vars.success;
  let gpaRank = "Giỏi";
  if (gpa10Scale < 5.0) {
    gpaColor = vars.danger;
    gpaRank = "Yếu";
  } else if (gpa10Scale < 8.0) {
    gpaColor = vars.warning;
    gpaRank = "Khá";
  }

  // Tỷ lệ hoàn thành
  const completedCount = classFilteredAssignments.filter(a => a.submission).length;
  const totalCount = classFilteredAssignments.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Điểm cao nhất & Điểm thấp nhất
  let highestScore = 0;
  let lowestScore = 10;
  if (classGradedAssignments.length > 0) {
    highestScore = Math.max(...classGradedAssignments.map((a: any) => a.submission?.grade ?? 0));
    lowestScore = Math.min(...classGradedAssignments.map((a: any) => a.submission?.grade ?? 10));
  } else {
    highestScore = 0;
    lowestScore = 0;
  }

  // Số lớp / môn đang học
  const enrolledClassCount = selectedClassId === "all" ? (classrooms.length || 1) : 1;

  // Mức độ tiến bộ (Tính tự động từ 2 bài chấm gần nhất từ API)
  let trendDiff = 0;
  if (classGradedAssignments.length >= 2) {
    const g1 = classGradedAssignments[0]?.submission?.grade || 0;
    const g2 = classGradedAssignments[1]?.submission?.grade || 0;
    trendDiff = Number((g1 - g2).toFixed(1));
  }

  // Thứ hạng học tập (Tính tự động theo GPA từ API)
  let rankTopText = "--";
  let rankSubText = "Chưa xếp hạng";
  let rankDesc = `Đã nộp ${completedCount}/${totalCount} bài tập`;

  if (classGradedAssignments.length > 0) {
    if (gpa10Scale >= 9.0) {
      rankTopText = "Top 5%";
      rankSubText = "Thành tích Xuất sắc";
      rankDesc = `Hoàn thành ${completionRate}% bài tập`;
    } else if (gpa10Scale >= 8.0) {
      rankTopText = "Top 15%";
      rankSubText = "Thành tích Giỏi";
      rankDesc = `Hoàn thành ${completionRate}% bài tập`;
    } else if (gpa10Scale >= 6.5) {
      rankTopText = "Top 35%";
      rankSubText = "Thành tích Khá";
      rankDesc = `Hoàn thành ${completionRate}% bài tập`;
    } else {
      rankTopText = "Top 50%";
      rankSubText = "Cần cố gắng thêm";
      rankDesc = `Hoàn thành ${completionRate}% bài tập`;
    }
  }

  // Tính tổng hợp điểm theo từng Môn/Lớp học
  const classSummaries: any[] = [];

  if (classrooms.length > 0) {
    classrooms.forEach((cls) => {
      const classAssigns = allAssignments.filter((a: any) => {
        const cId = typeof a.classId === 'object' ? a.classId?._id : a.classId;
        return String(cId) === cls._id || a.className === cls.name;
      });

      const gradedAssigns = classAssigns.filter((a: any) => a.submission?.status === "graded");
      const totalScore = gradedAssigns.reduce((sum: number, curr: any) => sum + (curr.submission?.grade || 0), 0);
      const totalMax = gradedAssigns.reduce((sum: number, curr: any) => sum + (curr.maxScore || 10), 0);
      const gpa = gradedAssigns.length > 0 ? (totalScore / totalMax) * 10 : 0;

      let highest = 0;
      if (gradedAssigns.length > 0) {
        highest = Math.max(...gradedAssigns.map((a: any) => a.submission?.grade ?? 0));
      }

      let rankText = "Chưa có điểm";
      let rankColor = "bg-slate-100 text-slate-600 border-slate-200/90";

      if (gradedAssigns.length > 0) {
        if (gpa >= 9.0) {
          rankText = "Xuất sắc";
          rankColor = "bg-emerald-50 text-emerald-700 border-emerald-200/90";
        } else if (gpa >= 8.0) {
          rankText = "Giỏi";
          rankColor = "bg-sky-50 text-sky-700 border-sky-200/90";
        } else if (gpa >= 6.5) {
          rankText = "Khá";
          rankColor = "bg-amber-50 text-amber-800 border-amber-200/90";
        } else {
          rankText = "Cần cố gắng";
          rankColor = "bg-rose-50 text-rose-700 border-rose-200/90";
        }
      }

      classSummaries.push({
        classId: cls._id,
        className: cls.name,
        subject: cls.subject || "Chung",
        gpa,
        highest,
        gradedCount: gradedAssigns.length,
        totalCount: classAssigns.length,
        rankText,
        rankColor,
      });
    });
  }

  // Fallback nếu không có danh sách lớp từ API nhưng có bài tập
  if (classSummaries.length === 0 && allAssignments.length > 0) {
    const groupedByName: Record<string, any[]> = {};
    allAssignments.forEach((a: any) => {
      const name = a.className || "Môn học chung";
      if (!groupedByName[name]) groupedByName[name] = [];
      groupedByName[name].push(a);
    });

    Object.entries(groupedByName).forEach(([name, classAssigns]) => {
      const gradedAssigns = classAssigns.filter((a: any) => a.submission?.status === "graded");
      const totalScore = gradedAssigns.reduce((sum: number, curr: any) => sum + (curr.submission?.grade || 0), 0);
      const totalMax = gradedAssigns.reduce((sum: number, curr: any) => sum + (curr.maxScore || 10), 0);
      const gpa = gradedAssigns.length > 0 ? (totalScore / totalMax) * 10 : 0;

      let highest = 0;
      if (gradedAssigns.length > 0) {
        highest = Math.max(...gradedAssigns.map((a: any) => a.submission?.grade ?? 0));
      }

      let rankText = "Chưa có điểm";
      let rankColor = "bg-slate-100 text-slate-600 border-slate-200/90";

      if (gradedAssigns.length > 0) {
        if (gpa >= 9.0) {
          rankText = "Xuất sắc";
          rankColor = "bg-emerald-50 text-emerald-700 border-emerald-200/90";
        } else if (gpa >= 8.0) {
          rankText = "Giỏi";
          rankColor = "bg-sky-50 text-sky-700 border-sky-200/90";
        } else if (gpa >= 6.5) {
          rankText = "Khá";
          rankColor = "bg-amber-50 text-amber-800 border-amber-200/90";
        } else {
          rankText = "Cần cố gắng";
          rankColor = "bg-rose-50 text-rose-700 border-rose-200/90";
        }
      }

      classSummaries.push({
        classId: name,
        className: name,
        subject: "Chung",
        gpa,
        highest,
        gradedCount: gradedAssigns.length,
        totalCount: classAssigns.length,
        rankText,
        rankColor,
      });
    });
  }

  // Dữ liệu biểu đồ điểm số theo thời gian
  const chartData = classGradedAssignments
    .slice()
    .sort((a, b) => new Date(a.submission?.gradedAt || a.submission?.submittedAt || a.createdAt || 0).getTime() - new Date(b.submission?.gradedAt || b.submission?.submittedAt || b.createdAt || 0).getTime())
    .map((assign) => ({
      name: assign.title.length > 14 ? assign.title.substring(0, 14) + "..." : assign.title,
      fullTitle: assign.title,
      score: assign.submission?.grade ?? 0,
      maxScore: assign.maxScore || 10,
      date: formatDate(assign.submission?.submittedAt || assign.deadline),
      className: assign.className || "Môn học",
    }));

  // Trạng thái xu hướng (📈 Tăng / → Ổn định / 📉 Giảm)
  let trendIcon = "📈";
  let trendLabel = "Đang tăng";
  let trendBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200/90";

  if (chartData.length >= 2) {
    const recent = chartData[chartData.length - 1].score;
    const previous = chartData[chartData.length - 2].score;
    const diff = Number((recent - previous).toFixed(1));
    if (diff > 0.3) {
      trendIcon = "📈";
      trendLabel = `Đang tăng (+${diff}đ)`;
      trendBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200/90";
    } else if (diff < -0.3) {
      trendIcon = "📉";
      trendLabel = `Đang giảm (${diff}đ)`;
      trendBadgeClass = "bg-rose-50 text-rose-700 border-rose-200/90";
    } else {
      trendIcon = "→";
      trendLabel = "Ổn định";
      trendBadgeClass = "bg-sky-50 text-sky-700 border-sky-200/90";
    }
  } else if (chartData.length === 1) {
    trendIcon = "📈";
    trendLabel = "Tốt (1 bài đã chấm)";
    trendBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200/90";
  } else {
    trendIcon = "→";
    trendLabel = "Chưa có dữ liệu";
    trendBadgeClass = "bg-slate-100 text-slate-600 border-slate-200/90";
  }

  // Lọc danh sách bài tập theo tìm kiếm & loại bài & trạng thái
  const filteredAssignments = classFilteredAssignments.filter(a => {
    if (searchTerm && !a.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (activeFilter === "homework" && a.type?.toLowerCase() !== "essay") return false;
    if (activeFilter === "exam" && a.type?.toLowerCase() !== "quiz") return false;

    const isGraded = a.submission?.status === "graded";
    const hasSubmitted = !!a.submission;
    const isPastDeadline = a.deadline && new Date(a.deadline).getTime() < Date.now();

    if (statusFilter === "graded" && !isGraded) return false;
    if (statusFilter === "submitted" && (!hasSubmitted || isGraded)) return false;
    if (statusFilter === "pending" && (hasSubmitted || isPastDeadline)) return false;
    if (statusFilter === "late" && (hasSubmitted || !isPastDeadline)) return false;

    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getClassChipStyle = (classNameStr?: string) => {
    const name = (classNameStr || "").toLowerCase();
    if (name.includes("toán") || name.includes("math")) {
      return "bg-orange-50 text-orange-700 border-orange-200/90";
    }
    if (name.includes("luyện thi") || name.includes("đại học") || name.includes("ôn")) {
      return "bg-purple-50 text-purple-700 border-purple-200/90";
    }
    if (name.includes("lý") || name.includes("vật lý") || name.includes("physics")) {
      return "bg-blue-50 text-blue-700 border-blue-200/90";
    }
    if (name.includes("hóa") || name.includes("chemistry")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/90";
    }
    if (name.includes("văn") || name.includes("ngữ văn")) {
      return "bg-rose-50 text-rose-700 border-rose-200/90";
    }
    if (name.includes("anh") || name.includes("english")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200/90";
    }
    return "bg-cyan-50 text-cyan-800 border-cyan-200/90";
  };

  return (
    <div className={styles.page}>
      {/* HEADER BANNER CÓ BỘ LỌC NẰM BÊN PHẢI */}
      <div className={styles.pageHeader}>
        <div className="flex flex-col gap-1">
          <h2>Kết quả Học tập</h2>
          <p>Tổng quan kết quả học tập, điểm số trung bình và xếp loại chi tiết</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* BỘ LỌC CHỌN LỚP HỌC (BÊN PHẢI) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 px-4.5 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-sm font-extrabold text-slate-800 hover:bg-slate-50 hover:border-[#f47c20] shadow-sm hover:shadow-md cursor-pointer transition-all outline-none focus:ring-2 focus:ring-[#f47c20]/20">
              <BookOpen size={18} className="text-[#f47c20]" weight="bold" />
              <span>
                {selectedClassId === "all"
                  ? "Tất cả lớp học"
                  : selectedClass?.name || "Lớp học"}
              </span>
              <CaretDown size={15} className="text-slate-400" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
              <DropdownMenuItem
                onClick={() => setSelectedClassId("all")}
                className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${selectedClassId === "all" ? "bg-orange-50 text-[#f47c20]" : "text-slate-700 hover:bg-slate-50"}`}
              >
                Tất cả lớp học
              </DropdownMenuItem>
              {classrooms.map((c) => (
                <DropdownMenuItem
                  key={c._id}
                  onClick={() => setSelectedClassId(c._id)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${selectedClassId === c._id ? "bg-orange-50 text-[#f47c20]" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {c.name} ({c.subject || "Chung"})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* TRỌNG TÂM KẾT QUẢ HỌC TẬP (4 PASTELL CARDS CHUẨN DESIGN) */}
      <div className={styles.heroBanner}>
        {/* CARD 1: ĐIỂM TRUNG BÌNH (XANH LÁ PASTEL) */}
        <div className={styles.cardGreen}>
          <div className={styles.cardTopRow}>
            <span className={styles.cardGreenLabel}>ĐIỂM TRUNG BÌNH</span>
            <div className={styles.whiteCircleIcon}>
              <Star size={20} weight="fill" className="text-emerald-600" />
            </div>
          </div>
          <div className={styles.cardValue}>{gpa10Scale.toFixed(1)}</div>
          <div className={styles.cardSubTextGreen}>
            <span>↗ {gpaRank} học tập</span>
            <span className={styles.cardDesc}>
              {trendDiff >= 0 ? `+${trendDiff}đ` : `${trendDiff}đ`} so với kỳ trước
            </span>
          </div>
        </div>

        {/* CARD 2: ĐIỂM THẤP NHẤT (CAM/VÀNG PASTEL) */}
        <div className={styles.cardYellow}>
          <div className={styles.cardTopRow}>
            <span className={styles.cardYellowLabel}>ĐIỂM THẤP NHẤT</span>
            <div className={styles.whiteCircleIcon}>
              <Target size={20} weight="fill" className="text-amber-700" />
            </div>
          </div>
          <div className={styles.cardValue}>{lowestScore}</div>
          <div className={styles.cardSubTextYellow}>
            <span>↗ Cần cải thiện</span>
            <span className={styles.cardDesc}>
              {classGradedAssignments.length > 0 ? "Mức điểm cần chú ý làm lại" : "Chưa có bài nào bị điểm kém"}
            </span>
          </div>
        </div>

        {/* CARD 3: SỐ MÔN / LỚP ĐANG HỌC (XANH DƯƠNG PASTEL) */}
        <div className={styles.cardBlue}>
          <div className={styles.cardTopRow}>
            <span className={styles.cardBlueLabel}>LỚP / MÔN ĐANG HỌC</span>
            <div className={styles.whiteCircleIcon}>
              <BookOpen size={20} weight="bold" className="text-blue-600" />
            </div>
          </div>
          <div className={styles.cardValue}>{enrolledClassCount}</div>
          <div className={styles.cardSubTextBlue}>
            <span>↗ Lớp học của bạn</span>
            <span className={styles.cardDesc}>
              {totalCount} bài tập / đầu điểm
            </span>
          </div>
        </div>

        {/* CARD 4: THỨ HẠNG LỚP HỌC (HỒNG/TÍM PASTEL) */}
        <div className={styles.cardPink}>
          <div className={styles.cardTopRow}>
            <span className={styles.cardPinkLabel}>THỨ HẠNG LỚP HỌC</span>
            <div className={styles.whiteCircleIcon}>
              <Medal size={20} weight="fill" className="text-pink-600" />
            </div>
          </div>
          <div className={styles.cardValue}>{rankTopText}</div>
          <div className={styles.cardSubTextPink}>
            <span>↗ {rankSubText}</span>
            <span className={styles.cardDesc}>
              {rankDesc}
            </span>
          </div>
        </div>
      </div>

      {/* BẢNG ĐIỂM CHI TIẾT - CÁC LẦN ĐÁNH GIÁ / ĐẦU ĐIỂM */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Bảng điểm chi tiết</h3>
          <div className={styles.tableFilters}>
            <div className={styles.searchBox}>
              <MagnifyingGlass size={18} weight="bold" color={vars.textSub} />
              <input
                type="text"
                placeholder="Tìm kiếm bài tập..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className={styles.filterSelect}>
                {activeFilter === "all" ? "Tất cả loại bài" : activeFilter === "homework" ? "Bài tự luận" : "Bài trắc nghiệm"}
                <CaretDown size={14} weight="bold" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                <DropdownMenuRadioGroup value={activeFilter} onValueChange={setActiveFilter}>
                  <DropdownMenuRadioItem value="all" className="cursor-pointer font-medium whitespace-nowrap">Tất cả loại bài</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="homework" className="cursor-pointer font-medium whitespace-nowrap">Bài tự luận</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="exam" className="cursor-pointer font-medium whitespace-nowrap">Bài trắc nghiệm</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className={styles.filterSelect}>
                {statusFilter === "all"
                  ? "Tất cả trạng thái"
                  : statusFilter === "graded"
                  ? "Đã chấm"
                  : statusFilter === "submitted"
                  ? "Chờ chấm"
                  : statusFilter === "pending"
                  ? "Chưa nộp"
                  : "Quá hạn"}
                <CaretDown size={14} weight="bold" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                  <DropdownMenuRadioItem value="all" className="cursor-pointer font-medium whitespace-nowrap">Tất cả trạng thái</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="graded" className="cursor-pointer font-medium whitespace-nowrap">Đã chấm</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="submitted" className="cursor-pointer font-medium whitespace-nowrap">Chờ chấm (Đã nộp)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending" className="cursor-pointer font-medium whitespace-nowrap">Chưa nộp</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="late" className="cursor-pointer font-medium whitespace-nowrap">Quá hạn</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* TIÊU ĐỀ CỘT CHO BẢNG ĐIỂM CHI TIẾT */}
        <div className={styles.gradeTableHeader}>
          <div>Tên bài tập</div>
          <div>Loại bài</div>
          <div>Ngày nộp</div>
          <div>Điểm số</div>
          <div>Trạng thái</div>
          <div className="text-right">Nhận xét</div>
        </div>

        <div className={styles.tableBody}>
          {(() => {
            const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage);

            if (filteredAssignments.length === 0) {
              return (
                <div className={styles.emptyState}>
                  <ChartBar size={64} className={styles.emptyIcon} weight="duotone" />
                  <p>Không tìm thấy lần đánh giá nào phù hợp với bộ lọc này.</p>
                </div>
              );
            }

            return (
              <>
                {paginatedAssignments.map((assign) => {
                  const isGraded = assign.submission?.status === "graded";
                  const grade = isGraded ? (assign.submission?.grade || 0) : null;
                  const max = assign.maxScore || 10;
                  const percentage = grade !== null ? (grade / max) * 100 : 0;
                  const isNewlyGraded = newlyGradedIds.has(assign._id);

                  let statusText = "Chưa nộp";
                  let statusChipStyle = "bg-[#fff7ed] text-[#d97706] border-[#fde68a]";

                  if (isGraded) {
                    statusText = "Đã chấm";
                    statusChipStyle = "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
                  } else if (assign.submission) {
                    statusText = "Chờ chấm";
                    statusChipStyle = "bg-[#f0f9fa] text-[#2f8fa3] border-[#b2e0e8]";
                  } else if (assign.deadline && new Date(assign.deadline).getTime() < Date.now()) {
                    statusText = "Quá hạn";
                    statusChipStyle = "bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]";
                  }

                  return (
                    <div key={assign._id} className={`${styles.gradeRowWrapper} ${isNewlyGraded ? styles.glowingNewRow : ""}`}>
                      <div className={styles.gradeRow} onClick={() => toggleExpand(assign._id)}>
                        {/* Cột 1: Tên đánh giá / Đầu điểm */}
                        <div className={styles.rowTitle}>
                          <Notebook size={18} color="#f47c20" weight="duotone" />
                          <span>{assign.title}</span>
                          {isNewlyGraded && (
                            <span className={styles.newBadge}>
                              <Sparkle size={12} weight="fill" /> MỚI CHẤM
                            </span>
                          )}
                        </div>

                        {/* Cột 2: Loại đánh giá (Tự luận: Ocean Blue #2f8fa3, Trắc nghiệm: Primary Orange #f47c20) */}
                        <div>
                          {assign.type?.toLowerCase() === 'quiz' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#fff7ed] text-[#f47c20] border border-[#fed7aa] text-[11px] font-extrabold whitespace-nowrap">
                              Trắc nghiệm
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#f0f9fa] text-[#2f8fa3] border border-[#b2e0e8] text-[11px] font-extrabold whitespace-nowrap">
                              Tự luận
                            </span>
                          )}
                        </div>

                        {/* Cột 4: Ngày nộp & Trễ */}
                        <div className={styles.rowCol}>
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                            <CalendarCheck size={14} className="text-slate-400" />
                            {(assign.submission?.submittedAt || assign.deadline)
                              ? formatDate(assign.submission?.submittedAt || assign.deadline)
                              : "Chưa cập nhật"}
                          </div>
                          {assign.submission?.isLate && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                              <Warning size={14} /> Nộp muộn
                            </div>
                          )}
                        </div>

                        {/* Cột 5: Điểm số */}
                        <div className={styles.rowScore}>
                          {grade !== null ? (
                            <span className="font-bold text-slate-800">{grade} <span style={{ fontSize: '0.82rem', color: vars.textSub, fontWeight: 600 }}>/ {max}</span></span>
                          ) : (
                            <span className="font-semibold text-slate-400">0 <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>/ {max}</span></span>
                          )}
                        </div>

                        {/* Cột 6: Trạng thái */}
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${statusChipStyle}`}>
                            {statusText}
                          </span>
                        </div>

                        {/* Cột 7: Mũi tên mở rộng nhận xét */}
                        <div className={styles.expandIconWrap}>
                          {expandedId === assign._id ? (
                            <CaretUp size={18} weight="bold" />
                          ) : (
                            <CaretDown size={18} weight="bold" />
                          )}
                        </div>
                      </div>

                      {/* VÙNG MỞ RỘNG (EXPANDABLE) */}
                      {expandedId === assign._id && (
                        <div className={styles.expandContent}>
                          <div className={styles.feedbackBox}>
                            <span className={styles.feedbackLabel}>
                              <ChatTeardropText size={16} weight="fill" color="#f59e0b" />
                              Nhận xét của Giáo viên:
                            </span>
                            <p className={styles.feedbackText}>
                              {assign.submission?.feedback || "Giáo viên không để lại nhận xét riêng cho đầu điểm này. Bạn đã làm rất tốt, hãy phát huy ở các bài sau!"}
                            </p>
                          </div>
                          <button
                            type="button"
                            className={styles.btnDetail}
                            onClick={() => navigate(`/assignments/${assign._id}`)}
                          >
                            Xem chi tiết bài làm
                            <ArrowRight size={16} weight="bold" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* KHU VỰC PHÂN TRANG BẢNG ĐIỂM CHI TIẾT (HEROUI STYLED) */}
                {filteredAssignments.length > 0 && (
                  <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-white rounded-b-2xl shadow-3xs mt-2">
                    <Pagination.Summary className="text-sm text-slate-500 font-medium">
                      Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredAssignments.length)} trong số {filteredAssignments.length} kết quả
                    </Pagination.Summary>
                    <Pagination.Content>
                      <Pagination.Item>
                        <Pagination.Previous
                          isDisabled={currentPage === 1}
                          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                          <Pagination.PreviousIcon />
                          Trang trước
                        </Pagination.Previous>
                      </Pagination.Item>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Pagination.Item key={p}>
                          <Pagination.Link
                            isActive={p === currentPage}
                            onPress={() => setCurrentPage(p)}
                            className={p === currentPage ? "bg-[#f47c20] text-white font-bold border-[#f47c20]" : "text-slate-600 font-medium hover:bg-slate-100"}
                          >
                            {p}
                          </Pagination.Link>
                        </Pagination.Item>
                      ))}
                      <Pagination.Item>
                        <Pagination.Next
                          isDisabled={currentPage === totalPages}
                          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Trang sau
                          <Pagination.NextIcon />
                        </Pagination.Next>
                      </Pagination.Item>
                    </Pagination.Content>
                  </Pagination>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
