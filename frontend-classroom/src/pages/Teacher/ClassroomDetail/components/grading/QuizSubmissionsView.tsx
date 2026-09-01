import React from "react";
import { BackButton } from "@/components/ui/Buttons/BackButton";
import { ClassErrorInsights } from "./ClassErrorInsights.tsx";
import styles from "../../TeacherClassroomDetail.module.scss";

interface QuizSubmissionsViewProps {
  quizBuilder?: any;
  selectedQuiz?: any;
  setSelectedQuiz?: (quiz: any) => void;
  quizResultTab?: "scores" | "errors";
  setQuizResultTab?: (tab: "scores" | "errors") => void;
  loadingResults?: boolean;
  quizResults?: any[];
}

export const QuizSubmissionsView: React.FC<QuizSubmissionsViewProps> = (props) => {
  const { quizBuilder } = props;

  const selectedQuiz = props.selectedQuiz ?? quizBuilder?.selectedQuiz;
  const setSelectedQuiz = props.setSelectedQuiz ?? quizBuilder?.setSelectedQuiz;
  const quizResultTab = props.quizResultTab ?? quizBuilder?.quizResultTab ?? "scores";
  const setQuizResultTab = props.setQuizResultTab ?? quizBuilder?.setQuizResultTab;
  const loadingResults = props.loadingResults ?? quizBuilder?.loadingResults ?? false;
  const quizResults = props.quizResults ?? quizBuilder?.quizResults ?? [];
  return (
    <div className={styles.submissionsView}>
      <div className={styles.submissionsHeader}>
        <div className="flex flex-col gap-3">
          <BackButton
            onClick={() => {
              setSelectedQuiz(null);
              setQuizResultTab("scores");
            }}
          >
            Quay lại danh sách đề thi
          </BackButton>
          <h3 className="text-xl font-bold text-slate-800">Phân tích: {selectedQuiz.title}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 border-b border-slate-200">
        <button
          className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors ${
            quizResultTab === "scores"
              ? "border-[#FE6747] text-[#FE6747]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setQuizResultTab("scores")}
        >
          Bảng điểm & Bài nộp
        </button>
        <button
          className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors ${
            quizResultTab === "errors"
              ? "border-[#FE6747] text-[#FE6747]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setQuizResultTab("errors")}
        >
          💡 Phân tích lỗi sai của lớp
        </button>
      </div>

      {quizResultTab === "scores" ? (
        <>
          {loadingResults ? (
            <p style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>
              Đang tải bảng điểm...
            </p>
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
                    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      name
                    )}&background=3b82f6&color=fff&bold=true`;
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
                        <td>
                          {correctCount}/{resItem.totalQuestions} câu
                        </td>
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
        </>
      ) : (
        <ClassErrorInsights activityId={selectedQuiz._id} />
      )}
    </div>
  );
};

export default QuizSubmissionsView;
