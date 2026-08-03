import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  CalendarBlank,
  FilePdf,
  FileDoc,
  CloudArrowUp,
  Clock,
  CheckCircle,
  UploadSimple,
  X,
  Bell,
  Info,
  ChatTeardropText,
  PaperPlaneRight
} from "phosphor-react";
import { BackButton } from "../../../components/ui/Buttons/BackButton.tsx";
import AnimatedSendButton from "../../../components/ui/Buttons/AnimatedSendButton.tsx";
import { gradebookService } from "../../../service/gradebook.service.ts";
import { classroomService } from "../../../service/classroom.service.ts";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import styles from "./AssignmentDetail.module.scss";

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignment, setAssignment] = useState<any | null>(null);
  const [className, setClassName] = useState("");
  const [teacherName, setTeacherName] = useState("Thầy/Cô giáo");
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mySubmission, setMySubmission] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !assignment) return;
    setIsSendingComment(true);
    try {
      await gradebookService.addComment(assignment._id, newComment);
      setNewComment("");
      loadData();
    } catch (err) {
      toast.error("Lỗi khi gửi bình luận");
    } finally {
      setIsSendingComment(false);
    }
  };

  const loadData = async () => {
    if (!id) return;
    try {
      const assignRes = await gradebookService.getAssignmentDetail(id);
      const assignData: any = assignRes?.data || assignRes;
      if (assignData && assignData._id) {
        const mappedAssign = {
          ...assignData,
          deadline: assignData.dueDate || (assignData as any).deadline
        };
        setAssignment(mappedAssign as any);

        const classRes = await classroomService.getClassroomDetail(assignData.classId);
        if (classRes && classRes.data) {
          setClassName(classRes.data.name);
          setTeacherName((classRes.data.teacherId as any)?.name || "Giáo viên");
        }
      }

      const subRes = await gradebookService.getMySubmission(id);
      if (subRes && subRes.data) {
        setMySubmission(subRes.data);
      } else {
        setMySubmission(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải chi tiết bài tập!");
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}, Thứ ${d.getDay() === 0 ? "Chủ nhật" : `${d.getDay() + 1}`
      }, ${d.getDate()} Tháng ${d.getMonth() + 1}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    if (!selectedFile && !note.trim()) {
      toast.error("Vui lòng đính kèm file hoặc nhập ghi chú trước khi nộp!");
      return;
    }

    setIsSubmitting(true);
    try {
      const attachments = selectedFile ? [{
        name: selectedFile.name,
        url: URL.createObjectURL(selectedFile),
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
      }] : [];

      await gradebookService.submitAssignment(assignment._id, {
        submissionText: note,
        attachments
      });

      toast.success("Nộp bài thành công! 🎉", 3000);
      setIsResubmitting(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Gặp lỗi khi nộp bài tập!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Đang tải thông tin bài tập...</p>
      </div>
    );
  }

  const isGraded = mySubmission?.status === "graded";
  const isSubmitted = mySubmission !== null;
  const isPastDeadline = new Date(assignment.deadline).getTime() < Date.now();

  return (
    <div className={styles.page}>
      {/* TOP HEADER */}
      <div className={styles.topHeader}>
        <BackButton onClick={() => navigate(-1)}>QUAY LẠI</BackButton>
      </div>

      <div className={styles.layout}>
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          <div className={styles.assignmentCard}>
            {/* Class + Status */}
            <div className={styles.cardTopRow}>
              <span className={styles.subjectTag}>{className.toUpperCase()}</span>
              <span className={`${styles.statusBadge} ${isGraded ? styles.graded : isSubmitted ? styles.submitted : isPastDeadline ? styles.late : styles.pending}`}>
                {isGraded ? "Đã chấm điểm" : isSubmitted ? "Đã nộp bài" : isPastDeadline ? "Quá hạn" : <><Clock size={14} weight="bold" className={styles.statusIcon} /> Đang chờ nộp</>}
              </span>
            </div>

            <h1 className={styles.assignmentTitle}>{assignment.title}</h1>

            {/* Meta info */}
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <div className={`${styles.iconWrapper} ${styles.redIcon}`}>
                  <User size={18} weight="bold" />
                </div>
                <div>
                  <span className={styles.metaLabel}>Giáo viên hướng dẫn</span>
                  <span className={styles.metaValue}>{teacherName}</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <div className={`${styles.iconWrapper} ${styles.blueIcon}`}>
                  <CalendarBlank size={18} weight="bold" />
                </div>
                <div>
                  <span className={styles.metaLabel}>Hạn chót nộp bài</span>
                  <span className={styles.metaValue}>{formatDate(assignment.deadline)}</span>
                </div>
              </div>
            </div>

            <hr className={styles.divider} />

            {/* Description */}
            <h4 className={styles.sectionLabel}>Mô tả bài tập</h4>
            <p className={styles.description}>{assignment.description}</p>

            {assignment.type === 'quiz' ? (
              <ul className={styles.requirementsList}>
                <li>Loại bài: Trắc nghiệm trực tuyến.</li>
                <li>Thời gian làm bài: {assignment.durationMinutes || assignment.bankItemId?.durationMinutes || 15} phút.</li>
                <li>Số câu hỏi: {assignment.bankItemId?.quizQuestions?.length || 0} câu.</li>
                <li>Lưu ý: Không thể tạm dừng khi đã bắt đầu làm bài. Điểm số sẽ được ghi nhận ngay sau khi nộp.</li>
              </ul>
            ) : (
              <ul className={styles.requirementsList}>
                <li>Trình bày chi tiết, rõ ràng các bước giải.</li>
                <li>Định dạng: File PDF hoặc Word (.docx).</li>
                <li>Lưu ý: Không sao chép, ưu tiên cách giải sáng tạo của bản thân.</li>
              </ul>
            )}

            {/* Attachments */}
            {assignment.bankItemId?.fileUrl && (
              <>
                <h4 className={styles.sectionLabel} style={{ marginTop: 24 }}>
                  <FilePdf size={20} weight="fill" className="text-[#2f8fa3]" />
                  Tài liệu đính kèm
                </h4>
                <div className={styles.attachmentsRow}>
                  <div className={styles.attachFile} onClick={() => window.open(assignment.bankItemId.fileUrl, "_blank")}>
                    <div className={`${styles.fileIconWrapper} ${assignment.bankItemId.fileUrl.endsWith('.pdf') ? styles.pdfBg : styles.docBg}`}>
                      {assignment.bankItemId.fileUrl.endsWith('.pdf') ? (
                        <FilePdf size={22} weight="fill" className={styles.pdfIcon} />
                      ) : (
                        <FileDoc size={22} weight="fill" className={styles.docIcon} />
                      )}
                    </div>
                    <div>
                      <span className={styles.fileName}>
                        {assignment.bankItemId.fileUrl.split('/').pop() || "Tai-lieu-dinh-kem"}
                      </span>
                      <span className={styles.fileSize}>Tài liệu môn học</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Comments Section */}
            <hr className={styles.divider} style={{ marginTop: 32 }} />
            <h4 className={styles.sectionLabel}>
              <ChatTeardropText size={22} weight="fill" className="text-[#f47c20]" />
              Thảo luận với Giáo viên
            </h4>
            <div className={styles.commentsContainer}>
              {(mySubmission?.comments || []).map((c: any, i: number) => (
                <div key={i} className={`${styles.commentBubble} ${c.isTeacher ? styles.teacherBubble : styles.studentBubble}`}>
                  <div className={styles.commentAvatar}>
                    <User size={16} weight="bold" />
                  </div>
                  <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentName}>{c.isTeacher ? c.name || teacherName : "Tôi"}</span>
                      <span className={styles.commentTime}>{formatRelativeTime(c.createdAt)}</span>
                    </div>
                    <p className={styles.commentText}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.commentInputWrapper}>
              <input
                type="text"
                placeholder="Nhắn tin cho giáo viên (không cần qua Zalo)..."
                className={styles.commentInput}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendComment();
                }}
                disabled={isSendingComment}
              />
              <button
                className={styles.sendCommentBtn}
                onClick={handleSendComment}
                disabled={isSendingComment || !newComment.trim()}
                style={{ opacity: (!newComment.trim() || isSendingComment) ? 0.5 : 1 }}
              >
                <PaperPlaneRight size={18} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>
          {/* Submission Box */}
          <div className={styles.submissionCard}>
            <h3 className={styles.submissionTitle}>
              <CloudArrowUp size={20} weight="bold" />
              Nộp bài của bạn
            </h3>

            {isGraded ? (
              <div className={styles.gradedBox}>
                <CheckCircle size={40} weight="fill" className={styles.checkIcon} />
                <p className={styles.gradedScore}>Điểm: <strong>{mySubmission.grade}/10</strong></p>
                {assignment.type === 'quiz' && (
                  <AnimatedSendButton
                    onClick={() => navigate(`/exams/${assignment._id}`)}
                    text="Xem chi tiết bài làm"
                    className="w-full"
                  />
                )}
                {mySubmission.feedback && (
                  <p className={styles.feedback}>💬 &ldquo;{mySubmission.feedback}&rdquo;</p>
                )}
              </div>
            ) : (isSubmitted && !isResubmitting) ? (
              <div className={styles.submittedBox}>
                <CheckCircle size={32} weight="fill" style={{ color: "#10B981" }} />
                <p>Đã nộp lúc {new Date(mySubmission.submittedAt).toLocaleString("vi-VN")}</p>
                <p className={styles.subNote}>Đang chờ giáo viên chấm điểm...</p>
                {assignment.allowMultipleSubmissions !== false && !isPastDeadline && (
                  <button className={styles.resubmitBtn} onClick={() => setIsResubmitting(true)}>Nộp lại bài</button>
                )}
              </div>
            ) : assignment.type === 'quiz' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.5 }}>
                  Đây là bài tập trắc nghiệm tính giờ. Hãy đảm bảo bạn có kết nối mạng ổn định trước khi bắt đầu.
                </p>
                <AnimatedSendButton
                  onClick={() => navigate(`/exams/${assignment._id}`)}
                  text="Bắt đầu làm bài"
                  className="w-full"
                />
              </div>
            ) : (
              <>
                {/* Drag & Drop area */}
                <div
                  className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <div className={styles.selectedFile}>
                      <FilePdf size={28} weight="fill" className="text-[#EF4444]" />
                      <span>{selectedFile.name}</span>
                      <button
                        className={styles.removeFile}
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.uploadIconContainer}>
                        <UploadSimple size={24} weight="bold" className={styles.uploadIcon} />
                      </div>
                      <p className={styles.dropText}>Kéo và thả file vào đây</p>
                      <p className={styles.dropSubText}>Hoặc nhấn để chọn từ máy tính</p>
                    </>
                  )}
                </div>

                {/* Note */}
                <label className={styles.noteLabel}>Ghi chú cho giáo viên</label>
                <textarea
                  className={styles.noteArea}
                  placeholder="Nhập lời nhắn hoặc lưu ý cho giáo viên..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />

                {/* Submit button using AnimatedSendButton */}
                <AnimatedSendButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  text={isSubmitting ? "Đang nộp bài..." : "Nộp bài tập ngay"}
                  className="w-full"
                />
                <div className={styles.editNoteContainer}>
                  <Info size={16} className={styles.infoIcon} />
                  <p className={styles.editNote}>
                    Bạn có thể chỉnh sửa bài nộp trước thời hạn chót.
                  </p>
                </div>
                {isResubmitting && (
                  <button className={styles.cancelResubmitBtn} onClick={() => setIsResubmitting(false)}>Hủy nộp lại</button>
                )}
              </>
            )}
          </div>

          {/* Submission History */}
          {mySubmission?.history?.length > 0 && (
            <div className={styles.historyCard}>
              <h4 className={styles.activityTitle}>LỊCH SỬ NỘP</h4>
              <div className={styles.historyTimeline}>
                {mySubmission.history.map((h: any, i: number) => (
                  <div key={i} className={styles.historyItem}>
                    <div className={styles.historyDot} />
                    <div className={styles.historyContent}>
                      <span className={styles.historyLabel}>Lần {i + 1}</span>
                      <span className={styles.historyDate}>{new Date(h.submittedAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
                <div className={styles.historyItem}>
                  <div className={`${styles.historyDot} ${styles.historyDotActive}`} />
                  <div className={styles.historyContent}>
                    <span className={styles.historyLabel}>Lần cuối</span>
                    <span className={styles.historyDate}>{new Date(mySubmission.submittedAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div className={styles.activityCard}>
            <h4 className={styles.activityTitle}>LỊCH SỬ HOẠT ĐỘNG</h4>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={`${styles.actIconWrapper} ${styles.orangeBg}`}>
                  <Bell size={14} weight="fill" color="white" />
                </div>
                <div>
                  <p className={styles.actText}>Bài tập đã được giao</p>
                  <span className={styles.actTime}>
                    {formatRelativeTime(assignment.createdAt)} • {new Date(assignment.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {isSubmitted && (
                <div className={styles.activityItem}>
                  <div className={`${styles.actIconWrapper} ${styles.greenBg}`}>
                    <CheckCircle size={14} weight="fill" color="white" />
                  </div>
                  <div>
                    <p className={styles.actText}>Bạn đã nộp bài</p>
                    <span className={styles.actTime}>
                      {formatRelativeTime(mySubmission.submittedAt)} • {new Date(mySubmission.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              )}

              {isGraded && (
                <div className={styles.activityItem}>
                  <div className={`${styles.actIconWrapper} ${styles.blueBg}`}>
                    <CheckCircle size={14} weight="fill" color="white" />
                  </div>
                  <div>
                    <p className={styles.actText}>Giáo viên đã chấm điểm</p>
                    <span className={styles.actTime}>
                      Điểm: {mySubmission.grade}/10
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
