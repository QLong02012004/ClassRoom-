import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  CalendarBlank,
  FilePdf,
  FileDoc,
  CloudArrowUp,
  PaperPlaneTilt,
  Clock,
  CheckCircle,
  UploadSimple,
  X,
  Bell,
  Eye,
  Info
} from "phosphor-react";
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

  const loadData = async () => {
    if (!id) return;
    try {
      const assignRes = await gradebookService.getAssignmentDetail(id);
      if (assignRes && assignRes.data) {
        const assignData = assignRes.data;
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
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}, Thứ ${
      d.getDay() === 0 ? "Chủ nhật" : `${d.getDay() + 1}`
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
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} weight="bold" />
        </button>
        <h2>Chi tiết bài tập</h2>
      </div>

      <div className={styles.layout}>
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          <div className={styles.assignmentCard}>
            {/* Class + Status */}
            <div className={styles.cardTopRow}>
              <span className={styles.subjectTag}>{className.toUpperCase()} - CHUYÊN ĐỀ THƠ VIỆT NAM</span>
              <span className={`${styles.statusBadge} ${isGraded ? styles.graded : isSubmitted ? styles.submitted : isPastDeadline ? styles.late : styles.pending}`}>
                {isGraded ? "✅ Đã chấm điểm" : isSubmitted ? "📤 Đã nộp bài" : isPastDeadline ? "❌ Quá hạn" : <><Clock size={14} weight="bold" className={styles.statusIcon}/> Đang chờ nộp</>}
              </span>
            </div>

            <h1 className={styles.assignmentTitle}>{assignment.title}</h1>

            {/* Meta info */}
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <div className={`${styles.iconWrapper} ${styles.redIcon}`}>
                  <User size={18} weight="fill" />
                </div>
                <div>
                  <span className={styles.metaLabel}>Giáo viên hướng dẫn</span>
                  <span className={styles.metaValue}>{teacherName}</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <div className={`${styles.iconWrapper} ${styles.redIcon}`}>
                  <CalendarBlank size={18} weight="fill" />
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

            <ul className={styles.requirementsList}>
              <li>Trình bày chi tiết, rõ ràng các bước giải.</li>
              <li>Định dạng: File PDF hoặc Word (.docx).</li>
              <li>Lưu ý: Không sao chép, ưu tiên cách giải sáng tạo của bản thân.</li>
            </ul>

            {/* Attachments */}
            <h4 className={styles.sectionLabel} style={{ marginTop: 24 }}>
              <FilePdf size={20} weight="fill" style={{ color: "#EF4444" }} />
              Tài liệu đính kèm
            </h4>
            <div className={styles.attachmentsRow}>
              <div className={styles.attachFile}>
                <div className={`${styles.fileIconWrapper} ${styles.pdfBg}`}>
                  <FilePdf size={22} weight="fill" className={styles.pdfIcon} />
                </div>
                <div>
                  <span className={styles.fileName}>Van-ban-Song-X...</span>
                  <span className={styles.fileSize}>1.2 MB • PDF</span>
                </div>
              </div>
              <div className={styles.attachFile}>
                <div className={`${styles.fileIconWrapper} ${styles.docBg}`}>
                  <FileDoc size={22} weight="fill" className={styles.docIcon} />
                </div>
                <div>
                  <span className={styles.fileName}>Huong-dan-lam-...</span>
                  <span className={styles.fileSize}>450 KB • Word</span>
                </div>
              </div>
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
                {mySubmission.feedback && (
                  <p className={styles.feedback}>💬 &ldquo;{mySubmission.feedback}&rdquo;</p>
                )}
              </div>
            ) : isSubmitted ? (
              <div className={styles.submittedBox}>
                <CheckCircle size={32} weight="fill" style={{ color: "#10B981" }} />
                <p>Đã nộp lúc {new Date(mySubmission.submittedAt).toLocaleString("vi-VN")}</p>
                <p className={styles.subNote}>Đang chờ giáo viên chấm điểm...</p>
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
                      <FilePdf size={28} weight="fill" style={{ color: "#EF4444" }} />
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

                {/* Submit button */}
                <button
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className={styles.loadingDots}>Đang nộp bài...</span>
                  ) : (
                    <>
                      <PaperPlaneTilt size={18} weight="bold" />
                      Nộp bài tập ngay
                    </>
                  )}
                </button>
                <div className={styles.editNoteContainer}>
                  <Info size={16} className={styles.infoIcon} />
                  <p className={styles.editNote}>
                    Bạn có thể chỉnh sửa bài nộp trước thời hạn chót.
                  </p>
                </div>
              </>
            )}
          </div>

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
                    2 ngày trước • 08:30
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
                      {new Date(mySubmission.submittedAt).toLocaleDateString("vi-VN")} • {new Date(mySubmission.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
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

              {!isSubmitted && (
                <div className={styles.activityItem}>
                  <div className={`${styles.actIconWrapper} ${styles.grayBg}`}>
                     <Eye size={14} weight="bold" color="#64748B" />
                  </div>
                  <div>
                    <p className={styles.actText}>Bạn đã xem tài liệu đính kèm</p>
                    <span className={styles.actTime}>
                      1 ngày trước • 14:15
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
