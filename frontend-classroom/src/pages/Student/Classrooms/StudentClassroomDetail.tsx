import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  X
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import { gradebookService } from "../../../service/gradebook.service.ts";
import { quizService } from "../../../service/quiz.service.ts";
import type { IAnnouncement } from "../../../service/announcement.service.ts";
import FolderFileCard from "../../../components/ui/FolderUpload/FolderFileCard";
import styles from "./StudentClassroomDetail.module.scss";

export default function StudentClassroomDetail() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "feed") as "feed" | "assignments" | "members" | "quizzes";
  const toast = useToast();
  const { user } = useAuth();

  const [classroom, setClassroom] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(quizzes.length / itemsPerPage);
  const currentQuizzes = quizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [filterType, setFilterType] = useState<"all" | "announcement" | "reminder" | "material">("all");

  // Bình luận
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);
  const [likedAnns, setLikedAnns] = useState<Record<string, boolean>>({});
  const [showReplyBox, setShowReplyBox] = useState<Record<string, boolean>>({});

  const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "H")}&background=3b82f6&color=fff&bold=true`;

  const loadData = async () => {
    if (!classId) return;

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

    // Tải bài tập
    try {
      const assignRes = await gradebookService.getAssignments(classId);
      if (assignRes && assignRes.data) setAssignments(assignRes.data);
    } catch (_) {}

    // Tải bài trắc nghiệm
    try {
      const quizRes = await quizService.getQuizzes(classId);
      if (quizRes && quizRes.data) setQuizzes(quizRes.data);
    } catch (_) {}
  };

  useEffect(() => { loadData(); }, [classId]);

  // Gửi bình luận
  const handleAddComment = async (annId: string) => {
    const content = (commentInputs[annId] || "").trim();
    if (!content) return;
    setSendingComment(annId);
    try {
      const res = await announcementService.addComment(annId, content);
      if (res && res.data) {
        const comments = res.data.comments;
        setAnnouncements(prev =>
          prev.map(ann => ann._id === annId ? { ...ann, comments } : ann)
        );
        setCommentInputs(prev => ({ ...prev, [annId]: "" }));
        toast.success("Đã gửi bình luận!");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi bình luận!");
    } finally {
      setSendingComment(null);
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
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate("/classrooms")}>
          <ArrowLeft size={18} weight="bold" />
          Quay lại
        </button>
        <div className={styles.classInfo}>
          <h2>{classroom?.name || "Lớp học"}</h2>
          <span>{classroom?.subject || ""}</span>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === "feed" ? styles.tabActive : ""}`}
          onClick={() => navigate(`/classrooms/${classId}?tab=feed`)}
        >
          <Megaphone size={16} weight="duotone" /> Bảng tin
        </button>
        <button
          className={`${styles.tab} ${activeTab === "assignments" ? styles.tabActive : ""}`}
          onClick={() => navigate(`/classrooms/${classId}?tab=assignments`)}
        >
          <ClipboardText size={16} weight="duotone" /> Bài tập ({assignments.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "quizzes" ? styles.tabActive : ""}`}
          onClick={() => navigate(`/classrooms/${classId}?tab=quizzes`)}
        >
          <GridFour size={16} weight="duotone" /> Trắc nghiệm ({quizzes.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "members" ? styles.tabActive : ""}`}
          onClick={() => navigate(`/classrooms/${classId}?tab=members`)}
        >
          <Users size={16} weight="duotone" /> Thành viên
        </button>
      </div>

      <div className={styles.body}>
        {/* ===== TAB: BẢNG TIN ===== */}
        {activeTab === "feed" && (
          <div className={styles.feedLayout}>
            {/* Sidebar trái: thông tin lớp */}
            <aside className={styles.sidebar}>
              <div className={styles.sideCard}>
                <h4>Thông tin lớp</h4>
                <div className={styles.infoRow}>
                  <Users size={15} weight="duotone" />
                  <span>Giáo viên: <strong>{classroom?.teacherId?.name || "—"}</strong></span>
                </div>
                <div className={styles.infoRow}>
                  <BookOpen size={15} weight="duotone" />
                  <span>Môn học: <strong>{classroom?.subject || "—"}</strong></span>
                </div>
                <div className={styles.infoRow}>
                  <ClipboardText size={15} weight="duotone" />
                  <span>Mã lớp: <strong>{classroom?.code || "—"}</strong></span>
                </div>
                <div className={styles.infoRow}>
                  <Users size={15} weight="duotone" />
                  <span>Sĩ số: <strong>{classroom?.students?.length || 0} học sinh</strong></span>
                </div>
              </div>

              {/* Bài tập sắp hết hạn */}
              {assignments.length > 0 && (
                <div className={styles.sideCard}>
                  <h4>Bài tập sắp tới</h4>
                  {assignments.slice(0, 3).map((a: any) => {
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
              {/* Filter chips */}
              <div className={styles.filterChips}>
                {(["all", "announcement", "reminder", "material"] as const).map(t => (
                  <button
                    key={t}
                    className={`${styles.chip} ${filterType === t ? styles.chipActive : ""}`}
                    onClick={() => setFilterType(t)}
                  >
                    {t === "all" ? "Tất cả" : t === "announcement" ? "Thông báo" : t === "reminder" ? "Nhắc nhở" : "Tài liệu"}
                  </button>
                ))}
              </div>

              {/* Danh sách bài đăng */}
              {filteredAnn.length > 0 ? filteredAnn.map(ann => {
                const authorName = ann.authorId?.name || "Giáo viên";
                const authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=FE6747&color=fff&bold=true`;
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

                    {/* Nội dung */}
                    <p className={styles.annContent}>{ann.content}</p>

                    {/* Tệp đính kèm */}
                    {ann.attachments && ann.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              }) : (
                <div className={styles.emptyFeed}>
                  <Bell size={36} weight="light" />
                  <p>Chưa có bài đăng nào trong lớp học này.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB: BÀI TẬP ===== */}
        {activeTab === "assignments" && (
          <div className={styles.assignmentsTab}>
            {assignments.length > 0 ? assignments.map((a: any) => {
              const urg = deadlineUrgency(a.dueDate || a.deadline);
              return (
                <div key={a._id} className={styles.assignCard}>
                  <div className={styles.assignLeft}>
                    <div className={styles.assignIcon}>
                      <ClipboardText size={22} weight="duotone" />
                    </div>
                    <div className={styles.assignInfo}>
                      <h4>{a.title}</h4>
                      <p>{a.description || "Không có mô tả"}</p>
                      <span className={styles.assignDeadline}>
                        <CalendarBlank size={13} /> Hạn nộp: {formatDate(a.dueDate || a.deadline)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.assignRight}>
                    <span className={`${styles.urgencyBadge} ${urg.cls}`}>{urg.text}</span>
                    <button
                      className={styles.submitBtn}
                      onClick={() => navigate(`/assignments/${a._id}`)}
                    >
                      Làm bài
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className={styles.emptyFeed}>
                <ClipboardText size={36} weight="light" />
                <p>Chưa có bài tập nào được giao.</p>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: THÀNH VIÊN ===== */}
        {activeTab === "members" && (
          <div className={styles.membersTab}>
            {/* Giáo viên */}
            {classroom?.teacherId && (
              <div className={styles.memberSection}>
                <h4>Giáo viên</h4>
                <div className={styles.memberCard}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(classroom.teacherId.name || "GV")}&background=FE6747&color=fff&bold=true`}
                    alt=""
                    className={styles.memberAvatar}
                  />
                  <div>
                    <p className={styles.memberName}>{classroom.teacherId.name}</p>
                    <p className={styles.memberRole}>Giáo viên phụ trách</p>
                  </div>
                </div>
              </div>
            )}

            {/* Học sinh */}
            <div className={styles.memberSection}>
              <h4>Học sinh ({classroom?.students?.length || 0})</h4>
              <div className={styles.memberGrid}>
                {(classroom?.students || []).map((s: any, i: number) => {
                  const sName = s.name || s.userId?.name || `Học sinh ${i + 1}`;
                  return (
                    <div key={s._id || i} className={styles.memberCard}>
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sName)}&background=6366f1&color=fff&bold=true`}
                        alt=""
                        className={styles.memberAvatar}
                      />
                      <div>
                        <p className={styles.memberName}>{sName}</p>
                        <p className={styles.memberRole}>Học sinh</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: TRẮC NGHIỆM ===== */}
        {activeTab === "quizzes" && (
          <div className={styles.assignmentsTab}>
            {quizzes.length > 0 ? (
              <>
                {currentQuizzes.map((q: any) => {
              const hasResult = q.result !== null && q.result !== undefined;
              return (
                <div key={q._id} className={styles.assignCard}>
                  <div className={styles.assignLeft}>
                    <div className={styles.assignIcon} style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                      <Clock size={22} weight="duotone" />
                    </div>
                    <div className={styles.assignInfo}>
                      <h4>{q.title}</h4>
                      <p>Thời gian: {q.durationMinutes} phút • Số câu hỏi: {q.questions?.length || 0} câu</p>
                      {hasResult && (
                        <span className={styles.assignDeadline} style={{ color: '#10b981', fontWeight: 600 }}>
                          Điểm thi: {q.result.score}/10 (Nộp lúc {new Date(q.result.submittedAt).toLocaleDateString('vi-VN')})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.assignRight}>
                    {hasResult ? (
                      <button
                        className={styles.submitBtn}
                        style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0' }}
                        onClick={() => navigate(`/exams/${q._id}`)}
                      >
                        Xem kết quả
                      </button>
                    ) : (
                      <button
                        className={styles.submitBtn}
                        onClick={() => navigate(`/exams/${q._id}`)}
                      >
                        Làm bài thi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className={styles.paginationControls}>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      disabled={currentPage === 1}
                      className={styles.pageBtn}
                    >
                      Trước
                    </button>
                    <span className={styles.pageInfo}>
                      Trang {currentPage} / {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                      disabled={currentPage === totalPages}
                      className={styles.pageBtn}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyFeed}>
                <Clock size={36} weight="light" />
                <p>Chưa có đề thi trắc nghiệm nào được giao.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
