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
  Info
} from "phosphor-react";
import { BackButton } from "../../../components/ui/Buttons/BackButton.tsx";
import AnimatedSendButton from "../../../components/ui/Buttons/AnimatedSendButton.tsx";
import { gradebookService } from "../../../service/gradebook.service.ts";
import { classroomService } from "../../../service/classroom.service.ts";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { io } from "socket.io-client";
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mySubmission, setMySubmission] = useState<any>(null);
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

    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true });

    socket.on("submission_update", (data?: { assignmentId?: string }) => {
      if (!data?.assignmentId || data.assignmentId === id) {
        console.log("⚡ [Socket.io Realtime] Cập nhật bài nộp/điểm số từ giáo viên...");
        loadData();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, loadData]);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}, Thứ ${d.getDay() === 0 ? "Chủ nhật" : `${d.getDay() + 1}`
      }, ${d.getDate()} Tháng ${d.getMonth() + 1}`;
  };

  const formatShortDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    return `${time} - ${date}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    if (e.target) e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    if (selectedFiles.length === 0 && !note.trim()) {
      toast.error("Vui lòng đính kèm ít nhất 1 file hoặc nhập ghi chú trước khi nộp!");
      return;
    }

    setIsSubmitting(true);
    try {
      const attachments = selectedFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      }));

      await gradebookService.submitAssignment(assignment._id, {
        submissionText: note,
        attachments
      });

      toast.success("Nộp bài thành công! 🎉", 3000);
      setSelectedFiles([]);
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

            {/* Meta info: Giáo viên + Hạn chót + Lịch sử hoạt động */}
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

              <div className={styles.metaItem}>
                <div className={`${styles.iconWrapper} ${styles.orangeIcon}`}>
                  <Bell size={18} weight="bold" />
                </div>
                <div>
                  <span className={styles.metaLabel}>Lịch sử hoạt động</span>
                  <span className={styles.metaValue}>
                    Đã giao: {formatShortDate(assignment.createdAt)}
                  </span>
                  {isSubmitted && (
                    <span className={styles.metaSubValue}>
                      {isGraded ? `Đã chấm: ${mySubmission.grade}/10` : `Đã nộp ${formatRelativeTime(mySubmission.submittedAt)}`}
                    </span>
                  )}
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
                {mySubmission.attachments && mySubmission.attachments.length > 0 && (
                  <div className={styles.submittedFilesList}>
                    <p className={styles.submittedFilesTitle}>Các file đã nộp ({mySubmission.attachments.length}):</p>
                    {mySubmission.attachments.map((att: any, idx: number) => (
                      <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className={styles.submittedFileItem}>
                        <FilePdf size={18} weight="fill" className="text-[#EF4444]" />
                        <span className={styles.submittedFileName}>{att.name}</span>
                        {att.size && <span className={styles.submittedFileSize}>{att.size}</span>}
                      </a>
                    ))}
                  </div>
                )}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar"
                  onChange={handleFileChange}
                />

                {/* Drag & Drop area */}
                <div
                  className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={styles.uploadIconContainer}>
                    <UploadSimple size={24} weight="bold" className={styles.uploadIcon} />
                  </div>
                  <p className={styles.dropText}>Kéo và thả file vào đây</p>
                  <p className={styles.dropSubText}>Có thể chọn nhiều file cùng lúc (PDF, Word, Ảnh, Zip...)</p>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className={styles.fileListContainer}>
                    <div className={styles.fileListHeader}>
                      <span>File đã chọn ({selectedFiles.length})</span>
                      <button
                        type="button"
                        className={styles.addMoreFilesBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        + Thêm file
                      </button>
                    </div>
                    <div className={styles.fileItemsList}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className={styles.selectedFileItem}>
                          <div className={styles.fileItemInfo}>
                            {file.name.endsWith('.pdf') ? (
                              <FilePdf size={22} weight="fill" className="text-[#EF4444] flex-shrink-0" />
                            ) : file.name.endsWith('.doc') || file.name.endsWith('.docx') ? (
                              <FileDoc size={22} weight="fill" className="text-[#2f8fa3] flex-shrink-0" />
                            ) : (
                              <CloudArrowUp size={22} weight="bold" className="text-[#f47c20] flex-shrink-0" />
                            )}
                            <div className={styles.fileItemDetails}>
                              <span className={styles.fileItemName} title={file.name}>{file.name}</span>
                              <span className={styles.fileItemSize}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.removeFile}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(idx);
                            }}
                            title="Xóa file này"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                  text={isSubmitting ? "Đang nộp bài..." : selectedFiles.length > 1 ? `Nộp ${selectedFiles.length} file ngay` : "Nộp bài tập ngay"}
                  className="w-full"
                />
                <div className={styles.editNoteContainer}>
                  <Info size={16} className={styles.infoIcon} />
                  <p className={styles.editNote}>
                    Bạn có thể chọn nhiều file và chỉnh sửa trước thời hạn chót.
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
        </div>
      </div>
    </div>
  );
}
