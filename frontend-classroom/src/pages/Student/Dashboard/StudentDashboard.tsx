import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  CheckSquare, 
  Clipboard,
  Compass,
  Flask,
  Book,
  ArrowRight,
  Star,
  Bell,
  ChatCircle,
  PaperPlaneTilt,
  CaretDown,
  CaretUp
} from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import { gradebookService } from "../../../service/gradebook.service.ts";
import { announcementService } from "../../../service/announcement.service.ts";
import type { IComment } from "../../../service/announcement.service.ts";
import styles from "./StudentDashboard.module.scss";

export default function StudentDashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Trạng thái người dùng
  const [username, setUsername] = useState<string>("Học sinh A");

  // Lớp học
  const [classrooms, setClassrooms] = useState<any[]>([]);
  
  // Chỉ số thống kê học sinh
  const [overallGPA, setOverallGPA] = useState<string>("Chưa có");
  const [attendanceRate, setAttendanceRate] = useState<number>(98);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState<number>(0);
  const [studentAnnouncements, setStudentAnnouncements] = useState<any[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);

  // Trạng thái bình luận
  const [expandedAnn, setExpandedAnn] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);


  // Tải dữ liệu từ database thật
  const loadData = async () => {
    const currentUsername = user?.name || localStorage.getItem("username") || "Học sinh A";
    setUsername(currentUsername);

    let joinedClassIds: string[] = [];
    let backendClasses: any[] = [];

    // 1. Tải danh sách lớp học thật
    try {
      const res = await classroomService.getStudentClassrooms();
      if (res && res.data) {
        backendClasses = res.data.map((c: any) => ({
          _id: c._id,
          className: c.name || c.className,
          subject: c.subject || "",
          teacherName: c.teacherId?.name || "Giáo viên",
          status: c.status
        }));
        setClassrooms(backendClasses);
        joinedClassIds = backendClasses.map((c: any) => c._id);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải thông tin lớp học từ server!");
    }

    // 2. Thiết lập thống kê mặc định (không dùng mock DB)
    setOverallGPA("Chưa có");
    setAttendanceRate(100);

    // 3. Tải danh sách bài tập thật
    let pendingCount = 0;
    const studentAssignmentsList: any[] = [];

    try {
      if (joinedClassIds.length > 0) {
        for (const classId of joinedClassIds) {
          const resAssign = await gradebookService.getAssignments(classId);
          if (resAssign && resAssign.data) {
            resAssign.data.forEach((item: any) => {
              const cls = backendClasses.find(c => c._id === classId);
              studentAssignmentsList.push({
                _id: item._id,
                title: item.title,
                description: item.description,
                deadline: item.dueDate || item.deadline,
                className: cls ? cls.className : "Lớp học",
                submission: null 
              });
              pendingCount++;
            });
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải danh sách bài tập từ server!");
    }

    setPendingAssignmentsCount(pendingCount);
    setStudentAssignments(studentAssignmentsList);

    // 4. Bảng tin thông báo
    const studentAnnouncementsList: any[] = [];
    try {
      if (joinedClassIds.length > 0) {
        for (const classId of joinedClassIds) {
          const resAnn = await announcementService.getAnnouncements(classId);
          if (resAnn && resAnn.data) {
            resAnn.data.forEach((ann: any) => {
              const cls = backendClasses.find(c => c._id === classId);
              studentAnnouncementsList.push({
                _id: ann._id,
                title: ann.type === "material" ? "Tài liệu mới" : ann.type === "reminder" ? "Lời nhắc" : "Thông báo mới",
                content: ann.content,
                createdAt: ann.createdAt,
                authorName: ann.authorId?.name || "Giáo viên",
                className: cls ? cls.className : "Lớp học",
                comments: ann.comments || [],
                type: ann.type
              });
            });
          }
        }
      }
      studentAnnouncementsList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải bảng tin lớp học từ server!");
    }
    setStudentAnnouncements(studentAnnouncementsList);
  };

  useEffect(() => {
    loadData();
  }, [username, user]);

  // Toggle mở/đóng bình luận
  const toggleExpand = (annId: string) => {
    setExpandedAnn(prev => prev === annId ? null : annId);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  // Gửi bình luận
  const handleSendComment = async (annId: string) => {
    const text = (commentTexts[annId] || "").trim();
    if (!text) return;

    setSendingComment(annId);
    try {
      const res = await announcementService.addComment(annId, text);
      if (res && res.data) {
        const comments = res.data.comments;
        // Cập nhật comments trong state
        setStudentAnnouncements(prev =>
          prev.map(ann =>
            ann._id === annId
              ? { ...ann, comments: comments || ann.comments }
              : ann
          )
        );
        setCommentTexts(prev => ({ ...prev, [annId]: "" }));
        toast.success("Đã gửi bình luận!");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi bình luận. Vui lòng thử lại!");
    } finally {
      setSendingComment(null);
    }
  };

  // Định dạng ngày tháng
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      return isoString;
    }
  };

  // Định dạng giờ phút
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')} - ${date.getDate()}/${date.getMonth() + 1}`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* 1. WELCOME BANNER GRADIENT */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <h1>Chào buổi sáng, {username}! 👋</h1>
          <p>
            Chúc mừng bạn đã hoàn thành {attendanceRate}% số buổi học tuần này. 
            Bạn có {pendingAssignmentsCount} bài tập cần hoàn thành trong hôm nay.
          </p>
        </div>
        <div className={styles.bannerActions}>
          <button 
            className={styles.btnPrimary} 
            onClick={() => {
              const section = document.getElementById("assignments-section");
              if (section) section.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Xem bài tập ngay
          </button>
          <button className={styles.btnSecondary}>Xem lịch học</button>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orangeBg}`}>
            <BookOpen size={24} weight="duotone" />
          </div>
          <span className={styles.statLabel}>Tổng số lớp học</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {classrooms.length.toString().padStart(2, '0')}
            </span>
            <span className={`${styles.statSubtext} ${styles.success}`}>
              Hoạt động
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.greenBg}`}>
            <CheckSquare size={24} weight="duotone" />
          </div>
          <span className={styles.statLabel}>Tỉ lệ chuyên cần</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {attendanceRate}%
            </span>
            <span className={`${styles.statSubtext} ${styles.success}`}>
              +2% tháng này
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.redBg}`}>
            <Clipboard size={24} weight="duotone" />
          </div>
          <span className={styles.statLabel}>Bài tập cần nộp</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {pendingAssignmentsCount.toString().padStart(2, '0')}
            </span>
            <span className={`${styles.statSubtext} ${styles.danger}`}>
              Hạn chót hôm nay
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blueBg}`}>
            <Star size={24} weight="duotone" />
          </div>
          <span className={styles.statLabel}>Điểm trung bình</span>
          <div className={styles.statBottomRow}>
            <span className={styles.statValue}>
              {overallGPA}
            </span>
            <span className={`${styles.statSubtext} ${styles.info}`}>
              {parseFloat(overallGPA) >= 8.0 ? "Xuất sắc" : parseFloat(overallGPA) >= 6.5 ? "Khá" : "Trung bình"}
            </span>
          </div>
        </div>
      </section>

      {/* 3. TWO-COLUMN LAYOUT */}
      <section className={styles.middleGrid}>
        
        {/* Left Column: Upcoming deadlines */}
        <div className={styles.deadlineSection} id="assignments-section">
          <div className={styles.deadlineHeader}>
            <h3>Hạn chót sắp tới</h3>
            <button className={styles.btnViewAll} onClick={() => navigate("/assignments")}>
              Xem tất cả
            </button>
          </div>
          <div className={styles.deadlineList}>
            {studentAssignments.length > 0 ? (
              studentAssignments.slice(0, 3).map((assign, idx) => {
                const isGraded = assign.submission?.status === "graded";
                const isSubmitted = assign.submission !== null;
                
                // Xác định icon và class dựa trên môn học
                let subjectClass = styles.defaultSub;
                let SubjectIcon = BookOpen;
                const lowerSubject = assign.className.toLowerCase() || "";
                
                if (lowerSubject.includes("toán")) {
                  subjectClass = styles.math;
                  SubjectIcon = Compass;
                } else if (lowerSubject.includes("hóa")) {
                  subjectClass = styles.chemistry;
                  SubjectIcon = Flask;
                } else if (lowerSubject.includes("văn") || lowerSubject.includes("ngữ văn")) {
                  subjectClass = styles.literature;
                  SubjectIcon = Book;
                }

                // Độ ưu tiên
                let urgencyClass = styles.medium;
                let urgencyText = "Bình thường";
                
                const timeDiff = new Date(assign.deadline).getTime() - new Date().getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                
                if (hoursDiff <= 24 && hoursDiff > 0) {
                  urgencyClass = styles.high;
                  urgencyText = "Gấp";
                } else if (idx === 0) {
                  urgencyClass = styles.high;
                  urgencyText = "Gấp";
                } else if (idx === 2) {
                  urgencyClass = styles.low;
                  urgencyText = "Mới";
                }

                return (
                  <div key={assign._id} className={styles.deadlineItem}>
                    <div className={`${styles.subjectIcon} ${subjectClass}`}>
                      <SubjectIcon size={24} weight="duotone" />
                    </div>
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemTitle}>{assign.title}</h4>
                      <span className={styles.itemMeta}>
                        {assign.className} • {formatDate(assign.deadline)}
                      </span>
                    </div>
                    <div className={styles.itemRight}>
                      <span className={`${styles.urgencyBadge} ${urgencyClass}`}>{urgencyText}</span>
                      {isGraded ? (
                        <span className={styles.gradeBadge}>Điểm: {assign.submission.grade}</span>
                      ) : isSubmitted ? (
                        <span className={styles.statusText}>Đang xử lý...</span>
                      ) : (
                        <button className={styles.actionLink} onClick={() => navigate(`/assignments/${assign._id}`)}>
                          Nộp bài <ArrowRight size={14} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div 
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 20px",
                  color: "#64748b",
                  background: "#fff",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "1px dashed #e2e8f0"
                }}
              >
                <Clipboard size={32} weight="light" style={{ marginBottom: "12px" }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>Chưa có bài tập nào được giao</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>Bạn đã hoàn thành toàn bộ bài tập của lớp học.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent activity timeline */}
        <div className={styles.activityTimeline}>
          <h3>Hoạt động gần đây</h3>
          <div className={styles.timelineWrapper}>
            {studentAnnouncements.length > 0 ? (
              studentAnnouncements.map((ann) => {
                const isExpanded = expandedAnn === ann._id;
                const commentCount = ann.comments?.length || 0;
                const dotColor =
                  ann.type === "reminder" ? styles.orange
                  : ann.type === "material" ? styles.blue
                  : styles.red;

                return (
                  <div key={ann._id} className={`${styles.timelineItem} ${isExpanded ? styles.timelineItemExpanded : ""}`}>
                    <span className={`${styles.timelineDot} ${dotColor}`}></span>
                    <div className={styles.timelineHeader}>
                      <span className={styles.author}>{ann.authorName} ({ann.className})</span>
                      <span className={styles.time}>{formatDate(ann.createdAt)}</span>
                    </div>
                    <p className={styles.timelineContent}>
                      <strong>{ann.title}</strong>: {ann.content}
                    </p>

                    {/* Nút mở rộng bình luận */}
                    <button
                      className={styles.commentToggleBtn}
                      onClick={() => toggleExpand(ann._id)}
                      aria-expanded={isExpanded}
                    >
                      <ChatCircle size={14} weight="duotone" />
                      <span>{commentCount > 0 ? `${commentCount} bình luận` : "Trả lời"}</span>
                      {isExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
                    </button>

                    {/* Khu vực bình luận mở rộng */}
                    {isExpanded && (
                      <div className={styles.commentSection}>
                        {/* Danh sách bình luận cũ */}
                        {commentCount > 0 && (
                          <div className={styles.commentList}>
                            {ann.comments.map((cmt: IComment, idx: number) => (
                              <div key={cmt._id || idx} className={styles.commentItem}>
                                <div className={styles.commentAvatar}>
                                  {(cmt.authorName || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.commentBody}>
                                  <div className={styles.commentMeta}>
                                    <span className={styles.commentAuthor}>{cmt.authorName}</span>
                                    <span className={styles.commentTime}>{formatDateTime(cmt.createdAt)}</span>
                                  </div>
                                  <p className={styles.commentText}>{cmt.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Ô nhập bình luận mới */}
                        <div className={styles.commentInputRow}>
                          <div className={styles.commentAvatar} style={{ background: "#6366f1" }}>
                            {(user?.name || "B").charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.commentInputWrapper}>
                            <textarea
                              ref={isExpanded ? commentInputRef : undefined}
                              className={styles.commentInput}
                              placeholder="Viết bình luận..."
                              value={commentTexts[ann._id] || ""}
                              rows={2}
                              onChange={e =>
                                setCommentTexts(prev => ({ ...prev, [ann._id]: e.target.value }))
                              }
                              onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendComment(ann._id);
                                }
                              }}
                            />
                            <button
                              className={styles.commentSendBtn}
                              onClick={() => handleSendComment(ann._id)}
                              disabled={sendingComment === ann._id || !(commentTexts[ann._id] || "").trim()}
                              title="Gửi (Enter)"
                            >
                              {sendingComment === ann._id ? (
                                <span className={styles.sendSpinner} />
                              ) : (
                                <PaperPlaneTilt size={16} weight="fill" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div 
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 20px",
                  color: "#64748b",
                  background: "#fff",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "1px dashed #e2e8f0"
                }}
              >
                <Bell size={32} weight="light" style={{ marginBottom: "12px" }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>Chưa có hoạt động nào</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>Các thông báo mới từ lớp học sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>

          <button className={styles.btnViewAllActivity}>
            Xem tất cả hoạt động
          </button>
        </div>
      </section>

    </div>
  );
}
