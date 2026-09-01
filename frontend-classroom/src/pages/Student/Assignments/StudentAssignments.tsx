import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@heroui/react";
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
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const getStatus = (assign: any) => {
    if (assign.submission?.status === "graded") return "graded";
    if (assign.submission) return "submitted";
    const diff = new Date(assign.deadline).getTime() - Date.now();
    if (diff < 0) return "late";
    return "pending";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "graded": return "Đã chấm điểm";
      case "submitted": return "Đã nộp bài";
      case "late": return "Quá hạn nộp";
      default: return "Chưa nộp bài";
    }
  };

  const formatDeadline = (iso: string) => {
    try {
      const d = new Date(iso);
      const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      return `${timeStr} - ${dateStr}`;
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

  const pending = filteredAssignments.filter((a) => getStatus(a) === "pending");
  const late = filteredAssignments.filter((a) => getStatus(a) === "late");
  const submitted = filteredAssignments.filter((a) => getStatus(a) === "submitted");
  const graded = filteredAssignments.filter((a) => getStatus(a) === "graded");

  const statusOptions = [
    { id: "all", label: "Tất cả trạng thái", icon: <ListChecks size={15} weight="duotone" className="text-slate-600" /> },
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
        className={`${styles.assignCard} ${status === "late" ? styles.lateCard : ""} ${isDone ? styles.doneCard : ""} tour-step-assign-card`}
        onClick={() => navigate(`/assignments/${assign._id}`)}
      >
        <div className={styles.cardMain}>
          {/* Card Top Badges Header */}
          <div className={styles.cardHeaderRow}>
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <span className={styles.classBadge}>
                {assign.className}
              </span>
              <span className={styles.typeBadge}>
                {isQuiz ? "Trắc nghiệm" : "Tự luận"}
              </span>
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

            <div className={styles.metaItem}>
              <Target size={14} weight="bold" />
              <span>
                Điểm:{" "}
                <strong>
                  {status === "graded" && assign.submission?.grade !== undefined && assign.submission?.grade !== null
                    ? `${assign.submission.grade}/${assign.maxScore || 10} đ`
                    : `0/${assign.maxScore || 10} đ`}
                </strong>
              </span>
            </div>

            <div className={styles.metaItem}>
              <Timer size={14} weight="bold" />
              <span>Thời gian: <strong>{assign.durationMinutes ? `${assign.durationMinutes} phút` : "Tự do"}</strong></span>
            </div>
          </div>
        </div>

        {/* Card Footer Action Block */}
        <div className={styles.cardFooter}>
          <div className="whitespace-nowrap">
            {status === "graded" && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                <CheckCircle size={12} weight="fill" className="text-emerald-600" /> Đã chấm
              </span>
            )}
            {status === "submitted" && (
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                <CheckCircle size={11} weight="fill" className="text-teal-600" /> Đã nộp
              </span>
            )}
            {status === "late" && (
              <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                <XCircle size={11} weight="fill" className="text-red-500" /> Hết hạn
              </span>
            )}
            {status === "pending" && (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                <Hourglass size={11} weight="fill" className="text-amber-500" /> Chưa nộp
              </span>
            )}
          </div>

          <PrimaryButton
            variant={isDone ? "outline" : "default"}
            size="sm"
            className="!text-xs font-extrabold ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/assignments/${assign._id}`);
            }}
          >
            {status === "graded" ? (
              <>
                Xem kết quả <ArrowRight size={13} weight="bold" />
              </>
            ) : (
              <>
                {isDone ? "Xem bài làm" : "Làm bài ngay"} <ArrowRight size={13} weight="bold" />
              </>
            )}
          </PrimaryButton>
        </div>
      </div>
    );
  };

  const renderList = (list: any[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className={styles.assignmentList}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-slate-200 rounded-[20px] p-5 flex flex-col justify-between gap-4 animate-pulse min-h-[240px] shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-20 bg-slate-200 rounded-lg" />
                <div className="h-5 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
              </div>
              <div className="h-20 w-full bg-slate-100/90 rounded-xl mt-2 border border-slate-100" />
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-auto">
                <div className="h-6 w-20 bg-slate-100 rounded-lg" />
                <div className="h-8 w-24 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      );
    }

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

        {list.length > 0 && (
          <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-white rounded-2xl shadow-3xs mt-2">
            <Pagination.Summary className="text-sm text-slate-500 font-medium">
              Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, list.length)} trong số {list.length} kết quả
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
          {pending.length > 0 && (
            <div className={styles.statPill}>
              <NotePencil size={16} weight="duotone" className="text-[#f47c20]" />
              <span>{pending.length} Chưa nộp</span>
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
            <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3.5 py-2 outline-none hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 transition-colors min-w-[140px] h-[36px] cursor-pointer whitespace-nowrap">
              <span className="whitespace-nowrap">{filterType === "all" ? "Tất cả loại bài" : (filterType === "quiz" ? "Trắc nghiệm" : "Tự luận")}</span>
              <CaretDown size={13} className="text-slate-400" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[170px]">
              <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setFilterType("all")}>Tất cả loại bài</DropdownMenuItem>
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
            <DropdownMenuContent align="end" className="w-[230px] p-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
              {statusOptions.map(opt => {
                const count = opt.id === "all" ? filteredAssignments.length
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
        {activeTab === "late" && renderList(late, "Tuyệt vời! Không có bài nào bị quá hạn")}
        {activeTab === "pending" && renderList(pending, "Không có bài tập nào chưa nộp")}
        {activeTab === "submitted" && renderList(submitted, "Chưa có bài tập nào đang chờ chấm")}
        {activeTab === "graded" && renderList(graded, "Chưa có bài tập nào được chấm điểm")}
      </div>
    </div>
  );
}
