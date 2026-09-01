/**
 * @file ClassroomActivitiesTab.tsx
 * @description Component Tab Danh sách Bài tập & Đề thi (Classroom Activities Tab)
 * - Dùng để quản lý và hiển thị toàn bộ danh sách bài tập tự luận và đề thi trắc nghiệm trong lớp học.
 * - Bộ lọc đa năng: Lọc theo dạng bài (Tất cả, Trắc nghiệm, Tự luận, Bài cần chấm), theo mục đích (Bài tập về nhà, Kiểm tra...), tìm kiếm theo tên.
 * - Chế độ hiển thị linh hoạt: Chuyển đổi giữa dạng thẻ lưới (Grid View) và dạng bảng dữ liệu chi tiết (Table View với ActivitiesTable).
 * - Các nút hành động: Giao bài tập từ Ngân hàng đề thi, mở/đóng bài tập, chấm bài nộp, sửa/xóa bài tập.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@heroui/react";
import {
  CheckCircle,
  FilePdf,
  Clock,
  Funnel,
  CaretDown,
  ClipboardText,
  BookOpen,
  Users,
  PencilSimple,
  Trash,
} from "phosphor-react";
import SearchInput from "@/components/ui/FormControls/SearchInput";
import ViewModeSwitch from "@/components/ui/Buttons/ViewModeSwitch";
import { QuizActionMenu } from "@/components/ui/ActionMenus/QuizActionMenu";
import ActivitiesTable from "@/components/ui/Tables/ActivitiesTable";
import AnimatedAddButton from "@/components/ui/Buttons/AnimatedAddButton";
import BackButton from "@/components/ui/Buttons/BackButton";
import QuizBuilder from "@/components/ui/Builders/QuizBuilder/QuizBuilder";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import styles from "../TeacherClassroomDetail.module.scss";

interface ClassroomActivitiesTabProps {
  activities?: any;
  bankAssign?: any;
  quizBuilder?: any;
  assignmentGrading?: any;
  classroom?: any;
  userRole?: string;
  filterType?: string;
  setFilterType?: (type: any) => void;
  totalPendingCount?: number;
  filterCategory?: string;
  setFilterCategory?: (cat: any) => void;
  filterStatus?: string;
  setFilterStatus?: (status: any) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  viewMode?: "grid" | "table";
  setViewMode?: (mode: "grid" | "table") => void;
  loadingActivities?: boolean;
  currentActivities?: any[];
  allActivities?: any[];
  currentPage?: number;
  setCurrentPage?: (page: number) => void;
  totalPages?: number;
  filteredActivities?: any[];
  handleOpenAssignFromBank?: () => void;
  getQuizStatus?: (act: any) => { label: string; class: string };
  setSelectedQuiz?: (quiz: any) => void;
  loadQuizResults?: (quizId: string) => void;
  setSelectedAssignment?: (assign: any) => void;
  loadAssignmentSubmissions?: (assignId: string) => void;
  handleOpenEditActivity?: (act: any) => void;
  handleToggleQuizStatus?: (act: any) => void;
  handleDeleteQuizClick?: (act: any) => void;
  handleDeleteAssignmentClick?: (act: any) => void;
  setSelectedResourceDetails?: (res: any) => void;
}

const getCategoryLabel = (cat: string): string => {
  const labels: Record<string, string> = {
    all: "Tất cả mục đích",
    homework: "Bài tập về nhà",
    periodic: "Kiểm tra định kỳ",
    mock_exam: "Thi thử",
    attitude: "Chuyên cần / Thái độ",
  };
  return labels[cat] || cat;
};

const getTypeFilterLabel = (type: string): string => {
  const labels: Record<string, string> = {
    all: "Tất cả loại",
    quiz: "Trắc nghiệm",
    document: "Tự luận / File",
  };
  return labels[type] || type;
};

const getStatusFilterLabel = (st: string, pendingCount: number = 0): string => {
  const labels: Record<string, string> = {
    all: "Tất cả trạng thái",
    open: "Đang mở",
    closed: "Đã đóng",
    ungraded: `Chưa chấm ${pendingCount > 0 ? `(${pendingCount})` : ""}`,
    graded: "Đã chấm",
  };
  return labels[st] || st;
};

export default function ClassroomActivitiesTab(props: ClassroomActivitiesTabProps) {
  const { activities, bankAssign, quizBuilder, assignmentGrading } = props;

  const classroom = props.classroom;
  const userRole = props.userRole;
  const filterType = props.filterType ?? activities?.filterType ?? "all";
  const setFilterType = props.setFilterType ?? activities?.setFilterType;
  const totalPendingCount = props.totalPendingCount ?? activities?.totalPendingCount ?? 0;
  const filterCategory = props.filterCategory ?? activities?.filterCategory ?? "all";
  const setFilterCategory = props.setFilterCategory ?? activities?.setFilterCategory;
  const filterStatus = props.filterStatus ?? activities?.filterStatus ?? "all";
  const setFilterStatus = props.setFilterStatus ?? activities?.setFilterStatus;
  const searchQuery = props.searchQuery ?? activities?.searchQuery ?? "";
  const setSearchQuery = props.setSearchQuery ?? activities?.setSearchQuery;
  const viewMode = props.viewMode ?? activities?.viewMode ?? "grid";
  const setViewMode = props.setViewMode ?? activities?.setViewMode;
  const loadingActivities = props.loadingActivities ?? activities?.loadingActivities ?? false;
  const currentActivities = props.currentActivities ?? activities?.currentActivities ?? [];
  const allActivities = props.allActivities ?? activities?.allActivities ?? [];
  const currentPage = props.currentPage ?? activities?.currentPage ?? 1;
  const setCurrentPage = props.setCurrentPage ?? activities?.setCurrentPage;
  const totalPages = props.totalPages ?? activities?.totalPages ?? 1;
  const filteredActivities = props.filteredActivities ?? activities?.filteredActivities ?? [];
  const handleOpenAssignFromBank = props.handleOpenAssignFromBank ?? bankAssign?.handleOpenAssignFromBank;
  const getQuizStatus = props.getQuizStatus ?? activities?.getQuizStatus;
  const setSelectedQuiz = props.setSelectedQuiz;
  const loadQuizResults = props.loadQuizResults;
  const setSelectedAssignment = props.setSelectedAssignment ?? assignmentGrading?.setSelectedAssignment;
  const loadAssignmentSubmissions = props.loadAssignmentSubmissions ?? assignmentGrading?.loadAssignmentSubmissions;
  const handleOpenEditActivity = props.handleOpenEditActivity ?? bankAssign?.handleOpenEditActivity;
  const handleToggleQuizStatus = props.handleToggleQuizStatus ?? activities?.handleToggleQuizStatus;
  const handleDeleteQuizClick = props.handleDeleteQuizClick ?? quizBuilder?.handleDeleteQuizClick;
  const handleDeleteAssignmentClick = props.handleDeleteAssignmentClick ?? assignmentGrading?.handleDeleteAssignmentClick;
  const setSelectedResourceDetails = props.setSelectedResourceDetails ?? bankAssign?.setSelectedResourceDetails;
  const navigate = useNavigate();

  if (quizBuilder?.isCreatingQuiz) {
    return (
      <div style={{ marginTop: "20px" }}>
        <QuizBuilder
          initialData={
            quizBuilder.editingQuizId
              ? {
                  title: quizBuilder.quizTitle,
                  durationMinutes: quizBuilder.quizDuration,
                  questions: quizBuilder.quizQuestions,
                  shuffleQuestions: quizBuilder.shuffleQuestions,
                  shuffleOptions: quizBuilder.shuffleOptions,
                  allowMultipleSubmissions: quizBuilder.allowMultipleSubmissions,
                }
              : null
          }
          onSubmit={quizBuilder.handleSaveQuiz}
          onCancel={quizBuilder.handleCancelCreate}
          isSaving={quizBuilder.isSavingQuiz}
        />
      </div>
    );
  }

  return (
    <div className={styles.quizzesTab}>
      <div className="mb-4">
        <BackButton onClick={() => navigate("/classrooms")}>Quay lại danh sách lớp</BackButton>
      </div>

      {/* ROW 1: TITLE & PRIMARY ACTION BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f47c20", margin: 0 }}>
            Danh Sách Bài Tập & Đề Thi
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {userRole === "TEACHER"
              ? "Quản lý toàn bộ hoạt động học tập, bài tập về nhà và đề thi trong lớp"
              : "Theo dõi tiến độ và hoạt động của lớp học"}
          </p>
        </div>
        {userRole === "TEACHER" && (
          <AnimatedAddButton onClick={handleOpenAssignFromBank}>Giao bài từ Ngân hàng</AnimatedAddButton>
        )}
      </div>

      {/* ROW 2: FILTERS & VIEW MODE TOOLBAR */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 1. SEARCH INPUT AT FRONT */}
          <div className="w-64">
            <SearchInput
              id="teacherActivitiesSearch"
              placeholder="Tìm theo tên bài tập..."
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
            />
          </div>

          {/* 2. TYPE COMBOBOX */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-full text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                <span>{getTypeFilterLabel(filterType)}</span>
                <CaretDown size={13} className="text-slate-400" weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
              <DropdownMenuItem
                onClick={() => setFilterType("all")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterType === "all" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Tất cả loại
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterType("quiz")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterType === "quiz" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Trắc nghiệm
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterType("document")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterType === "document" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Tự luận / File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. CATEGORY COMBOBOX */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-full text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                <span>{getCategoryLabel(filterCategory)}</span>
                <CaretDown size={13} className="text-slate-400" weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
              <DropdownMenuItem
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterCategory === "all" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Tất cả mục đích
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterCategory("homework")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterCategory === "homework" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Bài tập về nhà
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterCategory("periodic")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterCategory === "periodic" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Kiểm tra / Thi thử
              </DropdownMenuItem>
              {Array.from(new Set(allActivities.map((a: any) => a.category).filter(Boolean)))
                .filter((cat: any) => !["homework", "periodic", "mock_exam"].includes(cat))
                .map((cat: any) => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                      filterCategory === cat ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {getCategoryLabel(cat)}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 4. STATUS COMBOBOX */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-full text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                <span>{getStatusFilterLabel(filterStatus, totalPendingCount)}</span>
                <CaretDown size={13} className="text-slate-400" weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
              <DropdownMenuItem
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterStatus === "all" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Tất cả trạng thái
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterStatus("open")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterStatus === "open" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Đang mở
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterStatus("closed")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterStatus === "closed" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Đã đóng
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterStatus("ungraded")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterStatus === "ungraded" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Chưa chấm {totalPendingCount > 0 ? `(${totalPendingCount})` : ""}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterStatus("graded")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  filterStatus === "graded" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Đã chấm
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* VIEW MODE TOGGLE SWITCH */}
        <ViewModeSwitch id="teacherActivitiesViewMode" viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {loadingActivities ? (
        <p style={{ textAlign: "center", color: "#64748b", fontWeight: 600, padding: "48px 0" }}>
          Đang tải danh sách hoạt động...
        </p>
      ) : currentActivities.length === 0 ? (
        <div className={styles.emptyFeed}>
          <div className={styles.illustrationCircle}>
            <ClipboardText size={48} className="text-orange-400" weight="duotone" />
          </div>
          <h4 className="text-base font-bold text-slate-700 mt-2">Chưa có bài tập hoặc đề thi nào</h4>
          <p className="text-sm text-slate-500 mt-1">Giao bài tập mới từ ngân hàng câu hỏi để học sinh bắt đầu làm bài.</p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
              {currentActivities.map((act) => {
                const isQuiz = act.type === "quiz";
                const statusObj = getQuizStatus(act);
                const qCount = isQuiz ? act.questions?.length || act.bankItemId?.quizQuestions?.length || 0 : 0;
                const totalStudents = classroom?.studentCount || 0;
                const subCount = act.submissionCount || 0;
                const percent = totalStudents > 0 ? Math.min(100, Math.round((subCount / totalStudents) * 100)) : 0;

                return (
                  <div
                    key={act._id}
                    className="bg-white rounded-3xl p-5 border-2 border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5 text-left group"
                  >
                    {/* ROW 1: BADGES */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-3 py-1 font-bold text-xs rounded-lg border ${
                            isQuiz
                              ? "bg-[#f47c20]/10 text-[#f47c20] border-[#f47c20]/25"
                              : "bg-[#2f8fa3]/10 text-[#2f8fa3] border-[#2f8fa3]/25"
                          }`}
                        >
                          {isQuiz ? "Trắc nghiệm" : "Tự luận"}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${statusObj.class}`}>
                          {statusObj.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {userRole === "TEACHER" && (
                          <QuizActionMenu
                            status={act.status}
                            onViewResults={() => {
                              if (isQuiz) {
                                setSelectedQuiz(act);
                                loadQuizResults(act._id);
                              } else {
                                setSelectedAssignment(act);
                                loadAssignmentSubmissions(act._id);
                              }
                            }}
                            onEdit={() => handleOpenEditActivity(act)}
                            onToggleStatus={() => handleToggleQuizStatus(act)}
                            onDelete={() => {
                              if (isQuiz) handleDeleteQuizClick(act);
                              else handleDeleteAssignmentClick(act);
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* ROW 2: TITLE & CATEGORY */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4
                          onClick={() => setSelectedResourceDetails(act)}
                          className="text-lg font-extrabold text-slate-900 hover:text-[#f47c20] cursor-pointer transition-colors leading-snug line-clamp-2"
                          title={act.title}
                        >
                          {act.title}
                        </h4>
                        {act.description && (
                          <p className="text-xs text-[#64748b] mt-1 line-clamp-2 leading-relaxed" title={act.description}>
                            {act.description}
                          </p>
                        )}
                      </div>
                      {act.category && (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 border ${
                            isQuiz
                              ? "bg-[#2f8fa3]/10 text-[#2f8fa3] border-[#2f8fa3]/25"
                              : "bg-[#f47c20]/10 text-[#f47c20] border-[#f47c20]/25"
                          }`}
                        >
                          {
                            {
                              homework: "Bài tập về nhà",
                              periodic: "Kiểm tra định kỳ",
                              mock_exam: "Thi thử",
                              attitude: "Chuyên cần / Thái độ",
                            }[act.category] || act.category
                          }
                        </span>
                      )}
                    </div>

                    {/* ROW 3: SUB-INFO */}
                    <div className="flex items-center gap-1.5 text-xs text-[#64748b] font-semibold">
                      <Clock size={15} className="text-[#f47c20] shrink-0" />
                      <span>
                        Hạn nộp:{" "}
                        <span className="text-[#64748b] font-normal">
                          {act.dueDate ? new Date(act.dueDate).toLocaleDateString("vi-VN") : "Không giới hạn"}
                        </span>
                      </span>
                      <span className="ml-1">
                        {isQuiz ? `${act.durationMinutes || 15}p (${qCount} câu)` : `${act.attachments?.length || 1} file đính kèm`}
                      </span>
                    </div>

                    {/* ROW 4: PROGRESS BOX */}
                    <div
                      className={`rounded-2xl p-3 flex items-center justify-between text-xs transition-colors ${
                        subCount > 0
                          ? "bg-[#fff7ed] border border-[#fed7aa]"
                          : "bg-[#2f8fa3]/10 border border-[#2f8fa3]/25"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 font-semibold truncate ${
                          subCount > 0 ? "text-[#f47c20]" : "text-[#2f8fa3]"
                        }`}
                      >
                        {subCount > 0 ? (
                          <BookOpen size={16} weight="duotone" className="shrink-0 text-[#f47c20]" />
                        ) : (
                          <CheckCircle size={16} weight="bold" className="shrink-0 text-[#2f8fa3]" />
                        )}
                        <span className="truncate">
                          {subCount > 0 ? `Tiến độ: ${subCount}/${totalStudents} HS đã nộp` : "✓ Chưa có bài nộp nào"}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md bg-white font-extrabold shrink-0 border ${
                          subCount > 0 ? "text-[#f47c20] border-[#fed7aa]" : "text-[#2f8fa3] border-[#2f8fa3]/30"
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>

                    {/* ROW 5: BUTTONS */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (isQuiz) {
                            setSelectedQuiz(act);
                            loadQuizResults(act._id);
                          } else {
                            setSelectedAssignment(act);
                            loadAssignmentSubmissions(act._id);
                          }
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#64748b] font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title={isQuiz ? "Xem bảng điểm & kết quả bài nộp" : "Chấm bài nộp của học sinh"}
                      >
                        <Users size={14} weight="bold" />
                        <span>{isQuiz ? "Bảng điểm" : "Chấm bài"} ({subCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditActivity(act)}
                        className="w-full py-2 bg-[#f47c20]/10 hover:bg-[#f47c20]/20 text-[#f47c20] border border-[#f47c20]/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Chỉnh sửa bài tập"
                      >
                        <PencilSimple size={14} weight="bold" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isQuiz) handleDeleteQuizClick(act);
                          else handleDeleteAssignmentClick(act);
                        }}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Xóa bài tập"
                      >
                        <Trash size={14} weight="bold" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* KHU VỰC PHÂN TRANG CHO CHẾ ĐỘ LƯỚI (GRID VIEW PAGINATION MATCHING HEROUI STYLE) */}
            {totalPages > 1 && (
              <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-white rounded-2xl shadow-3xs mt-2">
                <Pagination.Summary className="text-sm text-slate-500 font-medium">
                  Hiển thị {(currentPage - 1) * 6 + 1} đến {Math.min(currentPage * 6, filteredActivities.length)} trong số {filteredActivities.length} kết quả
                </Pagination.Summary>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={currentPage === 1}
                      onPress={() => setCurrentPage && setCurrentPage(Math.max(1, currentPage - 1))}
                    >
                      <Pagination.PreviousIcon />
                      Trang trước
                    </Pagination.Previous>
                  </Pagination.Item>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Pagination.Item key={p}>
                      <Pagination.Link
                        isActive={p === currentPage}
                        onPress={() => setCurrentPage && setCurrentPage(p)}
                        className={p === currentPage ? "bg-[#f47c20] text-white font-bold border-[#f47c20]" : "text-slate-600 font-medium hover:bg-slate-100"}
                      >
                        {p}
                      </Pagination.Link>
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={currentPage === totalPages}
                      onPress={() => setCurrentPage && setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    >
                      Trang sau
                      <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            )}
          </>
          ) : (
            <ActivitiesTable
              activities={filteredActivities}
              userRole={userRole}
              onItemClick={(act) => setSelectedResourceDetails(act)}
              onViewResults={(act) => {
                if (act.type === "quiz") {
                  setSelectedQuiz(act);
                  loadQuizResults(act._id);
                } else {
                  setSelectedAssignment(act);
                  loadAssignmentSubmissions(act._id);
                }
              }}
              onEdit={(act) => handleOpenEditActivity(act)}
              onToggleStatus={(act) => handleToggleQuizStatus(act)}
              onDelete={(act) => {
                if (act.type === "quiz") handleDeleteQuizClick(act);
                else handleDeleteAssignmentClick(act);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
