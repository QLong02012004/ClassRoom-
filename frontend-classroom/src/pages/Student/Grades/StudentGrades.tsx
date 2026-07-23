import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChartBar, Clock, Notebook, Star, TrendUp, TrendDown, Trophy, Target, Crosshair, WarningCircle, CheckCircle, Lightning, CaretDown, CaretUp, ChatTeardropText, ArrowRight, Calculator, CalendarCheck, Warning, MagnifyingGlass, Lightbulb, Funnel, Medal } from "phosphor-react";
import { gradebookService } from "../../../service/gradebook.service.ts";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../../../components/ui/dropdown-menu";
import styles from "./StudentGrades.module.scss";
import vars from "../../../components/Styles/variables.module.scss";

export default function StudentGrades() {
  const navigate = useNavigate();
  const [gradedAssignments, setGradedAssignments] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);

  // States cho tính năng Tương tác
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expectedScore, setExpectedScore] = useState<number>(8.0);
  const [activeAiTab, setActiveAiTab] = useState("radar");

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await gradebookService.getStudentAssignments();
        if (res && res.data) {
          setAllAssignments(res.data);
          const graded = res.data.filter((assign: any) => assign.submission?.status === "graded");
          graded.sort(
            (a: any, b: any) => new Date(b.submission?.gradedAt || 0).getTime() - new Date(a.submission?.gradedAt || 0).getTime()
          );
          setGradedAssignments(graded);
        }
      } catch (err) {
        console.error("Không thể tải bảng điểm", err);
      }
    };
    fetchGrades();
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  // Tính toán GPA
  const totalScore = gradedAssignments.reduce((sum, curr) => sum + (curr.submission?.grade || 0), 0);
  const totalMaxScore = gradedAssignments.reduce((sum, curr) => sum + (curr.maxScore || 10), 0);
  const gpa10Scale = gradedAssignments.length > 0 ? (totalScore / totalMaxScore) * 10 : 0;

  let gpaColor = vars.success;
  let gpaRank = "Giỏi";
  if (gpa10Scale < 5.0) {
    gpaColor = vars.danger;
    gpaRank = "Yếu";
  } else if (gpa10Scale < 8.0) {
    gpaColor = vars.warning;
    gpaRank = "Khá";
  }

  // Tỷ lệ hoàn thành
  const completedCount = allAssignments.filter(a => a.submission).length;
  const totalCount = allAssignments.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const dashOffset = 214 - (214 * completionRate) / 100;

  // Lọc bài tập tổng hợp
  const filteredAssignments = allAssignments.filter(a => {
    // 1. Theo từ khóa
    if (searchTerm && !a.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    // 2. Theo loại bài
    if (activeFilter === "homework" && a.type?.toLowerCase() !== "essay") return false;
    if (activeFilter === "exam" && a.type?.toLowerCase() !== "quiz") return false;

    // 3. Theo trạng thái
    const isGraded = a.submission?.status === "graded";
    if (statusFilter === "graded" && !isGraded) return false;
    if (statusFilter === "ungraded" && isGraded) return false;

    return true;
  });

  // Điểm cao nhất
  let highestScore = 0;
  gradedAssignments.forEach(a => {
    if (a.submission?.grade > highestScore) {
      highestScore = a.submission.grade;
    }
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Tính toán điểm số dự kiến (What-if scenario)
  const newTotalScore = totalScore + expectedScore;
  const newTotalMax = totalMaxScore + 10; // Giả định bài thi cuối kỳ max 10đ
  const newGpa = newTotalMax > 0 ? (newTotalScore / newTotalMax) * 10 : 0;

  let newRank = "Giỏi";
  let newColor = vars.success;
  if (newGpa < 5.0) { newRank = "Yếu"; newColor = vars.danger; }
  else if (newGpa < 8.0) { newRank = "Khá"; newColor = vars.warning; }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Bảng điểm chi tiết</h2>
          <p>Xem toàn bộ điểm số các bài tập đã được giáo viên chấm</p>
        </div>
      </div>

      {/* TỔNG QUAN - HERO BANNER */}
      <div className={`${styles.heroBanner} tour-step-grade-hero`}>
        {/* KPI 1: GPA */}
        <div className={styles.bannerItem}>
          <div className={styles.iconWrap} style={{ background: 'rgba(47, 143, 163, 0.1)' }}>
            <Star size={24} weight="duotone" color={gpaColor} />
          </div>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>ĐTB Môn</span>
            <div className={styles.itemValueWrap}>
              <span className={styles.itemValue} style={{ color: gpaColor }}>{gpa10Scale.toFixed(1)}</span>
              <span className={styles.itemBadge} style={{ backgroundColor: gpaColor }}>{gpaRank}</span>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* KPI 2: Tỷ lệ hoàn thành */}
        <div className={styles.bannerItem}>
          <div className={styles.iconWrap} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <Target size={24} weight="duotone" color={vars.info} />
          </div>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>Tỷ lệ nộp</span>
            <span className={styles.itemValue}>{completionRate}%</span>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* KPI 3: Vị trí hiện tại */}
        <div className={styles.bannerItem}>
          <div className={styles.iconWrap} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <Trophy size={24} weight="duotone" color={vars.warning} />
          </div>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>Vị trí</span>
            <span className={styles.itemValue}>Top 10%</span>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* KPI 4: Điểm cao nhất */}
        <div className={styles.bannerItem}>
          <div className={styles.iconWrap} style={{ background: 'rgba(244, 124, 32, 0.1)' }}>
            <Medal size={24} weight="duotone" color={vars.primary} />
          </div>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>Cao nhất</span>
            <div className={styles.itemValueWrap}>
              <span className={styles.itemValue} style={{ color: vars.primary }}>{highestScore}</span>
              <span style={{ fontSize: '0.9rem', color: vars.textSub, fontWeight: 700 }}>/ 10</span>
            </div>
          </div>
        </div>
      </div>

      {/* TRỢ LÝ AI (FULL WIDTH ROW) */}
      <div className={`${styles.aiAssistantFull} tour-step-grade-ai`}>
        <div className={styles.aiHeader}>
          <div className={styles.aiIconWrap}>
            <Lightbulb size={24} weight="duotone" />
          </div>
          <h3>Trợ lý AI & Phân tích</h3>
        </div>

        <div className={styles.aiContentGrid}>
          {/* CỘT 1: ĐIỂM MẠNH */}
          <div className={styles.radarSection}>
            <span className={styles.radarSectionTitle}>
              <CheckCircle size={16} weight="bold" color={vars.success} />
              Điểm mạnh
            </span>
            <div className={`${styles.tagItem} ${styles.strength}`}>
              <div className={styles.tagInfo}>
                <span className={styles.tagName}>Vectơ</span>
                <span className={`${styles.tagScore} ${styles.good}`}>Đúng 90%</span>
              </div>
            </div>
            <div className={`${styles.tagItem} ${styles.strength}`}>
              <div className={styles.tagInfo}>
                <span className={styles.tagName}>Tọa độ mặt phẳng</span>
                <span className={`${styles.tagScore} ${styles.good}`}>Đúng 85%</span>
              </div>
            </div>
          </div>

          <div className={styles.verticalDivider}></div>

          {/* CỘT 2: CẦN CẢI THIỆN KHẨN CẤP */}
          <div className={styles.radarSection}>
            <span className={styles.radarSectionTitle}>
              <WarningCircle size={16} weight="bold" color={vars.danger} />
              Cần cải thiện khẩn cấp
            </span>
            <div className={`${styles.tagItem} ${styles.weakness}`}>
              <div className={styles.tagInfo}>
                <span className={styles.tagName}>Phương trình Đường tròn</span>
                <span className={`${styles.tagScore} ${styles.bad}`}>Sai 60%</span>
              </div>
              <button
                className={styles.ctaPractice}
                onClick={() => navigate('/practice')}
              >
                <Lightning size={20} weight="bold" />
                Luyện tập lấp lỗ hổng
              </button>
              <p className={styles.suggestionText}>
                Nên làm thêm 3 bài tập về <strong>Phương trình Đường tròn</strong> để nắm vững kiến thức hơn.
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* CỘT TRÁI: DANH SÁCH DẠNG BẢNG */}
      <div className={`${styles.tableContainer} tour-step-grade-table`}>
        <div className={styles.tableHeader}>
          <h3>Chi tiết điểm số</h3>
          <div className={styles.tableFilters}>
            <div className={styles.searchBox}>
              <MagnifyingGlass size={20} weight="bold" color={vars.textSub} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className={styles.filterSelect}>
                {activeFilter === "all" ? "Tất cả loại bài" : activeFilter === "homework" ? "Bài tập về nhà" : "Kiểm tra & Thi thử"}
                <CaretDown size={14} weight="bold" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={activeFilter} onValueChange={setActiveFilter}>
                  <DropdownMenuRadioItem value="all">Tất cả loại bài</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="homework">Bài tập về nhà</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="exam">Kiểm tra & Thi thử</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className={styles.filterSelect}>
                {statusFilter === "all" ? "Tất cả trạng thái" : statusFilter === "graded" ? "Đã chấm điểm" : "Chưa chấm điểm"}
                <CaretDown size={14} weight="bold" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                  <DropdownMenuRadioItem value="all">Tất cả trạng thái</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="graded">Đã chấm điểm</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="ungraded">Chưa chấm điểm</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className={styles.tableBody}>
          {filteredAssignments.length === 0 ? (
            <div className={styles.emptyState}>
              <ChartBar size={64} className={styles.emptyIcon} weight="duotone" />
              <p>Không tìm thấy bài tập nào phù hợp với bộ lọc.</p>
            </div>
          ) : (
            filteredAssignments.map((assign) => {
              const isGraded = assign.submission?.status === "graded";
              const grade = isGraded ? (assign.submission?.grade || 0) : null;
              const max = assign.maxScore || 10;
              const percentage = grade !== null ? (grade / max) * 100 : 0;

              let statusClass = styles.excellent;
              let statusText = "Xuất sắc";

              if (!isGraded) {
                statusClass = '';
                statusText = "Chưa chấm";
              } else if (percentage < 50) {
                statusClass = styles.needs_improvement;
                statusText = "Cần cố gắng";
              } else if (percentage < 80) {
                statusClass = styles.good;
                statusText = "Khá";
              }

              return (
                <div key={assign._id} className={styles.gradeRowWrapper}>
                  <div className={styles.gradeRow} onClick={() => toggleExpand(assign._id)}>
                    {/* Cột 1: Tên & Loại */}
                    <div className={styles.rowCol}>
                      <div className={styles.rowTitle}>
                        <Notebook size={20} color={vars.primary} weight="duotone" />
                        {assign.title}
                      </div>
                      <div className={styles.rowSubtitle}>
                        <span style={{ fontWeight: 600, color: vars.secondary }}>{assign.className || "Môn học chung"}</span>
                        <span>•</span>
                        <span>{assign.type?.toLowerCase() === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}</span>
                      </div>
                    </div>

                    {/* Cột 2: Ngày nộp & Trễ */}
                    <div className={styles.rowCol}>
                      <div className={styles.rowSubtitle} style={{ color: vars.darkText, fontWeight: 500 }}>
                        <CalendarCheck size={16} />
                        {(assign.submission?.submittedAt || assign.deadline)
                          ? `Nộp: ${formatDate(assign.submission?.submittedAt || assign.deadline)}`
                          : "Chưa cập nhật ngày"}
                      </div>
                      {assign.submission?.isLate && (
                        <div className={styles.rowSubtitle} style={{ color: vars.danger, fontWeight: 600 }}>
                          <Warning size={16} /> Nộp muộn
                        </div>
                      )}
                    </div>

                    {/* Cột 3: Điểm & Nhãn */}
                    <div className={styles.rowScoreWrap}>
                      {grade !== null ? (
                        <div className={styles.rowScore}>
                          {grade} <span style={{ fontSize: '0.9rem', color: vars.textSub, fontWeight: 500 }}>/ {max}</span>
                        </div>
                      ) : (
                        <div className={styles.rowScore} style={{ color: vars.textSub }}>--/--</div>
                      )}
                      <span className={`${styles.statusLabel} ${statusClass}`} style={{ backgroundColor: isGraded ? undefined : 'rgba(0,0,0,0.05)', color: isGraded ? undefined : vars.textSub }}>
                        {statusText}
                      </span>
                    </div>

                    {/* Cột 4: Mũi tên */}
                    <div className={styles.expandIconWrap}>
                      {expandedId === assign._id ? (
                        <CaretUp size={20} weight="bold" />
                      ) : (
                        <CaretDown size={20} weight="bold" />
                      )}
                    </div>
                  </div>

                  {/* VÙNG MỞ RỘNG (EXPANDABLE) */}
                  {expandedId === assign._id && (
                    <div className={styles.expandContent}>
                      <div className={styles.feedbackBox}>
                        <span className={styles.feedbackLabel}>
                          <ChatTeardropText size={16} weight="fill" color={vars.warning} />
                          Nhận xét của Giáo viên:
                        </span>
                        <p className={styles.feedbackText}>
                          {assign.submission?.feedback || "Giáo viên không để lại nhận xét riêng cho bài tập này. Bạn đã làm rất tốt, hãy phát huy ở các bài sau!"}
                        </p>
                      </div>
                      <button
                        className={styles.btnDetail}
                        onClick={() => navigate(`/assignments/${assign._id}`)}
                      >
                        Xem chi tiết bài thi
                        <ArrowRight size={16} weight="bold" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
