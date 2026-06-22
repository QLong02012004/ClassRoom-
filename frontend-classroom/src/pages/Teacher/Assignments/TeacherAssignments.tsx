import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Clock,
  Users,
  PencilSimple,
  Play,
  BookOpen,
  ChartBar,
  X,
  TrendUp,
  Spinner,
  FloppyDisk,
  CaretDown,
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { gradebookService } from "../../../service/gradebook.service";
import type { IAssignment, IGrade, IGradebookStudent, ISubmission } from "../../../service/gradebook.service";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import styles from "./TeacherAssignments.module.scss";

// TABS
const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "mieng", label: "Điểm miệng" },
  { key: "15phut", label: "Điểm 15 phút" },
  { key: "giuaky", label: "Giữa kỳ" },
  { key: "cuoiky", label: "Cuối kỳ" },
];

const chartData = [
  { day: "Thứ 2", value: 65 },
  { day: "Thứ 3", value: 80 },
  { day: "Thứ 4", value: 55 },
  { day: "Thứ 5", value: 90 },
  { day: "Thứ 6", value: 40 },
  { day: "Thứ 7", value: 75 },
  { day: "CN", value: 95 },
];

export default function TeacherAssignments() {
  const toast = useToast();

  const [classes, setClasses] = useState<ITeacherClassroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const [students, setStudents] = useState<IGradebookStudent[]>([]);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [grades, setGrades] = useState<IGrade[]>([]);

  const [activeTab, setActiveTab] = useState("all");
  
  // Form create assignment
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignCategory, setAssignCategory] = useState("15phut");
  const [maxScore, setMaxScore] = useState(10);
  const [description, setDescription] = useState("");

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [creating, setCreating] = useState(false);

  // Grading Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<IAssignment | null>(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingScores, setGradingScores] = useState<{ [key: string]: string }>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<{ [key: string]: string }>({});
  const [savingGrades, setSavingGrades] = useState(false);
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const selectedClass = classes.find(c => c._id === selectedClassId);

  // Load classrooms
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classroomService.getTeacherClassrooms();
        if (res.data && res.data.length > 0) {
          setClasses(res.data);
          setSelectedClassId(res.data[0]._id);
        }
      } catch {
        toast.error("Không thể tải danh sách lớp học");
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // Load assignments & students grades
  const loadData = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingData(true);
    try {
      const res = await gradebookService.getClassroomGrades(selectedClassId);
      if (res.data) {
        setStudents(res.data.students || []);
        setAssignments(res.data.assignments || []);
        setGrades(res.data.grades || []);
      }
    } catch {
      toast.error("Không thể tải dữ liệu bài tập");
    } finally {
      setLoadingData(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error("Vui lòng chọn lớp học!");
      return;
    }
    if (!title || !deadline) {
      toast.error("Vui lòng điền đủ Tiêu đề và Hạn nộp!");
      return;
    }

    setCreating(true);
    try {
      await gradebookService.createAssignment({
        classId: selectedClassId,
        title,
        dueDate: deadline,
        maxScore,
        category: assignCategory,
        description,
      });
      toast.success("Giao bài tập mới thành công!");
      setTitle("");
      setDeadline("");
      setAssignCategory("15phut");
      setMaxScore(10);
      setDescription("");
      loadData();
    } catch {
      toast.error("Tạo bài tập thất bại!");
    } finally {
      setCreating(false);
    }
  };

  // Open Grading Modal
  const openGradingModal = async (assignment: IAssignment) => {
    setSelectedAssignment(assignment);
    
    // Pre-populate scores & feedbacks
    const scoresMap: { [key: string]: string } = {};
    const feedbacksMap: { [key: string]: string } = {};
    
    grades.forEach(g => {
      if (g.assignmentId === assignment._id) {
        scoresMap[g.studentId] = String(g.score);
        feedbacksMap[g.studentId] = g.feedback || "";
      }
    });

    setGradingScores(scoresMap);
    setGradingFeedbacks(feedbacksMap);
    setShowGradingModal(true);

    // Fetch submissions for this assignment
    setLoadingSubmissions(true);
    try {
      const res = await gradebookService.getAssignmentSubmissions(assignment._id);
      if (res && res.data) {
        setSubmissions(res.data);
      }
    } catch {
      toast.error("Không thể tải danh sách bài nộp của học sinh");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Save Grades & Feedbacks
  const handleSaveGrades = async () => {
    if (!selectedAssignment) return;
    setSavingGrades(true);
    try {
      const gradesPayload = students
        .map(student => {
          const scoreVal = gradingScores[student._id];
          const feedbackVal = gradingFeedbacks[student._id] || "";
          if (scoreVal !== undefined && scoreVal !== "") {
            return {
              studentId: student._id,
              score: Number(scoreVal),
              feedback: feedbackVal
            };
          }
          return null;
        })
        .filter(item => item !== null) as { studentId: string; score: number; feedback?: string }[];

      await gradebookService.saveGrades({
        assignmentId: selectedAssignment._id,
        grades: gradesPayload
      });

      toast.success("Lưu điểm số và lời phê thành công!");
      setShowGradingModal(false);
      loadData();
    } catch {
      toast.error("Lưu điểm số thất bại!");
    } finally {
      setSavingGrades(false);
    }
  };

  // Filter assigned list by tab
  const filteredAssignments =
    activeTab === "all"
      ? assignments
      : assignments.filter((a) => a.category === activeTab);

  const getSubmissionsCount = (assignmentId: string) => {
    return grades.filter(g => g.assignmentId === assignmentId && g.score !== undefined).length;
  };

  const maxChartVal = Math.max(...chartData.map((d) => d.value));

  return (
    <div className={styles.container}>
      {/* ── TOP HEADER ── */}
      <div className={styles.topHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 className={styles.pageTitle}>Quản lý bài tập</h1>
          {!loadingClasses && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={styles.dropdownTriggerBtn}>
                  <span>
                    {selectedClass
                      ? `${selectedClass.name}${selectedClass.subject ? ` (${selectedClass.subject})` : ""}`
                      : "Chọn lớp học"}
                  </span>
                  <CaretDown size={14} weight="bold" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
                {classes.map((cls) => (
                  <DropdownMenuItem
                    key={cls._id}
                    onClick={() => setSelectedClassId(cls._id)}
                    className={`px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedClassId === cls._id ? "bg-orange-50 text-orange-600 font-semibold" : ""
                      }`}
                  >
                    {cls.name} {cls.subject ? `(${cls.subject})` : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className={styles.mainGrid}>
        {/* LEFT – CREATE FORM */}
        <div className={styles.leftCol}>
          <form className={styles.formCard} onSubmit={handleCreateAssignment}>
            <div className={styles.formHeader}>
              <Plus size={20} weight="bold" />
              <h2>Tạo bài tập mới</h2>
            </div>

            {/* Title */}
            <div className={styles.formGroup}>
              <label>Tiêu đề bài tập</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="VD: Ôn tập chương 2 - Giải tích"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Deadline + Type */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Hạn nộp</label>
                <input
                  type="date"
                  className={styles.textInput}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Loại đầu điểm</label>
                <select
                  className={styles.selectInput}
                  value={assignCategory}
                  onChange={(e) => setAssignCategory(e.target.value)}
                >
                  <option value="mieng">Điểm miệng (Hệ số 1)</option>
                  <option value="15phut">Điểm 15 phút (Hệ số 1)</option>
                  <option value="giuaky">Điểm giữa kỳ (Hệ số 2)</option>
                  <option value="cuoiky">Điểm cuối kỳ (Hệ số 3)</option>
                </select>
              </div>
            </div>

            {/* Max Score */}
            <div className={styles.formGroup}>
              <label>Điểm tối đa</label>
              <input
                type="number"
                className={styles.textInput}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                min={1}
                max={100}
                required
              />
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label>Mô tả chi tiết</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Nhập hướng dẫn làm bài cho học sinh..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Submit */}
            <button className={styles.btnSubmit} type="submit" disabled={creating}>
              {creating ? <Spinner size={18} className={styles.spinning} /> : <Play size={18} weight="fill" />}
              {creating ? "Đang giao..." : "Giao bài ngay"}
            </button>
          </form>
        </div>

        {/* RIGHT – ASSIGNED LIST + CHART */}
        <div className={styles.rightCol}>
          {/* Assigned List */}
          <div className={styles.assignedCard}>
            <div className={styles.assignedHeader}>
              <h3>Bài tập đã giao ({selectedClass?.name})</h3>
            </div>

            <div className={styles.assignedList}>
              {loadingData ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <Spinner size={32} className={styles.spinning} />
                </div>
              ) : filteredAssignments.map((item) => (
                <div key={item._id} className={styles.assignedItem} style={{ cursor: 'pointer' }} onClick={() => openGradingModal(item)}>
                  <div
                    className={styles.assignedIcon}
                    style={{ backgroundColor: '#f1f5f9' }}
                  >
                    <span>📝</span>
                  </div>
                  <div className={styles.assignedInfo}>
                    <h4>{item.title}</h4>
                    <div className={styles.assignedMeta}>
                      <span>
                        <Clock size={12} /> Hạn: {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                      </span>
                      <span>
                        <Users size={12} /> {getSubmissionsCount(item._id)}/{students.length} đã chấm
                      </span>
                    </div>
                  </div>
                  <button className={styles.editBtn}>
                    <PencilSimple size={16} />
                  </button>
                </div>
              ))}

              {!loadingData && filteredAssignments.length === 0 && (
                <div className={styles.emptyList}>
                  <BookOpen size={32} color="#cbd5e1" />
                  <p>Chưa có bài tập nào</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>
                <ChartBar size={20} weight="fill" />
                <h3>Tổng quan hành vi</h3>
              </div>
              <span className={styles.chartBadge}>
                <TrendUp size={14} weight="bold" />
                +12% tuần này
              </span>
            </div>
            <p className={styles.chartSubtitle}>
              Tỷ lệ nộp bài đúng hạn (7 ngày qua)
            </p>

            <div className={styles.chart}>
              {chartData.map((d, i) => (
                <div key={i} className={styles.chartCol}>
                  <div className={styles.barWrapper}>
                    <div
                      className={styles.bar}
                      style={{
                        height: `${(d.value / maxChartVal) * 100}%`,
                      }}
                    />
                  </div>
                  <span className={styles.barLabel}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GRADING & FEEDBACK MODAL */}
      {showGradingModal && selectedAssignment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3>Chấm điểm & Lời phê</h3>
                <p>Bài tập: <strong>{selectedAssignment.title}</strong> (Tối đa: {selectedAssignment.maxScore} điểm)</p>
              </div>
              <button onClick={() => setShowGradingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {students.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>Lớp học này chưa có học sinh.</p>
              ) : (
                students.map((student) => {
                  const submission = submissions.find(
                    (s: any) =>
                      (typeof s.studentId === "string" ? s.studentId : s.studentId?._id) === student._id
                  );

                  return (
                    <div
                      key={student._id}
                      className={styles.studentGradingRow}
                      style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12, paddingBottom: 16 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div className={styles.studentMeta}>
                          <span className={styles.studentName}>{student.name}</span>
                          <span className={styles.studentEmail}>{student.email}</span>
                        </div>

                        {/* Trạng thái nộp bài */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {loadingSubmissions ? (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Đang tải...</span>
                          ) : submission ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 12,
                                backgroundColor: submission.status === 'late' ? '#fef2f2' : '#f0fdf4',
                                color: submission.status === 'late' ? '#ef4444' : '#10b981'
                              }}
                            >
                              {submission.status === 'late' ? 'Nộp muộn' : 'Đã nộp'}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 12,
                                backgroundColor: '#f1f5f9',
                                color: '#64748b'
                              }}
                            >
                              Chưa nộp
                            </span>
                          )}
                        </div>

                        <div className={styles.gradingInputs}>
                          <input
                            type="number"
                            placeholder="Điểm"
                            className={styles.scoreInput}
                            min={0}
                            max={selectedAssignment.maxScore}
                            step="0.1"
                            value={gradingScores[student._id] || ""}
                            onChange={(e) => setGradingScores({ ...gradingScores, [student._id]: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder="Nhập lời phê..."
                            className={styles.feedbackInput}
                            value={gradingFeedbacks[student._id] || ""}
                            onChange={(e) => setGradingFeedbacks({ ...gradingFeedbacks, [student._id]: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Chi tiết câu trả lời / file của học sinh */}
                      {submission && (
                        <div
                          style={{
                            padding: '10px 12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: 8,
                            borderLeft: '3px solid #cbd5e1',
                            fontSize: 13,
                            color: '#334155',
                            marginTop: 4
                          }}
                        >
                          {submission.submissionText && (
                            <p style={{ margin: '0 0 6px 0', fontStyle: 'italic', color: '#475569' }}>
                              &ldquo;{submission.submissionText}&rdquo;
                            </p>
                          )}
                          {submission.attachments && submission.attachments.length > 0 && (
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              {submission.attachments.map((file: any, index: number) => (
                                <a
                                  key={index}
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    color: '#ef4444',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: 12
                                  }}
                                >
                                  <span>📄</span>
                                  <span style={{ textDecoration: 'underline' }}>{file.name}</span>
                                  {file.size && <span style={{ color: '#94a3b8', fontWeight: 400 }}>({file.size})</span>}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setShowGradingModal(false)}>
                Hủy bỏ
              </button>
              <button className={styles.btnConfirm} onClick={handleSaveGrades} disabled={savingGrades}>
                {savingGrades ? <Spinner size={16} className={styles.spinning} /> : <FloppyDisk size={16} />}
                {savingGrades ? "Đang lưu..." : "Lưu điểm & lời phê"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
