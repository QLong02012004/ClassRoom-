import React, { useState, useEffect } from 'react';
import { DownloadSimple, ShareNetwork, TrendUp, Medal, GraduationCap, Calendar, FunnelSimple, DotsThreeVertical, Atom, BookOpen, Clock } from 'phosphor-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useToast } from '../../../components/Styles/ToastContext.tsx';
import { classroomService } from '../../../service/classroom.service.ts';
import { gradebookService } from '../../../service/gradebook.service.ts';
import styles from './StudentResults.module.scss';

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'mieng': return 'Điểm miệng';
    case '15phut': return '15 phút';
    case 'giuaky': return 'Giữa kỳ';
    case 'cuoiky': return 'Cuối kỳ';
    default: return 'Thường xuyên';
  }
};

const getCategoryWeight = (category: string) => {
  switch (category) {
    case 'mieng': return 0.1;
    case '15phut': return 0.1;
    case 'giuaky': return 0.3;
    case 'cuoiky': return 0.5;
    default: return 0.1;
  }
};

const getCategoryWeightPercent = (category: string) => {
  switch (category) {
    case 'mieng': return '10%';
    case '15phut': return '10%';
    case 'giuaky': return '30%';
    case 'cuoiky': return '50%';
    default: return '10%';
  }
};

const getSubjectIconClass = (category: string) => {
  switch (category) {
    case 'cuoiky': return styles.greenBg;
    case 'giuaky': return styles.redBg;
    case '15phut': return styles.orangeBg;
    default: return styles.blueBg;
  }
};

const StudentResults: React.FC = () => {
  const toast = useToast();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [classroomDetail, setClassroomDetail] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  // 1. Tải danh sách lớp học của học sinh
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await classroomService.getStudentClassrooms();
        if (res && res.data) {
          setClassrooms(res.data);
          if (res.data.length > 0) {
            setSelectedClassId(res.data[0]._id);
          } else {
            setLoading(false);
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Không thể tải danh sách lớp học!');
        setLoading(false);
      }
    };
    fetchClassrooms();
  }, []);

  // 2. Tải điểm số khi đổi lớp học
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchGrades = async () => {
      setLoading(true);
      try {
        const res = await gradebookService.getStudentGrades(selectedClassId);
        if (res && res.data) {
          setClassroomDetail(res.data.classroom);
          setAssignments(res.data.assignments || []);
          setGrades(res.data.grades || []);
        }
      } catch (err: any) {
        toast.error(err.message || 'Không thể tải bảng điểm lớp học!');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [selectedClassId]);

  // Ghép bài tập với điểm tương ứng
  const assignmentGrades = assignments.map(a => {
    const grade = grades.find(g => g.assignmentId === a._id);
    return {
      ...a,
      grade: grade || null
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Tính toán chỉ số thống kê
  const gradedList = assignmentGrades.filter(ag => ag.grade !== null);
  const totalAssignments = assignments.length;
  const gradedCount = gradedList.length;
  const completionRate = totalAssignments > 0 ? Math.round((gradedCount / totalAssignments) * 100) : 0;

  // Tính GPA (Điểm TB có trọng số)
  let totalScoreWeighted = 0;
  let totalWeight = 0;
  gradedList.forEach(ag => {
    const weight = getCategoryWeight(ag.category);
    totalScoreWeighted += (ag.grade?.score || 0) * weight;
    totalWeight += weight;
  });
  const gpa = totalWeight > 0 ? (totalScoreWeighted / totalWeight) : null;
  const gpaText = gpa !== null ? gpa.toFixed(1) : '—';

  // Xếp loại học lực
  let academicStanding = 'Chưa xếp loại';
  let standingSubtext = 'Chưa đủ đầu điểm để đánh giá';
  if (gpa !== null) {
    if (gpa >= 8.0) {
      academicStanding = 'Giỏi';
      standingSubtext = 'Đạt thành tích học tập Xuất sắc';
    } else if (gpa >= 6.5) {
      academicStanding = 'Khá';
      standingSubtext = 'Đạt thành tích học tập Khá';
    } else if (gpa >= 5.0) {
      academicStanding = 'Trung bình';
      standingSubtext = 'Cần cố gắng củng cố kiến thức';
    } else {
      academicStanding = 'Yếu';
      standingSubtext = 'Cần trao đổi thêm với Giáo viên';
    }
  }

  // Dữ liệu biểu đồ Radar
  const categories = ['mieng', '15phut', 'giuaky', 'cuoiky'];
  const radarData = categories.map(cat => {
    const catList = gradedList.filter(ag => ag.category === cat);
    const avgScore = catList.length > 0
      ? (catList.reduce((acc, curr) => acc + (curr.grade?.score || 0), 0) / catList.length)
      : 0;

    let label = 'THƯỜNG XUYÊN';
    if (cat === 'mieng') label = 'MIỆNG';
    if (cat === '15phut') label = '15 PHÚT';
    if (cat === 'giuaky') label = 'GIỮA KỲ';
    if (cat === 'cuoiky') label = 'CUỐI KỲ';

    return {
      subject: label,
      A: Math.round(avgScore * 10), // Nhân 10 để vẽ cột trên thang điểm 100
      fullMark: 100
    };
  });

  // Tìm điểm mạnh và điểm yếu để hiển thị insight
  let highestCat = '—';
  let lowestCat = '—';
  let maxVal = -1;
  let minVal = 11;
  categories.forEach(cat => {
    const catList = gradedList.filter(ag => ag.category === cat);
    if (catList.length > 0) {
      const avg = catList.reduce((acc, curr) => acc + (curr.grade?.score || 0), 0) / catList.length;
      if (avg > maxVal) {
        maxVal = avg;
        highestCat = getCategoryLabel(cat);
      }
      if (avg < minVal) {
        minVal = avg;
        lowestCat = getCategoryLabel(cat);
      }
    }
  });

  // Các bài tập có nhận xét từ giáo viên
  const feedbacks = gradedList
    .filter(ag => ag.grade?.feedback && ag.grade.feedback.trim() !== '')
    .slice(0, 3); // Lấy tối đa 3 nhận xét mới nhất

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return isoString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && classrooms.length === 0) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Đang tải dữ liệu điểm số học tập...</p>
      </div>
    );
  }

  if (classrooms.length === 0) {
    return (
      <div className={styles.emptyState}>
        <GraduationCap size={48} weight="light" />
        <h3>Bạn chưa tham gia lớp học nào!</h3>
        <p>Vui lòng tham gia vào một lớp học bằng mã lớp từ Giáo viên cung cấp để xem điểm số.</p>
      </div>
    );
  }

  const teacherName = classroomDetail?.teacher?.name || 'Giáo viên phụ trách';
  const teacherAvatar = classroomDetail?.teacher?.avatar
    ? classroomDetail.teacher.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=FE6747&color=fff&bold=true`;

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>Kết quả học tập</h1>
          <div className={styles.classSelectorWrap}>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className={styles.classSelect}
            >
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.subject ? `— ${c.subject}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={handlePrint}>
            <DownloadSimple size={20} />
            In bảng điểm (PDF)
          </button>
        </div>
      </div>

      {/* Loading overlay for class switching */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Đang cập nhật bảng điểm của lớp...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className={styles.statCards}>
            <div className={`${styles.statCard} ${styles.gpaCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Điểm trung bình (GPA)</span>
                <div className={`${styles.iconWrapper} ${styles.orangeIcon}`}>
                  <TrendUp size={20} weight="bold" />
                </div>
              </div>
              <div className={styles.cardValue}>{gpaText}</div>
              <div className={styles.cardSubtext2}>Điểm TB có trọng số</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Xếp loại học lực</span>
                <div className={`${styles.iconWrapper} ${styles.greenIcon}`}>
                  <Medal size={20} weight="bold" />
                </div>
              </div>
              <div className={styles.cardValue}>{academicStanding}</div>
              <div className={styles.cardSubtext2}>{standingSubtext}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Đã chấm điểm</span>
                <div className={`${styles.iconWrapper} ${styles.blueIcon}`}>
                  <GraduationCap size={20} weight="bold" />
                </div>
              </div>
              <div className={styles.cardValue}>{gradedCount}/{totalAssignments}</div>
              <div className={styles.progressBarWrapper}>
                <div className={styles.progressBar} style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Tỷ lệ hoàn thành</span>
                <div className={`${styles.iconWrapper} ${styles.tealIcon}`}>
                  <Calendar size={20} weight="bold" />
                </div>
              </div>
              <div className={styles.cardValue}>{completionRate}%</div>
              <div className={styles.cardSubtext2}>Bài tập đã có điểm</div>
            </div>
          </div>

          {/* Main Grid: Grades Table & Radar Chart */}
          <div className={styles.mainGrid}>
            <div className={styles.gradesTableWrapper}>
              <div className={styles.sectionHeader}>
                <h2>Bảng điểm chi tiết</h2>
              </div>
              {assignmentGrades.length > 0 ? (
                <table className={styles.gradesTable}>
                  <thead>
                    <tr>
                      <th>BÀI ĐÁNH GIÁ</th>
                      <th>LOẠI</th>
                      <th>ĐIỂM SỐ</th>
                      <th>HỆ SỐ</th>
                      <th>TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentGrades.map((ag) => {
                      const score = ag.grade?.score;
                      const hasScore = score !== undefined && score !== null;
                      const displayScore = hasScore ? score.toFixed(1) : '—';
                      const maxScore = ag.maxScore || 10;
                      const isPassed = hasScore && score >= (maxScore / 2);

                      return (
                        <tr key={ag._id}>
                          <td>
                            <div className={styles.subjectCell}>
                              <div className={`${styles.subjectIcon} ${getSubjectIconClass(ag.category)}`}>
                                <BookOpen size={16} weight="fill" />
                              </div>
                              <span className={styles.subjectName}>{ag.title}</span>
                            </div>
                          </td>
                          <td className={styles.teacherCell}>{getCategoryLabel(ag.category)}</td>
                          <td className={styles.finalScore}>
                            {displayScore} <span style={{ fontSize: 11, color: '#888', fontWeight: 'normal' }}>/{maxScore}</span>
                          </td>
                          <td>{getCategoryWeightPercent(ag.category)}</td>
                          <td
                            className={styles.finalScore}
                            style={{ color: hasScore ? (isPassed ? '#1fb98f' : '#de350b') : '#999' }}
                          >
                            {hasScore ? (isPassed ? 'Đạt' : 'Chưa đạt') : 'Chưa chấm'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#666' }}>
                  Lớp học này chưa có bài đánh giá nào.
                </div>
              )}
            </div>

            <div className={styles.radarChartWrapper}>
              <div className={styles.sectionHeader}>
                <h2>Biểu đồ năng lực</h2>
              </div>
              <p className={styles.chartSubtitle}>Đánh giá theo 4 danh mục bài làm</p>
              <div className={styles.chartContainer}>
                {gradedCount > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData} startAngle={90} endAngle={-270}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <Radar name="Học lực" dataKey="A" stroke="#fe6747" fill="#fe6747" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', textAlign: 'center', fontSize: 13 }}>
                    Chưa có bài kiểm tra được chấm để hiển thị biểu đồ.
                  </div>
                )}
              </div>
              <div className={styles.chartInsights}>
                <div className={styles.insightRow}>
                  <span className={styles.insightLabel}>Điểm mạnh nhất:</span>
                  <span className={styles.insightValueOrange}>{highestCat}</span>
                </div>
                <div className={styles.insightRow}>
                  <span className={styles.insightLabel}>Cần cải thiện:</span>
                  <span className={styles.insightValue}>{lowestCat}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className={styles.feedbackSection}>
            <div className={styles.sectionHeaderLine}>
              <h2>Nhận xét gần đây từ Giáo viên</h2>
            </div>
            {feedbacks.length > 0 ? (
              <div className={styles.feedbackCards}>
                {feedbacks.map((fb) => (
                  <div key={fb._id} className={styles.feedbackCard}>
                    <div className={styles.fCardHeader}>
                      <div className={styles.fCardTitleInfo}>
                        <h3>{fb.title}</h3>
                        <p>{getCategoryLabel(fb.category)} &bull; {formatDate(fb.grade.gradedAt)}</p>
                      </div>
                      <div className={`${styles.fCardScore} ${styles.bgOrange}`}>
                        {fb.grade.score.toFixed(1)}
                      </div>
                    </div>
                    <div className={styles.fCardComment}>
                      "{fb.grade.feedback}"
                    </div>
                    <div className={styles.fCardTeacher}>
                      <img src={teacherAvatar} alt={`Avatar ${teacherName}`} />
                      <span>{teacherName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', background: 'white', borderRadius: 12, border: '1px solid #f0f0f0', color: '#888' }}>
                Chưa có nhận xét nào từ giáo viên trong lớp học này.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentResults;
