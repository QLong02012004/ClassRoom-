import React, { useState, useEffect } from "react";
import { Plus, User } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { getMockDb } from "../../../utils/mockDb.ts";
import type { Classroom, Student } from "../../../utils/mockDb.ts";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import { classroomService } from "../../../service/classroom.service.ts";
import styles from "./StudentClassrooms.module.scss";

export default function StudentClassrooms() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string>("Học sinh A");
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinClass = async () => {
    if (!classCode.trim()) return;
    try {
      setIsJoining(true);
      const res = await classroomService.joinClassByCode(classCode.trim());
      toast.success(res.message || "Tham gia lớp học thành công!");
      setShowJoinModal(false);
      setClassCode("");
      loadData(); // Reload danh sách lớp
    } catch (err: any) {
      toast.error(err.message || "Không thể tham gia lớp học, kiểm tra lại mã Code.");
    } finally {
      setIsJoining(false);
    }
  };

  const loadData = async () => {
    const currentUsername = user?.name || localStorage.getItem("username") || "Học sinh A";
    setUsername(currentUsername);

    try {
      // 1. Lấy dữ liệu lớp học thật từ backend
      const res = await classroomService.getStudentClassrooms();
      if (res && res.data && res.data.length > 0) {
        // Ánh xạ cấu trúc dữ liệu backend sang định dạng FE mong đợi
        const backendClasses = res.data.map((c: any) => ({
          _id: c._id,
          className: c.name || c.className,
          subject: c.subject || "",
          teacherName: c.teacherId?.name || "Thầy Nguyễn Văn A",
          studentCount: c.students?.length || 0,
          avatars: c.students?.slice(0, 3).map((s: any) => {
            if (s.avatar) return s.avatar;
            const fallbackName = s.name || "HS";
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=FE6747&color=fff&size=80`;
          }) || [],
          status: c.status,
          attendanceRate: c.attendanceRate || Math.floor(Math.random() * (100 - 85 + 1)) + 85
        }));
        setClassrooms(backendClasses);
        return;
      }
    } catch (err) {
      console.warn("Không thể tải danh sách lớp từ API, chuyển sang dùng Mock DB:", err);
    }

    // Fallback: Tìm trong Mock DB
    const db = getMockDb();
    const studentRecords = db.students.filter(
      s => s.name.toLowerCase() === currentUsername.toLowerCase()
    );
    const joinedClassIds = studentRecords.map(s => s.classId);
    const listClassrooms = db.classrooms.filter(c => joinedClassIds.includes(c._id));

    // Tính tỷ lệ chuyên cần từ attendances
    let totalAtt = 0;
    let presentAtt = 0;
    const sIds = studentRecords.map(s => s._id);
    db.attendances.forEach(att => {
      att.records.forEach(rec => {
        if (sIds.includes(rec.studentId)) {
          totalAtt++;
          if (rec.status === "present" || rec.status === "late") {
            presentAtt++;
          }
        }
      });
    });
    const globalAttendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 92;

    const mappedMockClasses = listClassrooms.map(c => {
      const classStudents = db.students.filter(s => s.classId === c._id);
      return {
        ...c,
        className: c.className,
        teacherName: c.teacherId, // Mock DB format
        studentCount: classStudents.length,
        avatars: classStudents.slice(0, 3).map(s => {
          if (s.avatar) return s.avatar;
          return `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=FE6747&color=fff&size=80`;
        }),
        attendanceRate: globalAttendanceRate
      };
    });
    setClassrooms(mappedMockClasses);
  };

  useEffect(() => {
    loadData();
  }, [username, user]);

  // Avatar học sinh ngẫu nhiên cho lớp học thêm
  const mockAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=80&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
  ];

  return (
    <div className={styles.classroomsPage}>
      {/* 1. TOP HEADER SECTION */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h2>Lớp học của tôi</h2>
          <p>Quản lý và theo dõi tiến độ tham gia lớp học của bạn.</p>
        </div>
        <button className={styles.btnJoinHeader} onClick={() => setShowJoinModal(true)}>
          <Plus size={20} weight="bold" />
          <span>Tham gia lớp học</span>
        </button>
      </div>

      {/* JOIN CLASS MODAL */}
      {showJoinModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Tham gia lớp học</h3>
            <div className={styles.formGroup}>
              <label>Mã lớp học (6 ký tự)</label>
              <input
                type="text"
                placeholder="VD: REACT1"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => {
                  setShowJoinModal(false);
                  setClassCode("");
                }}
              >
                Hủy
              </button>
              <button
                className={styles.btnConfirm}
                onClick={handleJoinClass}
                disabled={isJoining || classCode.length < 3}
              >
                {isJoining ? "Đang xử lý..." : "Tham gia"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CLASSES GRID */}
      <div className={styles.classesGrid}>
        {classrooms.map((cls) => (
          <div
            key={cls._id}
            className={styles.classCard}
            onClick={() => navigate(`/classrooms/${cls._id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.cardTop}>
              <h3 className={styles.classTitle} style={{ margin: 0 }}>{cls.className}</h3>
              <span className={styles.statusTag}>Đang diễn ra</span>
            </div>

            <div className={styles.cardMiddle}>
              <div className={styles.teacherInfo}>
                <User size={16} weight="bold" />
                <span style={{ textTransform: 'capitalize' }}>
                  {(() => {
                    const name = (cls.teacherName || cls.teacher?.name || "Nguyễn Văn A").toLowerCase();
                    if (name.startsWith("thầy") || name.startsWith("cô") || name.startsWith("gv") || name.startsWith("giáo viên")) {
                      return name;
                    }
                    return `Thầy/Cô ${name}`;
                  })()}
                </span>
              </div>
            </div>

            <div className={styles.cardProgress}>
              <div className={styles.progressText}>
                <span>Chuyên cần</span>
                <span className={styles.progressVal}>{cls.attendanceRate}%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${cls.attendanceRate}%` }}
                />
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.avatarsGroup}>
                {cls.avatars && cls.avatars.length > 0 && (
                  cls.avatars.map((av: string, index: number) => (
                    <img
                      key={index}
                      src={av}
                      alt="Student avatar"
                      style={{ zIndex: 3 - index }}
                      onError={(e) => { (e.target as HTMLImageElement).src = mockAvatars[index % mockAvatars.length]; }}
                    />
                  ))
                )}
                {cls.studentCount > 3 && (
                  <span className={styles.avatarMore}>+{cls.studentCount - 3}</span>
                )}
              </div>
              <span className={styles.studentCountText}>{cls.studentCount} học sinh</span>
            </div>
          </div>
        ))}

        {/* Placeholder if not joined any class */}
        {classrooms.length === 0 && (
          <div className={styles.emptyStateCard}>
            <div className={styles.emptyIconBox}>
              <User size={32} weight="bold" />
            </div>
            <h4>Chưa có lớp học</h4>
            <p>Tài khoản của bạn chưa được phân vào lớp học nào. Vui lòng liên hệ giáo viên để được thêm vào lớp.</p>
          </div>
        )}
      </div>

      {/* 3. BOTTOM BANNER */}
      <div className={styles.bottomBanner}>
        <div className={styles.bannerContent}>
          <h3>Học tập hiệu quả hơn mỗi ngày</h3>
          <p>
            Tham gia đầy đủ các tiết học và hoàn thành bài tập đúng hạn để tích lũy điểm chuyên cần cao nhất.
          </p>
        </div>
      </div>
    </div>
  );
}
