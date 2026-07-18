import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Compass,
  Flask,
  Book,
  ArrowRight,
  CheckCircle,
  Clock,
  Warning,
  Brain,
  Notebook,
  Lightbulb,
  Target,
  MagnifyingGlass,
  Funnel,
  CaretDown,
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { gradebookService } from "../../../service/gradebook.service.ts";
import styles from "./StudentAssignments.module.scss";

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await gradebookService.getStudentAssignments();
        if (res && res.data) {
          const mapped = res.data.map((assign: any) => ({
            ...assign,
            deadline: assign.dueDate || assign.deadline
          }));
          mapped.sort(
            (a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
          setAssignments(mapped);
        }
      } catch (err) {
        console.error("Không thể tải danh sách bài tập", err);
      }
    };
    fetchAssignments();
  }, []);

  const getStatus = (assign: any) => {
    if (assign.submission?.status === "graded") return "graded";
    if (assign.submission) return "submitted";
    const diff = new Date(assign.deadline).getTime() - Date.now();
    if (diff < 0) return "late";
    if (diff < 3 * 24 * 60 * 60 * 1000) return "urgent"; // Dưới 3 ngày
    return "pending";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "graded": return "Đã chấm điểm";
      case "submitted": return "Đã nộp";
      case "late": return "Quá hạn";
      case "urgent": return "Sắp đến hạn";
      default: return "Chưa nộp";
    }
  };

  const getAssignmentIcon = (type: string) => {
    if (!type) return <Notebook size={22} weight="duotone" />;
    const t = type.toLowerCase();
    if (t.includes("quiz")) return <Brain size={22} weight="duotone" />;
    return <Notebook size={22} weight="duotone" />;
  };

  const getAssignmentColorClass = (type: string) => {
    return styles.default; // Luôn dùng màu gradient của thương hiệu (Cam San Hô) để đồng bộ
  };

  const formatDeadline = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} • ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `Còn ${days} ngày`;
    return `Còn ${hours} giờ`;
  };

  const classesList = Array.from(new Set(assignments.map(a => a.className))).filter(Boolean);

  const filteredAssignments = assignments.filter((a) => {
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterClass !== "all" && a.className !== filterClass) return false;
    if (filterType !== "all" && (a.type || "").toLowerCase() !== filterType) return false;
    return true;
  });

  const urgent = filteredAssignments.filter((a) => getStatus(a) === "urgent");
  const pending = filteredAssignments.filter((a) => getStatus(a) === "pending");
  const late = filteredAssignments.filter((a) => getStatus(a) === "late");
  const submitted = filteredAssignments.filter((a) => getStatus(a) === "submitted");
  const graded = filteredAssignments.filter((a) => getStatus(a) === "graded");

  const renderAssignmentCard = (assign: any) => {
    const status = getStatus(assign);
    const timeLeft = getTimeLeft(assign.deadline);
    const isDone = status === "submitted" || status === "graded";
    
    return (
      <div
        key={assign._id}
        className={`${styles.assignCard} group hover:shadow-lg hover:border-[#FE6747]/30 transition-all duration-300 ${status === "late" ? styles.lateCard : ""} ${isDone ? styles.doneCard : ""}`}
        onClick={() => navigate(`/assignments/${assign._id}`)}
      >
        <div className={`${styles.subjectIcon} ${getAssignmentColorClass(assign.type)}`}>
          {getAssignmentIcon(assign.type)}
        </div>
        <div className={styles.cardInfo}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-[#FE6747]/10 text-[#FE6747] border border-[#FE6747]/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm">
              {assign.className}
            </span>
            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm">
              {assign.type?.toLowerCase() === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}
            </span>
          </div>
          <h4 className={styles.cardTitle}>{assign.title}</h4>
          <div className={styles.cardMeta}>
            <Clock size={13} />
            <span>Hạn: {formatDeadline(assign.deadline)}</span>
            {!isDone && timeLeft && <span className={`${styles.timeBadge} ${styles.urgent}`}>{timeLeft}</span>}
            {!isDone && !timeLeft && <span className={`${styles.timeBadge} ${styles.overdue}`}>Quá hạn</span>}
          </div>
        </div>
        {status === "graded" ? (
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#FE6747]">{assign.submission?.grade || 0}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Điểm</span>
            </div>
            <div className="flex text-amber-400 text-xs mb-1 tracking-widest">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>{i < Math.round((assign.submission?.grade || 0) / 2) ? '★' : '☆'}</span>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2 group-hover:text-[#FE6747] group-hover:decoration-[#FE6747] transition-all cursor-pointer">
              Xem chi tiết
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            {isDone ? (
              <CheckCircle size={18} className="text-[#10B981]" />
            ) : (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'late' ? 'bg-[#EF4444]' : 'bg-[#f59e0b]'}`} />
            )}
            <span className={`text-[12.5px] font-bold whitespace-nowrap transition-colors duration-300 ${!isDone ? 'text-slate-500 group-hover:text-[#FE6747]' : 'text-slate-500'}`}>
              {getStatusLabel(status)}
            </span>
            <ArrowRight size={16} className={`transition-all duration-300 ${!isDone ? 'text-slate-400 group-hover:text-[#FE6747] group-hover:translate-x-1' : 'text-slate-400'}`} />
          </div>
        )}
      </div>
    );
  };

  const renderList = (list: any[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <p>{emptyMessage}</p>
        </div>
      );
    }
    return (
      <div className={styles.assignmentList}>
        {list.map(renderAssignmentCard)}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Bài tập của tôi</h2>
          <p>Theo dõi và hoàn thành các bài tập được giao</p>
        </div>
      </div>

      {/* Bộ lọc nâng cao */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm mt-1 mb-6">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex-grow">
          <MagnifyingGlass size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm tên bài tập..." 
            className="bg-transparent border-none outline-none w-full text-sm text-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 outline-none font-medium hover:bg-slate-100 transition-colors min-w-[140px] h-[42px] cursor-pointer">
              {filterType === "all" ? "Môn học (Tất cả)" : (filterType === "quiz" ? "Trắc nghiệm" : "Tự luận")}
              <CaretDown size={14} className="text-slate-500" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem className="cursor-pointer" onClick={() => setFilterType("all")}>Môn học (Tất cả)</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setFilterType("quiz")}>Trắc nghiệm</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setFilterType("essay")}>Tự luận</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 outline-none font-medium hover:bg-slate-100 transition-colors min-w-[140px] h-[42px] cursor-pointer">
              <span className="truncate max-w-[120px]">{filterClass === "all" ? "Lớp học (Tất cả)" : filterClass}</span>
              <CaretDown size={14} className="text-slate-500 flex-shrink-0" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem className="cursor-pointer" onClick={() => setFilterClass("all")}>Lớp học (Tất cả)</DropdownMenuItem>
              {classesList.map(cls => (
                <DropdownMenuItem className="cursor-pointer" key={String(cls)} onClick={() => setFilterClass(String(cls))}>{cls}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-[#FE6747] text-sm rounded-lg px-4 py-2.5 outline-none font-bold hover:bg-orange-50 transition-colors min-w-[160px] h-[42px] cursor-pointer">
              <span className="truncate">
                {[
                  { id: "all", label: "📌 Tất cả trạng thái" },
                  { id: "urgent", label: "⏳ Sắp đến hạn" },
                  { id: "late", label: "❌ Quá hạn" },
                  { id: "pending", label: "📝 Chưa nộp" },
                  { id: "submitted", label: "✅ Đã nộp" },
                  { id: "graded", label: "⭐ Đã chấm điểm" },
                ].find(o => o.id === activeTab)?.label || "Trạng thái"}
              </span>
              <CaretDown size={14} className="text-[#FE6747] flex-shrink-0" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {[
                { id: "all", label: "📌 Tất cả trạng thái", count: filteredAssignments.length },
                { id: "urgent", label: "⏳ Sắp đến hạn", count: urgent.length },
                { id: "late", label: "❌ Quá hạn", count: late.length },
                { id: "pending", label: "📝 Chưa nộp", count: pending.length },
                { id: "submitted", label: "✅ Đã nộp", count: submitted.length },
                { id: "graded", label: "⭐ Đã chấm điểm", count: graded.length },
              ].map(opt => (
                <DropdownMenuItem key={opt.id} onClick={() => setActiveTab(opt.id)} className="flex justify-between items-center cursor-pointer">
                  <span className={activeTab === opt.id ? "font-bold text-[#FE6747]" : ""}>{opt.label}</span>
                  {opt.count > 0 && (
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{opt.count}</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="outline-none">
        {activeTab === "all" && renderList(filteredAssignments, "Chưa có bài tập nào thoả mãn bộ lọc")}
        {activeTab === "urgent" && renderList(urgent, "Không có bài tập nào sắp đến hạn")}
        {activeTab === "late" && renderList(late, "Tuyệt vời! Không có bài nào bị quá hạn")}
        {activeTab === "pending" && renderList(pending, "Không có bài tập nào chưa nộp")}
        {activeTab === "submitted" && renderList(submitted, "Chưa có bài tập nào đang chờ chấm")}
        {activeTab === "graded" && renderList(graded, "Chưa có bài tập nào được chấm điểm")}
      </div>
    </div>
  );
}
