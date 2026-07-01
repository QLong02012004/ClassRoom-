import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Paperclip,
  PaperPlaneRight,
  ChatCircle,
  ShareNetwork,
  FilePdf,
  DownloadSimple,
  DotsThree,
  Trash,
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
  Chalkboard,
  DotsSixVertical,
  Image,
  X as XIcon,
  ChatCircleText,
  ClipboardText,
  PushPin
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import { quizService } from "../../../service/quiz.service.ts";
import type { IAnnouncement } from "../../../service/announcement.service.ts";
import { Button } from "../../../components/ui/button";
import FolderUpload from "../../../components/ui/FolderUpload/FolderUpload";
import FolderFileCard from "../../../components/ui/FolderUpload/FolderFileCard";
import styles from "./TeacherClassroomDetail.module.scss";

export default function TeacherClassroomDetail() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "overview") as "overview" | "reports" | "schedule" | "quizzes";
  const toast = useToast();
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || localStorage.getItem("userRole") || "TEACHER";
  const username = user?.name || localStorage.getItem("username") || "Giáo viên";
  const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FE6747&color=fff&bold=true`;

  const [classroom, setClassroom] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [filterChip, setFilterChip] = useState<"all" | "reminder" | "material" | "assignment">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [sendingComment, setSendingComment] = useState<string | null>(null);

  // State cho trắc nghiệm
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // Form states cho tạo đề trắc nghiệm
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDuration, setQuizDuration] = useState(15);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    imageUrl?: string;
  }>>([
    { questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 }
  ]);

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

  const [postType, setPostType] = useState<"announcement" | "reminder" | "material">("announcement");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State cho bình luận mới của từng bài đăng
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [likedAnns, setLikedAnns] = useState<Record<string, boolean>>({});
  const [showReplyBox, setShowReplyBox] = useState<Record<string, boolean>>({});

  const loadQuizzes = async () => {
    if (!classId) return;
    try {
      setLoadingQuizzes(true);
      const res = await quizService.getQuizzes(classId);
      if (res && res.data) {
        setQuizzes(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách bài trắc nghiệm!");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const loadQuizResults = async (quizId: string) => {
    try {
      setLoadingResults(true);
      const res = await quizService.getQuizResults(quizId);
      if (res && res.data) {
        setQuizResults(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể tải bảng điểm!");
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    if (activeTab === "quizzes") {
      loadQuizzes();
      setSelectedQuiz(null);
      setIsCreatingQuiz(false);
    }
  }, [activeTab, classId]);

  const handleAddQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      { questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 }
    ]);
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
      updated[qIndex].correctOptionIndex = 0;
    }
    setQuizQuestions(updated);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;

    if (!quizTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề đề thi!");
      return;
    }

    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      if (!q.questionText.trim()) {
        toast.error(`Vui lòng nhập nội dung câu hỏi số ${i + 1}!`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          toast.error(`Vui lòng nhập phương án trả lời ${String.fromCharCode(65 + j)} của câu hỏi ${i + 1}!`);
          return;
        }
      }
    }

    try {
      if (editingQuizId) {
        await quizService.updateQuiz(editingQuizId, {
          title: quizTitle.trim(),
          durationMinutes: quizDuration,
          questions: quizQuestions
        });
        toast.success("Cập nhật đề thi trắc nghiệm thành công!");
      } else {
        await quizService.createQuiz({
          classId,
          title: quizTitle.trim(),
          durationMinutes: quizDuration,
          questions: quizQuestions
        });
        toast.success("Tạo đề thi trắc nghiệm thành công!");
      }
      setIsCreatingQuiz(false);
      setEditingQuizId(null);
      setQuizTitle("");
      setQuizDuration(15);
      setQuizQuestions([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 }]);
      loadQuizzes();
    } catch (err: any) {
      toast.error(err.message || (editingQuizId ? "Cập nhật đề thi trắc nghiệm thất bại!" : "Tạo đề thi trắc nghiệm thất bại!"));
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingQuiz(false);
    setEditingQuizId(null);
  };

  const handleOpenCreateQuiz = () => {
    setQuizTitle("");
    setQuizDuration(15);
    setQuizQuestions([{ questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 }]);
    setEditingQuizId(null);
    setIsCreatingQuiz(true);
  };

  const handleOpenEditQuiz = (quizItem: any) => {
    setQuizTitle(quizItem.title);
    setQuizDuration(quizItem.durationMinutes);
    // Sao chép sâu câu hỏi vào form state
    const formattedQuestions = quizItem.questions.map((q: any) => ({
      questionText: q.questionText,
      options: [...q.options],
      correctOptionIndex: q.correctOptionIndex
    }));
    setQuizQuestions(formattedQuestions);
    setEditingQuizId(quizItem._id);
    setIsCreatingQuiz(true);
  };

  // Tải dữ liệu lớp học và bảng tin
  const loadData = async () => {
    if (!classId) return;

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
          studentCount: res.data.students?.length || 0
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
    }
  };

  useEffect(() => {
    loadData();
  }, [classId]);

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
    if (!postText.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo!");
      return;
    }

    setIsPosting(true);
    try {
      await announcementService.createAnnouncement({
        classId,
        content: postText.trim(),
        type: postType,
        attachments: attachedFiles.map(f => ({ name: f.name, url: f.url, size: f.size }))
      });
      toast.success("Đăng bài thông báo thành công!");
      setPostText("");
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
  const handleDeletePost = async (annId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;

    try {
      await announcementService.deleteAnnouncement(annId);
      // Xóa khỏi state ngay lập tức (không cần reload)
      setAnnouncements(prev => prev.filter(ann => ann._id !== annId));
      toast.success("Đã xóa thông báo!");
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa thông báo. Bạn có phải tác giả không?");
    }
  };

  // Ghim bài đăng
  const handleTogglePin = async (annId: string) => {
    try {
      const res = await announcementService.togglePin(annId);
      if (res && res.data) {
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? res.data : ann)));
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
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? res.data : ann)));
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
        setAnnouncements(prev => prev.map(ann => (ann._id === annId ? res.data : ann)));
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thích bình luận!");
    }
  };

  // Đăng bình luận
  const handleAddComment = async (annId: string) => {
    const commentContent = (commentInputs[annId] || "").trim();
    if (!commentContent) return;

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
        toast.success("Đã gửi bình luận!");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể đăng bình luận!");
    } finally {
      setSendingComment(null);
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
            {/* LEFT SIDEBAR: CLASS INFO */}
            <div className={styles.classSidebar}>
              <div className={styles.classMergedCard}>
                <div className={styles.classBanner}>
                  <h2 className="text-xl font-black text-white mb-1 leading-tight">{classroom?.className || "Đang tải..."}</h2>
                  <p className="text-white/90 font-medium text-sm">{classroom?.subject || "Môn học chung"}</p>
                </div>
                <div className={styles.classInfo}>
                  <button 
                    className={`${styles.infoRow} ${styles.clickableRow}`}
                    onClick={() => navigate(`/classrooms/${classId}/students`)}
                    title="Quản lý học sinh"
                  >
                    <Users size={18} weight="duotone" className="text-blue-500" />
                    <span>Sĩ số: <strong>{classroom?.studentCount || 0}</strong> học sinh</span>
                    <span className={styles.rowActionText}>Quản lý &rarr;</span>
                  </button>
                </div>
              </div>

              {/* THỐNG KÊ (Đã gộp từ tab Báo cáo) */}
              <div className={styles.reportCardMini}>
                <h3>Tiến độ trung bình lớp</h3>
                <div className={styles.reportMetricsMini}>
                  <div className={styles.statMetricMini}>
                    <span className={styles.statNumMini}>92%</span>
                    <span className={styles.statDescMini}>Hoàn thành</span>
                  </div>
                  <div className={styles.statMetricMini}>
                    <span className={styles.statNumMini}>8.4</span>
                    <span className={styles.statDescMini}>GPA</span>
                  </div>
                  <div className={styles.statMetricMini}>
                    <span className={styles.statNumMini}>96%</span>
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

                  <div className={styles.composerBottom}>
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

                    <div className={styles.composerActions} style={{ justifyContent: 'flex-end' }}>

                      <Button
                        onClick={handleCreatePost}
                        disabled={!postText.trim() || isPosting}
                      >
                        {isPosting ? "Đang đăng..." : "Đăng bài"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* FILTER CHIPS BAR */}
              <div className={styles.filterBar}>
                <button
                  className={`${styles.filterChip} ${filterChip === "all" ? styles.active : ""}`}
                  onClick={() => setFilterChip("all")}
                >
                  Tất cả
                </button>
                <button
                  className={`${styles.filterChip} ${filterChip === "assignment" ? styles.active : ""}`}
                  onClick={() => setFilterChip("assignment")}
                >
                  Bài tập
                </button>
                <button
                  className={`${styles.filterChip} ${filterChip === "reminder" ? styles.active : ""}`}
                  onClick={() => setFilterChip("reminder")}
                >
                  Nhắc nhở
                </button>
                <button
                  className={`${styles.filterChip} ${filterChip === "material" ? styles.active : ""}`}
                  onClick={() => setFilterChip("material")}
                >
                  Tài liệu
                </button>
              </div>

              {/* ANNOUNCEMENT FEED LIST */}
              <div className={styles.feedList}>
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((ann) => {
                    // Xác định tên hiển thị cho loại bài đăng tiếng Việt
                    let typeText = "đã đăng một thông báo";
                    if (ann.type === "reminder") typeText = "đã đăng một nhắc nhở";
                    if (ann.type === "material") typeText = "đã chia sẻ một tài liệu";

                    const authorDisplayName = ann.authorId?.name || "Giáo viên";
                    const authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorDisplayName)}&background=FE6747&color=fff&bold=true`;

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
                                  onClick={() => handleDeletePost(ann._id)}
                                  title="Xóa bài đăng"
                                >
                                  <Trash size={16} />
                                </button>
                              </>
                            )}
                            <button className={styles.moreBtn} aria-label="Tùy chọn">
                              <DotsThree size={24} weight="bold" />
                            </button>
                          </div>
                        </div>

                        {/* Content Card */}
                        <div className={styles.cardContent}>
                          <p>{ann.content}</p>
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
                        <div className={styles.customCommentsCard}>
                          <span className={styles.customTitle}>Comments</span>
                          
                          <div className={styles.customComments}>
                            <div className={styles.commentContainer}>
                              {ann.comments?.map((comment: any, idx: number) => {
                                const commentAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=FE6747&color=fff&bold=true`;
                                const isTeacher = (comment.authorId === (classroom?.teacherId?._id || classroom?.teacherId));
                                const isReply = comment.content.trim().startsWith('@');
                                return (
                                  <div key={comment._id || idx} className={`${styles.singleCommentWrapper} ${isTeacher ? styles.teacherComment : ""} ${isReply ? styles.replyComment : ""}`}>


                                    <div className={styles.commentBodyWrapper}>
                                      <div className={styles.user}>
                                        <div className={styles.userPic}>
                                          <img src={commentAvatar} alt="" />
                                        </div>
                                        <div className={styles.userInfo}>
                                          <span>
                                            {comment.authorName}
                                            {isTeacher && <span className={styles.teacherBadge}>Giáo viên</span>}
                                          </span>
                                          <div className={styles.metaRow}>
                                            <p>{formatTime(comment.createdAt)}</p>
                                          </div>
                                        </div>
                                      </div>
                                      <p className={styles.commentContent}>
                                        {comment.content}
                                      </p>
                                      <div className={styles.commentActions}>
                                        <button 
                                          className={`${styles.likeBtn} ${comment.likes?.includes(user?.id || "") ? styles.liked : ""}`}
                                          onClick={() => handleLikeComment(ann._id, comment._id)}
                                        >
                                          <svg fill={comment.likes?.includes(user?.id || "") ? "#f5356e" : "none"} viewBox="0 0 24 24" height={14} width={14} xmlns="http://www.w3.org/2000/svg">
                                            <path fill={comment.likes?.includes(user?.id || "") ? "#f5356e" : "#707277"} strokeLinecap="round" strokeWidth={2} stroke={comment.likes?.includes(user?.id || "") ? "#f5356e" : "#707277"} d="M19.4626 3.99415C16.7809 2.34923 14.4404 3.01211 13.0344 4.06801C12.4578 4.50096 12.1696 4.71743 12 4.71743C11.8304 4.71743 11.5422 4.50096 10.9656 4.06801C9.55962 3.01211 7.21909 2.34923 4.53744 3.99415C1.01807 6.15294 0.221721 13.2749 8.33953 19.2834C9.88572 20.4278 10.6588 21 12 21C13.3412 21 14.1143 20.4278 15.6605 19.2834C23.7783 13.2749 22.9819 6.15294 19.4626 3.99415Z" />
                                          </svg>
                                          Thích {comment.likes?.length ? `(${comment.likes.length})` : ""}
                                        </button>
                                        <button 
                                          className={styles.replyBtn}
                                          onClick={() => {
                                            setShowReplyBox(prev => ({ ...prev, [ann._id]: true }));
                                            setCommentInputs(prev => ({
                                              ...prev,
                                              [ann._id]: `@${comment.authorName} `
                                            }));
                                          }}
                                        >
                                          Trả lời
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {showReplyBox[ann._id] ? (
                            <div className={styles.textBox}>
                              <div className={styles.boxContainer}>
                                <button 
                                  className={styles.closeReplyBtn}
                                  onClick={() => setShowReplyBox(prev => ({ ...prev, [ann._id]: false }))}
                                  title="Đóng"
                                >
                                  <X size={14} weight="bold" />
                                </button>
                                <textarea
                                  placeholder="Reply"
                                  value={commentInputs[ann._id] || ""}
                                  onChange={(e) => setCommentInputs({
                                    ...commentInputs,
                                    [ann._id]: e.target.value
                                  })}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddComment(ann._id);
                                    }
                                  }}
                                  autoFocus
                                />
                                <div>
                                  <div className={styles.formatting}>
                                    <button type="button">
                                      <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M5 6C5 4.58579 5 3.87868 5.43934 3.43934C5.87868 3 6.58579 3 8 3H12.5789C15.0206 3 17 5.01472 17 7.5C17 9.98528 15.0206 12 12.5789 12H5V6Z" clipRule="evenodd" fillRule="evenodd" />
                                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M12.4286 12H13.6667C16.0599 12 18 14.0147 18 16.5C18 18.9853 16.0599 21 13.6667 21H8C6.58579 21 5.87868 21 5.43934 20.5607C5 20.1213 5 19.4142 5 18V12" />
                                      </svg>
                                    </button>
                                    <button type="button">
                                      <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M12 4H19" />
                                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M8 20L16 4" />
                                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M5 20H12" />
                                      </svg>
                                    </button>
                                    <button type="button">
                                      <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M5.5 3V11.5C5.5 15.0899 8.41015 18 12 18C15.5899 18 18.5 15.0899 18.5 11.5V3" />
                                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M3 21H21" />
                                      </svg>
                                    </button>
                                    <button type="button">
                                      <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M4 12H20" />
                                        <path strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M17.5 7.66667C17.5 5.08934 15.0376 3 12 3C8.96243 3 6.5 5.08934 6.5 7.66667C6.5 8.15279 6.55336 8.59783 6.6668 9M6 16.3333C6 18.9107 8.68629 21 12 21C15.3137 21 18 19.6667 18 16.3333C18 13.9404 16.9693 12.5782 14.9079 12" />
                                      </svg>
                                    </button>
                                    <button type="button">
                                      <svg fill="none" viewBox="0 0 24 24" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
                                        <circle strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" r={10} cy={12} cx={12} />
                                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="#707277" d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15" />
                                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="#707277" d="M8.00897 9L8 9M16 9L15.991 9" />
                                      </svg>
                                    </button>
                                    <button type="button" className={styles.newSendBtn} onClick={() => handleAddComment(ann._id)}>
                                      <div className={styles.svgWrapper1}>
                                        <div className={styles.svgWrapper}>
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24}>
                                            <path fill="none" d="M0 0h24v24H0z" />
                                            <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
                                          </svg>
                                        </div>
                                      </div>
                                      <span>Send</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.showReplyBoxBtnContainer}>
                              <button className={styles.showReplyBoxBtn} onClick={() => setShowReplyBox(prev => ({ ...prev, [ann._id]: true }))}>
                                Viết bình luận...
                              </button>
                            </div>
                          )}
                        </div>
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
              </div>
            </div>
          </div>
        )}

        {/* TABS 4: QUIZZES VIEW */}
        {activeTab === "quizzes" && (
          <div className={styles.tabContentPanel}>
            {isCreatingQuiz ? (
              /* CREATE QUIZ FORM */
              <div className={styles.createQuizView}>
                <div className={styles.formHeader}>
                  <h3>Tạo đề thi trắc nghiệm mới</h3>
                  <button type="button" className={styles.removeQBtn} onClick={handleCancelCreate} title="Hủy bỏ" style={{ border: "none", background: "none", cursor: "pointer" }}>
                    <X size={20} weight="bold" />
                  </button>
                </div>
                <form onSubmit={handleSaveQuiz}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="quiz-title">Tiêu đề đề thi trắc nghiệm</label>
                      <input
                        id="quiz-title"
                        type="text"
                        placeholder="Ví dụ: Kiểm tra giữa kỳ môn Toán"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="quiz-duration">Thời gian làm bài (phút)</label>
                      <input
                        id="quiz-duration"
                        type="number"
                        min={1}
                        max={180}
                        value={quizDuration}
                        onChange={(e) => setQuizDuration(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  {/* Question Editor list */}
                  <div className={styles.questionsSection}>
                    <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Danh sách câu hỏi ({quizQuestions.length})</span>
                    </h4>

                    {quizQuestions.map((q, qIndex) => (
                      <div
                        key={qIndex}
                        className={`${styles.questionBuilderCard} ${dragOverIndex === qIndex ? styles.dragOver : ""}`}
                        draggable
                        onDragStart={() => handleDragStart(qIndex)}
                        onDragOver={(e) => handleDragOver(e, qIndex)}
                        onDrop={() => handleDrop(qIndex)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className={styles.questionHeaderRow}>
                          <div className={styles.headerLeft}>
                            <span className={styles.gripHandle} title="Kéo để sắp xếp lại">
                              <DotsSixVertical size={20} weight="bold" />
                            </span>
                            <span>CÂU HỎI {qIndex + 1}</span>
                          </div>
                          <button
                            type="button"
                            className={styles.removeQBtn}
                            onClick={() => handleRemoveQuestion(qIndex)}
                            title="Xóa câu hỏi này"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>

                        <div className={styles.formGroup}>
                          <div className={styles.questionLabelRow}>
                            <label htmlFor={`q-${qIndex}-text`}>Nội dung câu hỏi</label>
                            <label className={styles.imgUploadBtn} title="Đính kèm hình ảnh">
                              <Image size={16} weight="duotone" />
                              <span>Ảnh</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleQuestionImage(qIndex, e.target.files?.[0] ?? null)}
                              />
                            </label>
                          </div>
                          <textarea
                            id={`q-${qIndex}-text`}
                            placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                            value={q.questionText}
                            onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                            rows={2}
                            required
                          />
                          {q.imageUrl && (
                            <div className={styles.questionImagePreview}>
                              <img src={q.imageUrl} alt="Hình ảnh câu hỏi" />
                              <button
                                type="button"
                                className={styles.imgRemoveBtn}
                                onClick={() => handleRemoveQuestionImage(qIndex)}
                                title="Xóa ảnh"
                              >
                                <X size={14} weight="bold" />
                              </button>
                            </div>
                          )}
                        </div>

                        <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "8px" }}>
                          Các phương án trả lời và tích chọn đáp án đúng
                          <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6, fontSize: "0.78rem" }}>({q.options.length} phương án, tối thiểu 2 · tối đa 6)</span>
                        </label>
                        <div className={styles.optionsGrid}>
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className={`${styles.optionInputGroup} ${q.correctOptionIndex === optIndex ? styles.optionCorrect : ""}`}>
                              <span className={styles.letterLabel}>
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <input
                                type="text"
                                placeholder={`Nhập phương án ${String.fromCharCode(65 + optIndex)}`}
                                value={opt}
                                onChange={(e) => handleOptionTextChange(qIndex, optIndex, e.target.value)}
                                required
                              />
                              <input
                                type="radio"
                                name={`correct-opt-${qIndex}`}
                                checked={q.correctOptionIndex === optIndex}
                                onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                                title="Chọn làm đáp án đúng"
                                required
                              />
                              {/* Nút bỏ phương án */}
                              <button
                                type="button"
                                className={styles.optionRemoveBtn}
                                onClick={() => handleRemoveOption(qIndex, optIndex)}
                                title="Xóa phương án này"
                                disabled={q.options.length <= 2}
                              >
                                −
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* Nút thêm phương án */}
                        {q.options.length < 6 && (
                          <button
                            type="button"
                            className={styles.btnAddOption}
                            onClick={() => handleAddOption(qIndex)}
                          >
                            <Plus size={13} weight="bold" />
                            Thêm phương án
                          </button>
                        )}
                      </div>
                    ))}
                    {/* NÚT THÊM CÂU HỎI - đặt dưới danh sách, dạng outline */}
                    <button
                      type="button"
                      className={styles.btnAddQuestion}
                      onClick={handleAddQuestion}
                    >
                      <Plus size={15} weight="bold" />
                      Thêm câu hỏi mới
                    </button>
                  </div>

                  <div className={styles.formActions}>
                    <button type="button" className={styles.btnCancel} onClick={handleCancelCreate}>
                      Hủy bỏ
                    </button>
                    <button type="submit" className={styles.btnSave} disabled={quizQuestions.length === 0}>
                      Lưu đề thi
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedQuiz ? (
              /* SUBMISSIONS RESULTS TABLE */
              <div className={styles.submissionsView}>
                <div className={styles.submissionsHeader}>
                  <button className={styles.backBtn} onClick={() => setSelectedQuiz(null)}>
                    <ArrowLeft size={16} weight="bold" />
                    Quay lại danh sách đề thi
                  </button>
                  <h3>Bảng điểm: {selectedQuiz.title}</h3>
                </div>

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
              </div>
            ) : (
              /* QUIZZES LIST GRID */
              <div className={styles.quizzesTab}>
                <div className={styles.quizzesHeader}>
                  <h3>Đề thi trắc nghiệm trong lớp</h3>
                  <Button onClick={handleOpenCreateQuiz}>
                    <Plus size={16} weight="bold" />
                    Tạo đề thi mới
                  </Button>
                </div>

                {loadingQuizzes ? (
                  <p style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>Đang tải danh sách đề thi...</p>
                ) : quizzes.length === 0 ? (
                  <div className={styles.emptyFeed}>
                    <p>Chưa có đề thi trắc nghiệm nào được tạo trong lớp này.</p>
                  </div>
                ) : (
                  <div className={styles.quizGrid}>
                    {quizzes.map((quizItem) => (
                      <div key={quizItem._id} className={styles.quizCard}>
                        <div className={styles.quizCardHeader}>
                          <h4>{quizItem.title}</h4>
                        </div>
                        <div className={styles.quizCardMeta}>
                          <div className={styles.metaItem}>
                            <Clock size={15} />
                            <span>Thời gian: {quizItem.durationMinutes} phút</span>
                          </div>
                          <div className={styles.metaItem}>
                            <CheckCircle size={15} />
                            <span>Số câu hỏi: {quizItem.questions?.length || 0} câu</span>
                          </div>
                          <div className={styles.metaItem}>
                            <CalendarBlank size={15} />
                            <span>Ngày tạo: {new Date(quizItem.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                        <div className={styles.quizCardActions}>
                          <button
                            className={styles.btnViewSubmissions}
                            onClick={() => {
                              setSelectedQuiz(quizItem);
                              loadQuizResults(quizItem._id);
                            }}
                          >
                            <Eye size={14} />
                            Xem bảng điểm
                          </button>
                          <button
                            className={styles.btnViewSubmissions}
                            onClick={() => handleOpenEditQuiz(quizItem)}
                          >
                            <PencilSimple size={14} />
                            Chỉnh sửa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
