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
  GridFour
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import { gradebookService } from "../../../service/gradebook.service.ts";
import { quizService } from "../../../service/quiz.service.ts";
import type { IAnnouncement } from "../../../service/announcement.service.ts";
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
  const [filterType, setFilterType] = useState<"all" | "announcement" | "reminder" | "material">("all");

  // Bình luận
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);

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
  );

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
                        </div>
                        <span className={styles.annTime}>{formatTime(ann.createdAt)}</span>
                      </div>
                    </div>

                    {/* Nội dung */}
                    <p className={styles.annContent}>{ann.content}</p>

                    {/* Tệp đính kèm */}
                    {ann.attachments && ann.attachments.length > 0 && (
                      <div className={styles.attachList}>
                        {ann.attachments.map((f, i) => (
                          <a key={i} href={f.url} target="_blank" rel="noreferrer" className={styles.attachItem}>
                            <FilePdf size={20} weight="fill" color="#EF4444" />
                            <div>
                              <p className={styles.attachName}>{f.name}</p>
                              <p className={styles.attachSize}>{f.size}</p>
                            </div>
                            <DownloadSimple size={18} className={styles.dlIcon} />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Bình luận */}
                    <div className={styles.commentsWrap}>
                      <div className={styles.commentsCount}>
                        <ChatCircle size={14} weight="duotone" />
                        {ann.comments.length > 0 ? `${ann.comments.length} bình luận` : "Chưa có bình luận"}
                      </div>

                      {ann.comments.length > 0 && (
                        <div className={styles.commentsList}>
                          {ann.comments.map((c, i) => {
                            const cav = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.authorName)}&background=6366f1&color=fff&bold=true`;
                            return (
                              <div key={c._id || i} className={styles.commentItem}>
                                <img src={cav} alt="" className={styles.cAvatar} />
                                <div className={styles.cBubble}>
                                  <span className={styles.cName}>{c.authorName}</span>
                                  <p className={styles.cText}>{c.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Ô nhập bình luận */}
                      <div className={styles.replyRow}>
                        <img src={userAvatar} alt="" className={styles.cAvatar} />
                        <div className={styles.replyInputWrap}>
                          <input
                            type="text"
                            placeholder="Viết phản hồi..."
                            value={commentInputs[ann._id] || ""}
                            onChange={e => setCommentInputs(p => ({ ...p, [ann._id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") handleAddComment(ann._id); }}
                          />
                          <button
                            className={styles.sendBtn}
                            onClick={() => handleAddComment(ann._id)}
                            disabled={sendingComment === ann._id || !(commentInputs[ann._id] || "").trim()}
                          >
                            <PaperPlaneRight size={15} weight="fill" />
                          </button>
                        </div>
                      </div>
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
            {quizzes.length > 0 ? quizzes.map((q: any) => {
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
            }) : (
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
