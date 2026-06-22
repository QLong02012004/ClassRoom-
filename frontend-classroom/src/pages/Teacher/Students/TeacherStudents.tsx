import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, UserList, EnvelopeSimple, Key, CaretLeft, Phone, Pencil, Trash } from "phosphor-react";
import { getMockStudents, addMockStudent, updateMockStudent, deleteMockStudent, getMockClassrooms } from "../../../utils/mockDb.ts";
import type { Student, Classroom } from "../../../utils/mockDb.ts";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { authService } from "../../../service/auth.service.ts";
import { classroomService } from "../../../service/classroom.service.ts";
import { attendanceService } from "../../../service/attendance.service.ts";
import styles from "./TeacherStudents.module.scss";

export default function TeacherStudents() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", password: "", parentPhone: "" });
  
  // States for editing student
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "", parentPhone: "" });

  const loadData = async () => {
    if (!id) return;

    try {
      // 1. Tải danh sách học sinh thật của lớp từ backend
      const resStudents = await attendanceService.getClassroomStudents(id);
      if (resStudents && resStudents.data) {
        const list = resStudents.data.map((s: any) => ({
          _id: s._id,
          name: s.name,
          email: s.email,
          parentPhone: s.parentPhone || "Không có",
          password: s.password || "••••••••"
        })) as any[];
        setStudents(list);
      }
    } catch (err) {
      console.warn("Không thể tải học sinh từ API, dùng mock:", err);
      const list = getMockStudents(id);
      setStudents(list);
    }

    try {
      // 2. Tải thông tin lớp học từ backend
      const res = await classroomService.getClassroomDetail(id);
      if (res && res.data) {
        const backendClass = {
          _id: res.data._id,
          className: res.data.name,
          subject: res.data.subject || "",
          code: res.data.code,
          teacherName: (res.data as any).teacherId?.name || "Giáo viên",
          studentCount: res.data.students?.length || 0
        } as any;
        setClassroom(backendClass);
        return;
      }
    } catch (err) {
      console.warn("Không thể tải thông tin lớp từ API, chuyển sang mock:", err);
    }

    const classrooms = getMockClassrooms();
    const cls = classrooms.find(c => c._id === id);
    if (cls) setClassroom(cls);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      // Gọi API thực tế
      const response = await authService.createStudent({
        name: newStudent.name,
        email: newStudent.email,
        password: newStudent.password,
        parentPhone: newStudent.parentPhone || undefined,
        classId: id,
      });

      const apiUser = response?.user;

      // Đồng bộ vào Mock DB ở LocalStorage để hiển thị lên UI
      addMockStudent(
        id, 
        apiUser?.name || newStudent.name, 
        newStudent.parentPhone || "Không có", 
        apiUser?.email || newStudent.email, 
        newStudent.password
      );

      toast.success(response?.message || `Tạo tài khoản học sinh "${newStudent.name}" thành công!`, 3000);
      setNewStudent({ name: "", email: "", password: "", parentPhone: "" });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi tạo tài khoản!");
    }
  };

  const handleDeleteStudent = (studentId: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản học sinh "${name}" khỏi lớp này không?`)) {
      try {
        const ok = deleteMockStudent(studentId);
        if (ok) {
          toast.success(`Đã xóa học sinh "${name}" thành công!`);
          loadData();
        } else {
          toast.error("Không tìm thấy học sinh để xóa.");
        }
      } catch (err) {
        toast.error("Lỗi khi xóa tài khoản học sinh.");
      }
    }
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudentId(student._id);
    setEditForm({
      name: student.name,
      email: student.email || "",
      password: student.password || "",
      parentPhone: student.parentPhone === "Không có" ? "" : student.parentPhone
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    if (!editForm.name || !editForm.email || !editForm.password) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      updateMockStudent(editingStudentId, editForm.name, editForm.parentPhone || "Không có", editForm.email, editForm.password);
      toast.success(`Cập nhật tài khoản học sinh "${editForm.name}" thành công!`);
      setShowEditModal(false);
      setEditingStudentId(null);
      loadData();
    } catch (err) {
      toast.error("Lỗi khi cập nhật tài khoản học sinh.");
    }
  };

  if (!classroom) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.page}>
      <button className={styles.btnBack} onClick={() => navigate("/classrooms")}>
        <CaretLeft size={20} weight="bold" />
        Quay lại danh sách lớp
      </button>

      {/* HEADER */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h2>Quản lý Học sinh - {classroom.className}</h2>
          <p>Tạo tài khoản học viên tham gia lớp học và cung cấp thông tin đăng nhập cho học sinh.</p>
        </div>
        <button className={styles.btnCreateHeader} onClick={() => setShowModal(true)}>
          <Plus size={18} weight="bold" />
          <span>Thêm Học sinh</span>
        </button>
      </div>

      {/* GRID */}
      <div className={styles.studentsGrid}>
        {students.length === 0 ? (
          <div className={styles.emptyState}>Chưa có học sinh nào trong lớp.</div>
        ) : (
          students.map((student) => (
            <div key={student._id} className={styles.studentCard}>
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>
                  <UserList size={24} weight="duotone" />
                </div>
                <span className={styles.codeTag}>{student.studentCode}</span>
              </div>

              <div className={styles.cardMiddle}>
                <h3 className={styles.studentName}>{student.name}</h3>
                <div className={styles.infoRow}>
                  <EnvelopeSimple size={14} weight="bold" />
                  <span>{student.email || "Chưa có email"}</span>
                </div>
                <div className={styles.infoRow}>
                  <Key size={14} weight="bold" />
                  <span>Mật khẩu: <strong>{student.password || "********"}</strong></span>
                </div>
                <div className={styles.infoRow}>
                  <Phone size={14} weight="bold" />
                  <span>PHHS: {student.parentPhone}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button 
                  className={styles.btnActionEdit}
                  onClick={() => handleOpenEditModal(student)}
                  title="Sửa thông tin / Reset mật khẩu"
                >
                  <Pencil size={14} weight="bold" />
                  Sửa / Đổi MK
                </button>
                <button 
                  className={styles.btnActionDelete}
                  onClick={() => handleDeleteStudent(student._id, student.name)}
                  title="Xóa tài khoản học sinh"
                >
                  <Trash size={14} weight="bold" />
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Tạo Tài Khoản Học Sinh</h3>
            <form onSubmit={handleCreateStudent}>
              <div className={styles.formGroup}>
                <label htmlFor="studentName">Họ và tên</label>
                <input
                  id="studentName"
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="studentEmail">Tên đăng nhập / Email</label>
                <input
                  id="studentEmail"
                  type="text"
                  required
                  placeholder="Ví dụ: nva.class6@classroom.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="studentPassword">Mật khẩu khởi tạo</label>
                <input
                  id="studentPassword"
                  type="text"
                  required
                  placeholder="Ví dụ: password123"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="parentPhone">SĐT Phụ huynh (tùy chọn)</label>
                <input
                  id="parentPhone"
                  type="text"
                  placeholder="Ví dụ: 09xx"
                  value={newStudent.parentPhone}
                  onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.btnConfirm}>
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowEditModal(false); setEditingStudentId(null); }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Cập Nhật & Reset Mật Khẩu</h3>
            <form onSubmit={handleUpdateStudent}>
              <div className={styles.formGroup}>
                <label htmlFor="editStudentName">Họ và tên</label>
                <input
                  id="editStudentName"
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editStudentEmail">Tên đăng nhập / Email</label>
                <input
                  id="editStudentEmail"
                  type="text"
                  required
                  placeholder="Ví dụ: nva.class6@classroom.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editStudentPassword">Mật khẩu mới (Reset mật khẩu)</label>
                <input
                  id="editStudentPassword"
                  type="text"
                  required
                  placeholder="Ví dụ: password123"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editParentPhone">SĐT Phụ huynh (tùy chọn)</label>
                <input
                  id="editParentPhone"
                  type="text"
                  placeholder="Ví dụ: 09xx"
                  value={editForm.parentPhone}
                  onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.btnCancel} 
                  onClick={() => { setShowEditModal(false); setEditingStudentId(null); }}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.btnConfirm}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
