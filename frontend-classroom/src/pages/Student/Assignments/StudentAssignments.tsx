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
import { SecondaryButton } from "../../../components/ui/Buttons/SecondaryButton";
import { gradebookService } from "../../../service/gradebook.service.ts";
import styles from "./StudentAssignments.module.scss";

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [filterClass, setFilterClass] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterClass, filterType, searchQuery]);

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
        className={`${styles.assignCard} group ${status === "late" ? styles.lateCard : ""} ${isDone ? styles.doneCard : ""} tour-step-assign-card`}
        onClick={() => navigate(`/assignments/${assign._id}`)}
      >
        <div className="flex justify-between items-start w-full mb-4">
          <div className="flex gap-1.5 flex-wrap">
            <span className="bg-[#FE6747]/10 text-[#FE6747] border border-[#FE6747]/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm w-fit whitespace-nowrap">
              {assign.className}
            </span>
            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm w-fit whitespace-nowrap">
              {assign.type?.toLowerCase() === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-full border border-slate-200 shadow-sm flex-shrink-0">
             {isDone ? (
              <CheckCircle size={14} className="text-[#10B981]" weight="bold" />
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'late' ? 'bg-[#EF4444]' : 'bg-[#f59e0b]'}`} />
            )}
            <span className={`text-[11px] font-bold ${!isDone ? 'text-slate-600 group-hover:text-[#FE6747] transition-colors' : 'text-slate-500'}`}>
              {getStatusLabel(status)}
            </span>
          </div>
        </div>

        <h4 className={`${styles.cardTitle} mb-4`}>{assign.title}</h4>

        <div className="flex flex-col mt-auto pt-4 border-t border-slate-100 gap-3">
          <div className={`${styles.cardMeta} flex-wrap`}>
            <Clock size={14} className="text-slate-400" />
            <span className="text-[12px] font-medium">Hạn: {formatDeadline(assign.deadline)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              {!isDone && timeLeft && <span className={`${styles.timeBadge} ${styles.urgent} whitespace-nowrap inline-block`}>{timeLeft}</span>}
              {!isDone && !timeLeft && <span className={`${styles.timeBadge} ${styles.overdue} whitespace-nowrap inline-block`}>Quá hạn</span>}
            </div>

            <div className="flex items-center gap-2">
              {status === "graded" ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#FE6747]">{assign.submission?.grade || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm</span>
                </div>
              ) : (
                <SecondaryButton className="!text-[11px] !px-4 !py-2 !font-bold">
                  {isDone ? "Xem chi tiết" : "Làm bài ngay"}
                </SecondaryButton>
              )}
            </div>
          </div>
        </div>
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
    
    const totalPages = Math.ceil(list.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedList = list.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="flex flex-col gap-6">
        <div className={styles.assignmentList}>
          {paginatedList.map(renderAssignmentCard)}
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-2 mb-8">
            <button 
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-[#FE6747] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        )}
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
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex-grow tour-step-search">
          <MagnifyingGlass size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm tên bài tập..." 
            className="bg-transparent border-none outline-none w-full text-sm text-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3 tour-step-filters">
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
