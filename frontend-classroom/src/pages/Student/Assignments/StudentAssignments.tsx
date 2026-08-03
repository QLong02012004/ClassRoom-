import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowRight,
  CheckCircle,
  Clock,
  Warning,
  Notebook,
  MagnifyingGlass,
  CaretDown,
  Timer,
  Target,
  FileText,
  ListChecks,
  Hourglass,
  XCircle,
  NotePencil,
  Star
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton.tsx";
import { gradebookService } from "../../../service/gradebook.service.ts";
import styles from "./StudentAssignments.module.scss";

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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
      case "submitted": return "Đã nộp bài";
      case "late": return "Quá hạn nộp";
      case "urgent": return "Sắp đến hạn";
      default: return "Chưa nộp bài";
    }
  };

  const formatDeadline = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} • ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return iso;
    }
  };

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `Còn ${days} ngày ${hours}h`;
    return `Còn ${hours}h`;
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

  const statusOptions = [
    { id: "all", label: "Tất cả trạng thái", icon: <ListChecks size={15} weight="duotone" className="text-slate-600" /> },
    { id: "urgent", label: "Sắp đến hạn", icon: <Hourglass size={15} weight="duotone" className="text-amber-500" /> },
    { id: "late", label: "Quá hạn", icon: <XCircle size={15} weight="duotone" className="text-red-500" /> },
    { id: "pending", label: "Chưa nộp", icon: <NotePencil size={15} weight="duotone" className="text-orange-500" /> },
    { id: "submitted", label: "Đã nộp", icon: <CheckCircle size={15} weight="duotone" className="text-teal-600" /> },
    { id: "graded", label: "Đã chấm điểm", icon: <Star size={15} weight="fill" className="text-amber-400" /> },
  ];

  const renderAssignmentCard = (assign: any) => {
    const status = getStatus(assign);
    const timeLeft = getTimeLeft(assign.deadline);
    const isDone = status === "submitted" || status === "graded";
    const isQuiz = (assign.type || "").toLowerCase() === "quiz";

    return (
      <div
        key={assign._id}
        className={`${styles.assignCard} ${status === "late" ? styles.lateCard : ""} ${status === "urgent" ? styles.urgentCard : ""} ${isDone ? styles.doneCard : ""} tour-step-assign-card`}
        onClick={() => navigate(`/assignments/${assign._id}`)}
      >
        <div className={styles.cardMain}>
          {/* Card Top Badges Header */}
          <div className={styles.cardHeaderRow}>
            <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <span className={styles.classBadge}>
                {assign.className}
              </span>
              <span className={styles.typeBadge}>
                {isQuiz ? "Trắc nghiệm" : "Tự luận"}
              </span>
            </div>

            <div className={`${styles.statusBadge} ${styles[status]}`}>
              {status === "late" && (
                <>
                  <XCircle size={13} weight="fill" className="text-red-500 flex-shrink-0" />
                  <span className="whitespace-nowrap">{getStatusLabel(status)}</span>
                </>
              )}
              {status === "urgent" && (
                <>
                  <Hourglass size={13} weight="fill" className="text-amber-500 flex-shrink-0" />
                  <span className="whitespace-nowrap">{timeLeft || getStatusLabel(status)}</span>
                </>
              )}
              {status === "pending" && (
                <>
                  <NotePencil size={13} weight="bold" className="text-slate-500 flex-shrink-0" />
                  <span className="whitespace-nowrap">{getStatusLabel(status)}</span>
                </>
              )}
              {status === "submitted" && (
                <>
                  <CheckCircle size={13} weight="fill" className="text-teal-600 flex-shrink-0" />
                  <span className="whitespace-nowrap">{getStatusLabel(status)}</span>
                </>
              )}
              {status === "graded" && (
                <>
                  <Star size={13} weight="fill" className="text-amber-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">{getStatusLabel(status)}</span>
                </>
              )}
            </div>
          </div>

          {/* Title and Description */}
          <h4 className={styles.cardTitle}>{assign.title}</h4>
          {assign.subject || assign.description ? (
            <p className={styles.cardDesc}>
              {assign.subject ? `Môn: ${assign.subject}` : assign.description}
            </p>
          ) : (
            <p className={styles.cardDesc}>Hoàn thành đúng hạn để nhận điểm XP.</p>
          )}

          {/* Detailed Info Pills Box */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <Clock size={14} weight="bold" />
              <span>Hạn: <strong>{formatDeadline(assign.deadline)}</strong></span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className={styles.metaItem}>
                <Target size={14} weight="bold" />
                <span>Điểm: <strong>{assign.maxScore || 10} đ</strong></span>
              </div>
              {assign.durationMinutes ? (
                <div className={styles.metaItem}>
                  <Timer size={14} weight="bold" />
                  <span><strong>{assign.durationMinutes} phút</strong></span>
                </div>
              ) : (
                <div className={styles.metaItem}>
                  <FileText size={14} weight="bold" />
                  <span>{isQuiz ? 'Trắc nghiệm' : 'Tự luận'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer Action Block */}
        <div className={styles.cardFooter}>
          {status === "graded" ? (
            <>
              <div className={styles.scoreBlock}>
                <span className={styles.scoreValue}>{assign.submission?.grade ?? 0}</span>
                <span className={styles.scoreMax}>/ {assign.maxScore || 10}đ</span>
              </div>
              <PrimaryButton
                variant="outline"
                size="sm"
                className="!text-xs font-extrabold ml-auto"
              >
                Xem kết quả <ArrowRight size={13} weight="bold" />
              </PrimaryButton>
            </>
          ) : (
            <>
              <div className="whitespace-nowrap">
                {!isDone && timeLeft && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                    <Hourglass size={11} weight="fill" className="text-amber-500" /> {timeLeft}
                  </span>
                )}
                {!isDone && !timeLeft && (
                  <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                    <XCircle size={11} weight="fill" className="text-red-500" /> Hết hạn
                  </span>
                )}
                {isDone && (
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle size={11} weight="fill" className="text-teal-600" /> Đã nộp
                  </span>
                )}
              </div>

              <PrimaryButton
                variant={isDone ? "outline" : "default"}
                size="sm"
                className="!text-xs font-extrabold ml-auto"
              >
                {isDone ? "Xem bài làm" : "Làm bài ngay"} <ArrowRight size={13} weight="bold" />
              </PrimaryButton>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderList = (list: any[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className={styles.emptyState}>
          <BookOpen size={44} className={styles.emptyIcon} />
          <h4>Không tìm thấy bài tập</h4>
          <p>{emptyMessage}</p>
        </div>
      );
    }

    const totalPages = Math.ceil(list.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedList = list.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="flex flex-col gap-5">
        <div className={styles.assignmentList}>
          {paginatedList.map(renderAssignmentCard)}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-2 mb-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold whitespace-nowrap"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trang trước
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-[#f47c20] text-white shadow-sm scale-105' : 'text-slate-700 hover:bg-orange-50 hover:text-[#f47c20]'}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold whitespace-nowrap"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2>Bài tập của tôi</h2>
          <p>Quản lý, thực hiện và theo dõi kết quả các bài tập được giao</p>
        </div>

        <div className={styles.headerStats}>
          <div className={styles.statPill}>
            <Notebook size={16} weight="duotone" className="text-[#f47c20]" />
            <span>{assignments.length} Bài tập</span>
          </div>
          {urgent.length > 0 && (
            <div className={styles.statPill}>
              <Warning size={16} weight="fill" className={styles.iconWarning} />
              <span className="text-amber-700">{urgent.length} Sắp đến hạn</span>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className={styles.filterBar}>
        <div className={styles.searchInput + " tour-step-search"}>
          <MagnifyingGlass size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bài tập..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-2.5 tour-step-filters">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3.5 py-2 outline-none hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 transition-colors min-w-[130px] h-[36px] cursor-pointer whitespace-nowrap">
              <span className="whitespace-nowrap">{filterType === "all" ? "Môn học (Tất cả)" : (filterType === "quiz" ? "Trắc nghiệm" : "Tự luận")}</span>
              <CaretDown size={13} className="text-slate-400" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[170px]">
              <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setFilterType("all")}>Môn học (Tất cả)</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setFilterType("quiz")}>Trắc nghiệm</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setFilterType("essay")}>Tự luận</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3.5 py-2 outline-none hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 transition-colors min-w-[130px] h-[36px] cursor-pointer whitespace-nowrap">
              <span className="truncate max-w-[110px] whitespace-nowrap">{filterClass === "all" ? "Lớp học (Tất cả)" : filterClass}</span>
              <CaretDown size={13} className="text-slate-400 flex-shrink-0" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[190px]">
              <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setFilterClass("all")}>Lớp học (Tất cả)</DropdownMenuItem>
              {classesList.map(cls => (
                <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" key={String(cls)} onClick={() => setFilterClass(String(cls))}>{cls}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-orange-50 border border-orange-200 text-[#f47c20] text-xs font-extrabold rounded-lg px-3.5 py-2 outline-none hover:bg-orange-100 transition-colors min-w-[175px] h-[36px] cursor-pointer whitespace-nowrap">
              {(() => {
                const activeOpt = statusOptions.find(o => o.id === activeTab) || statusOptions[0];
                return (
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    {activeOpt.icon}
                    <span className="whitespace-nowrap font-extrabold">{activeOpt.label}</span>
                  </div>
                );
              })()}
              <CaretDown size={13} className="text-[#f47c20] flex-shrink-0" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {statusOptions.map(opt => {
                const count = opt.id === "all" ? filteredAssignments.length
                  : opt.id === "urgent" ? urgent.length
                    : opt.id === "late" ? late.length
                      : opt.id === "pending" ? pending.length
                        : opt.id === "submitted" ? submitted.length
                          : graded.length;

                return (
                  <DropdownMenuItem
                    key={opt.id}
                    onClick={() => setActiveTab(opt.id)}
                    className="flex justify-between items-center cursor-pointer font-semibold py-1.5 px-2.5 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {opt.icon}
                      <span className={`whitespace-nowrap ${activeTab === opt.id ? "font-bold text-[#f47c20]" : "text-slate-[#f47c20]"}`}>
                        {opt.label}
                      </span>
                    </div>
                    {count > 0 && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{count}</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid Content */}
      <div className="outline-none">
        {activeTab === "all" && renderList(filteredAssignments, "Chưa có bài tập nào thỏa mãn bộ lọc tìm kiếm")}
        {activeTab === "urgent" && renderList(urgent, "Không có bài tập nào sắp đến hạn")}
        {activeTab === "late" && renderList(late, "Tuyệt vời! Không có bài nào bị quá hạn")}
        {activeTab === "pending" && renderList(pending, "Không có bài tập nào chưa nộp")}
        {activeTab === "submitted" && renderList(submitted, "Chưa có bài tập nào đang chờ chấm")}
        {activeTab === "graded" && renderList(graded, "Chưa có bài tập nào được chấm điểm")}
      </div>
    </div>
  );
}
