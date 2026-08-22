import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import AnnouncementComments from "../../../components/Classroom/AnnouncementComments";
import {

  FilePdf,
  Paperclip,
  Funnel,
  DotsThree,
  Trash,
  Archive,
  X,
  Megaphone,
  Bell,
  BookOpen,
  Clock,
  CalendarBlank,
  Plus,
  ArrowLeft,
  Eye,
  CheckCircle,
  PencilSimple,
  Users,
  X as XIcon,
  ChatCircleText,
  ClipboardText,
  PushPin,
  GridFour,
  List,
  TrendUp,
  CaretDown,
  FolderOpen,
  BookBookmark,
  Calculator,
  DownloadSimple,
  Lightbulb,
  Key,
  Copy,
  Check,
  User,
  YoutubeLogo,
  GoogleLogo,
  ArrowSquareOut,
  LinkSimple,
  Info,
  TextAa,
  FileText,
  ListChecks,
  NotePencil
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import { activityService } from "../../../service/activity.service.ts";
import { bankService } from "../../../service/bank.service.ts";
import { gradebookService } from "../../../service/gradebook.service.ts";
import type { IAnnouncement } from "../../../service/announcement.service.ts";
import * as XLSX from "xlsx";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton";
import { BackButton } from "../../../components/ui/Buttons/BackButton.tsx";
import { Table, Checkbox as HeroCheckbox, Pagination } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { AnimatedAddButton } from "../../../components/ui/Buttons/AnimatedAddButton";
import { ActivitiesTable } from "../../../components/ui/Tables/ActivitiesTable";
import { ResourceDetailModal } from "../../../components/ui/Dialogs/ResourceDetailModal/ResourceDetailModal";
import FolderUpload from "../../../components/ui/Uploads/FolderUpload/FolderUpload";
import FolderFileCard from "../../../components/ui/Uploads/FolderUpload/FolderFileCard";
import Switch3D from "../../../components/ui/FormControls/Switch3D";
import { Checkbox as UiCheckbox } from "../../../components/ui/checkbox";
import { CustomConfirmDialog } from "../../../components/ui/Dialogs/CustomConfirmDialog";
import { SmartSearchBar, type SearchSuggestionItem } from "../../../components/ui/Inputs/SmartSearchBar";
import { DropdownFilter, type DropdownFilterOption } from "../../../components/ui/Dropdowns/DropdownFilter";
import FullPageLoader from "../../../components/ui/Loaders/FullPageLoader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../components/ui/dropdown-menu";
import { QuizActionMenu } from "../../../components/ui/ActionMenus/QuizActionMenu";
import AnimatedSendButton from "../../../components/ui/Buttons/AnimatedSendButton";
import { SaveButton } from "../../../components/ui/Buttons/SaveButton";
import NumberStepper from "../../../components/ui/FormControls/NumberStepper";
import QuizBuilder from "../../../components/ui/Builders/QuizBuilder/QuizBuilder";
import QuizPreviewModal from "../../../components/ui/Dialogs/QuizPreviewModal/QuizPreviewModal";
import { ClassErrorInsights } from "./components/ClassErrorInsights";
import ViewModeSwitch from "../../../components/ui/Buttons/ViewModeSwitch";
import styles from "./TeacherClassroomDetail.module.scss";

const AnimatedCounter = ({ end, decimals = 0, duration = 1200, suffix = "" }: { end: number; decimals?: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(easeProgress * end);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return (
    <span>
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
};

const MediaContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const ytMatch = content.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  const ytVideoId = ytMatch ? ytMatch[1] : null;

  const driveMatch = content.match(/(https?:\/\/(?:drive|docs)\.google\.com\/[^\s]+)/);
  const driveUrl = driveMatch ? driveMatch[0] : null;

  return (
    <div className="flex flex-col gap-3">
      <p className="whitespace-pre-wrap leading-relaxed text-slate-800 text-sm m-0">
        {content}
      </p>

      {ytVideoId && (
        <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black aspect-video max-w-2xl mt-1">
          <iframe
            src={`https://www.youtube.com/embed/${ytVideoId}`}
            title="YouTube Video Player"
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/90 border border-emerald-200/90 hover:bg-emerald-100/70 transition-all text-decoration-none shadow-2xs group max-w-md mt-1"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <GoogleLogo size={20} weight="bold" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Google Drive</span>
              <span className="text-xs font-bold text-emerald-950 truncate group-hover:underline">
                Mở tài liệu trên Google Drive
              </span>
            </div>
          </div>
          <ArrowSquareOut size={16} weight="bold" className="text-emerald-700 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </a>
      )}
    </div>
  );
};

export default function TeacherClassroomDetail() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "overview") as "overview" | "reports" | "schedule" | "quizzes" | "assignments" | "activities";
  const toast = useToast();
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || localStorage.getItem("userRole") || "TEACHER";
  const username = user?.name || localStorage.getItem("username") || "Giáo viên";
  const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=f47c20&color=fff&bold=true`;

  const [classroom, setClassroom] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filterChip, setFilterChip] = useState<"all" | "reminder" | "material" | "assignment">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [sendingComment, setSendingComment] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // State cho đính kèm Link Youtube / Google Drive
  const [attachedLink, setAttachedLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleCopyCode = () => {
    if (!classroom?.code) return;
    navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    toast.success(`Đã sao chép mã lớp ${classroom.code}!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // State cho trắc nghiệm & hoạt động
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "quiz" | "document" | "pending">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "homework" | "periodic">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [bankFilterType, setBankFilterType] = useState<"all" | "quiz" | "essay">("all");

  const [quizzes, setQuizzes] = useState<any[]>([]);
  // State cho bài tập tự luận
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingData, setGradingData] = useState<Record<string, { score: number | string; feedback: string }>>({});
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [isDeleteAssignmentDialogOpen, setIsDeleteAssignmentDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<any | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const [focusGradingSub, setFocusGradingSub] = useState<any | null>(null);

  const getFileExt = (filename: string = "") => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return null;
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatCleanFileName = (rawName?: string, rawUrl?: string) => {
    let name = rawName || "";
    if (!name && rawUrl) {
      try {
        const parts = rawUrl.split("/");
        name = decodeURIComponent(parts[parts.length - 1] || "file");
      } catch {
        name = "file";
      }
    }
    // Loại bỏ tiền tố timestamp/hash ngẫu nhiên như 569762304_313088_ hoặc 1735123456_
    if (/^\d{8,}_[0-9a-zA-Z]{5,}_/.test(name)) {
      name = name.replace(/^\d{8,}_[0-9a-zA-Z]{5,}_/, "");
    } else if (/^\d{10,}_/.test(name)) {
      name = name.replace(/^\d{10,}_/, "");
    }
    if (name.length > 32) {
      const ext = getFileExt(name);
      const base = name.substring(0, name.lastIndexOf(".")) || name;
      return base.substring(0, 18) + "..." + (ext ? `.${ext}` : "");
    }
    return name || "File_dinh_kem";
  };

  const formatFileName = (filename: string = "") => {
    return formatCleanFileName(filename);
  };

  const QUICK_FEEDBACK_TAGS = [
    "✨ Làm bài rất tốt",
    "📝 Cần bổ sung ý",
    "👏 Trình bày đẹp",
    "💯 Xuất sắc",
    "⏰ Cần nộp đúng hạn",
    "⚠️ Cần rèn luyện thêm"
  ];

  const handleScoreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIdx: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = document.getElementById(`score-input-${currentIdx + 1}`);
      if (nextInput) {
        nextInput.focus();
        (nextInput as HTMLInputElement).select?.();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = document.getElementById(`score-input-${currentIdx - 1}`);
      if (prevInput) {
        prevInput.focus();
        (prevInput as HTMLInputElement).select?.();
      }
    }
  };
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [feedPage, setFeedPage] = useState(1);
  const [replyToMap, setReplyToMap] = useState<Record<string, string>>({});

  // Shortcut bàn phím (Mũi tên ←/→, Ctrl + ←/→ hoặc [ / ]) để chuyển học sinh nhanh khi đang mở modal chấm bài
  useEffect(() => {
    if (!focusGradingSub || !assignmentSubmissions || assignmentSubmissions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );

      const currentIdx = assignmentSubmissions.findIndex((s) => s._id === focusGradingSub._id);
      if (currentIdx === -1) return;

      const isPrev = e.key === "ArrowLeft" || (e.ctrlKey && e.key === "ArrowLeft") || (!isInput && e.key === "[");
      const isNext = e.key === "ArrowRight" || (e.ctrlKey && e.key === "ArrowRight") || (!isInput && e.key === "]");

      if (!isInput || e.ctrlKey) {
        if (isPrev) {
          e.preventDefault();
          if (currentIdx > 0) {
            setFocusGradingSub(assignmentSubmissions[currentIdx - 1]);
          }
        } else if (isNext) {
          e.preventDefault();
          if (currentIdx < assignmentSubmissions.length - 1) {
            setFocusGradingSub(assignmentSubmissions[currentIdx + 1]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusGradingSub, assignmentSubmissions]);

  const totalPendingCount = allActivities.reduce((acc, act) => acc + (act.pendingGradeCount || 0), 0);

  const filteredActivities = allActivities.filter((item: any) => {
    if (filterType === "quiz" && item.type !== "quiz") return false;
    if (filterType === "document" && item.type === "quiz") return false;
    if (filterType === "pending" && (!item.pendingGradeCount || item.pendingGradeCount <= 0)) return false;

    if (filterCategory !== "all") {
      if (filterCategory === "homework") {
        if (item.category !== "homework") return false;
      } else if (filterCategory === "periodic") {
        if (item.category !== "periodic" && item.category !== "mock_exam") return false;
      } else {
        if (item.category !== filterCategory) return false;
      }
    }
    return true;
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const currentActivities = filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getQuizStatus = (quizItem: any) => {
    const status = quizItem.status || 'open';
    if (status === 'draft') return { label: "Bản nháp", class: "bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs" };
    if (status === 'closed') return { label: "Đã đóng", class: "bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs" };

    if (quizItem.type !== "quiz") {
      const subCount = quizItem.submissionCount || 0;
      const gradedCount = quizItem.gradedCount || 0;
      const pendingCount = quizItem.pendingGradeCount !== undefined
        ? quizItem.pendingGradeCount
        : Math.max(0, subCount - gradedCount);

      if (gradedCount > 0 && gradedCount >= subCount && subCount > 0) {
        return { label: "Đã chấm", class: "bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs" };
      }
      return { label: `Chưa chấm (${pendingCount})`, class: "bg-orange-50 text-[#f47c20] border border-orange-200/90 shadow-2xs" };
    }

    return { label: "Đang mở", class: "bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs" };
  };

  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizzesViewMode, setQuizzesViewMode] = useState<"grid" | "table">("grid");
  const [selectedQuizKeys, setSelectedQuizKeys] = useState<Selection>(new Set());

  const selectedQuizIds = React.useMemo(() => {
    if (selectedQuizKeys === "all") {
      return quizzes.map((q: any) => q._id);
    }
    return Array.from(selectedQuizKeys) as string[];
  }, [selectedQuizKeys, quizzes]);

  const handleBulkDeleteQuizzes = async () => {
    if (selectedQuizIds.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedQuizIds.length} đề thi đã chọn?`)) {
      try {
        await Promise.all(selectedQuizIds.map(id => activityService.deleteActivity(id)));
        toast.success("Đã xóa các đề thi thành công!");
        setSelectedQuizKeys(new Set());
        loadQuizzes();
      } catch (err: any) {
        toast.error(err.message || "Có lỗi xảy ra khi xóa hàng loạt!");
      }
    }
  };

  const handleBulkChangeStatusQuizzes = async (status: 'open' | 'closed') => {
    if (selectedQuizIds.length === 0) return;
    try {
      await Promise.all(selectedQuizIds.map(id => activityService.updateActivity(id, { status })));
      toast.success(`Đã ${status === 'open' ? 'mở' : 'đóng'} các đề thi thành công!`);
      setSelectedQuizKeys(new Set());
      loadQuizzes();
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizResultTab, setQuizResultTab] = useState<"scores" | "errors">("scores");

  const [isDeleteQuizDialogOpen, setIsDeleteQuizDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<any>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
  const [pendingQuizData, setPendingQuizData] = useState<any>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  // State giao bài từ Ngân hàng đề
  const [isAssignFromBankOpen, setIsAssignFromBankOpen] = useState(false);
  const [previewBankItem, setPreviewBankItem] = useState<any>(null);
  const [selectedResourceDetails, setSelectedResourceDetails] = useState<any | null>(null);
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [selectedBankItem, setSelectedBankItem] = useState<any | null>(null);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [bankFilterOrigin, setBankFilterOrigin] = useState("all");
  const [bankModalPage, setBankModalPage] = useState(1);

  useEffect(() => {
    setBankModalPage(1);
  }, [bankSearchQuery, bankFilterOrigin, bankFilterType, isAssignFromBankOpen]);

  // Form giao bài
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDescription, setAssignDescription] = useState("");
  const [assignCategory, setAssignCategory] = useState("homework");
  const [assignCustomCategory, setAssignCustomCategory] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignMaxScore, setAssignMaxScore] = useState(10);
  const [assignDurationMinutes, setAssignDurationMinutes] = useState(15);
  const [assignAllowMultiple, setAssignAllowMultiple] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Form states cho Chỉnh sửa bài tập / hoạt động
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("homework");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editMaxScore, setEditMaxScore] = useState(10);
  const [editAllowMultiple, setEditAllowMultiple] = useState(false);
  const [isSavingEditActivity, setIsSavingEditActivity] = useState(false);

  // Form states cho tạo đề trắc nghiệm
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDuration, setQuizDuration] = useState(15);
  const [defaultPoints, setDefaultPoints] = useState<number>(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    imageUrl?: string;
    optionImages?: string[];
    points?: number;
  }>>([
    { questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }
  ]);
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(0);
  const [errorQuestionIndex, setErrorQuestionIndex] = useState<number | null>(null);
  const [showImageUpload, setShowImageUpload] = useState<Record<number, boolean>>({});

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewQIndex, setPreviewQIndex] = useState(0);

  // Drag & Drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    const from = dragIndexRef.current;
    if (from === null || from === index) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    const updated = [...quizQuestions];
    const [moved] = updated.splice(from, 1);
    updated.splice(index, 0, moved);
    setQuizQuestions(updated);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  // State cho việc đăng bài mới
  const [postText, setPostText] = useState("");
  const [replyText, setReplyText] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea khi nhấn nút CTA
  const handleFocusComposer = () => {
    if (composerRef.current) {
      composerRef.current.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fileImportRef = useRef<HTMLInputElement>(null);
  const fileDocxImportRef = useRef<HTMLInputElement>(null);
  const fileCombinedImportRef = useRef<HTMLInputElement>(null);
  const fileDocxAIImportRef = useRef<HTMLInputElement>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Đang xử lý file Word...");

      const formData = new FormData();
      formData.append("file", file);

      // Gọi API gửi file xuống backend
      // Lưu ý: Cần thêm base URL hoặc config theo axios instance của bạn, ở đây giả định dùng fetch
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      const response = await fetch("http://localhost:5000/api/v1/upload/docx", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Lỗi khi xử lý file");
      }

      const rawText = data.text;

      // Parse raw text
      const parsedQuestions = [];
      // Regex cơ bản để bắt "Câu 1: ...", "A.", "B.", "C.", "D.", "Đáp án: A"
      // Định dạng linh hoạt: "Câu 1", "Câu 1:", "Câu 1." 
      const questionBlocks = rawText.split(/Câu\s*\d+[:.\s-]/i).filter((b: string) => b.trim().length > 0);

      for (const block of questionBlocks) {
        // Tách câu hỏi và các phần còn lại (phương án + đáp án)
        // Tìm chữ A. hoặc A: hoặc A)
        const optionsMatch = block.match(/([A-D][.:\)])/ig);

        if (!optionsMatch || optionsMatch.length < 2) continue;

        const firstOptionIndex = block.indexOf(optionsMatch[0]);
        const questionText = block.substring(0, firstOptionIndex).trim();

        const options = [];
        let correctOptionIndex = 0;

        // Tách các phương án
        for (let i = 0; i < optionsMatch.length; i++) {
          const optStart = block.indexOf(optionsMatch[i]);
          let optEnd = block.length;
          if (i < optionsMatch.length - 1) {
            optEnd = block.indexOf(optionsMatch[i + 1], optStart + 1);
          } else {
            // Lấy đến phần đáp án (nếu có)
            const answerMatch = block.match(/Đáp\s*án\s*[:\s]*([A-D])/i);
            if (answerMatch && answerMatch.index !== undefined && answerMatch.index > optStart) {
              optEnd = answerMatch.index;
              const correctLetter = answerMatch[1].toUpperCase();
              if (correctLetter === 'A') correctOptionIndex = 0;
              else if (correctLetter === 'B') correctOptionIndex = 1;
              else if (correctLetter === 'C') correctOptionIndex = 2;
              else if (correctLetter === 'D') correctOptionIndex = 3;
            }
          }

          let optText = block.substring(optStart + optionsMatch[i].length, optEnd).trim();
          // Xóa chữ "Đáp án: A" nếu bị dính
          optText = optText.replace(/Đáp\s*án\s*[:\s]*[A-D]/i, '').trim();
          options.push(optText);
        }

        parsedQuestions.push({
          questionText: questionText.replace(/\n/g, ' '),
          options: options.slice(0, 6), // Giới hạn tối đa 6
          correctOptionIndex,
          points: 1,
          imageUrl: ""
        });
      }

      if (parsedQuestions.length > 0) {
        setQuizQuestions(parsedQuestions);
        toast.success(`Đã import ${parsedQuestions.length} câu hỏi thành công!`);
      } else {
        toast.warning("Không tìm thấy câu hỏi nào đúng định dạng.");
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi import file docx");
    } finally {
      if (fileDocxImportRef.current) {
        fileDocxImportRef.current.value = "";
      }
    }
  };

  const handleImportDocxAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsGeneratingAI(true);
      toast.info("AI đang đọc và tạo câu hỏi... Vui lòng đợi trong giây lát!", 5000);

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      const response = await fetch("http://localhost:5000/api/v1/upload/docx-ai", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Lỗi khi AI sinh câu hỏi");
      }

      const questions = data.data;

      if (questions && questions.length > 0) {
        // Map data if needed to ensure correct format
        const parsedQuestions = questions.map((q: any) => ({
          questionText: q.questionText || "",
          options: Array.isArray(q.options) ? q.options.slice(0, 6) : [],
          correctOptionIndex: q.correctOptionIndex || 0,
          points: q.points || 1,
          imageUrl: ""
        }));

        setQuizQuestions(parsedQuestions);
        toast.success(`AI đã tạo thành công ${parsedQuestions.length} câu hỏi!`);
      } else {
        toast.warning("AI không thể tạo được câu hỏi nào từ nội dung này.");
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi kết nối với AI");
    } finally {
      setIsGeneratingAI(false);
      if (fileDocxAIImportRef.current) {
        fileDocxAIImportRef.current.value = "";
      }
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const parsedQuestions = [];
        // Bắt đầu từ dòng 1 (bỏ dòng header 0)
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 2) continue;

          const questionText = row[0] || "";
          const optA = row[1] || "";
          const optB = row[2] || "";
          const optC = row[3] || "";
          const optD = row[4] || "";
          const correctLetter = (row[5] || "").toString().trim().toUpperCase();

          if (!questionText) continue;

          let correctOptionIndex = 0;
          if (correctLetter === 'A' || correctLetter === '1') correctOptionIndex = 0;
          else if (correctLetter === 'B' || correctLetter === '2') correctOptionIndex = 1;
          else if (correctLetter === 'C' || correctLetter === '3') correctOptionIndex = 2;
          else if (correctLetter === 'D' || correctLetter === '4') correctOptionIndex = 3;

          parsedQuestions.push({
            questionText,
            options: [optA, optB, optC, optD],
            correctOptionIndex,
            points: 1
          });
        }

        if (parsedQuestions.length > 0) {
          setQuizQuestions(parsedQuestions);
          toast.success(`Đã nhập thành công ${parsedQuestions.length} câu hỏi!`);
        } else {
          toast.warning("Không tìm thấy câu hỏi hợp lệ trong file Excel!");
        }
      } catch (error) {
        console.error(error);
        toast.error("Lỗi khi đọc file Excel, vui lòng kiểm tra lại định dạng!");
      }

      if (fileImportRef.current) {
        fileImportRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCombinedImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.docx')) {
      handleImportDocx(e);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      handleImportExcel(e);
    } else {
      toast.error("Định dạng file không được hỗ trợ!");
    }

    if (fileCombinedImportRef.current) {
      fileCombinedImportRef.current.value = "";
    }
  };

  const [postType, setPostType] = useState<"announcement" | "reminder" | "material">("announcement");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State cho bình luận mới của từng bài đăng
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [likedAnns, setLikedAnns] = useState<Record<string, boolean>>({});
  const [showReplyBox, setShowReplyBox] = useState<Record<string, boolean>>({});
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [showAllComments, setShowAllComments] = useState<Record<string, boolean>>({});

  const [isDeletePostDialogOpen, setIsDeletePostDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const [isResetQuizDialogOpen, setIsResetQuizDialogOpen] = useState(false);
  const [isResettingQuiz, setIsResettingQuiz] = useState(false);

  const loadAllActivities = async () => {
    if (!classId) return;
    try {
      setLoadingActivities(true);
      setLoadingQuizzes(true);
      setLoadingAssignments(true);
      const res: any = await activityService.getClassActivities(classId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setAllActivities(list);
      setQuizzes(list.filter((a: any) => a.type === 'quiz'));
      setAssignments(list.filter((a: any) => a.type !== 'quiz'));
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách hoạt động!");
    } finally {
      setLoadingActivities(false);
      setLoadingQuizzes(false);
      setLoadingAssignments(false);
    }
  };

  const loadQuizzes = loadAllActivities;

  const loadQuizResults = async (quizId: string) => {
    try {
      setLoadingResults(true);
      const res = await activityService.getQuizResults(quizId);
      if (res && res.data) {
        setQuizResults(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng điểm!");
    } finally {
      setLoadingResults(false);
    }
  };

  const loadAssignments = loadAllActivities;

  const loadAssignmentSubmissions = async (assignmentId: string) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      setLoadingSubmissions(true);
      const res = await gradebookService.getAssignmentSubmissions(assignmentId);
      if (res && res.data) {
        setAssignmentSubmissions(res.data);
        const initialGrading: Record<string, { score: number | string; feedback: string }> = {};
        res.data.forEach((sub: any) => {
          const studentIdStr = typeof sub.studentId === 'object' ? sub.studentId._id : sub.studentId;
          initialGrading[studentIdStr] = {
            score: sub.grade !== undefined && sub.grade !== null ? sub.grade : '',
            feedback: sub.feedback || ''
          };
        });
        setGradingData(initialGrading);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách bài nộp!");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (selectedAssignment || selectedQuiz) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [selectedAssignment, selectedQuiz]);

  useEffect(() => {
    if (activeTab === "activities" || activeTab === "quizzes" || activeTab === "assignments") {
      loadAllActivities();
      setSelectedQuiz(null);
      setSelectedAssignment(null);
      setIsCreatingQuiz(false);
    }
  }, [activeTab, classId]);

  const handleApplyDefaultPoints = () => {
    if (quizQuestions.length === 0) return;
    const updated = quizQuestions.map(q => ({
      ...q,
      points: defaultPoints
    }));
    setQuizQuestions(updated);
    toast.success(`Đã áp dụng ${defaultPoints} điểm cho tất cả ${quizQuestions.length} câu hỏi!`);
  };

  const handleAddQuestion = () => {
    const newIndex = quizQuestions.length;
    setQuizQuestions([
      ...quizQuestions,
      { questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }
    ]);
    scrollToQuestion(newIndex);
  };

  const scrollToQuestion = (index: number) => {
    setExpandedQuestionIndex(index);
    setTimeout(() => {
      const element = document.getElementById(`quiz-question-${index}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleRemoveQuestion = (index: number) => {
    if (quizQuestions.length <= 1) {
      toast.warning("Đề thi trắc nghiệm cần có ít nhất 1 câu hỏi!");
      return;
    }
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (index: number, val: string) => {
    const updated = [...quizQuestions];
    updated[index].questionText = val;
    setQuizQuestions(updated);
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, val: string) => {
    const updated = [...quizQuestions];
    updated[qIndex].options[optIndex] = val;
    setQuizQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex: number, optIndex: number) => {
    const updated = [...quizQuestions];
    updated[qIndex].correctOptionIndex = optIndex;
    setQuizQuestions(updated);
    if (errorQuestionIndex === qIndex) {
      setErrorQuestionIndex(null);
    }
  };

  const handleQuestionImage = (qIndex: number, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WEBP)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = [...quizQuestions];
      updated[qIndex].imageUrl = e.target?.result as string;
      setQuizQuestions(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQuestionImage = (qIndex: number) => {
    const updated = [...quizQuestions];
    updated[qIndex].imageUrl = undefined;
    setQuizQuestions(updated);
  };

  const handleOptionImage = (qIndex: number, optIndex: number, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = [...quizQuestions];
      if (!updated[qIndex].optionImages) {
        updated[qIndex].optionImages = Array(updated[qIndex].options.length).fill("");
      }
      updated[qIndex].optionImages[optIndex] = e.target?.result as string;
      setQuizQuestions(updated);
    };
    reader.readAsDataURL(file);
  }

  const handleRemoveOptionImage = (qIndex: number, optIndex: number) => {
    const updated = [...quizQuestions];
    if (updated[qIndex].optionImages) {
      updated[qIndex].optionImages[optIndex] = "";
      setQuizQuestions(updated);
    }
  }

  const handleAddOption = (qIndex: number) => {
    const updated = [...quizQuestions];
    if (updated[qIndex].options.length >= 6) {
      toast.warning("Tối đa 6 phương án!");
      return;
    }
    updated[qIndex].options.push("");
    setQuizQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...quizQuestions];
    if (updated[qIndex].options.length <= 2) {
      toast.warning("Cần ít nhất 2 phương án!");
      return;
    }
    updated[qIndex].options.splice(optIndex, 1);
    // Nếu đáp án đúng bị xóa hoặc vượt chỉ số mới, reset về 0
    if (updated[qIndex].correctOptionIndex >= updated[qIndex].options.length) {
      updated[qIndex].correctOptionIndex = -1;
    }
    setQuizQuestions(updated);
  };

  const handleSaveQuiz = async (quizData: { title: string; durationMinutes: number; questions: any[]; shuffleQuestions: boolean; shuffleOptions: boolean; allowMultipleSubmissions?: boolean; }) => {
    if (!classId) return;
    setIsSavingQuiz(true);
    try {
      if (editingQuizId) {
        // Cập nhật BankItem (câu hỏi) và Activity (thông tin chung)
        const activityToUpdate = quizzes.find((q: any) => q._id === editingQuizId);
        if (activityToUpdate && activityToUpdate.bankItemId) {
          const bankId = activityToUpdate.bankItemId._id || activityToUpdate.bankItemId;
          await bankService.updateBankItem(bankId, {
            title: quizData.title,
            durationMinutes: quizData.durationMinutes,
            shuffleQuestions: quizData.shuffleQuestions,
            shuffleOptions: quizData.shuffleOptions,
            quizQuestions: quizData.questions
          });
          await activityService.updateActivity(editingQuizId, {
            title: quizData.title,
            durationMinutes: quizData.durationMinutes,
            allowMultipleSubmissions: quizData.allowMultipleSubmissions
          });
        }
        toast.success("Cập nhật đề thi trắc nghiệm thành công!");
      } else {
        // Tạo BankItem mới rồi giao cho lớp
        const bankRes: any = await bankService.createBankItem({
          type: 'quiz',
          title: quizData.title,
          durationMinutes: quizData.durationMinutes,
          shuffleQuestions: quizData.shuffleQuestions,
          shuffleOptions: quizData.shuffleOptions,
          quizQuestions: quizData.questions
        });

        const bankItemId = bankRes?.data?._id || bankRes?._id;
        if (!bankItemId) {
          throw new Error("Không lấy được ID tài nguyên từ ngân hàng đề!");
        }

        await activityService.assignActivity(classId, {
          bankItemId: bankItemId,
          title: quizData.title,
          durationMinutes: quizData.durationMinutes,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          allowMultipleSubmissions: quizData.allowMultipleSubmissions
        });
        toast.success("Tạo đề thi trắc nghiệm thành công!");
      }
      setIsCreatingQuiz(false);
      setEditingQuizId(null);
      loadQuizzes();
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.includes('đã có học sinh làm bài')) {
        setPendingQuizData(quizData);
        setIsResetQuizDialogOpen(true);
      } else {
        toast.error(errorMessage || (editingQuizId ? "Cập nhật đề thi trắc nghiệm thất bại!" : "Tạo đề thi trắc nghiệm thất bại!"));
      }
      throw err;
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const confirmSaveWithReset = async () => {
    if (!editingQuizId || !pendingQuizData) return;
    setIsResettingQuiz(true);
    try {
      const activityToUpdate = quizzes.find((q: any) => q._id === editingQuizId);
      if (activityToUpdate && activityToUpdate.bankItemId) {
        const bankId = activityToUpdate.bankItemId._id || activityToUpdate.bankItemId;
        await bankService.updateBankItem(bankId, {
          title: pendingQuizData.title,
          durationMinutes: pendingQuizData.durationMinutes,
          shuffleQuestions: pendingQuizData.shuffleQuestions,
          shuffleOptions: pendingQuizData.shuffleOptions,
          quizQuestions: pendingQuizData.questions
        });
        await activityService.updateActivity(editingQuizId, {
          title: pendingQuizData.title,
          durationMinutes: pendingQuizData.durationMinutes
        });
      }
      toast.success("Cập nhật đề thi & reset kết quả thành công!");
      setIsCreatingQuiz(false);
      setEditingQuizId(null);
      setPendingQuizData(null);
      loadQuizzes();
      setIsResetQuizDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể cập nhật đề thi này!");
    } finally {
      setIsResettingQuiz(false);
    }
  };



  const handleToggleQuizStatus = async (quizItem: any) => {
    const newStatus = quizItem.status === 'open' ? 'closed' : 'open';
    try {
      const res = await activityService.updateActivity(quizItem._id, { status: newStatus });
      if (res) {
        setAllActivities(prev => prev.map(a =>
          a._id === quizItem._id ? { ...a, status: newStatus } : a
        ));
        setQuizzes(prevQuizzes => prevQuizzes.map(q =>
          q._id === quizItem._id ? { ...q, status: newStatus } : q
        ));
        setAssignments(prev => prev.map(a =>
          a._id === quizItem._id ? { ...a, status: newStatus } : a
        ));
        toast.success(`Đã ${newStatus === 'open' ? 'mở' : 'đóng'} bài tập "${quizItem.title}"`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái bài tập");
    }
  };

  const handleDeleteQuizClick = (quizItem: any) => {
    setQuizToDelete(quizItem);
    setIsDeleteQuizDialogOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeletingQuiz(true);
    try {
      await activityService.deleteActivity(quizToDelete._id);
      toast.success("Xóa đề thi thành công!");
      setQuizzes(prevQuizzes => prevQuizzes.filter(q => q._id !== quizToDelete._id));
      setIsDeleteQuizDialogOpen(false);
      setQuizToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể xóa đề thi này!");
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  const handleDeleteAssignmentClick = (assignmentItem: any) => {
    setAssignmentToDelete(assignmentItem);
    setIsDeleteAssignmentDialogOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setIsDeletingAssignment(true);
    try {
      await activityService.deleteActivity(assignmentToDelete._id);
      toast.success("Xóa bài tập thành công!");
      setAssignments(prev => prev.filter(a => a._id !== assignmentToDelete._id));
      setIsDeleteAssignmentDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể xóa bài tập này!");
    } finally {
      setIsDeletingAssignment(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedAssignment) return;
    setIsSavingGrades(true);
    try {
      const gradesPayload: { studentId: string; score: number; feedback?: string }[] = [];
      Object.entries(gradingData).forEach(([studentId, data]) => {
        if (data.score !== '' && !isNaN(Number(data.score))) {
          gradesPayload.push({
            studentId,
            score: Number(data.score),
            feedback: data.feedback
          });
        }
      });

      if (gradesPayload.length === 0) {
        toast.warning("Vui lòng nhập điểm số cho ít nhất 1 học sinh trước khi lưu!");
        setIsSavingGrades(false);
        return;
      }

      await gradebookService.saveGrades({
        assignmentId: selectedAssignment._id,
        grades: gradesPayload
      });
      toast.success("Lưu điểm & nhận xét thành công!");
      await loadAssignmentSubmissions(selectedAssignment._id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Lỗi khi lưu bảng điểm!");
    } finally {
      setIsSavingGrades(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingQuiz(false);
    setEditingQuizId(null);
  };

  // Mở danh sách bài soạn từ ngân hàng đề để giao
  const handleOpenAssignFromBank = async () => {
    setIsAssignFromBankOpen(true);
    setLoadingBank(true);
    setSelectedBankItem(null);
    try {
      const res = await bankService.getMyBankItems();
      setBankItems(res.data || []);
    } catch {
      toast.error("Không thể tải danh sách tài nguyên từ ngân hàng");
    } finally {
      setLoadingBank(false);
    }
  };

  // Chọn bài soạn từ ngân hàng
  const handleSelectBankItem = (item: any) => {
    setSelectedBankItem(item);
    setAssignTitle(item.title);
    setAssignDescription(item.description || "");
    setAssignMaxScore(item.maxScore || 10);
    setAssignDurationMinutes(item.durationMinutes || 15);

    const knownCategories = ["homework", "periodic", "mock_exam", "attitude"];
    if (item.category && !knownCategories.includes(item.category)) {
      setAssignCategory("custom");
      setAssignCustomCategory(item.category);
    } else {
      setAssignCategory(item.category || (item.type === 'quiz' ? 'periodic' : 'homework'));
      setAssignCustomCategory("");
    }

    setAssignAllowMultiple(false);

    // Hạn nộp mặc định là 7 ngày sau (Định dạng local ISO cho datetime-local picker)
    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
    setAssignDueDate(defaultDate.toISOString().slice(0, 16));
  };

  // Giao bài tập
  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankItem || !classId) return;

    const finalCategory = assignCategory === 'custom' ? assignCustomCategory : assignCategory;
    if (assignCategory === 'custom' && !assignCustomCategory.trim()) {
      toast.error("Vui lòng nhập tên phân loại bài tập tùy chỉnh!");
      return;
    }

    if (assignDueDate) {
      const selectedTime = new Date(assignDueDate).getTime();
      if (!isNaN(selectedTime) && selectedTime < Date.now() - 60000) {
        toast.error("Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.");
        return;
      }
    }

    setIsAssigning(true);
    try {
      await activityService.assignActivity(classId, {
        bankItemId: selectedBankItem._id,
        title: assignTitle,
        description: assignDescription,
        category: finalCategory,
        dueDate: assignDueDate,
        maxScore: assignMaxScore,
        durationMinutes: selectedBankItem.type === 'quiz' ? assignDurationMinutes : undefined,
        allowMultipleSubmissions: assignAllowMultiple
      });
      toast.success("Giao bài tập mới thành công!");

      // Reset form states
      setAssignTitle("");
      setAssignDescription("");
      setAssignCategory("homework");
      setAssignCustomCategory("");
      setAssignDueDate("");
      setAssignMaxScore(10);
      setAssignAllowMultiple(false);

      setIsAssignFromBankOpen(false);
      setSelectedBankItem(null);
      if (selectedBankItem.type === 'quiz') {
        loadQuizzes();
      } else {
        loadAssignments();
      }
    } catch (err: any) {
      toast.error(err.message || "Giao bài tập thất bại!");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOpenEditActivity = (act: any) => {
    if (act.type === "quiz") {
      handleOpenEditQuiz(act);
      return;
    }
    setEditingActivity(act);
    setEditTitle(act.title || "");
    setEditDescription(act.description || "");

    const knownCategories = ["homework", "periodic", "mock_exam", "attitude"];
    if (act.category && !knownCategories.includes(act.category)) {
      setEditCategory("custom");
      setEditCustomCategory(act.category);
    } else {
      setEditCategory(act.category || "homework");
      setEditCustomCategory("");
    }

    setEditMaxScore(act.maxScore || 10);
    setEditAllowMultiple(act.allowMultipleSubmissions ?? false);

    if (act.dueDate) {
      const d = new Date(act.dueDate);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setEditDueDate(d.toISOString().slice(0, 16));
    } else {
      const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setEditDueDate(d.toISOString().slice(0, 16));
    }
  };

  const handleConfirmEditActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    const finalCategory = editCategory === 'custom' ? editCustomCategory : editCategory;
    if (editCategory === 'custom' && !editCustomCategory.trim()) {
      toast.error("Vui lòng nhập tên phân loại bài tập tùy chỉnh!");
      return;
    }

    if (editDueDate) {
      const selectedTime = new Date(editDueDate).getTime();
      if (!isNaN(selectedTime) && selectedTime < Date.now() - 60000) {
        toast.error("Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.");
        return;
      }
    }

    setIsSavingEditActivity(true);
    try {
      const updatedData = {
        title: editTitle,
        description: editDescription,
        category: finalCategory,
        dueDate: editDueDate,
        maxScore: editMaxScore,
        allowMultipleSubmissions: editAllowMultiple
      };
      const res = await activityService.updateActivity(editingActivity._id, updatedData);
      if (res) {
        setAllActivities(prev => prev.map(a => a._id === editingActivity._id ? { ...a, ...updatedData } : a));
        setAssignments(prev => prev.map(a => a._id === editingActivity._id ? { ...a, ...updatedData } : a));
        toast.success("Cập nhật thông tin bài tập thành công!");
        setEditingActivity(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Lỗi khi cập nhật bài tập!");
    } finally {
      setIsSavingEditActivity(false);
    }
  };

  const handleOpenCreateQuiz = () => {
    setQuizTitle("");
    setQuizDuration(15);
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setQuizQuestions([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: -1, points: 1 }]);
    setEditingQuizId(null);
    setIsCreatingQuiz(true);
  };

  const handleOpenEditQuiz = (quizItem: any) => {
    setQuizTitle(quizItem.title);
    setQuizDuration(quizItem.durationMinutes);
    setShuffleQuestions(quizItem.shuffleQuestions || quizItem.bankItemId?.shuffleQuestions || false);
    setShuffleOptions(quizItem.shuffleOptions || quizItem.bankItemId?.shuffleOptions || false);
    // Sao chép sâu câu hỏi vào form state từ bankItemId.quizQuestions hoặc quizItem.questions
    const rawQuestions = quizItem.bankItemId?.quizQuestions || quizItem.questions || [];
    const formattedQuestions = rawQuestions.map((q: any) => ({
      questionText: q.questionText || "",
      imageUrl: q.imageUrl,
      options: q.options ? [...q.options] : ["", "", "", ""],
      optionImages: q.optionImages ? [...q.optionImages] : [],
      correctOptionIndex: q.correctOptionIndex ?? -1,
      points: q.points || 1
    }));
    setQuizQuestions(formattedQuestions);
    setEditingQuizId(quizItem._id);
    setAllowMultipleSubmissions(quizItem.allowMultipleSubmissions ?? false);
    setIsCreatingQuiz(true);
  };

  // Tải dữ liệu lớp học và bảng tin
  const loadData = async (isInitial = false) => {
    if (!classId) return;
    if (isInitial) setLoadingData(true);

    // Tải thông tin lớp học
    try {
      const res = await classroomService.getClassroomDetail(classId);
      if (res && res.data) {
        setClassroom({
          _id: res.data._id,
          className: res.data.name,
          subject: res.data.subject || "",
          code: res.data.code,
          teacherName: (res.data as any).teacherId?.name || "Giáo viên",
          studentCount: res.data.students?.length || 0,
          status: res.data.status
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải thông tin lớp học!");
      navigate("/classrooms");
      return;
    }

    // Tải danh sách thông báo thật từ API
    try {
      const annRes = await announcementService.getAnnouncements(classId);
      if (annRes && annRes.data) {
        setAnnouncements(annRes.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng tin lớp học!");
    } finally {
      if (isInitial) setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // Kết nối Socket.io Realtime cho Bảng tin lớp học (Giáo viên)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const socket = io(backendUrl, { withCredentials: true });

    socket.on('classroom_feed_update', (targetClassId?: string) => {
      if (!targetClassId || targetClassId === classId) {
        console.log('⚡ [Socket.io Realtime] Bảng tin có cập nhật mới, đang tự động tải lại...');
        loadData();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [classId]);

  useEffect(() => {
    setFeedPage(1);
  }, [filterChip, searchQuery]);

  // Bộ lọc thông báo
  const filteredAnnouncements = announcements.filter(ann => {
    // Lọc theo loại (chip)
    if (filterChip !== "all" && ann.type !== filterChip) return false;

    // Lọc theo nội dung tìm kiếm
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return ann.content.toLowerCase().includes(q);
    }

    return true;
  }).sort((a, b) => {
    // Đưa bài ghim lên đầu
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const feedItemsPerPage = 5;
  const totalFeedPages = Math.ceil(filteredAnnouncements.length / feedItemsPerPage);
  const paginatedAnnouncements = filteredAnnouncements.slice((feedPage - 1) * feedItemsPerPage, feedPage * feedItemsPerPage);
  const feedStartIdx = filteredAnnouncements.length > 0 ? (feedPage - 1) * feedItemsPerPage + 1 : 0;
  const feedEndIdx = Math.min(feedPage * feedItemsPerPage, filteredAnnouncements.length);

  // Xử lý chọn file thật từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      size: file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`,
      url: URL.createObjectURL(file)
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    // Reset input để có thể chọn lại cùng file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Đăng bài mới
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    if (!postText.trim() && !attachedLink.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo hoặc chèn link!");
      return;
    }

    setIsPosting(true);
    try {
      let finalContent = postText.trim();
      if (attachedLink.trim()) {
        finalContent = finalContent ? `${finalContent}\n\n${attachedLink.trim()}` : attachedLink.trim();
      }

      await announcementService.createAnnouncement({
        classId,
        content: finalContent,
        type: postType,
        attachments: attachedFiles.map(f => ({ name: f.name, url: f.url, size: f.size }))
      });
      toast.success("Đăng bài thông báo thành công!");
      setPostText("");
      setAttachedLink("");
      setShowLinkInput(false);
      setPostType("announcement");
      setAttachedFiles([]);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi đăng bài!");
    } finally {
      setIsPosting(false);
    }
  };

  // Xóa bài đăng
  const handleDeletePostClick = (annId: string) => {
    setPostToDelete(annId);
    setIsDeletePostDialogOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
      await announcementService.deleteAnnouncement(postToDelete);
      // Xóa khỏi state ngay lập tức (không cần reload)
      setAnnouncements(prev => prev.filter(ann => ann._id !== postToDelete));
      toast.success("Đã xóa thông báo!");
      setIsDeletePostDialogOpen(false);
      setPostToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa thông báo. Bạn có phải tác giả không?");
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Ghim bài đăng
  const handleTogglePin = async (annId: string) => {
    try {
      const res = await announcementService.togglePin(annId);
      if (res && res.data) {
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? (res.data as IAnnouncement) : ann)));
        toast.success(res.data.isPinned ? "Đã ghim thông báo!" : "Đã bỏ ghim thông báo!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi ghim thông báo!");
    }
  };

  // Thích bài đăng
  const handleLikeAnnouncement = async (annId: string) => {
    try {
      const res = await announcementService.likeAnnouncement(annId);
      if (res && res.data) {
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? (res.data as IAnnouncement) : ann)));
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thích thông báo!");
    }
  };

  // Thích bình luận
  const handleLikeComment = async (annId: string, commentId: string) => {
    try {
      const res = await announcementService.likeComment(annId, commentId);
      if (res && res.data) {
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? (res.data as IAnnouncement) : ann)));
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thích bình luận!");
    }
  };

  // Đăng bình luận
  const handleAddComment = async (annId: string, contentFromComponent?: string) => {
    let commentContent = (contentFromComponent || commentInputs[annId] || "").trim();
    if (!commentContent) return;

    const parentId = replyToMap[annId];
    if (parentId && commentContent.startsWith("@")) {
      commentContent = `<!--replyTo:${parentId}-->${commentContent}`;
    }

    setSendingComment(annId);
    try {
      const res = await announcementService.addComment(annId, commentContent);
      if (res && res.data) {
        const comments = res.data.comments;
        setAnnouncements(prev =>
          prev.map(ann =>
            ann._id === annId ? { ...ann, comments } : ann
          )
        );
        setCommentInputs(prev => ({ ...prev, [annId]: "" }));
        setReplyToMap(prev => ({ ...prev, [annId]: "" }));
        toast.success("Đã gửi bình luận!");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể đăng bình luận!");
    } finally {
      setSendingComment(null);
    }
  };

  // Xóa bình luận
  const handleDeleteComment = async (annId: string, commentId: string) => {
    try {
      const res = await announcementService.deleteComment(annId, commentId);
      if (res && res.data) {
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? (res.data as IAnnouncement) : ann)));
        toast.success("Đã xóa bình luận thành công!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể xóa bình luận này!");
    }
  };

  // Format ngày tương đối hoặc tuyệt đối
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 1) return "Vừa xong";
      if (diffMin < 60) return `${diffMin} phút trước`;

      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs} giờ trước`;

      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <>
      {loadingData && (
        <FullPageLoader
          text="Đang tải dữ liệu lớp học..."
          subtext="Vui lòng chờ trong giây lát"
        />
      )}
      <div className={styles.classroomDetailContainer}>
        <div className={styles.mainContent}>
          {/* TABS 3: SCHEDULE VIEW */}
          {activeTab === "schedule" && (
            <div className={styles.tabContentPanel}>
              <div className={styles.reportCard}>
                <h3>Lịch trình học tập</h3>
                <p>Lịch dạy và các buổi học thêm được xếp lịch cho lớp {classroom?.className}.</p>
                <div className={styles.scheduleTimeline}>
                  <div className={styles.timelineEvent}>
                    <span className={styles.eventTime}>Thứ 2 (08:00 - 09:30)</span>
                    <div className={styles.eventInfo}>
                      <h4>Buổi ôn tập Đại Số</h4>
                      <p>Chương Đạo hàm & Khảo sát hàm số</p>
                    </div>
                  </div>
                  <div className={styles.timelineEvent}>
                    <span className={styles.eventTime}>Thứ 4 (18:00 - 19:30)</span>
                    <div className={styles.eventInfo}>
                      <h4>Học chuyên đề Hình Học không gian</h4>
                      <p>Tính thể tích khối đa diện</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TABS 1: OVERVIEW (FEED VIEW - GIỐNG ẢNH MẪU) */}
          {activeTab === "overview" && (
            <div className={styles.feedLayout}>
              {/* THÔNG BÁO LỚP ĐÓNG */}
              {classroom?.status === 'Closed' && (
                <div className="col-span-full mb-4 w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 shadow-sm items-start">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-full shrink-0">
                    <Archive size={20} weight="fill" />
                  </div>
                  <div>
                    <h4 className="text-amber-800 font-bold text-sm mb-1">Lớp học đang bị đóng</h4>
                    <p className="text-amber-700/90 text-[13px] leading-relaxed">
                      Lớp học này đã bị đóng. Học sinh chỉ có thể xem lại dữ liệu cũ, không thể nộp bài mới hay bình luận.
                    </p>
                  </div>
                </div>
              )}
              {/* LEFT SIDEBAR: CLASS INFO & PROGRESS */}
              <div className={styles.classSidebar}>
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-3xs flex flex-col gap-3">
                  {/* TÊN LỚP HỌC */}
                  <div className="flex flex-col border-b border-slate-100 pb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lớp học</span>
                    <h2 className="text-base font-black text-[#f47c20] m-0 tracking-tight leading-snug">
                      {classroom?.className || "Lớp học"}
                    </h2>
                  </div>

                  <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Thông tin chi tiết</h4>

                  {/* 4 MỤC THÔNG TIN DẠNG LƯỚI 2 CỘT ĐỒNG BỘ CHUẨN MÃ MÀU THƯƠNG HIỆU ($primary #f47c20, $secondary #2f8fa3, $warning #F59E0B) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* GIÁO VIÊN - $secondary (#2f8fa3) */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#2f8fa3]/10 border border-[#2f8fa3]/30 shadow-2xs min-w-0 transition-all hover:bg-[#2f8fa3]/15 hover:border-[#2f8fa3]/50">
                      <div className="w-7 h-7 rounded-lg bg-[#2f8fa3]/20 text-[#2f8fa3] flex items-center justify-center shrink-0 font-bold">
                        <User size={15} weight="bold" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-[#2f8fa3] font-bold uppercase tracking-wider truncate">Giáo viên</span>
                        <span className="text-xs font-black text-[#0F172A] truncate capitalize" title={classroom?.teacherName || user?.name || "—"}>
                          {classroom?.teacherName || user?.name || "—"}
                        </span>
                      </div>
                    </div>

                    {/* MÔN HỌC - $primary (#f47c20) */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f47c20]/10 border border-[#f47c20]/30 shadow-2xs min-w-0 transition-all hover:bg-[#f47c20]/15 hover:border-[#f47c20]/50">
                      <div className="w-7 h-7 rounded-lg bg-[#f47c20]/20 text-[#f47c20] flex items-center justify-center shrink-0 font-bold">
                        <BookOpen size={15} weight="bold" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-[#f47c20] font-bold uppercase tracking-wider truncate">Môn học</span>
                        <span className="text-xs font-black text-[#0F172A] truncate">
                          {classroom?.subject || "Môn học chung"}
                        </span>
                      </div>
                    </div>

                    {/* MÃ GIA NHẬP - $warning (#F59E0B) */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/35 shadow-2xs min-w-0 transition-all hover:bg-[#F59E0B]/15">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/20 text-[#d97706] flex items-center justify-center shrink-0 font-bold">
                          <Key size={15} weight="bold" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-[#b45309] font-bold uppercase tracking-wider truncate">Mã gia nhập</span>
                          <span className="text-xs font-black font-mono text-[#78350f] tracking-wider truncate">
                            {classroom?.code || "—"}
                          </span>
                        </div>
                      </div>
                      {classroom?.code && (
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-1 text-[#b45309] hover:bg-[#F59E0B]/25 rounded-md transition-colors cursor-pointer border-none shrink-0"
                          title="Sao chép mã lớp"
                        >
                          {copiedCode ? <Check size={14} weight="bold" className="text-emerald-600" /> : <Copy size={14} weight="bold" />}
                        </button>
                      )}
                    </div>

                    {/* SĨ SỐ LỚP - $secondary (#2f8fa3) */}
                    <div
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#2f8fa3]/10 border border-[#2f8fa3]/30 shadow-2xs hover:bg-[#2f8fa3]/15 hover:border-[#2f8fa3]/50 transition-all cursor-pointer min-w-0"
                      onClick={() => navigate(`/classrooms/${classId}/students`)}
                      title="Quản lý danh sách học sinh"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#2f8fa3]/20 text-[#2f8fa3] flex items-center justify-center shrink-0 font-bold">
                          <Users size={15} weight="bold" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-[#2f8fa3] font-bold uppercase tracking-wider truncate">Sĩ số lớp</span>
                          <span className="text-xs font-black text-[#0F172A] truncate">
                            {classroom?.studentCount || 0} học sinh
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#2f8fa3] font-bold shrink-0">&rarr;</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: TIẾN ĐỘ TRUNG BÌNH */}
                <div className={styles.reportCardMini}>
                  <div className={styles.reportHeader}>
                    <div className={styles.headerIcon}>
                      <TrendUp size={18} weight="bold" className="text-[#2f8fa3]" />
                    </div>
                    <h3>Tiến độ trung bình</h3>
                  </div>
                  <div className={styles.reportMetricsMini}>
                    <div className={styles.statMetricMini}>
                      <span className={styles.statNumMini}>
                        <AnimatedCounter end={92} suffix="%" />
                      </span>
                      <span className={styles.statDescMini}>Hoàn thành</span>
                    </div>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statMetricMini}>
                      <span className={styles.statNumMini}>
                        <AnimatedCounter end={8.4} decimals={1} />
                      </span>
                      <span className={styles.statDescMini}>GPA</span>
                    </div>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statMetricMini}>
                      <span className={styles.statNumMini}>
                        <AnimatedCounter end={96} suffix="%" />
                      </span>
                      <span className={styles.statDescMini}>Chuyên cần</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT MAIN FEED */}
              <div className={styles.feedMain}>
                {/* POST COMPOSER */}
                {userRole === "TEACHER" && (
                  <div className={styles.postComposer}>
                    <div className={styles.composerTop}>
                      <img src={userAvatar} alt="Avatar" className={styles.avatarMini} />
                      <textarea
                        ref={composerRef}
                        placeholder="Bạn muốn thông báo gì cho cả lớp hôm nay?"
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                      />
                    </div>

                    <div style={{ padding: '0 16px' }}>
                      <FolderUpload
                        label="Không có tệp nào được chọn"
                        onFileSelect={(files) => handleFileChange({ target: { files } } as any)}
                        value={attachedFiles.length > 0 ? attachedFiles.map(f => f.name).join(', ') : ''}
                      />
                    </div>

                    {/* Tệp đính kèm đã chọn */}
                    {attachedFiles.length > 0 && (
                      <div className={styles.composerAttachments}>
                        {attachedFiles.map((file, index) => (
                          <div key={index} className={styles.attachedFileItem}>
                            <FilePdf size={16} weight="fill" color="#EF4444" />
                            <span>{file.name} <em>({file.size})</em></span>
                            <button
                              type="button"
                              onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== index))}
                              className={styles.removeAttachBtn}
                            >
                              <X size={13} weight="bold" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input đính kèm Link Youtube / Google Drive (Luôn luôn hiện) */}
                    <div className="flex items-center gap-2.5 p-2.5 mx-4 my-2 bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs">
                      <div className="flex items-center gap-1 shrink-0">
                        <YoutubeLogo size={16} weight="fill" className="text-red-500" />
                        <GoogleLogo size={16} weight="bold" className="text-emerald-600" />
                      </div>
                      <input
                        type="url"
                        placeholder="Dán đường dẫn Youtube hoặc Google Drive vào đây (tuỳ chọn)..."
                        value={attachedLink}
                        onChange={(e) => setAttachedLink(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 font-medium placeholder:text-slate-400"
                      />
                      {attachedLink && (
                        <button
                          type="button"
                          onClick={() => setAttachedLink("")}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer border-none shrink-0"
                          title="Xóa link"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      )}
                    </div>

                    <div className={styles.composerBottom}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">Loại bài đăng:</span>
                        {/* Loại bài đăng - custom chips */}
                        <div className={styles.typeChips}>
                          <button
                            type="button"
                            className={`${styles.typeChip} ${postType === "announcement" ? styles.typeChipActive : ""}`}
                            onClick={() => setPostType("announcement")}
                          >
                            <Megaphone size={14} weight="duotone" />
                            Thông báo
                          </button>
                          <button
                            type="button"
                            className={`${styles.typeChip} ${postType === "reminder" ? styles.typeChipActiveReminder : ""}`}
                            onClick={() => setPostType("reminder")}
                          >
                            <Bell size={14} weight="duotone" />
                            Nhắc nhở
                          </button>
                          <button
                            type="button"
                            className={`${styles.typeChip} ${postType === "material" ? styles.typeChipActiveMaterial : ""}`}
                            onClick={() => setPostType("material")}
                          >
                            <BookOpen size={14} weight="duotone" />
                            Tài liệu
                          </button>
                        </div>
                      </div>

                      <div className={styles.composerActions} style={{ justifyContent: 'flex-end' }}>
                        <PrimaryButton
                          onClick={handleCreatePost}
                          disabled={!postText.trim() || isPosting}
                        >
                          {isPosting ? "Đang đăng..." : "Đăng bài"}
                        </PrimaryButton>
                      </div>
                    </div>
                  </div>
                )}

                {/* FEED SECTION HEADER & ADMIN-STYLE DROPDOWN FILTER */}
                <div className="flex items-center justify-between mt-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Bảng tin lớp học
                    </span>
                  </div>
                  <DropdownFilter
                    label="Lọc bài đăng"
                    value={filterChip}
                    options={[
                      { id: "all", label: "Tất cả bài đăng" },
                      { id: "announcement", label: "Thông báo" },
                      { id: "reminder", label: "Nhắc nhở" },
                      { id: "material", label: "Tài liệu" },
                    ]}
                    onChange={(key) => setFilterChip(key as any)}
                    minWidthClass="min-w-[165px]"
                  />
                </div>

                {/* ANNOUNCEMENT FEED LIST */}
                <div className={styles.feedList}>
                  {paginatedAnnouncements.length > 0 ? (
                    paginatedAnnouncements.map((ann) => {
                      // Xác định tên hiển thị cho loại bài đăng tiếng Việt
                      let typeText = "đã đăng một thông báo";
                      if (ann.type === "reminder") typeText = "đã đăng một nhắc nhở";
                      if (ann.type === "material") typeText = "đã chia sẻ một tài liệu";

                      const authorDisplayName = ann.authorId?.name || "Giáo viên";
                      const authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorDisplayName)}&background=f47c20&color=fff&bold=true`;

                      const getTypeStyles = (type: string) => {
                        if (type === "reminder") return { label: "Nhắc nhở", icon: <Bell size={14} weight="duotone" />, cls: styles.tagReminder };
                        if (type === "material") return { label: "Tài liệu", icon: <BookOpen size={14} weight="duotone" />, cls: styles.tagMaterial };
                        if (type === "assignment") return { label: "Bài tập", icon: <ClipboardText size={14} weight="duotone" />, cls: styles.tagAssignment };
                        return { label: "Thông báo", icon: <Megaphone size={14} weight="duotone" />, cls: styles.tagAnnouncement };
                      };
                      const { label, icon, cls } = getTypeStyles(ann.type);

                      return (
                        <div key={ann._id} className={styles.announcementCard}>
                          {/* Top Header Card */}
                          <div className={styles.cardHeader}>
                            <div className={styles.authorInfo}>
                              <img src={authorAvatar} alt="Author" className={styles.authorAvatar} />
                              <div className={styles.authorMeta}>
                                <div className={styles.authorNameRow}>
                                  <strong>{authorDisplayName}</strong>
                                  <span className={`${styles.typeTag} ${cls}`}>
                                    {icon} {label}
                                  </span>
                                </div>
                                <div className={styles.timeMeta}>
                                  {formatTime(ann.createdAt)} • {classroom?.className || "Lớp học"}
                                </div>
                              </div>
                            </div>
                            <div className={styles.headerActions}>
                              {userRole === "TEACHER" && (
                                <>
                                  <button
                                    className={`${styles.pinPostBtn} ${ann.isPinned ? styles.activePin : ""}`}
                                    onClick={() => handleTogglePin(ann._id)}
                                    title={ann.isPinned ? "Bỏ ghim" : "Ghim bài đăng"}
                                  >
                                    <PushPin size={16} weight={ann.isPinned ? "fill" : "regular"} />
                                  </button>
                                  <button
                                    className={styles.deletePostBtn}
                                    onClick={() => handleDeletePostClick(ann._id)}
                                    title="Xóa bài đăng"
                                  >
                                    <Trash size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Content Card với Media Renderer */}
                          <div className={styles.cardContent}>
                            <MediaContentRenderer content={ann.content} />
                          </div>

                          {/* Attachments Card */}
                          {ann.attachments && ann.attachments.length > 0 && (
                            <div className={styles.filesGrid}>
                              {ann.attachments.map((file, idx) => (
                                <FolderFileCard
                                  key={idx}
                                  fileName={file.name}
                                  fileSize={file.size || ''}
                                  downloadUrl={file.url}
                                />
                              ))}
                            </div>
                          )}

                          {/* Comments section */}
                          <AnnouncementComments
                            announcementId={ann._id}
                            comments={ann.comments || []}
                            user={user}
                            classroomStatus={classroom?.status}
                            onAddComment={handleAddComment}
                            onLikeComment={handleLikeComment}
                            onDeleteComment={handleDeleteComment}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.emptyFeed}>
                      <div className={styles.illustrationCircle}>
                        <ChatCircleText size={56} weight="duotone" className="text-slate-300" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-700 mt-4 mb-2">Chưa có bài đăng nào</h4>
                      <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Lớp học của bạn đang khá yên ắng. Hãy là người đầu tiên chia sẻ thông tin, lời chào hoặc tài liệu cho lớp nhé.</p>
                      {userRole === "TEACHER" && (
                        <button className={styles.ctaEmptyBtn} onClick={handleFocusComposer}>
                          <Plus size={16} weight="bold" />
                          Tạo thông báo đầu tiên cho lớp
                        </button>
                      )}
                    </div>
                  )}

                  {/* PAGINATION TOOLBAR FOR CLASS FEED */}
                  {totalFeedPages > 1 && filteredAnnouncements.length > 0 && (
                    <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200/80 bg-white/70 rounded-2xl shadow-3xs mt-4 mb-2">
                      <Pagination.Summary className="text-sm text-slate-500 font-medium">
                        Hiển thị {feedStartIdx} đến {feedEndIdx} trong số {filteredAnnouncements.length} bài đăng
                      </Pagination.Summary>
                      <Pagination.Content>
                        <Pagination.Item>
                          <Pagination.Previous
                            isDisabled={feedPage === 1}
                            onPress={() => setFeedPage((p) => Math.max(1, p - 1))}
                          >
                            <Pagination.PreviousIcon />
                            Trang trước
                          </Pagination.Previous>
                        </Pagination.Item>
                        {Array.from({ length: totalFeedPages }, (_, i) => i + 1).map((p) => (
                          <Pagination.Item key={p}>
                            <Pagination.Link
                              isActive={p === feedPage}
                              onPress={() => setFeedPage(p)}
                              className={p === feedPage ? "bg-[#f47c20] text-white font-bold border-[#f47c20]" : "text-slate-600 font-medium hover:bg-slate-100"}
                            >
                              {p}
                            </Pagination.Link>
                          </Pagination.Item>
                        ))}
                        <Pagination.Item>
                          <Pagination.Next
                            isDisabled={feedPage === totalFeedPages}
                            onPress={() => setFeedPage((p) => Math.min(totalFeedPages, p + 1))}
                          >
                            Trang sau
                            <Pagination.NextIcon />
                          </Pagination.Next>
                        </Pagination.Item>
                      </Pagination.Content>
                    </Pagination>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* UNIFIED ACTIVITIES VIEW */}
          {(activeTab === "activities" || activeTab === "quizzes" || activeTab === "assignments") && (
            <div className={styles.tabContentPanel}>
              {isCreatingQuiz ? (
                <div style={{ marginTop: '20px' }}>
                  <QuizBuilder
                    initialData={editingQuizId ? {
                      title: quizTitle,
                      durationMinutes: quizDuration,
                      questions: quizQuestions,
                      shuffleQuestions: shuffleQuestions,
                      shuffleOptions: shuffleOptions,
                      allowMultipleSubmissions: allowMultipleSubmissions
                    } : null}
                    onSubmit={handleSaveQuiz}
                    onCancel={handleCancelCreate}
                    isSaving={isSavingQuiz}
                  />
                </div>
              ) : selectedQuiz ? (
                /* SUBMISSIONS RESULTS TABLE */
                <div className={styles.submissionsView}>
                  <div className={styles.submissionsHeader}>
                    <div className="flex flex-col gap-3">
                      <BackButton onClick={() => {
                        setSelectedQuiz(null);
                        setQuizResultTab("scores");
                      }}>
                        Quay lại danh sách đề thi
                      </BackButton>
                      <h3 className="text-xl font-bold text-slate-800">Phân tích: {selectedQuiz.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6 border-b border-slate-200">
                    <button
                      className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors ${quizResultTab === 'scores' ? 'border-[#FE6747] text-[#FE6747]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setQuizResultTab('scores')}
                    >
                      Bảng điểm & Bài nộp
                    </button>
                    <button
                      className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors ${quizResultTab === 'errors' ? 'border-[#FE6747] text-[#FE6747]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setQuizResultTab('errors')}
                    >
                      💡 Phân tích lỗi sai của lớp
                    </button>
                  </div>

                  {quizResultTab === 'scores' ? (
                    <>
                      {loadingResults ? (
                        <p style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>Đang tải bảng điểm...</p>
                      ) : quizResults.length === 0 ? (
                        <div className={styles.emptyFeed}>
                          <p>Chưa có học sinh nào nộp bài thi trắc nghiệm này.</p>
                        </div>
                      ) : (
                        <div className={styles.submissionsTableWrapper}>
                          <table className={styles.submissionsTable}>
                            <thead>
                              <tr>
                                <th>Học sinh</th>
                                <th>Thời gian nộp</th>
                                <th>Số câu đúng</th>
                                <th>Điểm thi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quizResults.map((resItem) => {
                                const student = resItem.studentId || {};
                                const name = student.name || "Học sinh";
                                const email = student.email || "";
                                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&bold=true`;
                                const score = resItem.score;

                                let badgeClass = styles.scoreBadge;
                                if (score < 5) badgeClass += ` ${styles.low}`;
                                else if (score < 8) badgeClass += ` ${styles.mid}`;

                                const correctCount = Math.round((score / 10) * resItem.totalQuestions);

                                return (
                                  <tr key={resItem._id}>
                                    <td>
                                      <div className={styles.studentCell}>
                                        <img src={avatarUrl} alt="" className={styles.studentAvatar} />
                                        <div className={styles.studentInfo}>
                                          <span className={styles.studentName}>{name}</span>
                                          <span className={styles.studentEmail}>{email}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td>{new Date(resItem.submittedAt).toLocaleString("vi-VN")}</td>
                                    <td>{correctCount}/{resItem.totalQuestions} câu</td>
                                    <td>
                                      <span className={badgeClass}>{score}/10</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    <ClassErrorInsights activityId={selectedQuiz._id} />
                  )}
                </div>
              ) : selectedAssignment ? (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300 pt-2">
                  {/* OUTSIDE BACK BUTTON */}
                  <div>
                    <BackButton onClick={() => setSelectedAssignment(null)}>
                      Quay lại danh sách bài tập
                    </BackButton>
                  </div>

                  {/* HEADER BANNER & STATS */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                          <ClipboardText size={28} className="text-[#f47c20]" weight="duotone" />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#f47c20] bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/60 inline-block mb-1">
                            Bài tập tự luận
                          </span>
                          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                            Chấm bài: {selectedAssignment.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thang điểm:</span>
                          <span className="text-base font-extrabold text-[#f47c20]">10 điểm</span>
                        </div>
                        <SaveButton
                          onClick={handleSaveGrades}
                          disabled={isSavingGrades || loadingSubmissions}
                        >
                          <CheckCircle size={20} weight="bold" />
                          <span>{isSavingGrades ? "Đang lưu..." : "Lưu bảng điểm"}</span>
                        </SaveButton>
                      </div>
                    </div>

                    {/* QUICK STATS CARDS (SYNCHRONIZED WITH TEACHER CLASSROOMS DASHBOARD) */}
                    {!loadingSubmissions && assignmentSubmissions.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-100">
                        {/* Card 1: Tổng bài đã nộp (Ocean Blue #2f8fa3) */}
                        <div className="bg-[#2f8fa3]/10 border border-[#2f8fa3]/20 rounded-3xl p-5 flex flex-col justify-between shadow-3xs relative overflow-hidden min-h-[135px]">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-[#2f8fa3] uppercase tracking-wider block">TỔNG BÀI ĐÃ NỘP</span>
                              <strong className="text-3xl font-black text-slate-800 block mt-1">
                                {assignmentSubmissions.length} bài
                              </strong>
                            </div>
                            <div className="p-3 bg-white text-[#2f8fa3] rounded-2xl shadow-3xs shrink-0 flex items-center justify-center">
                              <Users size={22} weight="bold" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-xs font-bold text-[#2f8fa3] block">↗ Tiến độ bài tập</span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Sĩ số nộp bài thực tế từ học sinh</span>
                          </div>
                        </div>

                        {/* Card 2: Đã chấm điểm (Green Pastel) */}
                        <div className="bg-[#dcfce7]/50 border border-[#bbf7d0]/40 rounded-3xl p-5 flex flex-col justify-between shadow-3xs relative overflow-hidden min-h-[135px]">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-[#15803d] uppercase tracking-wider block">ĐÃ CHẤM ĐIỂM</span>
                              <strong className="text-3xl font-black text-slate-800 block mt-1">
                                {assignmentSubmissions.filter((s: any) => s.status === "graded").length} / {assignmentSubmissions.length} bài
                              </strong>
                            </div>
                            <div className="p-3 bg-white text-[#15803d] rounded-2xl shadow-3xs shrink-0 flex items-center justify-center">
                              <CheckCircle size={22} weight="bold" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-xs font-bold text-[#15803d] block">↗ Tiến độ chấm điểm</span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {assignmentSubmissions.filter((s: any) => s.status === "graded").length === assignmentSubmissions.length
                                ? "Đã hoàn thành chấm toàn bộ bài nộp"
                                : "Đang tiến hành chấm bài nộp"}
                            </span>
                          </div>
                        </div>

                        {/* Card 3: Cần chấm điểm (Amber Pastel) */}
                        <div className="bg-[#fef3c7]/50 border border-[#fde68a]/40 rounded-3xl p-5 flex flex-col justify-between shadow-3xs relative overflow-hidden min-h-[135px]">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-[#b45309] uppercase tracking-wider block">CẦN CHẤM ĐIỂM</span>
                              <strong className="text-3xl font-black text-slate-800 block mt-1">
                                {assignmentSubmissions.filter((s: any) => s.status !== "graded" && s.status !== "pending").length} bài
                              </strong>
                            </div>
                            <div className="p-3 bg-white text-[#b45309] rounded-2xl shadow-3xs shrink-0 flex items-center justify-center">
                              <Clock size={22} weight="bold" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-xs font-bold text-[#b45309] block">↗ Tồn đọng cần xử lý</span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {assignmentSubmissions.filter((s: any) => s.status !== "graded" && s.status !== "pending").length > 0
                                ? `Còn ${assignmentSubmissions.filter((s: any) => s.status !== "graded" && s.status !== "pending").length} bài chưa có điểm`
                                : "Đã chấm xong tất cả bài nộp"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SUBMISSIONS TABLE CONTAINER */}
                  {loadingSubmissions ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-slate-500 font-semibold border border-slate-200/80 shadow-xs">
                      Đang tải danh sách bài nộp của học sinh...
                    </div>
                  ) : assignmentSubmissions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 shadow-xs">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                        <FolderOpen size={32} weight="duotone" />
                      </div>
                      <h4 className="text-base font-bold text-slate-700">Chưa có bài nộp nào</h4>
                      <p className="text-xs text-slate-500 mt-1">Học sinh chưa nộp bài tập tự luận này.</p>
                    </div>
                  ) : (
                    <Table>
                      <Table.ScrollContainer className="min-h-[350px]">
                        <Table.Content aria-label="Bảng bài nộp học sinh" className="min-w-[900px]">
                          <Table.Header>
                            <Table.Column id="stt" className="after:hidden text-center w-14 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                              STT
                            </Table.Column>
                            <Table.Column isRowHeader id="student" className="after:hidden min-w-[200px] py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                              Học sinh
                            </Table.Column>
                            <Table.Column id="status" className="after:hidden min-w-[180px] py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                              Trạng thái & Nộp bài
                            </Table.Column>
                            <Table.Column id="content" className="after:hidden min-w-[240px] py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                              Nội dung / File nộp
                            </Table.Column>
                            <Table.Column id="score" className="after:hidden min-w-[140px] text-center py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                              Điểm số ({selectedAssignment.maxScore || 10})
                            </Table.Column>
                            <Table.Column id="actions" className="after:hidden min-w-[130px] text-end py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                              Hành động
                            </Table.Column>
                          </Table.Header>
                          <Table.Body>
                            {assignmentSubmissions.map((sub: any, idx: number) => {
                              const studentObj = typeof sub.studentId === "object" ? sub.studentId : { _id: sub.studentId, name: "Học sinh", email: "" };
                              const studentIdStr = studentObj._id;
                              const currentScore = gradingData[studentIdStr]?.score ?? "";
                              const currentFeedback = gradingData[studentIdStr]?.feedback ?? "";
                              const isGraded = sub.status === "graded" || (currentScore !== "" && currentScore !== null && currentScore !== undefined);

                              return (
                                <Table.Row
                                  key={sub._id || idx}
                                  id={sub._id || idx}
                                  className="hover:bg-orange-50/40 cursor-pointer transition-colors"
                                  onClick={() => setFocusGradingSub(sub)}
                                >
                                  {/* STT */}
                                  <Table.Cell className="text-center">
                                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 inline-flex items-center justify-center font-bold text-xs shadow-2xs">
                                      {idx + 1}
                                    </span>
                                  </Table.Cell>

                                  {/* HỌC SINH */}
                                  <Table.Cell>
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={studentObj.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(studentObj.name || "HS") + "&background=f47c20&color=fff&bold=true"}
                                        alt="avatar"
                                        className="w-10 h-10 rounded-full border-2 border-orange-100 object-cover shadow-2xs shrink-0"
                                      />
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-slate-900 text-sm truncate">{studentObj.name}</span>
                                        <span className="text-xs font-medium text-slate-500 truncate">{studentObj.email}</span>
                                      </div>
                                    </div>
                                  </Table.Cell>

                                  {/* TRẠNG THÁI & NỘP BÀI */}
                                  <Table.Cell>
                                    <div className="flex flex-col gap-1 items-start">
                                      {sub.status === "graded" && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          Đã chấm
                                        </span>
                                      )}
                                      {sub.status === "submitted" && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-[#2f8fa3]/10 text-[#2f8fa3] border border-[#2f8fa3]/30">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#2f8fa3]" />
                                          Đã nộp
                                        </span>
                                      )}
                                      {sub.status === "late" && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                          Nộp muộn
                                        </span>
                                      )}
                                      {sub.status === "pending" && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                          Chưa nộp
                                        </span>
                                      )}
                                      {sub.submittedAt && (
                                        <span className="text-[11px] font-medium text-slate-400">
                                          {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                                        </span>
                                      )}
                                    </div>
                                  </Table.Cell>

                                  {/* NỘI DUNG / FILE NỘP */}
                                  <Table.Cell>
                                    <div className="flex flex-col gap-1.5 max-w-[240px]">
                                      {sub.submissionText && (
                                        <p className="text-xs text-slate-700 font-medium line-clamp-1 italic">
                                          "{sub.submissionText}"
                                        </p>
                                      )}
                                      {sub.attachments && sub.attachments.length > 0 ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                            <Paperclip size={13} className="text-[#f47c20]" weight="bold" />
                                            {sub.attachments.length} file đính kèm
                                          </span>
                                        </div>
                                      ) : (
                                        !sub.submissionText && <span className="text-xs text-slate-400 italic">Không có file nộp</span>
                                      )}
                                    </div>
                                  </Table.Cell>

                                  {/* ĐIỂM SỐ */}
                                  <Table.Cell className="text-center">
                                    {currentScore !== "" && currentScore !== null && currentScore !== undefined ? (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-black rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                                        {currentScore} / {selectedAssignment.maxScore || 10}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-[#f47c20]/10 text-[#f47c20] border border-[#f47c20]/30 shadow-2xs">
                                        Chưa có điểm
                                      </span>
                                    )}
                                  </Table.Cell>

                                  {/* HÀNH ĐỘNG */}
                                  <Table.Cell className="text-end">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFocusGradingSub(sub);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-[#f47c20] text-[#f47c20] hover:text-white font-extrabold text-xs border border-orange-200/80 transition-all cursor-pointer shadow-2xs"
                                    >
                                      <NotePencil size={15} weight="bold" />
                                      {isGraded ? "Sửa điểm" : "Chấm bài"}
                                    </button>
                                  </Table.Cell>
                                </Table.Row>
                              );
                            })}
                          </Table.Body>
                        </Table.Content>
                      </Table.ScrollContainer>
                    </Table>
                  )}

                  {/* MODAL CHẤM BÀI CHI TIẾT (FOCUS GRADING DIALOG) */}
                  {focusGradingSub && (() => {
                    const fStudentObj = typeof focusGradingSub.studentId === "object" ? focusGradingSub.studentId : { _id: focusGradingSub.studentId, name: "Học sinh", email: "" };
                    const fStudentIdStr = fStudentObj._id;
                    const fCurrentScore = gradingData[fStudentIdStr]?.score ?? "";
                    const fCurrentFeedback = gradingData[fStudentIdStr]?.feedback ?? "";
                    const currentSubIdx = assignmentSubmissions.findIndex((s) => s._id === focusGradingSub._id);

                    const maxScore = selectedAssignment?.maxScore || 10;
                    const isScoreSelected = (pts: number) => parseFloat(String(fCurrentScore)) === pts;

                    // Tính toán trạng thái nộp đúng hạn / nộp muộn & thời gian trễ
                    let isLateSub = focusGradingSub.status === "late";
                    let lateText = "";

                    if (selectedAssignment?.dueDate && focusGradingSub.submittedAt) {
                      const subTime = new Date(focusGradingSub.submittedAt).getTime();
                      const dueTime = new Date(selectedAssignment.dueDate).getTime();
                      if (dueTime > 0 && subTime > dueTime) {
                        isLateSub = true;
                        const diffMs = subTime - dueTime;
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMins / 60);
                        const diffDays = Math.floor(diffHours / 24);

                        if (diffDays > 0) {
                          const remHours = diffHours % 24;
                          lateText = remHours > 0 ? `Trễ ${diffDays} ngày ${remHours} giờ` : `Trễ ${diffDays} ngày`;
                        } else if (diffHours > 0) {
                          const remMins = diffMins % 60;
                          lateText = remMins > 0 ? `Trễ ${diffHours} giờ ${remMins} phút` : `Trễ ${diffHours} giờ`;
                        } else {
                          lateText = `Trễ ${Math.max(1, diffMins)} phút`;
                        }
                      }
                    }

                    return (
                      <Dialog open={!!focusGradingSub} onOpenChange={(open) => !open && setFocusGradingSub(null)}>
                        <DialogContent className="sm:max-w-[920px] max-h-[82vh] my-auto flex flex-col p-0 overflow-hidden rounded-[28px] gap-0 border border-slate-200/80 shadow-2xl bg-white">
                          {/* HEADER MODAL */}
                          <DialogHeader className="px-7 py-4 bg-gradient-to-r from-slate-50 via-orange-50/30 to-slate-50 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={fStudentObj.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(fStudentObj.name || "HS") + "&background=f47c20&color=fff&bold=true"}
                                alt="avatar"
                                className="w-11 h-11 rounded-full border-2 border-[#f47c20]/40 object-cover shadow-sm shrink-0"
                              />
                              <div>
                                <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                                  Chấm bài chi tiết: <span className="text-[#f47c20] font-black">{fStudentObj.name}</span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-slate-600 font-semibold">{fStudentObj.email}</span>
                                  {focusGradingSub.submittedAt && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-500">Nộp bài lúc: <strong className="text-slate-700 font-bold">{new Date(focusGradingSub.submittedAt).toLocaleString("vi-VN")}</strong></span>
                                      {/* BADGE PHÂN LOẠI ĐÚNG HẠN / NỘP MUỘN */}
                                      {isLateSub ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/90 shadow-3xs flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                          Nộp muộn {lateText ? `(${lateText})` : ""}
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-3xs flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          Đúng hạn
                                        </span>
                                      )}
                                    </>
                                  )}
                                </DialogDescription>
                              </div>
                            </div>

                            {/* NAV HỌC SINH & PHÍM TẮT */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#2f8fa3] bg-[#2f8fa3]/10 px-3.5 py-1.5 rounded-xl border border-[#2f8fa3]/25 mr-1">
                                Học sinh {currentSubIdx + 1} / {assignmentSubmissions.length}
                              </span>
                              <button
                                type="button"
                                title="Phím tắt: Mũi tên trái (←) hoặc ["
                                disabled={currentSubIdx <= 0}
                                onClick={() => currentSubIdx > 0 && setFocusGradingSub(assignmentSubmissions[currentSubIdx - 1])}
                                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                              >
                                ← Trước <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">(←)</span>
                              </button>
                              <button
                                type="button"
                                title="Phím tắt: Mũi tên phải (→) hoặc ]"
                                disabled={currentSubIdx >= assignmentSubmissions.length - 1}
                                onClick={() => currentSubIdx < assignmentSubmissions.length - 1 && setFocusGradingSub(assignmentSubmissions[currentSubIdx + 1])}
                                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                              >
                                Sau → <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">(→)</span>
                              </button>
                            </div>
                          </DialogHeader>

                          {/* BODY MODAL */}
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[58vh] flex-1 overflow-y-auto bg-slate-50/60">
                            {/* CỘT TRÁI: BÀI LÀM CỦA HỌC SINH */}
                            <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-3xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                                  <FileText size={17} className="text-[#2f8fa3]" weight="bold" />
                                  Nội dung bài làm & File nộp
                                </h4>
                              </div>

                              {focusGradingSub.submissionText ? (
                                <div className="bg-[#fffbf5] p-4 rounded-2xl text-xs text-slate-800 font-semibold leading-relaxed border border-[#fde8d3] whitespace-pre-wrap shadow-3xs">
                                  "{focusGradingSub.submissionText}"
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 font-medium italic bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
                                  Học sinh không nhập văn bản bài làm.
                                </div>
                              )}

                              {focusGradingSub.attachments && focusGradingSub.attachments.length > 0 && (
                                <div className="flex flex-col gap-3 mt-1">
                                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                    <Paperclip size={16} className="text-[#f47c20]" weight="bold" />
                                    File đính kèm ({focusGradingSub.attachments.length}):
                                  </span>

                                  <div className="flex flex-col gap-2.5">
                                    {focusGradingSub.attachments.map((att: any, aIdx: number) => {
                                      const ext = getFileExt(att.name || att.url);
                                      const isImg = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "");
                                      const isPdf = ext === "pdf";
                                      const cleanName = formatCleanFileName(att.name, att.url);
                                      const sizeStr = formatFileSize(att.size);

                                      return (
                                        <div
                                          key={aIdx}
                                          onClick={() => setPreviewFile({ name: cleanName, url: att.url })}
                                          className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/90 hover:bg-orange-50/40 border border-slate-200/90 hover:border-[#f47c20]/50 rounded-2xl transition-all cursor-pointer shadow-3xs group"
                                        >
                                          {/* Left: Icon & File Title + Format/Size */}
                                          <div className="flex items-center gap-3 truncate min-w-0">
                                            <div
                                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                                isPdf ? "bg-rose-50 text-rose-500" : isImg ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-[#f47c20]"
                                              }`}
                                            >
                                              {isPdf ? (
                                                <FilePdf size={22} weight="fill" />
                                              ) : isImg ? (
                                                <Eye size={22} weight="bold" />
                                              ) : (
                                                <Paperclip size={22} weight="bold" />
                                              )}
                                            </div>
                                            <div className="flex flex-col truncate min-w-0">
                                              <span className="text-xs font-black text-slate-800 truncate group-hover:text-[#f47c20] transition-colors" title={cleanName}>
                                                {cleanName}
                                              </span>
                                              <span className="text-[11px] font-semibold text-slate-400">
                                                {ext ? ext.toUpperCase() : "FILE"} {sizeStr ? `• ${sizeStr}` : ""}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Right: Action Buttons */}
                                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button
                                              type="button"
                                              onClick={() => setPreviewFile({ name: cleanName, url: att.url })}
                                              className="px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:text-[#f47c20] bg-white border border-slate-200 hover:border-orange-200 rounded-xl hover:bg-orange-50 transition-all inline-flex items-center gap-1.5 shadow-3xs cursor-pointer"
                                            >
                                              <Eye size={14} weight="bold" />
                                              Xem nhanh
                                            </button>
                                            <a
                                              href={att.url}
                                              download
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1.5 text-slate-500 hover:text-[#f47c20] bg-white border border-slate-200 hover:border-orange-200 rounded-xl hover:bg-orange-50 transition-all shadow-3xs"
                                              title="Tải về máy"
                                            >
                                              <DownloadSimple size={15} weight="bold" />
                                            </a>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* CỘT PHẢI: CHẤM ĐIỂM & NHẬN XÉT */}
                            <div className="flex flex-col gap-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-3xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                                  <PencilSimple size={17} className="text-[#f47c20]" weight="bold" />
                                  Đánh giá & Cho điểm
                                </h4>
                              </div>

                              {/* Ô CHỌN ĐIỂM SỐ */}
                              <div className="flex flex-col gap-3">
                                <label className="text-xs font-extrabold text-slate-700">
                                  Điểm số (Thang điểm {maxScore}):
                                </label>

                                <div className="flex items-center gap-3">
                                  <div className="relative flex items-center">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={fCurrentScore}
                                      placeholder="0"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                                          const num = parseFloat(val);
                                          if (val === "" || (num >= 0 && num <= maxScore)) {
                                            setGradingData((prev) => ({
                                              ...prev,
                                              [fStudentIdStr]: {
                                                ...prev[fStudentIdStr],
                                                score: val
                                              }
                                            }));
                                          }
                                        }
                                      }}
                                      className="w-28 h-12 text-center font-black text-2xl text-[#f47c20] bg-orange-50/60 border-2 border-[#f47c20]/50 focus:border-[#f47c20] focus:ring-4 focus:ring-[#f47c20]/20 rounded-2xl outline-none transition-all shadow-2xs"
                                    />
                                  </div>
                                  <span className="text-base font-black text-slate-500">/ {maxScore} điểm</span>
                                </div>

                                {/* CHIPS ĐIỂM NHANH */}
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6, 5].map((pts) => {
                                    const active = isScoreSelected(pts);
                                    return (
                                      <button
                                        key={pts}
                                        type="button"
                                        onClick={() => {
                                          setGradingData((prev) => ({
                                            ...prev,
                                            [fStudentIdStr]: {
                                              ...prev[fStudentIdStr],
                                              score: pts
                                            }
                                          }));
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${active
                                            ? "bg-[#f47c20] text-white border-2 border-[#f47c20] shadow-sm scale-105"
                                            : "bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#f47c20] border border-slate-200/90"
                                          }`}
                                      >
                                        {pts} đ
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Ô NHẬN XÉT ĐA DÒNG */}
                              <div className="flex flex-col gap-3">
                                <label className="text-xs font-extrabold text-slate-700">
                                  Nhận xét của giáo viên:
                                </label>
                                <textarea
                                  rows={4}
                                  placeholder="Nhập lời khen hoặc nhận xét góp ý chi tiết cho học sinh..."
                                  value={fCurrentFeedback}
                                  onChange={(e) => {
                                    setGradingData((prev) => ({
                                      ...prev,
                                      [fStudentIdStr]: {
                                        ...prev[fStudentIdStr],
                                        feedback: e.target.value
                                      }
                                    }));
                                  }}
                                  className="w-full p-3.5 bg-slate-50/80 border border-slate-200 focus:border-[#f47c20] focus:ring-4 focus:ring-[#f47c20]/15 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 outline-none leading-relaxed transition-all shadow-3xs"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {QUICK_FEEDBACK_TAGS.map((tag, tIdx) => {
                                    const isIncluded = fCurrentFeedback.includes(tag);
                                    return (
                                      <button
                                        key={tIdx}
                                        type="button"
                                        onClick={() => {
                                          setGradingData((prev) => {
                                            const oldFb = prev[fStudentIdStr]?.feedback || "";
                                            const newFb = oldFb ? (isIncluded ? oldFb.replace(tag, "").trim() : `${oldFb} ${tag}`) : tag;
                                            return {
                                              ...prev,
                                              [fStudentIdStr]: {
                                                ...prev[fStudentIdStr],
                                                feedback: newFb
                                              }
                                            };
                                          });
                                        }}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${isIncluded
                                            ? "bg-[#2f8fa3] text-white border border-[#2f8fa3] shadow-3xs"
                                            : "bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-[#f47c20] border border-slate-200/90"
                                          }`}
                                      >
                                        {tag}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* FOOTER MODAL */}
                          <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => setFocusGradingSub(null)}
                              className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              Hủy & Đóng
                            </button>

                            <div className="flex items-center gap-3">
                              {currentSubIdx < assignmentSubmissions.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFocusGradingSub(assignmentSubmissions[currentSubIdx + 1]);
                                  }}
                                  className="px-4.5 py-2.5 rounded-xl font-black text-xs text-white bg-[#2f8fa3] hover:bg-[#257485] transition-all cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-98"
                                >
                                  Lưu & Chấm tiếp →
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setFocusGradingSub(null)}
                                className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-[#f47c20] hover:bg-[#e0650d] transition-all cursor-pointer shadow-md shadow-[#f47c20]/20 flex items-center gap-2 active:scale-98"
                              >
                                <Check size={16} weight="bold" />
                                Hoàn tất & Đóng
                              </button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    );
                  })()}

                  {/* MODAL XEM NHANH FILE TRỰC TIẾP (IN-MODAL PREVIEW) */}
                  {previewFile && (() => {
                    const ext = getFileExt(previewFile.name || previewFile.url);
                    const isImg = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "");
                    const isPdf = ext === "pdf";

                    return (
                      <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[28px] shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
                          {/* MODAL HEADER */}
                          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-slate-50/80">
                            <div className="flex items-center gap-3 truncate pr-4">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isPdf ? "bg-rose-50 text-rose-500" : isImg ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-[#f47c20]"
                              }`}>
                                {isPdf ? <FilePdf size={20} weight="fill" /> : isImg ? <Eye size={20} weight="bold" /> : <Paperclip size={20} weight="bold" />}
                              </div>
                              <div className="flex flex-col truncate">
                                <h4 className="font-black text-slate-900 text-sm truncate" title={previewFile.name}>
                                  {previewFile.name}
                                </h4>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                                  Trình xem tài liệu trực tiếp
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={previewFile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-orange-50 hover:text-[#f47c20] font-bold text-xs flex items-center gap-1.5 transition-all shadow-3xs"
                                title="Mở trong tab mới"
                              >
                                <ArrowSquareOut size={14} weight="bold" />
                                <span>Tab mới</span>
                              </a>
                              <a
                                href={previewFile.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 rounded-xl bg-[#f47c20] text-white hover:bg-[#e0650d] font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#f47c20]/20"
                              >
                                <DownloadSimple size={15} weight="bold" />
                                <span>Tải về</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => setPreviewFile(null)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer ml-1"
                              >
                                <X size={20} weight="bold" />
                              </button>
                            </div>
                          </div>

                          {/* MODAL BODY PREVIEW */}
                          <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-100/60 min-h-[50vh]">
                            {isImg ? (
                              <img
                                src={previewFile.url}
                                alt="preview"
                                className="max-w-full max-h-[76vh] rounded-2xl object-contain shadow-lg bg-white"
                              />
                            ) : isPdf ? (
                              <iframe
                                src={previewFile.url}
                                className="w-full h-[76vh] rounded-2xl border border-slate-200 bg-white shadow-sm"
                                title="PDF Preview"
                              />
                            ) : (
                              <div className="text-center py-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
                                <Paperclip size={48} className="text-[#f47c20] mx-auto mb-3" weight="duotone" />
                                <h5 className="text-sm font-black text-slate-800 mb-1">File không hỗ trợ xem trực tiếp</h5>
                                <p className="text-xs text-slate-500 font-medium mb-4">Vui lòng bấm nút dưới đây để tải về hoặc mở file trong ứng dụng tương ứng.</p>
                                <a
                                  href={previewFile.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f47c20] text-white font-black text-xs rounded-xl hover:bg-[#e0650d] transition-all shadow-md shadow-[#f47c20]/20"
                                >
                                  <DownloadSimple size={16} weight="bold" />
                                  Tải file về máy
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* UNIFIED ACTIVITY LIST */
                <div className={styles.quizzesTab}>
                  <div className="mb-4">
                    <BackButton onClick={() => navigate("/classrooms")}>Quay lại danh sách lớp</BackButton>
                  </div>
                  {/* ROW 1: TITLE & PRIMARY ACTION BUTTON */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f47c20', margin: 0 }}>Danh Sách Bài Tập & Đề Thi</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {userRole === "TEACHER" ? "Quản lý toàn bộ hoạt động học tập, bài tập về nhà và đề thi trong lớp" : "Theo dõi tiến độ và hoạt động của lớp học"}
                      </p>
                    </div>
                    {userRole === "TEACHER" && (
                      <AnimatedAddButton onClick={handleOpenAssignFromBank}>
                        Giao bài từ Ngân hàng
                      </AnimatedAddButton>
                    )}
                  </div>

                  {/* ROW 2: FILTERS & VIEW MODE TOOLBAR */}
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* TYPE PILL TABS */}
                      <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setFilterType("all")}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterType === "all" ? "bg-white text-[#f47c20] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                        >
                          Tất cả loại
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterType("quiz")}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === "quiz" ? "bg-white text-[#f47c20] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                        >
                          <CheckCircle size={14} weight="bold" /> Trắc nghiệm
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterType("document")}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === "document" ? "bg-white text-[#f47c20] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                        >
                          <FilePdf size={14} weight="bold" /> Tự luận / File
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterType("pending")}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterType === "pending" ? "bg-rose-500 text-white shadow-sm font-extrabold" : "bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold"}`}
                        >
                          <Clock size={14} weight="bold" /> Cần chấm {totalPendingCount > 0 ? `(${totalPendingCount})` : ""}
                        </button>
                      </div>

                      {/* CATEGORY SELECT COMBOBOX */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                          >
                            <Funnel size={14} className="text-slate-500" weight="bold" />
                            <span>
                              {filterCategory === "all"
                                ? "Tất cả mục đích"
                                : {
                                  homework: "Bài tập về nhà",
                                  periodic: "Kiểm tra / Thi thử",
                                  mock_exam: "Thi thử",
                                  attitude: "Chuyên cần / Thái độ"
                                }[filterCategory] || filterCategory}
                            </span>
                            <CaretDown size={13} className="text-slate-400" weight="bold" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
                          <DropdownMenuItem
                            onClick={() => setFilterCategory("all")}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${filterCategory === "all" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            Tất cả mục đích
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setFilterCategory("homework")}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${filterCategory === "homework" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            Bài tập về nhà
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setFilterCategory("periodic")}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${filterCategory === "periodic" ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            Kiểm tra / Thi thử
                          </DropdownMenuItem>
                          {Array.from(new Set(allActivities.map((a: any) => a.category).filter(Boolean)))
                            .filter((cat: any) => !["homework", "periodic", "mock_exam"].includes(cat))
                            .map((cat: any) => (
                              <DropdownMenuItem
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${filterCategory === cat ? "bg-orange-50 text-[#f47c20] font-bold" : "text-slate-700 hover:bg-slate-50"}`}
                              >
                                {
                                  {
                                    attitude: "Chuyên cần / Thái độ"
                                  }[cat] || cat
                                }
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* VIEW MODE TOGGLE SWITCH (GRID / TABLE) */}
                    <ViewModeSwitch id="teacherActivitiesViewMode" viewMode={viewMode} onViewModeChange={setViewMode} />
                  </div>

                  {loadingActivities ? (
                    <p style={{ textAlign: "center", color: "#64748b", fontWeight: 600, padding: "48px 0" }}>Đang tải danh sách hoạt động...</p>
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
                              const qCount = isQuiz ? (act.questions?.length || act.bankItemId?.quizQuestions?.length || 0) : 0;
                              const totalStudents = classroom?.studentCount || 0;
                              const subCount = act.submissionCount || 0;
                              const percent = totalStudents > 0 ? Math.min(100, Math.round((subCount / totalStudents) * 100)) : 0;

                              return (
                                <div
                                  key={act._id}
                                  className="bg-white rounded-3xl p-5 border-2 border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5 text-left group"
                                >
                                  {/* ROW 1: BADGES (Type + Status) & ACTIONS */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {/* Type Tag */}
                                      <span className={`px-3 py-1 font-bold text-xs rounded-lg border ${isQuiz
                                        ? "bg-[#f47c20]/10 text-[#f47c20] border-[#f47c20]/25"
                                        : "bg-[#2f8fa3]/10 text-[#2f8fa3] border-[#2f8fa3]/25"
                                        }`}>
                                        {isQuiz ? "Trắc nghiệm" : "Tự luận"}
                                      </span>
                                      {/* Status Badge */}
                                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${statusObj.class}`}>
                                        {statusObj.label}
                                      </span>
                                    </div>

                                    {/* Right: 3-line Action Menu */}
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

                                  {/* ROW 2: TITLE & CATEGORY CODE */}
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
                                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 border ${isQuiz
                                        ? "bg-[#2f8fa3]/10 text-[#2f8fa3] border-[#2f8fa3]/25"
                                        : "bg-[#f47c20]/10 text-[#f47c20] border-[#f47c20]/25"
                                        }`}>
                                        {
                                          {
                                            homework: "Bài tập về nhà",
                                            periodic: "Kiểm tra định kỳ",
                                            mock_exam: "Thi thử",
                                            attitude: "Chuyên cần / Thái độ"
                                          }[act.category] || act.category
                                        }
                                      </span>
                                    )}
                                  </div>

                                  {/* ROW 3: SUB-INFO (DEADLINE / DURATION / FILES) */}
                                  <div className="flex items-center gap-1.5 text-xs text-[#64748b] font-semibold">
                                    <Clock size={15} className="text-[#f47c20] shrink-0" />
                                    <span>
                                      Hạn nộp: <span className="text-[#64748b] font-normal">{act.dueDate ? new Date(act.dueDate).toLocaleDateString("vi-VN") : "Không giới hạn"}</span>
                                    </span>
                                    <span className="ml-1">{isQuiz ? `${act.durationMinutes || 15}p (${qCount} câu)` : `${act.attachments?.length || 1} file đính kèm`}</span>
                                  </div>

                                  {/* ROW 4: HIGHLIGHTED MIDDLE PROGRESS BOX */}
                                  <div className={`rounded-2xl p-3 flex items-center justify-between text-xs transition-colors ${subCount > 0
                                    ? "bg-[#fff7ed] border border-[#fed7aa]"
                                    : "bg-[#2f8fa3]/10 border border-[#2f8fa3]/25"
                                    }`}>
                                    <div className={`flex items-center gap-2 font-semibold truncate ${subCount > 0 ? "text-[#f47c20]" : "text-[#2f8fa3]"
                                      }`}>
                                      {subCount > 0 ? (
                                        <BookOpen size={16} weight="duotone" className="shrink-0 text-[#f47c20]" />
                                      ) : (
                                        <CheckCircle size={16} weight="bold" className="shrink-0 text-[#2f8fa3]" />
                                      )}
                                      <span className="truncate">
                                        {subCount > 0 ? `Tiến độ: ${subCount}/${totalStudents} HS đã nộp` : "✓ Chưa có bài nộp nào"}
                                      </span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md bg-white font-extrabold shrink-0 border ${subCount > 0 ? "text-[#f47c20] border-[#fed7aa]" : "text-[#2f8fa3] border-[#2f8fa3]/30"
                                      }`}>
                                      {percent}%
                                    </span>
                                  </div>

                                  {/* ROW 5: BOTTOM 3 PILL BUTTONS */}
                                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                                    {/* Button 1: Bảng điểm / Chấm bài */}
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

                                    {/* Button 2: Sửa */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditActivity(act)}
                                      className="w-full py-2 bg-[#f47c20]/10 hover:bg-[#f47c20]/20 text-[#f47c20] border border-[#f47c20]/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                                      title="Chỉnh sửa bài tập"
                                    >
                                      <PencilSimple size={14} weight="bold" />
                                      <span>Chỉnh sửa</span>
                                    </button>

                                    {/* Button 3: Xóa */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isQuiz) handleDeleteQuizClick(act);
                                        else handleDeleteAssignmentClick(act);
                                      }}
                                      className="w-full py-2 bg-slate-100 hover:bg-rose-50 text-[#64748b] hover:text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                                      title="Xóa bài"
                                    >
                                      <Trash size={14} weight="bold" />
                                      <span>Xóa bài</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* PAGINATION CONTROLS FOR GRID VIEW */}
                          {filteredActivities.length > 0 && (
                            <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200/80 bg-white rounded-2xl shadow-3xs mt-4 mb-6">
                              <Pagination.Summary className="text-sm text-slate-500 font-medium">
                                Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, filteredActivities.length)} trong số {filteredActivities.length} kết quả
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
                      ) : (
                        <ActivitiesTable
                          activities={filteredActivities}
                          totalStudents={classroom?.studentCount || 0}
                          onViewDetails={(act) => setSelectedResourceDetails(act)}
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
                          onDelete={(act) => {
                            if (act.type === "quiz") handleDeleteQuizClick(act);
                            else handleDeleteAssignmentClick(act);
                          }}
                          onBulkDelete={(ids) => {
                            toast.info(`Đã chọn xóa hàng loạt ${ids.length} bài tập / đề thi.`);
                          }}
                          onToggleStatus={(act) => handleToggleQuizStatus(act)}
                          getQuizStatus={getQuizStatus}
                          rowsPerPage={itemsPerPage}
                          readOnly={userRole !== "TEACHER"}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DIALOGS */}
        <CustomConfirmDialog
          isOpen={isDeletePostDialogOpen}
          onOpenChange={setIsDeletePostDialogOpen}
          title="Xác nhận xóa thông báo"
          description="Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác."
          onConfirm={confirmDeletePost}
          confirmText="Xóa"
          cancelText="Hủy"
          isLoading={isDeletingPost}
          actionType="danger"
        />

        <CustomConfirmDialog
          isOpen={isDeleteQuizDialogOpen}
          onOpenChange={setIsDeleteQuizDialogOpen}
          title="Xác nhận xóa đề thi"
          description={<>Bạn có chắc chắn muốn xóa đề thi <strong>{quizToDelete?.title}</strong>? Thao tác này không thể hoàn tác.</>}
          onConfirm={confirmDeleteQuiz}
          confirmText="Xóa"
          cancelText="Hủy"
          isLoading={isDeletingQuiz}
          actionType="danger"
        />

        <CustomConfirmDialog
          isOpen={isDeleteAssignmentDialogOpen}
          onOpenChange={setIsDeleteAssignmentDialogOpen}
          title="Xác nhận xóa bài tập"
          description={<>Bạn có chắc chắn muốn xóa bài tập <strong>{assignmentToDelete?.title}</strong>? Thao tác này không thể hoàn tác.</>}
          onConfirm={confirmDeleteAssignment}
          confirmText="Xóa"
          cancelText="Hủy"
          isLoading={isDeletingAssignment}
          actionType="danger"
        />

        <CustomConfirmDialog
          isOpen={isResetQuizDialogOpen}
          onOpenChange={setIsResetQuizDialogOpen}
          title="Cảnh báo: Đã có học sinh làm bài"
          description="Đề thi này đã có học sinh làm bài. Nếu bạn tiếp tục chỉnh sửa, toàn bộ kết quả làm bài hiện tại của học sinh sẽ bị XÓA BỎ. Bạn có chắc chắn muốn tiếp tục?"
          onConfirm={confirmSaveWithReset}
          confirmText="Xóa & Lưu"
          cancelText="Hủy bỏ"
          isLoading={isResettingQuiz}
          actionType="danger"
        />

        {/* Modal chọn bài tập từ ngân hàng để giao */}
        <Dialog open={isAssignFromBankOpen} onOpenChange={(open) => { if (!open) setIsAssignFromBankOpen(false); }}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[960px] w-[95vw] min-h-[580px] max-h-[92vh] flex flex-col bg-white rounded-3xl p-6 overflow-y-auto shadow-2xl border border-slate-100">
            <DialogHeader className="flex-shrink-0 pb-2 border-b border-slate-100">
              <DialogTitle className="text-xl font-bold text-[#f47c20] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f47c20]/10 border border-[#f47c20]/20 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <FolderOpen className="text-[#f47c20]" size={24} weight="duotone" />
                </div>
                Giao bài tập từ Ngân hàng đề
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs font-medium mt-1">
                Chọn bài tập hoặc đề thi đã soạn sẵn từ ngân hàng để giao cho lớp học.
              </DialogDescription>
            </DialogHeader>

            {!selectedBankItem ? (
              <div className="mt-3 flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <BookBookmark className="text-[#f47c20]" size={18} weight="duotone" />
                      Danh sách tài nguyên sẵn có
                    </div>

                    {/* Pill tabs cho Bộ lọc Loại bài: Tất cả, Trắc nghiệm, Tự luận */}
                    <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setBankFilterType("all")}
                        className={`px-3 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${bankFilterType === "all"
                          ? "bg-white text-[#f47c20] shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        Tất cả bài
                      </button>
                      <button
                        type="button"
                        onClick={() => setBankFilterType("quiz")}
                        className={`px-3 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${bankFilterType === "quiz"
                          ? "bg-[#f47c20] text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        Trắc nghiệm
                      </button>
                      <button
                        type="button"
                        onClick={() => setBankFilterType("essay")}
                        className={`px-3 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${bankFilterType === "essay"
                          ? "bg-[#2f8fa3] text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        Tự luận
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <SmartSearchBar
                      placeholder="Tìm kiếm bài tập từ ngân hàng..."
                      value={bankSearchQuery}
                      onChange={(val) => setBankSearchQuery(val)}
                      suggestions={bankItems.map((item: any) => ({
                        id: item._id,
                        title: item.title,
                        subtitle: item.type === 'quiz' ? `Trắc nghiệm • ${item.quizQuestions?.length || 0} câu` : `Tự luận`,
                        tag: item.sharingStatus === 'CENTER_SHARED' ? 'Thư viện' : 'Cá nhân',
                        rawData: item
                      }))}
                      onSelectSuggestion={(item) => {
                        if (item.rawData) {
                          handleSelectBankItem(item.rawData);
                        }
                      }}
                      recentSearchesKey="recent_searches_assign_bank"
                      enableShortcut={false}
                      widthClass="flex-1"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger className="min-w-[190px] justify-between px-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none cursor-pointer bg-white flex items-center gap-2 font-semibold text-slate-700 hover:border-[#f47c20]/40 transition-colors shadow-2xs">
                        <span>{bankFilterOrigin === "all" ? "Tất cả nguồn" : bankFilterOrigin === "CENTER_SHARED" ? "Thư viện chung" : "Cá nhân"}</span>
                        <CaretDown size={14} className="text-slate-500 shrink-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-white shadow-xl border border-slate-100 rounded-xl p-1 z-50">
                        <DropdownMenuItem onClick={() => setBankFilterOrigin("all")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2">
                          Tất cả nguồn
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setBankFilterOrigin("CENTER_SHARED")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2">
                          Thư viện chung
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setBankFilterOrigin("PRIVATE")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2">
                          Cá nhân
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {loadingBank ? (
                  <div className="text-center py-12 text-slate-400 font-semibold text-sm">Đang tải dữ liệu ngân hàng đề...</div>
                ) : bankItems.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/70 text-slate-500">
                    <p className="font-bold text-slate-700">Ngân hàng đề của bạn đang trống</p>
                    <p className="text-xs text-slate-400 mt-1">Hãy tạo đề thi/bài tập ở menu Ngân hàng trước khi giao.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between min-h-0">
                    {(() => {
                      const filtered = bankItems.filter(item => {
                        const searchLower = bankSearchQuery.toLowerCase();
                        const matchesSearch = (item.title?.toLowerCase().includes(searchLower)) || (item.description?.toLowerCase().includes(searchLower));
                        if (!matchesSearch) return false;
                        if (bankFilterOrigin === 'CENTER_SHARED' && item.sharingStatus !== 'CENTER_SHARED') return false;
                        if (bankFilterOrigin === 'PRIVATE' && item.sharingStatus !== 'PRIVATE') return false;
                        if (bankFilterType === 'quiz' && item.type !== 'quiz') return false;
                        if (bankFilterType === 'essay' && item.type === 'quiz') return false;
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-12 text-sm text-slate-500 font-semibold flex flex-col items-center justify-center flex-1">
                            Không tìm thấy bài tập nào phù hợp với từ khóa.
                          </div>
                        );
                      }

                      const bankItemsPerPage = 6;
                      const totalBankPages = Math.ceil(filtered.length / bankItemsPerPage);
                      const paginatedItems = filtered.slice((bankModalPage - 1) * bankItemsPerPage, bankModalPage * bankItemsPerPage);
                      const bankStartIdx = (bankModalPage - 1) * bankItemsPerPage + 1;
                      const bankEndIdx = Math.min(bankModalPage * bankItemsPerPage, filtered.length);

                      return (
                        <div className="flex flex-col gap-4 flex-1 justify-between">
                          <div className="grid grid-cols-2 gap-3.5 min-h-[250px] content-start">
                            {paginatedItems.map((item) => (
                              <div key={item._id} className="flex items-center justify-between p-4 border border-slate-200/80 rounded-2xl bg-white hover:bg-slate-50/90 hover:border-[#f47c20]/40 transition-all shadow-3xs hover:shadow-2xs">
                                <div className="flex-1 min-w-0 pr-3">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${item.type === 'quiz' ? 'bg-[#f47c20]/10 border-[#f47c20]/30 text-[#f47c20]' : 'bg-[#2f8fa3]/10 border-[#2f8fa3]/30 text-[#2f8fa3]'}`}>
                                      {item.type === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}
                                    </span>
                                    <h4
                                      onClick={() => setSelectedResourceDetails(item)}
                                      className="font-semibold text-slate-800 text-sm m-0 truncate hover:text-[#f47c20] cursor-pointer transition-colors"
                                      title={item.title}
                                    >
                                      {item.title}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-3.5 text-[11px] text-slate-500 font-semibold truncate">
                                    {item.type === 'quiz' && (
                                      <>
                                        <span className="flex items-center gap-1" title="Số lượng câu hỏi">
                                          <BookOpen size={12} weight="duotone" className="text-[#2f8fa3]" />
                                          {item.quizQuestions?.length || 0} câu
                                        </span>
                                        <span className="flex items-center gap-1" title="Thời gian làm bài">
                                          <Clock size={12} weight="duotone" className="text-[#f47c20]" />
                                          {item.durationMinutes || 0}p
                                        </span>
                                      </>
                                    )}
                                    <span className="flex items-center gap-1" title="Nguồn gốc">
                                      <Users size={12} weight="duotone" className="text-[#2f8fa3]" />
                                      {item.sharingStatus === 'CENTER_SHARED' ? "Thư viện" : "Cá nhân"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedResourceDetails(item)}
                                    className="p-2 text-slate-500 hover:text-[#f47c20] hover:bg-[#f47c20]/10 rounded-xl transition-all border border-transparent hover:border-[#f47c20]/20 cursor-pointer"
                                    title="Xem trước chi tiết bài tập"
                                  >
                                    <Eye size={18} weight="bold" />
                                  </button>
                                  <AnimatedSendButton
                                    size="sm"
                                    text="Chọn giao"
                                    onClick={() => handleSelectBankItem(item)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pagination toolbar - Unified with all other pages */}
                          <Pagination size="sm" className="flex items-center justify-between w-full p-3.5 border-t border-slate-200/80 bg-slate-50/60 rounded-2xl shadow-3xs mt-3 shrink-0">
                            <Pagination.Summary className="text-xs text-slate-500 font-medium">
                              Hiển thị {bankStartIdx} đến {bankEndIdx} trong số {filtered.length} bài
                            </Pagination.Summary>
                            <Pagination.Content>
                              <Pagination.Item>
                                <Pagination.Previous
                                  isDisabled={bankModalPage === 1}
                                  onPress={() => setBankModalPage((p) => Math.max(1, p - 1))}
                                >
                                  <Pagination.PreviousIcon />
                                  Trang trước
                                </Pagination.Previous>
                              </Pagination.Item>
                              {Array.from({ length: totalBankPages }, (_, i) => i + 1).map((p) => (
                                <Pagination.Item key={p}>
                                  <Pagination.Link
                                    isActive={p === bankModalPage}
                                    onPress={() => setBankModalPage(p)}
                                    className={p === bankModalPage ? "bg-[#f47c20] text-white font-bold border-[#f47c20]" : "text-slate-600 font-medium hover:bg-slate-100"}
                                  >
                                    {p}
                                  </Pagination.Link>
                                </Pagination.Item>
                              ))}
                              <Pagination.Item>
                                <Pagination.Next
                                  isDisabled={bankModalPage === totalBankPages}
                                  onPress={() => setBankModalPage((p) => Math.min(totalBankPages, p + 1))}
                                >
                                  Trang sau
                                  <Pagination.NextIcon />
                                </Pagination.Next>
                              </Pagination.Item>
                            </Pagination.Content>
                          </Pagination>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleConfirmAssign} className="mt-3 flex flex-col gap-3.5">
                {/* Back Button & Assignment title info */}
                <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100">
                  <BackButton
                    type="button"
                    onClick={() => setSelectedBankItem(null)}
                  >
                    Quay lại chọn bài khác
                  </BackButton>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-slate-600 font-semibold truncate max-w-[350px]">Đang giao: {selectedBankItem.title}</span>
                </div>

                {/* Row 1: Title & Description */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tiêu đề bài giao</label>
                    <input
                      type="text"
                      value={assignTitle}
                      onChange={(e) => setAssignTitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none font-semibold text-slate-600 bg-slate-50/40 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mô tả chi tiết</label>
                    <input
                      type="text"
                      placeholder="Nhập ghi chú hoặc dặn dò..."
                      value={assignDescription}
                      onChange={(e) => setAssignDescription(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none font-semibold text-slate-600 bg-slate-50/40 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Row 2: Category & Due date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Phân loại bài tập</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none flex items-center justify-between bg-slate-50/40 hover:bg-white text-slate-600 font-semibold shadow-2xs transition-colors">
                        {
                          {
                            homework: "Bài tập về nhà",
                            periodic: "Kiểm tra định kỳ",
                            mock_exam: "Thi thử",
                            attitude: "Chuyên cần / Thái độ",
                            custom: assignCustomCategory ? assignCustomCategory : "+ Lựa chọn khác..."
                          }[assignCategory] || assignCategory || "Chọn phân loại..."
                        }
                        <CaretDown size={14} className="text-slate-500" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] bg-white shadow-xl border border-slate-100 rounded-xl p-1 z-50">
                        <DropdownMenuItem onClick={() => setAssignCategory("homework")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2">
                          Bài tập về nhà
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAssignCategory("periodic")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2">
                          Kiểm tra định kỳ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAssignCategory("mock_exam")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2">
                          Thi thử
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAssignCategory("attitude")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2">
                          Chuyên cần / Thái độ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAssignCategory("custom")} className="cursor-pointer font-semibold text-orange-600 hover:bg-orange-50 rounded-lg px-3 py-2 border-t border-slate-100">
                          + Lựa chọn khác...
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {assignCategory === "custom" && (
                      <input
                        type="text"
                        placeholder="Nhập loại bài tập tùy chỉnh..."
                        value={assignCustomCategory}
                        onChange={(e) => setAssignCustomCategory(e.target.value)}
                        className="w-full px-3.5 py-1.5 mt-1 border border-orange-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500/20 bg-orange-50/30"
                        required
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hạn nộp</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 1);
                            d.setHours(23, 59, 0, 0);
                            const tzOffset = d.getTimezoneOffset() * 60000;
                            setAssignDueDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-[#f47c20]/10 hover:bg-[#f47c20]/20 rounded-md transition-colors cursor-pointer"
                        >
                          +1 Ngày
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 3);
                            d.setHours(23, 59, 0, 0);
                            const tzOffset = d.getTimezoneOffset() * 60000;
                            setAssignDueDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-[#f47c20]/10 hover:bg-[#f47c20]/20 rounded-md transition-colors cursor-pointer"
                        >
                          +3 Ngày
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 7);
                            d.setHours(23, 59, 0, 0);
                            const tzOffset = d.getTimezoneOffset() * 60000;
                            setAssignDueDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-[#f47c20]/10 hover:bg-[#f47c20]/20 rounded-md transition-colors cursor-pointer"
                        >
                          +7 Ngày
                        </button>
                      </div>
                    </div>
                    <div className="relative flex items-center w-full">
                      <div className="absolute left-3.5 pointer-events-none text-[#f47c20] z-10">
                        <CalendarBlank size={18} weight="duotone" />
                      </div>
                      <div className="w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/40 text-slate-800 font-bold flex items-center justify-between pointer-events-none shadow-2xs">
                        <span>
                          {assignDueDate ? (
                            (() => {
                              const d = new Date(assignDueDate);
                              if (isNaN(d.getTime())) return assignDueDate;
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              const hours = String(d.getHours()).padStart(2, '0');
                              const minutes = String(d.getMinutes()).padStart(2, '0');
                              return `${day}/${month}/${year} lúc ${hours}:${minutes}`;
                            })()
                          ) : (
                            <span className="text-slate-400 font-normal">DD/MM/YYYY - HH:mm</span>
                          )}
                        </span>
                        <CaretDown size={14} className="text-slate-400 shrink-0" />
                      </div>
                      <input
                        type="datetime-local"
                        value={assignDueDate}
                        onChange={(e) => setAssignDueDate(e.target.value)}
                        onFocus={(e) => { e.target.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16); }}
                        onClick={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          target.showPicker?.();
                        }}
                        min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Max score, Duration, & Allow Multiple Submissions */}
                <div className={`grid ${selectedBankItem.type === 'quiz' ? 'grid-cols-3' : 'grid-cols-2'} gap-3 items-end`}>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Điểm tối đa</label>
                    <div style={{ display: 'flex' }}>
                      <NumberStepper
                        value={assignMaxScore}
                        onChange={(val) => setAssignMaxScore(Number(val))}
                        min={1}
                        max={100}
                        step={1}
                        fullWidth
                      />
                    </div>
                  </div>

                  {selectedBankItem.type === 'quiz' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Thời gian (phút)</label>
                      <div style={{ display: 'flex' }}>
                        <NumberStepper
                          value={assignDurationMinutes}
                          onChange={(val) => setAssignDurationMinutes(Number(val))}
                          min={1}
                          max={180}
                          step={1}
                          fullWidth
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 h-[38px] px-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <UiCheckbox
                      id="assignAllowMultiple"
                      checked={assignAllowMultiple}
                      onCheckedChange={(checked) => setAssignAllowMultiple(checked as boolean)}
                    />
                    <label htmlFor="assignAllowMultiple" className="cursor-pointer m-0 font-semibold text-xs text-slate-700 select-none whitespace-nowrap">
                      Nộp nhiều lần
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedBankItem(null); setIsAssignFromBankOpen(false); }}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <PrimaryButton
                    type="submit"
                    disabled={isAssigning}
                    className="px-5 py-2 font-semibold"
                  >
                    {isAssigning ? "Đang giao bài..." : "Giao bài ngay"}
                  </PrimaryButton>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* REUSABLE RESOURCE DETAIL MODAL */}
        <ResourceDetailModal
          isOpen={!!selectedResourceDetails}
          onClose={() => setSelectedResourceDetails(null)}
          item={selectedResourceDetails}
          onViewQuizScores={(item) => {
            setSelectedQuiz(item);
            loadQuizResults(item._id);
          }}
        />

        {/* QUIZ PREVIEW MODAL */}
        {previewBankItem && (
          <QuizPreviewModal
            isOpen={!!previewBankItem}
            onClose={() => setPreviewBankItem(null)}
            quizTitle={previewBankItem.title}
            quizQuestions={previewBankItem.quizQuestions || []}
          />
        )}

        {/* EDIT ACTIVITY MODAL */}
        <Dialog open={!!editingActivity} onOpenChange={(open) => { if (!open) setEditingActivity(null); }}>
          <DialogContent className="sm:max-w-[700px] w-[95vw] bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xl overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PencilSimple className="text-orange-500" size={22} weight="bold" />
                Chỉnh sửa thông tin bài tập
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Cập nhật tiêu đề, hạn nộp, mô tả và cài đặt bài giao cho lớp học.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmEditActivity} className="mt-3 flex flex-col gap-3">
              {/* Row 1: Title & Description */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Tiêu đề bài giao</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-medium text-slate-800"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Mô tả chi tiết</label>
                  <input
                    type="text"
                    placeholder="Nhập ghi chú hoặc dặn dò..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Category & Due date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Phân loại bài tập</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none flex items-center justify-between bg-white text-slate-700">
                      {
                        {
                          homework: "Bài tập về nhà",
                          periodic: "Kiểm tra định kỳ",
                          mock_exam: "Thi thử",
                          attitude: "Chuyên cần / Thái độ",
                          custom: editCustomCategory ? editCustomCategory : "+ Lựa chọn khác..."
                        }[editCategory] || editCategory || "Chọn phân loại..."
                      }
                      <CaretDown size={14} className="text-slate-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] bg-white shadow-lg border border-slate-100 z-50">
                      <DropdownMenuItem onClick={() => setEditCategory("homework")} className="cursor-pointer font-medium text-slate-700 hover:bg-slate-50 rounded-md px-3 py-2 outline-none">
                        Bài tập về nhà
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditCategory("periodic")} className="cursor-pointer font-medium text-slate-700 hover:bg-slate-50 rounded-md px-3 py-2 outline-none">
                        Kiểm tra định kỳ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditCategory("mock_exam")} className="cursor-pointer font-medium text-slate-700 hover:bg-slate-50 rounded-md px-3 py-2 outline-none">
                        Thi thử
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditCategory("attitude")} className="cursor-pointer font-medium text-slate-700 hover:bg-slate-50 rounded-md px-3 py-2 outline-none">
                        Chuyên cần / Thái độ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditCategory("custom")} className="cursor-pointer font-semibold text-orange-600 hover:bg-orange-50 rounded-md px-3 py-2 outline-none border-t border-slate-100">
                        + Lựa chọn khác...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {editCategory === "custom" && (
                    <input
                      type="text"
                      placeholder="Nhập loại bài tập tùy chỉnh..."
                      value={editCustomCategory}
                      onChange={(e) => setEditCustomCategory(e.target.value)}
                      className="w-full px-3 py-1.5 mt-1 border border-orange-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-orange-500 bg-orange-50/30"
                      required
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span>Hạn nộp</span>
                    <span className="text-[10px] text-orange-500 font-normal lowercase">(chọn ngày & giờ)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    onFocus={(e) => { e.target.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16); }}
                    onClick={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                      target.showPicker?.();
                    }}
                    min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none cursor-pointer bg-white text-slate-700 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Row 3: Max score & Allow Multiple Submissions */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Điểm tối đa</label>
                  <div style={{ display: 'flex' }}>
                    <NumberStepper
                      value={editMaxScore}
                      onChange={(val) => setEditMaxScore(Number(val))}
                      min={1}
                      max={100}
                      step={1}
                      fullWidth
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 h-[38px] px-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <UiCheckbox
                    id="editAllowMultiple"
                    checked={editAllowMultiple}
                    onCheckedChange={(checked) => setEditAllowMultiple(checked as boolean)}
                  />
                  <label htmlFor="editAllowMultiple" className="cursor-pointer m-0 font-semibold text-xs text-slate-700 select-none whitespace-nowrap">
                    Cho phép nộp nhiều lần
                  </label>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <PrimaryButton
                  type="submit"
                  disabled={isSavingEditActivity}
                  className="px-4 py-1.5 font-semibold"
                >
                  {isSavingEditActivity ? "Đang lưu..." : "Cập nhật ngay"}
                </PrimaryButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
