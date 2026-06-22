import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Compass,
  Flask,
  Book,
  ArrowRight,
  CheckCircle,
  Clock,
  Warning,
} from "phosphor-react";
import { gradebookService } from "../../../service/gradebook.service.ts";
import styles from "./StudentAssignments.module.scss";

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await gradebookService.getStudentAssignments();
        if (res && res.data) {
          const mapped = res.data.map((assign: any) => ({
            ...assign,
            deadline: assign.dueDate || assign.deadline
          }));
          mapped.sort(
            (a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
          setAssignments(mapped);
        }
      } catch (err) {
        console.error("Không thể tải danh sách bài tập", err);
      }
    };
    fetchAssignments();
  }, []);

  const getStatus = (assign: any) => {
    if (assign.submission?.status === "graded") return "graded";
    if (assign.submission) return "submitted";
    if (new Date(assign.deadline).getTime() < Date.now()) return "late";
    return "pending";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "graded": return "Đã chấm điểm";
      case "submitted": return "Đã nộp";
      case "late": return "Quá hạn";
      default: return "Chưa nộp";
    }
  };

  const getSubjectIcon = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("toán")) return <Compass size={22} weight="duotone" />;
    if (s.includes("hóa")) return <Flask size={22} weight="duotone" />;
    if (s.includes("văn")) return <Book size={22} weight="duotone" />;
    return <BookOpen size={22} weight="duotone" />;
  };

  const getSubjectColorClass = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("toán")) return styles.math;
    if (s.includes("hóa")) return styles.chemistry;
    if (s.includes("văn")) return styles.literature;
    return styles.default;
  };

  const formatDeadline = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} • ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `Còn ${days} ngày`;
    return `Còn ${hours} giờ`;
  };

  const pending = assignments.filter((a) => getStatus(a) === "pending" || getStatus(a) === "late");
  const done = assignments.filter((a) => getStatus(a) === "submitted" || getStatus(a) === "graded");

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Bài tập của tôi</h2>
          <p>Theo dõi và hoàn thành các bài tập được giao</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statPill}>
            <Warning size={16} weight="fill" className={styles.iconWarning} />
            <span>{pending.length} chưa nộp</span>
          </div>
          <div className={styles.statPill}>
            <CheckCircle size={16} weight="fill" className={styles.iconSuccess} />
            <span>{done.length} đã nộp</span>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>⏳ Cần hoàn thành</h3>
          <div className={styles.assignmentList}>
            {pending.map((assign) => {
              const status = getStatus(assign);
              const timeLeft = getTimeLeft(assign.deadline);
              return (
                <div
                  key={assign._id}
                  className={`${styles.assignCard} ${status === "late" ? styles.lateCard : ""}`}
                  onClick={() => navigate(`/assignments/${assign._id}`)}
                >
                  <div className={`${styles.subjectIcon} ${getSubjectColorClass(assign.subject)}`}>
                    {getSubjectIcon(assign.subject)}
                  </div>
                  <div className={styles.cardInfo}>
                    <span className={styles.classTag}>{assign.className}</span>
                    <h4 className={styles.cardTitle}>{assign.title}</h4>
                    <div className={styles.cardMeta}>
                      <Clock size={13} />
                      <span>Hạn: {formatDeadline(assign.deadline)}</span>
                      {timeLeft && <span className={`${styles.timeBadge} ${styles.urgent}`}>{timeLeft}</span>}
                      {!timeLeft && <span className={`${styles.timeBadge} ${styles.overdue}`}>Quá hạn</span>}
                    </div>
                  </div>
                  <div className={styles.cardAction}>
                    <span className={`${styles.statusDot} ${styles[status]}`} />
                    <span className={styles.statusText}>{getStatusLabel(status)}</span>
                    <ArrowRight size={16} className={styles.arrow} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>✅ Đã nộp / Đã chấm</h3>
          <div className={styles.assignmentList}>
            {done.map((assign) => {
              const status = getStatus(assign);
              return (
                <div
                  key={assign._id}
                  className={`${styles.assignCard} ${styles.doneCard}`}
                  onClick={() => navigate(`/assignments/${assign._id}`)}
                >
                  <div className={`${styles.subjectIcon} ${getSubjectColorClass(assign.subject)}`}>
                    {getSubjectIcon(assign.subject)}
                  </div>
                  <div className={styles.cardInfo}>
                    <span className={styles.classTag}>{assign.className}</span>
                    <h4 className={styles.cardTitle}>{assign.title}</h4>
                    <div className={styles.cardMeta}>
                      <Clock size={13} />
                      <span>Hạn: {formatDeadline(assign.deadline)}</span>
                      {status === "graded" && (
                        <span className={styles.gradeBadge}>
                          Điểm: {assign.submission?.grade}/10
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.cardAction}>
                    <CheckCircle size={18} className={styles.iconSuccess} />
                    <span className={styles.statusText}>{getStatusLabel(status)}</span>
                    <ArrowRight size={16} className={styles.arrow} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {assignments.length === 0 && (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h4>Chưa có bài tập nào</h4>
          <p>Khi giáo viên giao bài, chúng sẽ xuất hiện ở đây.</p>
        </div>
      )}
    </div>
  );
}
