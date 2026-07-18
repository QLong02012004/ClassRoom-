import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, UserList, EnvelopeSimple, Key, CaretLeft, Phone, Pencil, Trash } from "phosphor-react";
import { getMockStudents, addMockStudent, updateMockStudent, deleteMockStudent, getMockClassrooms } from "../../../utils/mockDb.ts";
import type { Student, Classroom } from "../../../utils/mockDb.ts";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../../components/ui/alert-dialog";
import { authService } from "../../../service/auth.service.ts";
import { classroomService } from "../../../service/classroom.service.ts";
import { attendanceService } from "../../../service/attendance.service.ts";
import { userService } from "../../../service/user.service.ts";
import { AnimatedAddButton } from "../../../components/ui/AnimatedAddButton";
import { StudentsTable } from "../../../components/ui/StudentsTable";
import styles from "./TeacherStudents.module.scss";

export default function TeacherStudents() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", password: "", parentPhone: "" });
  
  // States for adding existing student
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // States for editing student
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "", parentPhone: "" });

  // Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk' | null;
    studentId?: string;
    studentName?: string;
    studentIds?: string[];
  }>({ isOpen: false, type: null });

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

  useEffect(() => {
    if (activeTab === "existing" && searchQuery.trim().length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        userService.getUsers({ role: 'student', search: searchQuery })
          .then(res => {
             setSearchResults(res.data || []);
             setIsSearching(false);
          })
          .catch(() => {
             setSearchResults([]);
             setIsSearching(false);
          });
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const handleAddExistingStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedStudentId) {
      toast.error("Vui lòng chọn một học sinh!");
      return;
    }
    try {
      await classroomService.addExistingStudent(id, selectedStudentId);
      toast.success("Đã thêm học sinh vào lớp thành công!");
      setShowModal(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedStudentId(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi thêm học sinh.");
    }
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'single',
      studentId,
      studentName
    });
  };

  const handleBulkDelete = (studentIds: string[]) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'bulk',
      studentIds
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm.type === 'single' && deleteConfirm.studentId) {
      try {
        const ok = deleteMockStudent(deleteConfirm.studentId);
        if (ok) {
          toast.success(`Đã xóa học sinh "${deleteConfirm.studentName}" thành công!`);
          loadData();
        } else {
          toast.error("Không tìm thấy học sinh để xóa.");
        }
      } catch (err) {
        toast.error("Lỗi khi xóa tài khoản học sinh.");
      }
    } else if (deleteConfirm.type === 'bulk' && deleteConfirm.studentIds) {
      try {
        let count = 0;
        deleteConfirm.studentIds.forEach(id => {
          if (deleteMockStudent(id)) count++;
        });
        toast.success(`Đã xóa ${count} học sinh thành công!`);
        loadData();
      } catch (err) {
        toast.error("Lỗi khi xóa tài khoản học sinh.");
      }
    }
    setDeleteConfirm({ isOpen: false, type: null });
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

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    if (!editForm.name || !editForm.email) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      // 1. Gọi API cập nhật thông tin user
      await userService.updateUser(editingStudentId, {
        name: editForm.name,
        email: editForm.email,
        parentPhone: editForm.parentPhone || undefined
      } as any);

      // 2. Nếu có nhập mật khẩu mới thì gọi API reset password
      if (editForm.password) {
        await userService.resetUserPassword(editingStudentId, editForm.password);
      }

      // 3. Vẫn update mockDb để dự phòng nếu backend không hoạt động
      updateMockStudent(editingStudentId, editForm.name, editForm.parentPhone || "Không có", editForm.email, editForm.password);
      
      toast.success(`Cập nhật tài khoản học sinh "${editForm.name}" thành công!`);
      setShowEditModal(false);
      setEditingStudentId(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật tài khoản học sinh.");
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
        <AnimatedAddButton onClick={() => setShowModal(true)}>
          Thêm Học sinh
        </AnimatedAddButton>
      </div>

      {/* TABLE */}
      <StudentsTable
        students={students}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteStudent}
        onBulkDelete={handleBulkDelete}
      />

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Thêm Học Sinh Vào Lớp</h3>
            
            <div className={styles.tabHeader}>
              <button 
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'new' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('new')}
              >
                Tạo mới
              </button>
              <button 
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'existing' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('existing')}
              >
                Thêm từ hệ thống
              </button>
            </div>

            {activeTab === 'new' && (
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
            )}

            {activeTab === 'existing' && (
              <form onSubmit={handleAddExistingStudent}>
                <div className={styles.formGroup}>
                  <label htmlFor="searchQuery">Tìm kiếm học sinh</label>
                  <input
                    id="searchQuery"
                    type="text"
                    placeholder="Nhập tên, email hoặc SĐT để tìm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {searchQuery.trim().length > 0 && (
                  <div className={styles.searchResults}>
                    {isSearching ? (
                      <div className={styles.noResults}>Đang tìm kiếm...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user: any) => (
                        <div 
                          key={user._id} 
                          className={`${styles.searchItem} ${selectedStudentId === user._id ? styles.selectedItem : ''}`}
                          onClick={() => setSelectedStudentId(user._id)}
                        >
                          <div className={styles.itemName}>{user.name}</div>
                          <div className={styles.itemEmail}>{user.email} - {user.parentPhone || 'Chưa có SĐT'}</div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noResults}>Không tìm thấy học sinh nào.</div>
                    )}
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    className={styles.btnConfirm} 
                    disabled={!selectedStudentId}
                    style={{ opacity: !selectedStudentId ? 0.5 : 1, cursor: !selectedStudentId ? 'not-allowed' : 'pointer' }}
                  >
                    Thêm vào lớp
                  </button>
                </div>
              </form>
            )}
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
                <label htmlFor="editStudentPassword">Mật khẩu mới (Reset mật khẩu - Bỏ trống nếu không đổi)</label>
                <input
                  id="editStudentPassword"
                  type="text"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteConfirm.isOpen} 
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm({ isOpen: false, type: null });
        }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 text-xl">Xác nhận xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              {deleteConfirm.type === 'single' 
                ? `Bạn có chắc chắn muốn xóa tài khoản học sinh "${deleteConfirm.studentName}" khỏi lớp này không? Hành động này không thể hoàn tác.`
                : `Bạn có chắc chắn muốn xóa ${deleteConfirm.studentIds?.length || 0} học sinh đã chọn khỏi lớp? Hành động này không thể hoàn tác.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-700 border-slate-300 hover:bg-slate-100">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}
            >
              Xóa ngay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
