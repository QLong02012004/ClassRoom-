import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, UserList, EnvelopeSimple, Key, CaretLeft, Phone, Pencil, Trash, CaretDown } from "phosphor-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../components/ui/dropdown-menu";
import { authService } from "../../../service/auth.service.ts";
import { classroomService } from "../../../service/classroom.service.ts";
import { attendanceService } from "../../../service/attendance.service.ts";
import { userService } from "../../../service/user.service.ts";
import { AnimatedAddButton } from "../../../components/ui/Buttons/AnimatedAddButton";
import { BackButton } from "../../../components/ui/Buttons/BackButton";
import { StudentsTable } from "../../../components/ui/Tables/StudentsTable";
import { ManageStudentsModal } from "../../../components/ui/Dialogs/ManageStudentsModal";
import type { ITeacherClassroom } from "../../../service/classroom.service";
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
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    parentPhone: "",
    parentRelationship: "",
    gradeLevel: "",
    school: "",
    phone: "",
    dob: "",
    gender: ""
  });

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
          parentRelationship: s.parentRelationship || "",
          gradeLevel: s.gradeLevel || "",
          school: s.school || "",
          phone: s.phone || "",
          dob: s.dob || "",
          gender: s.gender || "",
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

  const confirmDelete = async () => {
    if (deleteConfirm.type === 'single' && deleteConfirm.studentId) {
      try {
        if (id) {
          await classroomService.removeStudentFromClassroom(id, deleteConfirm.studentId);
        }
        deleteMockStudent(deleteConfirm.studentId);
        toast.success(`Đã mời học sinh "${deleteConfirm.studentName}" ra khỏi lớp thành công!`);
        loadData();
      } catch (err: any) {
        toast.error(err.message || "Lỗi khi xóa học sinh khỏi lớp.");
      }
    } else if (deleteConfirm.type === 'bulk' && deleteConfirm.studentIds) {
      try {
        let count = 0;
        for (const sId of deleteConfirm.studentIds) {
          if (id) {
            await classroomService.removeStudentFromClassroom(id, sId);
          }
          deleteMockStudent(sId);
          count++;
        }
        toast.success(`Đã mời ${count} học sinh ra khỏi lớp thành công!`);
        loadData();
      } catch (err: any) {
        toast.error(err.message || "Lỗi khi xóa học sinh khỏi lớp.");
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
      parentPhone: student.parentPhone === "Không có" ? "" : student.parentPhone,
      parentRelationship: student.parentRelationship || "",
      gradeLevel: student.gradeLevel || "",
      school: student.school || "",
      phone: student.phone || "",
      dob: student.dob || "",
      gender: student.gender || ""
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
        parentPhone: editForm.parentPhone || undefined,
        parentRelationship: editForm.parentRelationship || undefined,
        gradeLevel: editForm.gradeLevel || undefined,
        school: editForm.school || undefined,
        phone: editForm.phone || undefined,
        dob: editForm.dob || undefined,
        gender: editForm.gender || undefined
      } as any);

      // 2. Nếu có nhập mật khẩu mới thì gọi API reset password
      if (editForm.password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
        if (!passwordRegex.test(editForm.password)) {
          toast.error("Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường, chữ số và ký tự đặc biệt!");
          return;
        }
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
      <div>
        <BackButton onClick={() => navigate("/classrooms")}>
          Quay lại danh sách lớp
        </BackButton>
      </div>

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

      {/* MANAGE STUDENTS MODAL */}
      <ManageStudentsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        classroom={classroom ? {
          _id: classroom._id,
          name: (classroom as any).name || classroom.className || "Lớp học",
          code: classroom.classCode || (classroom as any).code,
          subject: classroom.subject
        } as ITeacherClassroom : null}
        defaultTab="add_existing"
        onSuccess={loadData}
      />

      {/* EDIT MODAL - Reused layout & design from Student Profile */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[860px] p-0 overflow-hidden rounded-2xl gap-0">
          <DialogHeader className="px-6 pt-5 pb-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                ✏️ Cập nhật thông tin học sinh
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Chỉnh sửa thông tin cá nhân, tài khoản đăng nhập, khối lớp, trường học và phụ huynh liên hệ.
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdateStudent}>
            <div className="p-6 grid grid-cols-2 gap-x-7 gap-y-5 max-h-[75vh] overflow-y-auto">
              {/* ── CỘT TRÁI ── */}
              <div className="space-y-5">
                {/* Tài khoản & Cá nhân */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 bg-[#f47c20] rounded-full" />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Tài khoản & Cá nhân</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label htmlFor="editStudentName" className="text-xs font-bold text-slate-600">Họ và tên <span className="text-red-500">*</span></Label>
                      <Input
                        id="editStudentName"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                        className="h-9 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-[#f47c20]/20 text-sm font-medium"
                        placeholder="Nhập họ và tên..."
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="editStudentEmail" className="text-xs font-bold text-slate-600">Tên đăng nhập / Email <span className="text-red-500">*</span></Label>
                      <Input
                        id="editStudentEmail"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                        className="h-9 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-[#f47c20]/20 text-sm font-medium"
                        placeholder="Ví dụ: nva.class6@classroom.com"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="editStudentPassword" className="text-xs font-bold text-slate-600">Mật khẩu mới (Reset - Bỏ trống nếu không đổi)</Label>
                      <Input
                        id="editStudentPassword"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        className="h-9 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-[#f47c20]/20 text-sm font-medium"
                        placeholder="Nhập mật khẩu mới..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="grid gap-1">
                        <Label htmlFor="editStudentDob" className="text-xs font-bold text-slate-600">Ngày sinh</Label>
                        <Input
                          id="editStudentDob"
                          type="date"
                          value={editForm.dob}
                          onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                          className="h-9 rounded-xl border-slate-200 focus:border-[#f47c20] focus:ring-[#f47c20]/20 text-sm"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="editStudentGender" className="text-xs font-bold text-slate-600">Giới tính</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              id="editStudentGender"
                              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 flex items-center justify-between hover:border-[#f47c20] focus:outline-none focus:ring-2 focus:ring-[#f47c20]/30 transition-colors cursor-pointer"
                            >
                              <span className={editForm.gender ? "text-slate-800 font-bold" : "text-slate-400"}>
                                {editForm.gender || "Chọn giới tính"}
                              </span>
                              <CaretDown size={14} className="text-slate-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[180px] bg-white border border-slate-100 shadow-xl rounded-xl p-1 z-[10000]">
                            {["Nam", "Nữ", "Khác"].map((val) => (
                              <DropdownMenuItem
                                key={val}
                                onClick={() => setEditForm({ ...editForm, gender: val })}
                                className={`cursor-pointer text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors ${editForm.gender === val
                                    ? "bg-orange-50 text-[#f47c20] font-bold"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                  }`}
                              >
                                {val}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SĐT Cá nhân */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Liên lạc học sinh</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label htmlFor="editStudentPhone" className="text-xs font-bold text-slate-600">SĐT Cá nhân</Label>
                      <Input
                        id="editStudentPhone"
                        type="tel"
                        placeholder="VD: 0901 234 567"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="h-9 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CỘT PHẢI ── */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 bg-blue-500 rounded-full" />
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Trường học & Phụ huynh</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="grid gap-1">
                        <Label htmlFor="editGradeLevel" className="text-xs font-bold text-slate-600">Khối lớp (VD: 4, 5, 7, 8...)</Label>
                        <Input
                          id="editGradeLevel"
                          placeholder="VD: 10"
                          value={editForm.gradeLevel}
                          onChange={(e) => setEditForm({ ...editForm, gradeLevel: e.target.value })}
                          className="h-9 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="editSchool" className="text-xs font-bold text-slate-600">Trường học ban ngày</Label>
                        <Input
                          id="editSchool"
                          placeholder="VD: THPT Lê Hồng Phong"
                          value={editForm.school}
                          onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                          className="h-9 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="grid gap-1">
                        <Label htmlFor="editParentPhone" className="text-xs font-bold text-slate-600">SĐT Phụ huynh (Chính)</Label>
                        <Input
                          id="editParentPhone"
                          placeholder="VD: 0987 654 321"
                          value={editForm.parentPhone}
                          onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                          className="h-9 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="editParentRelationship" className="text-xs font-bold text-slate-600">Mối quan hệ</Label>
                        <Input
                          id="editParentRelationship"
                          placeholder="VD: Bố, Mẹ..."
                          value={editForm.parentRelationship}
                          onChange={(e) => setEditForm({ ...editForm, parentRelationship: e.target.value })}
                          className="h-9 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-medium">
                💡 Thay đổi sẽ được lưu ngay lập tức vào hồ sơ học sinh.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingStudentId(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#f47c20] hover:bg-[#d96610] shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
