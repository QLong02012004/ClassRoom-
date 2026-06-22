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
  PencilSimple
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import { quizService } from "../../../service/quiz.service.ts";
import type { IAnnouncement } from "../../../service/announcement.service.ts";
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
  }>>([
    { questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 }
  ]);

  // State cho việc đăng bài mới
  const [postText, setPostText] = useState("");
  const [postType, setPostType] = useState<"announcement" | "reminder" | "material">("announcement");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State cho bình luận mới của từng bài đăng
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

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

  // Thích bài đăng (UI only)
  const handleLikePost = (annId: string) => {
    // Chức năng like chưa có API — bỏ qua
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
        {/* TABS 2: REPORTS VIEW */}
        {activeTab === "reports" && (
          <div className={styles.tabContentPanel}>
            <div className={styles.reportCard}>
              <h3>Báo cáo kết quả lớp học</h3>
              <p>Thống kê điểm số và tỉ lệ hoàn thành bài tập của {classroom?.className}.</p>
              <div className={styles.reportPlaceholder}>
                <div className={styles.statMetric}>
                  <span className={styles.statNum}>92%</span>
                  <span className={styles.statDesc}>Bài tập hoàn thành</span>
                </div>
                <div className={styles.statMetric}>
                  <span className={styles.statNum}>8.4</span>
                  <span className={styles.statDesc}>GPA Trung bình</span>
                </div>
                <div className={styles.statMetric}>
                  <span className={styles.statNum}>96%</span>
                  <span className={styles.statDesc}>Tỉ lệ chuyên cần</span>
                </div>
              </div>
              <button className={styles.btnSecondary} onClick={() => navigate(`/classrooms/${classId}/students`)}>
                Xem danh sách quản lý học sinh
              </button>
            </div>
          </div>
        )}

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
            {/* POST COMPOSER */}
            {userRole === "TEACHER" && (
              <div className={styles.postComposer}>
                <div className={styles.composerTop}>
                  <img src={userAvatar} alt="Avatar" className={styles.avatarMini} />
                  <textarea 
                    placeholder="Bạn muốn thông báo gì cho cả lớp hôm nay?" 
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
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

                  <div className={styles.composerActions}>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <button 
                      type="button" 
                      className={styles.toolBtn} 
                      onClick={() => fileInputRef.current?.click()}
                      title="Đính kèm tệp"
                    >
                      <Paperclip size={18} weight="bold" />
                      <span>Tệp đính kèm</span>
                    </button>

                    <button 
                      className={styles.postBtn}
                      onClick={handleCreatePost}
                      disabled={!postText.trim() || isPosting}
                    >
                      {isPosting ? "Đang đăng..." : "Đăng bài"}
                    </button>
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

                  return (
                    <div key={ann._id} className={styles.announcementCard}>
                      {/* Top Header Card */}
                      <div className={styles.cardHeader}>
                        <div className={styles.authorInfo}>
                          <img src={authorAvatar} alt="Author" className={styles.authorAvatar} />
                          <div className={styles.authorMeta}>
                            <div className={styles.authorName}>
                              <strong>{authorDisplayName}</strong> {typeText}
                            </div>
                            <div className={styles.timeMeta}>
                              {formatTime(ann.createdAt)} • {classroom?.className || "Lớp học"}
                            </div>
                          </div>
                        </div>
                        <div className={styles.headerActions}>
                          {userRole === "TEACHER" && (
                            <button 
                              className={styles.deletePostBtn}
                              onClick={() => handleDeletePost(ann._id)}
                              title="Xóa bài đăng"
                            >
                              <Trash size={16} />
                            </button>
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
                            <div key={idx} className={styles.fileAttachmentCard}>
                              <div className={styles.fileLeft}>
                                <div className={styles.pdfIconWrapper}>
                                  <FilePdf size={24} weight="fill" color="#EF4444" />
                                </div>
                                <div className={styles.fileMeta}>
                                  <span className={styles.fileName}>{file.name}</span>
                                  <span className={styles.fileSize}>{file.size} • Tài liệu đính kèm</span>
                                </div>
                              </div>
                              <a href={file.url} target="_blank" rel="noreferrer" className={styles.downloadBtn} title="Tải xuống tệp">
                                <DownloadSimple size={20} weight="bold" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className={styles.cardFooterActions}>
                        <button className={styles.actionBtn}>
                          <ChatCircle size={18} weight="bold" />
                          <span>{ann.comments.length} bình luận</span>
                        </button>
                        <button className={styles.actionBtn}>
                          <ShareNetwork size={18} weight="bold" />
                          <span>Chia sẻ</span>
                        </button>
                      </div>

                      {/* Comments section */}
                      <div className={styles.commentsSection}>
                        {ann.comments.length > 0 && (
                          <div className={styles.commentsList}>
                            {ann.comments.map((comment, idx) => {
                              const commentAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=3b82f6&color=fff&bold=true`;
                              return (
                                <div key={comment._id || idx} className={styles.commentItem}>
                                  <img src={commentAvatar} alt="Comment Author" className={styles.commentAvatar} />
                                  <div className={styles.commentContentWrapper}>
                                    <div className={styles.commentBubble}>
                                      <span className={styles.commentAuthor}>{comment.authorName}</span>
                                      <p className={styles.commentText}>{comment.content}</p>
                                    </div>
                                    <div className={styles.commentMeta}>
                                      <button className={styles.commentAction}>Thích</button>
                                      <span className={styles.bullet}>•</span>
                                      <button className={styles.commentAction}>Phản hồi</button>
                                      {comment.createdAt && (
                                        <>
                                          <span className={styles.bullet}>•</span>
                                          <span className={styles.commentTime}>{formatTime(comment.createdAt)}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Quick Reply Form */}
                        <div className={styles.quickReplyForm}>
                          <img src={userAvatar} alt="User Avatar" className={styles.replyAvatar} />
                          <div className={styles.replyInputWrapper}>
                            <input 
                              type="text" 
                              placeholder="Viết phản hồi nhanh..."
                              value={commentInputs[ann._id] || ""}
                              onChange={(e) => setCommentInputs({
                                ...commentInputs,
                                [ann._id]: e.target.value
                              })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddComment(ann._id);
                                }
                              }}
                            />
                            <button 
                              className={styles.sendReplyBtn}
                              onClick={() => handleAddComment(ann._id)}
                              disabled={sendingComment === ann._id || !(commentInputs[ann._id] || "").trim()}
                            >
                              <PaperPlaneRight size={16} weight="fill" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyFeed}>
                  <p>Chưa có bài đăng nào trong lớp học này.</p>
                </div>
              )}
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
                      <div key={qIndex} className={styles.questionBuilderCard}>
                        <div className={styles.questionHeaderRow}>
                          <span>CÂU HỎI {qIndex + 1}</span>
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
                          <label htmlFor={`q-${qIndex}-text`}>Nội dung câu hỏi</label>
                          <textarea
                            id={`q-${qIndex}-text`}
                            placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                            value={q.questionText}
                            onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                            rows={2}
                            required
                          />
                        </div>

                        <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "8px" }}>
                          Các phương án trả lời và tích chọn đáp án đúng
                        </label>
                        <div className={styles.optionsGrid}>
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className={styles.optionInputGroup}>
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
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.formActions}>
                    <button type="button" className={styles.btnCancel} onClick={handleCancelCreate}>
                      Hủy bỏ
                    </button>
                    <button 
                      type="button" 
                      className={styles.btnPrimary} 
                      onClick={handleAddQuestion}
                    >
                      <Plus size={16} weight="bold" />
                      Thêm câu hỏi
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
                  <button className={styles.btnPrimary} onClick={handleOpenCreateQuiz}>
                    <Plus size={16} weight="bold" />
                    Tạo đề thi mới
                  </button>
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
