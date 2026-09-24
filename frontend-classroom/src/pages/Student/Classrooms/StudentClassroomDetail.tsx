import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getSocket } from "../../../service/socket.service";
import AnnouncementComments from "../../../components/Classroom/AnnouncementComments";
import {
  ChatCircle,
  PaperPlaneRight,
  FilePdf,
  DownloadSimple,
  ClipboardText,
  Users,
  CalendarBlank,
  ArrowLeft,
  BookOpen,
  Bell,
  Megaphone,
  Clock,
  GridFour,
  PushPin,
  X,
  Copy,
  Check,
  Key,
  User,
  Chalkboard,
  YoutubeLogo,
  GoogleLogo,
  ArrowSquareOut,
  Funnel,
  CaretDown,
  List,
  CheckCircle,
  Eye,
  PencilSimple,
  Notebook,
  NotePencil,
  MagnifyingGlass,
  ListChecks,
  Hourglass,
  XCircle,
  Star,
  Target,
  Timer,
  ArrowRight,
  ListNumbers
} from "phosphor-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../components/ui/dropdown-menu";
import ActivitiesTable from "../../../components/ui/Tables/ActivitiesTable";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import ViewModeSwitch from "../../../components/ui/Buttons/ViewModeSwitch";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import { gradebookService } from "../../../service/gradebook.service.ts";
import { activityService } from "../../../service/activity.service.ts";
import type { IAnnouncement } from "../../../service/announcement.service.ts";
import FolderFileCard from "../../../components/ui/Uploads/FolderUpload/FolderFileCard";
import { BackButton } from "../../../components/ui/Buttons/BackButton.tsx";
import { DropdownFilter } from "../../../components/ui/Dropdowns/DropdownFilter";
import FullPageLoader from "../../../components/ui/Loaders/FullPageLoader";
import { SmartSearchBar, type SearchSuggestionItem } from "../../../components/ui/Inputs/SmartSearchBar";

const removeAccents = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};
import AnimatedSendButton from "../../../components/ui/Buttons/AnimatedSendButton";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton";
import { Pagination } from "@heroui/react";
import styles from "./StudentClassroomDetail.module.scss";
import stylesAssign from "../Assignments/StudentAssignments.module.scss";

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

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Không có";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
};

const deadlineUrgency = (dueDate?: string) => {
  if (!dueDate) return { text: "Không hạn", cls: styles.urgencyLow };
  const diffDays = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 3600 * 24));
  if (diffDays < 0) return { text: "Đã hết hạn", cls: styles.urgencyDanger };
  if (diffDays <= 1) return { text: "Gấp", cls: styles.urgencyDanger };
  if (diffDays <= 3) return { text: "Sắp hết hạn", cls: styles.urgencyHigh };
  return { text: "Còn hạn", cls: styles.urgencyLow };
};

const formatScore = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num)) return String(val);
  return String(parseFloat(num.toFixed(2)));
};

export default function StudentClassroomDetail() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") || "feed";
  const isFeedTab = rawTab === "feed" || rawTab === "overview" || !searchParams.get("tab");
  const isActivitiesTab = rawTab === "activities" || rawTab === "assignments" || rawTab === "quizzes";
  const isMembersTab = rawTab === "members";
  const toast = useToast();
  const { user } = useAuth();

  const [classroom, setClassroom] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState<"all" | "quiz" | "document">("all");
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedPage, setFeedPage] = useState(1);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [replyToMap, setReplyToMap] = useState<Record<string, string>>({});
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const studentList = useMemo(() => {
    return classroom?.students || [];
  }, [classroom?.students]);

  const filteredStudents = useMemo(() => {
    if (!memberSearchQuery.trim()) return studentList;
    const q = memberSearchQuery.toLowerCase().trim();
    return studentList.filter((s: any) => {
      const name = (typeof s === 'object' ? (s.name || s.email || '') : String(s)).toLowerCase();
      const email = (typeof s === 'object' ? (s.email || '') : '').toLowerCase();
      const code = (typeof s === 'object' ? (s.studentCode || '') : '').toLowerCase();
      return name.includes(q) || email.includes(q) || code.includes(q);
    });
  }, [studentList, memberSearchQuery]);

  const teacherObj = classroom?.teacherId;
  const teacherName = typeof teacherObj === 'object' ? (teacherObj?.name || classroom?.teacherName || "Giáo viên phụ trách") : (classroom?.teacherName || "Giáo viên phụ trách");
  const teacherEmail = typeof teacherObj === 'object' ? teacherObj?.email : "";
  const teacherAvatar = (typeof teacherObj === 'object' && teacherObj?.avatar)
    ? teacherObj.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=2f8fa3&color=fff&bold=true`;

  useEffect(() => {
    setCurrentPage(1);
  }, [activityTypeFilter, activityCategoryFilter, statusFilter, searchQuery]);

  const getStatus = (act: any) => {
    const sub = act.submission || act.result;
    if (sub?.status === "graded" || (sub?.grade !== undefined && sub?.grade !== null)) return "graded";
    if (sub !== null && sub !== undefined) return "submitted";
    const deadline = act.dueDate || act.deadline;
    if (deadline) {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff < 0) return "late";
    }
    return "pending";
  };

  const formatDeadline = (iso?: string) => {
    if (!iso) return "Không giới hạn";
    try {
      const d = new Date(iso);
      const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      return `${timeStr} - ${dateStr}`;
    } catch {
      return iso;
    }
  };

  const statusOptions = [
    { id: "all", label: "Tất cả trạng thái", icon: <ListChecks size={15} weight="duotone" className="text-slate-600" /> },
    { id: "late", label: "Quá hạn", icon: <XCircle size={15} weight="duotone" className="text-red-500" /> },
    { id: "pending", label: "Chưa nộp", icon: <NotePencil size={15} weight="duotone" className="text-orange-500" /> },
    { id: "submitted", label: "Đã nộp", icon: <CheckCircle size={15} weight="duotone" className="text-teal-600" /> },
    { id: "graded", label: "Đã chấm điểm", icon: <Star size={15} weight="fill" className="text-amber-400" /> },
  ];

  const activitiesForStatusCount = allActivities.filter((item: any) => {
    if (searchQuery.trim() !== "") {
      const tokens = removeAccents(searchQuery.toLowerCase().trim()).split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        const titleNorm = removeAccents((item.title || "").toLowerCase());
        const descNorm = removeAccents((item.description || "").toLowerCase());
        const isQuiz = item.type === "quiz";
        const typeText = isQuiz ? "trac nghiem quiz" : "tu luan document essay file";
        const catText = item.category === "homework"
          ? "bai tap ve nha homework btvn"
          : item.category === "periodic"
            ? "kiem tra periodic 15 phut 1 tiet giua ky hoc ky"
            : item.category === "mock_exam"
              ? "thi thu mock exam"
              : removeAccents((item.category || "").toLowerCase());
        const combined = `${titleNorm} ${descNorm} ${typeText} ${catText}`;
        const isMatch = tokens.every(token => combined.includes(token));
        if (!isMatch) return false;
      }
    }
    if (activityTypeFilter === "quiz" && item.type !== "quiz") return false;
    if (activityTypeFilter === "document" && item.type === "quiz") return false;
    if (activityCategoryFilter !== "all") {
      if (activityCategoryFilter === "homework") {
        if (item.category !== "homework") return false;
      } else if (activityCategoryFilter === "periodic") {
        if (item.category !== "periodic" && item.category !== "mock_exam") return false;
      } else {
        if (item.category !== activityCategoryFilter) return false;
      }
    }
    return true;
  });

  const activitySuggestions = useMemo<SearchSuggestionItem[]>(() => {
    if (!searchQuery.trim()) return [];
    const tokens = removeAccents(searchQuery.toLowerCase().trim()).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    return allActivities
      .filter((item: any) => {
        const titleNorm = removeAccents((item.title || "").toLowerCase());
        const descNorm = removeAccents((item.description || "").toLowerCase());
        const isQuiz = item.type === "quiz";
        const typeText = isQuiz ? "trac nghiem quiz" : "tu luan document essay file";
        const catText = item.category === "homework"
          ? "bai tap ve nha homework btvn"
          : item.category === "periodic"
            ? "kiem tra periodic 15 phut 1 tiet giua ky hoc ky"
            : item.category === "mock_exam"
              ? "thi thu mock exam"
              : removeAccents((item.category || "").toLowerCase());
        const combined = `${titleNorm} ${descNorm} ${typeText} ${catText}`;
        return tokens.every(token => combined.includes(token));
      })
      .slice(0, 6)
      .map((item: any) => {
        const isQuiz = item.type === "quiz";
        const typeLabel = isQuiz ? "Trắc nghiệm" : "Tự luận";
        const catLabel = item.category === "homework"
          ? "BTVN"
          : item.category === "periodic"
            ? "Kiểm tra"
            : item.category === "mock_exam"
              ? "Thi thử"
              : "";

        const status = getStatus(item);
        const statusLabelMap: Record<string, string> = {
          graded: "Đã chấm",
          submitted: "Đã nộp",
          late: "Quá hạn",
          pending: "Chưa nộp"
        };
        const tag = statusLabelMap[status] || "Đang mở";

        const subtitleParts = [typeLabel];
        if (catLabel) subtitleParts.push(catLabel);
        if (isQuiz && item.quizQuestions?.length) {
          subtitleParts.push(`${item.quizQuestions.length} câu`);
        }

        return {
          id: item._id,
          title: item.title,
          subtitle: subtitleParts.join(" • "),
          tag,
          rawData: item,
        };
      });
  }, [allActivities, searchQuery]);

  const pendingCount = activitiesForStatusCount.filter((a) => getStatus(a) === "pending").length;
  const lateCount = activitiesForStatusCount.filter((a) => getStatus(a) === "late").length;
  const submittedCount = activitiesForStatusCount.filter((a) => getStatus(a) === "submitted").length;
  const gradedCount = activitiesForStatusCount.filter((a) => getStatus(a) === "graded").length;

  const filteredActivities = activitiesForStatusCount.filter((item: any) => {
    if (statusFilter !== "all") {
      if (getStatus(item) !== statusFilter) return false;
    }
    return true;
  });

  const allPendingCount = allActivities.filter((a) => {
    const s = getStatus(a);
    return s === "pending" || s === "late";
  }).length;

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const currentActivities = filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [filterType, setFilterType] = useState<"all" | "announcement" | "reminder" | "material">("all");

  // Bình luận
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);
  const [likedAnns, setLikedAnns] = useState<Record<string, boolean>>({});
  const [showReplyBox, setShowReplyBox] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!classroom?.code) return;
    navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    toast.success(`Đã sao chép mã lớp ${classroom.code}!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "H")}&background=3b82f6&color=fff&bold=true`;

  const loadData = async (isInitial = false) => {
    if (!classId) return;
    if (isInitial) setLoadingData(true);

    // Tải thông tin lớp
    try {
      const res = await classroomService.getClassroomDetail(classId);
      if (res && res.data) {
        setClassroom(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải thông tin lớp học!");
      navigate("/classrooms");
      return;
    }

    // Tải thông báo
    try {
      const annRes = await announcementService.getAnnouncements(classId);
      if (annRes && annRes.data) setAnnouncements(annRes.data);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng tin!");
    }

    // Tải danh sách hoạt động (bài tập & bài thi) kèm trạng thái nộp bài của học sinh
    try {
      let subMap = new Map();
      try {
        const studentActRes = await gradebookService.getStudentAssignments();
        const studentActs = studentActRes && studentActRes.data ? studentActRes.data : [];
        studentActs.forEach((sa: any) => {
          if (sa.submission) {
            subMap.set(String(sa._id), sa.submission);
          }
        });
      } catch (e) {
        console.error("Lỗi khi tải bài nộp học sinh:", e);
      }

      const assignRes = await gradebookService.getAssignments(classId);
      const quizRes: any = await activityService.getClassActivities(classId);
      const activities = Array.isArray(quizRes) ? quizRes : (quizRes?.data || []);
      const assignList = assignRes && assignRes.data ? assignRes.data : [];

      const existIds = new Set(activities.map((a: any) => String(a._id)));
      const merged = activities.map((a: any) => ({
        ...a,
        submission: subMap.get(String(a._id)) || a.submission || null
      }));

      assignList.forEach((a: any) => {
        if (!existIds.has(String(a._id))) {
          merged.push({
            ...a,
            type: 'document',
            submission: subMap.get(String(a._id)) || a.submission || null
          });
        }
      });
      setAllActivities(merged);
    } catch (_) { } finally {
      if (isInitial) setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // Kết nối Socket.io Realtime cho Bảng tin lớp học (Học sinh)
    const socket = getSocket();

    const handleFeedUpdate = (targetClassId?: string) => {
      if (!targetClassId || targetClassId === classId) {
        console.log('⚡ [Socket.io Realtime] Giáo viên đã đăng bài/thay đổi thông báo, đang tự động cập nhật...');
        loadData();
      }
    };

    const handleSubmission = (data?: { classId?: string }) => {
      if (!data?.classId || data.classId === classId) {
        console.log('⚡ [Socket.io Realtime] Có bài nộp hoặc cập nhật điểm số mới, đang tự động tải lại...');
        loadData();
      }
    };

    const handleClassUpdate = () => {
      console.log('⚡ [Socket.io Realtime] Lớp học có thay đổi trạng thái, đang tự động cập nhật...');
      loadData();
    };

    const handleNotif = () => {
      loadData();
    };

    socket.on('classroom_feed_update', handleFeedUpdate);
    socket.on('submission_update', handleSubmission);
    socket.on('student_classrooms_update', handleClassUpdate);
    socket.on('notification_update', handleNotif);

    return () => {
      socket.off('classroom_feed_update', handleFeedUpdate);
      socket.off('submission_update', handleSubmission);
      socket.off('student_classrooms_update', handleClassUpdate);
      socket.off('notification_update', handleNotif);
    };
  }, [classId]);

  useEffect(() => {
    setFeedPage(1);
  }, [filterType]);

  // Gửi bình luận
  const handleAddComment = async (annId: string, contentFromComponent?: string) => {
    let content = (contentFromComponent || commentInputs[annId] || "").trim();
    if (!content) return;

    const parentId = replyToMap[annId];
    if (parentId && content.startsWith("@")) {
      content = `<!--replyTo:${parentId}-->${content}`;
    }

    setSendingComment(annId);
    try {
      const res = await announcementService.addComment(annId, content);
      if (res && res.data) {
        const comments = res.data.comments;
        setAnnouncements(prev =>
          prev.map(ann => ann._id === annId ? { ...ann, comments } : ann)
        );
        setCommentInputs(prev => ({ ...prev, [annId]: "" }));
        setReplyToMap(prev => ({ ...prev, [annId]: "" }));
        toast.success("Đã gửi bình luận!");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi bình luận!");
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

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
      if (diffMin < 1) return "Vừa xong";
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs} giờ trước`;
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch { return isoString; }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch { return iso; }
  };

  const filteredAnn = announcements.filter(ann =>
    filterType === "all" ? true : ann.type === filterType
  ).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const feedItemsPerPage = 5;
  const totalFeedPages = Math.ceil(filteredAnn.length / feedItemsPerPage);
  const paginatedFeedAnn = filteredAnn.slice((feedPage - 1) * feedItemsPerPage, feedPage * feedItemsPerPage);
  const feedStartIdx = filteredAnn.length > 0 ? (feedPage - 1) * feedItemsPerPage + 1 : 0;
  const feedEndIdx = Math.min(feedPage * feedItemsPerPage, filteredAnn.length);

  const typeIcon = (type: string) => {
    if (type === "reminder") return <Bell size={14} weight="duotone" />;
    if (type === "material") return <BookOpen size={14} weight="duotone" />;
    return <Megaphone size={14} weight="duotone" />;
  };

  const typeLabel = (type: string) => {
    if (type === "reminder") return { label: "Nhắc nhở", cls: styles.tagReminder };
    if (type === "material") return { label: "Tài liệu", cls: styles.tagMaterial };
    return { label: "Thông báo", cls: styles.tagAnnouncement };
  };

  const deadlineUrgency = (deadline: string) => {
    const h = (new Date(deadline).getTime() - Date.now()) / 3600000;
    if (h < 0) return { text: "Quá hạn", cls: styles.urgencyDanger };
    if (h <= 24) return { text: "Gấp", cls: styles.urgencyHigh };
    if (h <= 72) return { text: "Sắp tới", cls: styles.urgencyMid };
    return { text: "Còn thời gian", cls: styles.urgencyLow };
  };

  return (
    <>
      {loadingData && (
        <FullPageLoader
          text="Đang tải dữ liệu lớp học..."
          subtext="Vui lòng chờ trong giây lát"
        />
      )}
      <div className={styles.page}>
        <div className={styles.body}>
          {/* ===== TAB: BẢNG TIN ===== */}
          {isFeedTab && (
            <div>
              {/* TOP HEADER ROW: NÚT QUAY LẠI + TIÊU ĐỀ BẢNG TIN + BỘ LỌC */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <BackButton onClick={() => navigate("/classrooms")} />
                  <div className="h-4 w-[1px] bg-slate-300 mx-1" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Bảng tin lớp học
                  </span>
                </div>
                <DropdownFilter
                  label="Lọc bài đăng"
                  value={filterType}
                  options={[
                    { id: "all", label: "Tất cả bài đăng" },
                    { id: "announcement", label: "Thông báo" },
                    { id: "reminder", label: "Nhắc nhở" },
                    { id: "material", label: "Tài liệu" },
                  ]}
                  onChange={(key: any) => setFilterType(key)}
                  minWidthClass="min-w-[165px]"
                />
              </div>

              <div className={styles.feedLayout}>
                {/* THÔNG BÁO LỚP ĐÓNG */}
                {classroom?.status === 'Closed' && (
                  <div className="col-span-full mb-4 w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 shadow-sm items-start">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-full shrink-0">
                      <BookOpen size={20} weight="fill" />
                    </div>
                    <div>
                      <h4 className="text-amber-800 font-bold text-sm mb-1">Lớp học đang bị đóng</h4>
                      <p className="text-amber-700/90 text-[13px] leading-relaxed">
                        Lớp học này đã bị đóng. Bạn chỉ có thể xem lại dữ liệu cũ, không thể nộp bài tập mới hay bình luận.
                      </p>
                    </div>
                  </div>
                )}

                {/* Sidebar trái: thông tin lớp */}
                <aside className={styles.sidebar}>
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-3xs flex flex-col gap-3">
                    {/* TÊN LỚP HỌC */}
                    <div className="flex flex-col border-b border-slate-100 pb-3 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lớp học</span>
                      <h2 className="text-lg font-black text-[#f47c20] m-0 tracking-tight leading-snug">
                        {classroom?.name || "Lớp học"}
                      </h2>
                    </div>

                    <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-0.5">Thông tin chi tiết</h4>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#2f8fa3]/10 border border-[#2f8fa3]/30 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-[#2f8fa3]/20 text-[#2f8fa3] flex items-center justify-center shrink-0 font-bold">
                        <User size={16} weight="bold" />
                      </div>
                      <div className="flex flex-col min-w-0 justify-center gap-0.5">
                        <span className="text-[10px] text-[#2f8fa3] font-bold uppercase tracking-wider leading-tight">Giáo viên</span>
                        <span className="text-xs font-black text-[#0F172A] truncate capitalize leading-tight" title={classroom?.teacherId?.name || "—"}>
                          {classroom?.teacherId?.name || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#f47c20]/10 border border-[#f47c20]/30 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-[#f47c20]/20 text-[#f47c20] flex items-center justify-center shrink-0 font-bold">
                        <BookOpen size={16} weight="bold" />
                      </div>
                      <div className="flex flex-col min-w-0 justify-center gap-0.5">
                        <span className="text-[10px] text-[#f47c20] font-bold uppercase tracking-wider leading-tight">Môn học</span>
                        <span className="text-xs font-black text-[#0F172A] truncate leading-tight">
                          {classroom?.subject || "Môn học chung"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/35 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 text-[#d97706] flex items-center justify-center shrink-0 font-bold">
                          <Key size={16} weight="bold" />
                        </div>
                        <div className="flex flex-col min-w-0 justify-center gap-0.5">
                          <span className="text-[10px] text-[#b45309] font-bold uppercase tracking-wider leading-tight">Mã gia nhập</span>
                          <span className="text-xs font-black font-mono text-[#78350f] tracking-wider leading-tight">
                            {classroom?.code || "—"}
                          </span>
                        </div>
                      </div>
                      {classroom?.code && (
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-1.5 text-[#b45309] hover:bg-[#F59E0B]/25 rounded-lg transition-colors cursor-pointer border-none ml-1"
                          title="Sao chép mã lớp"
                        >
                          {copiedCode ? <Check size={16} weight="bold" className="text-emerald-600" /> : <Copy size={16} weight="bold" />}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#2f8fa3]/10 border border-[#2f8fa3]/30 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-[#2f8fa3]/20 text-[#2f8fa3] flex items-center justify-center shrink-0 font-bold">
                        <Users size={16} weight="bold" />
                      </div>
                      <div className="flex flex-col min-w-0 justify-center gap-0.5">
                        <span className="text-[10px] text-[#2f8fa3] font-bold uppercase tracking-wider leading-tight">Sĩ số lớp</span>
                        <span className="text-xs font-black text-[#0F172A] leading-tight">
                          {classroom?.students?.length || 0} học sinh
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bài tập sắp hết hạn */}
                  {allActivities.filter((a: any) => a.type !== "quiz").length > 0 && (
                    <div className={styles.sideCard}>
                      <h4>Bài tập sắp tới</h4>
                      {allActivities.filter((a: any) => a.type !== "quiz").slice(0, 3).map((a: any) => {
                        const urg = deadlineUrgency(a.dueDate || a.deadline);
                        return (
                          <div key={a._id} className={styles.miniAssign}>
                            <span className={`${styles.urgencyDot} ${urg.cls}`} />
                            <div>
                              <p className={styles.miniTitle}>{a.title}</p>
                              <p className={styles.miniDate}>
                                <Clock size={11} /> {formatDate(a.dueDate || a.deadline)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </aside>

                {/* Feed chính */}
                <div className={styles.feedMain}>

                  {/* Danh sách bài đăng */}
                  {paginatedFeedAnn.length > 0 ? paginatedFeedAnn.map(ann => {
                    const authorName = ann.authorId?.name || "Giáo viên";
                    const authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=f47c20&color=fff&bold=true`;
                    const { label, cls } = typeLabel(ann.type);

                    return (
                      <div key={ann._id} className={styles.annCard}>
                        {/* Header */}
                        <div className={styles.annHeader}>
                          <img src={authorAvatar} alt="" className={styles.annAvatar} />
                          <div className={styles.annMeta}>
                            <div className={styles.annAuthorRow}>
                              <strong>{authorName}</strong>
                              <span className={`${styles.typeTag} ${cls}`}>
                                {typeIcon(ann.type)} {label}
                              </span>
                              {ann.isPinned && (
                                <span className={styles.pinnedIndicator} title="Bài đăng đã được ghim">
                                  <PushPin size={16} weight="fill" color="#F59E0B" />
                                </span>
                              )}
                            </div>
                            <span className={styles.annTime}>{formatTime(ann.createdAt)}</span>
                          </div>
                        </div>

                        {/* Nội dung Media Renderer */}
                        <MediaContentRenderer content={ann.content} />

                        {/* Tệp đính kèm */}
                        {ann.attachments && ann.attachments.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                            {ann.attachments.map((f, i) => (
                              <FolderFileCard
                                key={i}
                                fileName={f.name}
                                fileSize={f.size || ''}
                                downloadUrl={f.url}
                              />
                            ))}
                          </div>
                        )}

                        {/* Bình luận */}
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
                  }) : (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-3xs my-2 min-h-[260px]">
                      <div className="w-16 h-16 bg-gradient-to-tr from-[#2f8fa3]/10 to-[#f47c20]/15 rounded-2xl flex items-center justify-center text-[#f47c20] mb-3.5 shadow-inner">
                        <Megaphone size={32} weight="duotone" />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800 m-0 mb-1">Chưa có bài đăng nào trong lớp</h3>
                      <p className="text-xs text-slate-500 max-w-sm m-0 leading-relaxed">
                        Giáo viên chưa đăng thông báo, nhắc nhở hoặc tài liệu mới nào lên bảng tin của lớp học này.
                      </p>
                    </div>
                  )}

                  {/* PAGINATION TOOLBAR FOR CLASS FEED */}
                  {totalFeedPages > 1 && filteredAnn.length > 0 && (
                    <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200/80 bg-white/70 rounded-2xl shadow-3xs mt-4 mb-2">
                      <Pagination.Summary className="text-sm text-slate-500 font-medium">
                        Hiển thị {feedStartIdx} đến {feedEndIdx} trong số {filteredAnn.length} bài đăng
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

          {/* ===== TAB: BÀI TẬP & BÀI THI ===== */}
          {isActivitiesTab && (
            <div className="flex flex-col gap-5 pb-12">
              <div className="mb-1">
                <BackButton onClick={() => navigate("/classrooms")}>Quay lại danh sách lớp</BackButton>
              </div>

              {/* Header matching StudentAssignments */}
              <div className={stylesAssign.pageHeader}>
                <div>
                  <h2>Danh Sách Bài Tập & Đề Thi</h2>
                  <p>Theo dõi tiến độ và hoạt động của lớp học</p>
                </div>

                <div className={stylesAssign.headerStats}>
                  <div className={stylesAssign.statPill}>
                    <Notebook size={16} weight="duotone" className="text-[#f47c20]" />
                    <span>{allActivities.length} Bài tập</span>
                  </div>
                  {allPendingCount > 0 && (
                    <div className={stylesAssign.statPill}>
                      <NotePencil size={16} weight="duotone" className="text-[#f47c20]" />
                      <span>{allPendingCount} Chưa nộp</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Filter Toolbar matching StudentAssignments */}
              <div className={stylesAssign.filterBar}>
                <div className="w-full sm:w-72 md:w-80">
                  <SmartSearchBar
                    placeholder="Tìm kiếm bài tập, đề thi... (Ấn /)"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    suggestions={activitySuggestions}
                    onSelectSuggestion={(item) => {
                      setActivityTypeFilter("all");
                      setActivityCategoryFilter("all");
                      setStatusFilter("all");
                      setSearchQuery(item.title);
                    }}
                    recentSearchesKey="studentClassroomActivitiesSearches"
                    enableShortcut={true}
                    widthClass="w-full"
                    inputClassName="w-full h-9 pl-9 pr-8 bg-white border border-slate-200/80 hover:border-slate-300 focus:border-[#f47c20] focus:ring-1 focus:ring-[#f47c20] transition-colors rounded-xl outline-none text-slate-700 placeholder:text-slate-400/80 text-xs font-medium shadow-2xs"
                  />
                </div>

                <div className="flex flex-wrap md:flex-nowrap gap-2.5">
                  {/* Dropdown Type */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3.5 py-2 outline-none hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 transition-colors min-w-[140px] h-[36px] cursor-pointer whitespace-nowrap">
                      <span className="whitespace-nowrap">
                        {activityTypeFilter === "all" ? "Tất cả loại bài" : (activityTypeFilter === "quiz" ? "Trắc nghiệm" : "Tự luận")}
                      </span>
                      <CaretDown size={13} className="text-slate-400" weight="bold" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[170px] bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
                      <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setActivityTypeFilter("all")}>
                        Tất cả loại bài
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setActivityTypeFilter("quiz")}>
                        Trắc nghiệm
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setActivityTypeFilter("document")}>
                        Tự luận
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Dropdown Purpose / Category */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3.5 py-2 outline-none hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 transition-colors min-w-[145px] h-[36px] cursor-pointer whitespace-nowrap">
                      <span className="truncate max-w-[115px] whitespace-nowrap">
                        {activityCategoryFilter === "all"
                          ? "Tất cả mục đích"
                          : {
                              homework: "Bài tập về nhà",
                              periodic: "Kiểm tra định kỳ",
                              mock_exam: "Thi thử",
                              attitude: "Chuyên cần / Thái độ"
                            }[activityCategoryFilter] || activityCategoryFilter}
                      </span>
                      <CaretDown size={13} className="text-slate-400 flex-shrink-0" weight="bold" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[190px] bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
                      <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setActivityCategoryFilter("all")}>
                        Tất cả mục đích
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setActivityCategoryFilter("homework")}>
                        Bài tập về nhà
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer font-medium whitespace-nowrap" onClick={() => setActivityCategoryFilter("periodic")}>
                        Kiểm tra định kỳ
                      </DropdownMenuItem>
                      {Array.from(new Set(allActivities.map((a: any) => a.category).filter(Boolean)))
                        .filter((cat: any) => !["homework", "periodic", "mock_exam"].includes(cat))
                        .map((cat: any) => (
                          <DropdownMenuItem
                            key={cat}
                            onClick={() => setActivityCategoryFilter(cat)}
                            className="cursor-pointer font-medium whitespace-nowrap"
                          >
                            {cat === "attitude" ? "Chuyên cần / Thái độ" : cat}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Dropdown Status (with active icon and count) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-orange-50 border border-orange-200 text-[#f47c20] text-xs font-extrabold rounded-lg px-3.5 py-2 outline-none hover:bg-orange-100 transition-colors min-w-[175px] h-[36px] cursor-pointer whitespace-nowrap">
                      {(() => {
                        const activeOpt = statusOptions.find(o => o.id === statusFilter) || statusOptions[0];
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
                        const count = opt.id === "all" ? activitiesForStatusCount.length
                          : opt.id === "late" ? lateCount
                            : opt.id === "pending" ? pendingCount
                              : opt.id === "submitted" ? submittedCount
                                : gradedCount;

                        return (
                          <DropdownMenuItem
                            key={opt.id}
                            onClick={() => setStatusFilter(opt.id)}
                            className="flex justify-between items-center cursor-pointer font-semibold py-1.5 px-2.5 whitespace-nowrap"
                          >
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              {opt.icon}
                              <span className={`whitespace-nowrap ${statusFilter === opt.id ? "font-bold text-[#f47c20]" : "text-slate-700"}`}>
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

              {/* Activities Cards Grid */}
              {filteredActivities.length === 0 ? (
                <div className={stylesAssign.emptyState}>
                  <BookOpen size={44} className={stylesAssign.emptyIcon} />
                  <h4>Không tìm thấy bài tập</h4>
                  <p>Chưa có bài tập hoặc đề thi nào phù hợp với bộ lọc tìm kiếm.</p>
                </div>
              ) : (
                <>
                  <div className={stylesAssign.assignmentList}>
                    {currentActivities.map((act: any) => {
                      const isQuiz = act.type === "quiz";
                      const sub = act.submission || act.result;
                      const isSubmitted = sub !== null && sub !== undefined;
                      const isGraded = sub?.status === 'graded' || (sub?.grade !== null && sub?.grade !== undefined);
                      const score = sub?.grade ?? sub?.score;
                      const status = getStatus(act);
                      const isDone = status === "submitted" || status === "graded";
                      const qCount =
                        act.questionCount ||
                        act.bankItemId?.quizQuestions?.length ||
                        act.questions?.length ||
                        act.quizQuestions?.length ||
                        (act.title ? (() => {
                          const m = act.title.match(/(\d+)\s*câu/i);
                          return m ? parseInt(m[1], 10) : 0;
                        })() : 0);

                      return (
                        <div
                          key={act._id}
                          className={`${stylesAssign.assignCard} ${status === "late" ? stylesAssign.lateCard : ""} ${isDone ? stylesAssign.doneCard : ""}`}
                          onClick={() => {
                            if (isQuiz && status !== "late") navigate(`/exams/${act._id}`);
                            else navigate(`/assignments/${act._id}`);
                          }}
                        >
                          <div className={stylesAssign.cardMain}>
                            {/* Card Top Badges Header */}
                            <div className={stylesAssign.cardHeaderRow}>
                              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                                <span className={stylesAssign.classBadge}>
                                  {classroom?.name || "Lớp học"}
                                </span>
                                <span className={stylesAssign.typeBadge}>
                                  {isQuiz ? "Trắc nghiệm" : "Tự luận"}
                                </span>
                              </div>
                            </div>

                            {/* Title and Description */}
                            <h4 className={stylesAssign.cardTitle} title={act.title}>{act.title}</h4>
                            <p className={stylesAssign.cardDesc} title={classroom?.subject || act.description}>
                              {classroom?.subject ? `Môn: ${classroom.subject}` : (act.description || "Hoàn thành đúng hạn để nhận điểm XP.")}
                            </p>

                            {/* Detailed Info Pills Box */}
                            <div className={stylesAssign.metaGrid}>
                              <div className={stylesAssign.metaItem}>
                                <Clock size={14} weight="bold" />
                                <span>Hạn: <strong>{formatDeadline(act.dueDate || act.deadline)}</strong></span>
                              </div>

                              <div className={stylesAssign.metaItem}>
                                <Target size={14} weight="bold" />
                                <span>
                                  Điểm:{" "}
                                  <strong>
                                    {isGraded && score !== undefined && score !== null
                                      ? `${formatScore(score)}/${formatScore(act.maxScore || 10)} đ`
                                      : `0/${formatScore(act.maxScore || 10)} đ`}
                                  </strong>
                                </span>
                              </div>

                              <div className={stylesAssign.metaItem}>
                                <Timer size={14} weight="bold" />
                                <span>Thời gian: <strong>{act.durationMinutes ? `${act.durationMinutes} phút` : "Tự do"}</strong></span>
                              </div>

                              {qCount > 0 && (
                                <div className={stylesAssign.metaItem}>
                                  <ListNumbers size={14} weight="bold" />
                                  <span>Số câu: <strong>{qCount} câu</strong></span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer Action Block */}
                          <div className={stylesAssign.cardFooter}>
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
                              variant={isDone || status === "late" ? "outline" : "default"}
                              size="sm"
                              className="!text-xs font-extrabold ml-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isQuiz && status !== "late") navigate(`/exams/${act._id}`);
                                else navigate(`/assignments/${act._id}`);
                              }}
                              disabled={classroom?.status === 'Closed' && !isDone}
                            >
                              {status === "graded" ? (
                                <>
                                  Xem kết quả <ArrowRight size={13} weight="bold" />
                                </>
                              ) : status === "late" ? (
                                <>
                                  Xem chi tiết <ArrowRight size={13} weight="bold" />
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
                    })}
                  </div>

                  {/* Pagination */}
                  {filteredActivities.length > 0 && (
                    <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-white rounded-2xl shadow-3xs mt-2 mb-6">
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
              )}
            </div>
          )}

          {/* ===== TAB: THÀNH VIÊN ===== */}
          {isMembersTab && (
            <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 py-2">
              {/* TOP HEADER: Nút quay lại + Tiêu đề trang + Ô tìm kiếm */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <BackButton onClick={() => navigate(`/classrooms/${classId}?tab=overview`)}>
                    Quay lại bảng tin
                  </BackButton>
                  <div className="h-5 w-[1px] bg-slate-300 mx-1 hidden sm:block" />
                  <div>
                    <h2 className="text-lg font-black text-slate-800 m-0 flex items-center gap-2">
                      <Users size={22} weight="duotone" className="text-[#2f8fa3]" />
                      <span>Thành viên lớp học</span>
                    </h2>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">
                      {classroom?.name || classroom?.className || "Lớp học"} • {studentList.length} bạn cùng lớp
                    </p>
                  </div>
                </div>

                {/* Ô tìm kiếm nhanh thành viên */}
                <div className="relative w-full sm:w-64">
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên bạn học..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2f8fa3]/30 focus:border-[#2f8fa3] transition-all shadow-2xs"
                  />
                  {memberSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMemberSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent p-0 flex items-center justify-center"
                    >
                      <X size={13} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              {/* 1. MỤC: GIÁO VIÊN CHỦ NHIỆM */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b-2 border-[#2f8fa3]/40">
                  <div className="flex items-center gap-2">
                    <Chalkboard size={20} weight="bold" className="text-[#2f8fa3]" />
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider m-0">
                      Giáo viên chủ nhiệm
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#2f8fa3] bg-[#2f8fa3]/10 px-2.5 py-0.5 rounded-full border border-[#2f8fa3]/20">
                    Phụ trách lớp
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4 flex-wrap max-w-xl">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={teacherAvatar}
                      alt={teacherName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#2f8fa3]/30 shadow-2xs shrink-0"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                          {(() => {
                            const name = teacherName.toLowerCase();
                            if (name.startsWith("thầy") || name.startsWith("cô") || name.startsWith("gv") || name.startsWith("giáo viên")) {
                              return teacherName;
                            }
                            return `Thầy/Cô ${teacherName}`;
                          })()}
                        </span>
                      </div>
                      {teacherEmail ? (
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          {teacherEmail}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium mt-0.5">
                          {classroom?.subject ? `Môn giảng dạy: ${classroom.subject}` : "Giáo viên giảng dạy"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-[#2f8fa3] border border-[#2f8fa3]/30 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-[#2f8fa3]" />
                      Giáo viên chủ nhiệm
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. MỤC: DANH SÁCH BẠN CÙNG LỚP */}
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-center justify-between pb-2 border-b-2 border-[#f47c20]/40">
                  <div className="flex items-center gap-2">
                    <Users size={20} weight="bold" className="text-[#f47c20]" />
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider m-0">
                      Danh sách bạn cùng lớp
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#f47c20] bg-[#f47c20]/10 px-2.5 py-0.5 rounded-full border border-[#f47c20]/20">
                    {studentList.length} học sinh
                  </span>
                </div>

                {filteredStudents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredStudents.map((s: any, idx: number) => {
                      const sId = typeof s === 'object' ? (s._id || s.id) : s;
                      const isCurrentUser = user && (sId === user._id || sId === user.id || (typeof s === 'object' && s.email && s.email === user.email));
                      const studentName = typeof s === 'object' ? (s.name || s.email || `Học sinh ${idx + 1}`) : `Học sinh ${idx + 1}`;
                      const studentEmail = typeof s === 'object' ? s.email : "";
                      const studentCode = typeof s === 'object' ? s.studentCode : "";

                      const colorPalette = ["f47c20", "2f8fa3", "0d9488", "6366f1", "ec4899", "8b5cf6"];
                      const avatarBg = colorPalette[idx % colorPalette.length];
                      const studentAvatar = (typeof s === 'object' && s.avatar)
                        ? s.avatar
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=${avatarBg}&color=fff&bold=true`;

                      return (
                        <div
                          key={sId || idx}
                          className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 group ${
                            isCurrentUser
                              ? "bg-amber-50/70 border-amber-300 shadow-2xs hover:shadow-xs hover:border-[#f47c20]"
                              : "bg-white border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-[#2f8fa3]/50 hover:-translate-y-0.5"
                          }`}
                        >
                          {/* STT */}
                          <span className="text-[11px] font-black text-slate-400 font-mono w-4 text-center shrink-0">
                            {idx + 1}
                          </span>

                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <img
                              src={studentAvatar}
                              alt={studentName}
                              className={`w-10 h-10 rounded-full object-cover border shrink-0 ${
                                isCurrentUser ? "border-[#f47c20] ring-2 ring-[#f47c20]/25" : "border-slate-200"
                              }`}
                            />
                            {isCurrentUser && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#f47c20] border-2 border-white shadow-2xs" title="Tài khoản của bạn" />
                            )}
                          </div>

                          {/* Thông tin học sinh */}
                          <div className="flex flex-col min-w-0 flex-1 justify-center">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`text-xs sm:text-sm font-bold truncate ${
                                  isCurrentUser ? "text-[#f47c20]" : "text-slate-800 group-hover:text-[#2f8fa3]"
                                } transition-colors`}
                                title={studentName}
                              >
                                {studentName}
                              </span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#f47c20]/15 text-[#f47c20] border border-[#f47c20]/30 shrink-0">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span
                              className="text-[11px] text-slate-400 font-medium truncate mt-0.5"
                              title={studentEmail || studentCode || "Học sinh"}
                            >
                              {studentEmail || studentCode || "Học sinh"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : memberSearchQuery ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center">
                    <MagnifyingGlass size={36} weight="duotone" className="text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700 m-0">Không tìm thấy bạn học nào</p>
                    <p className="text-xs text-slate-400 m-0 mt-1">Không có kết quả khớp với "{memberSearchQuery}"</p>
                    <button
                      type="button"
                      onClick={() => setMemberSearchQuery("")}
                      className="mt-3 px-3 py-1 text-xs font-bold text-[#2f8fa3] hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Xóa tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center">
                    <Users size={36} weight="duotone" className="text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700 m-0">Chưa có bạn học nào trong lớp</p>
                    <p className="text-xs text-slate-400 m-0 mt-1">Các bạn học sinh khác tham gia bằng mã code sẽ hiển thị tại đây.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
