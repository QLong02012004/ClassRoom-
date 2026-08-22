import React, { useState, useEffect } from "react";
import { UserPlus, MagnifyingGlass, Plus, CheckCircle, Clock, CheckSquare, XCircle, Eye, EyeSlash, CaretDown } from "phosphor-react";
import { useToast } from "../../Styles/ToastContext";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { userService } from "../../../service/user.service";
import { authService } from "../../../service/auth.service";
import { AnimatedAddButton } from "../Buttons/AnimatedAddButton";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../dropdown-menu";

interface ManageStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: ITeacherClassroom | null;
  defaultTab?: 'pending' | 'add_existing' | 'create_new';
  onSuccess?: () => void;
}

export const ManageStudentsModal: React.FC<ManageStudentsModalProps> = ({
  isOpen,
  onClose,
  classroom,
  defaultTab = 'pending',
  onSuccess,
}) => {
  const toast = useToast();
  const [modalTab, setModalTab] = useState<'pending' | 'add_existing' | 'create_new'>(defaultTab);

  // State hiển thị/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  // State cho Tab 1: Yêu cầu chờ duyệt
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingPendingList, setLoadingPendingList] = useState(false);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  // State cho Tab 2: Thêm học sinh từ hệ thống
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // State cho Tab 3: Tạo học sinh mới
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    email: "",
    password: "",
    gradeLevel: "",
    school: "",
    phone: "",
    dob: "",
    gender: "",
    parentPhone: "",
    parentRelationship: ""
  });
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  // Load danh sách yêu cầu chờ duyệt
  const loadPendingRequests = async () => {
    if (!classroom?._id) return;
    setLoadingPendingList(true);
    try {
      const res = await classroomService.getPendingJoinRequests(classroom._id);
      if (res.data) {
        setPendingRequests(res.data);
      }
    } catch {
      toast.error("Không thể tải danh sách yêu cầu chờ duyệt");
    } finally {
      setLoadingPendingList(false);
    }
  };

  useEffect(() => {
    if (isOpen && classroom) {
      setModalTab(defaultTab);
      setStudentSearchQuery("");
      setStudentSearchResults([]);
      setSelectedStudentId(null);
      setNewStudentForm({
        name: "",
        email: "",
        password: "",
        gradeLevel: "",
        school: "",
        phone: "",
        dob: "",
        gender: "",
        parentPhone: "",
        parentRelationship: ""
      });
      loadPendingRequests();
    }
  }, [isOpen, classroom, defaultTab]);

  // Tìm kiếm học sinh trong hệ thống (chỉ tìm khi người dùng gõ từ khóa)
  useEffect(() => {
    if (isOpen && modalTab === "add_existing") {
      const query = studentSearchQuery.trim();
      if (!query) {
        setStudentSearchResults([]);
        setIsSearchingStudent(false);
        return;
      }
      setIsSearchingStudent(true);
      const timer = setTimeout(() => {
        userService.getUsers({ role: 'student', search: query })
          .then(res => {
            setStudentSearchResults(res.data || []);
            setIsSearchingStudent(false);
          })
          .catch(() => {
            setStudentSearchResults([]);
            setIsSearchingStudent(false);
          });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [studentSearchQuery, modalTab, isOpen]);

  const handleApproveStudent = async (requestId: string) => {
    if (!classroom) return;
    setProcessingActionId(requestId);
    try {
      await classroomService.approveJoinRequest(classroom._id, requestId);
      toast.success("Đã duyệt học sinh vào lớp!");
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Duyệt học sinh thất bại!");
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleRejectStudent = async (requestId: string) => {
    if (!classroom) return;
    setProcessingActionId(requestId);
    try {
      await classroomService.rejectJoinRequest(classroom._id, requestId);
      toast.info("Đã từ chối yêu cầu tham gia.");
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Từ chối thất bại!");
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleApproveAllStudents = async () => {
    if (!classroom) return;
    setProcessingActionId('all');
    try {
      const res = await classroomService.approveAllJoinRequests(classroom._id);
      toast.success(res.message || "Đã duyệt tất cả học sinh vào lớp!");
      setPendingRequests([]);
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Duyệt tất cả thất bại!");
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleAddExistingStudentDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom || !selectedStudentId) {
      toast.error("Vui lòng chọn một học sinh!");
      return;
    }
    setIsAddingStudent(true);
    try {
      await classroomService.addExistingStudent(classroom._id, selectedStudentId);
      toast.success(`Đã thêm học sinh vào lớp "${classroom.name}"!`);
      setSelectedStudentId(null);
      setStudentSearchQuery("");
      setStudentSearchResults([]);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể thêm học sinh vào lớp.");
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleCreateNewStudentDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom) return;
    if (!newStudentForm.name || !newStudentForm.email || !newStudentForm.password) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
    if (!passwordRegex.test(newStudentForm.password)) {
      toast.error("Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường, chữ số và ký tự đặc biệt!");
      return;
    }

    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const email = newStudentForm.email.trim().toLowerCase();

    if (!email || !strictEmailRegex.test(email)) {
      toast.error("Địa chỉ Email không đúng định dạng cú pháp chuẩn!");
      return;
    }

    setIsCreatingStudent(true);
    try {
      const response = await authService.createStudent({
        name: newStudentForm.name,
        email: newStudentForm.email,
        password: newStudentForm.password,
        parentPhone: newStudentForm.parentPhone || undefined,
        classId: classroom._id,
      });

      const createdUserId = response?.user?.id || response?.user?._id;
      if (createdUserId) {
        await userService.updateUser(createdUserId, {
          gradeLevel: newStudentForm.gradeLevel || undefined,
          school: newStudentForm.school || undefined,
          phone: newStudentForm.phone || undefined,
          dob: newStudentForm.dob || undefined,
          gender: newStudentForm.gender || undefined,
          parentRelationship: newStudentForm.parentRelationship || undefined
        });
      }

      toast.success(response?.message || `Tạo tài khoản học sinh "${newStudentForm.name}" thành công!`);
      setNewStudentForm({
        name: "",
        email: "",
        password: "",
        gradeLevel: "",
        school: "",
        phone: "",
        dob: "",
        gender: "",
        parentPhone: "",
        parentRelationship: ""
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi tạo tài khoản học sinh!");
    } finally {
      setIsCreatingStudent(false);
    }
  };

  if (!isOpen || !classroom) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full p-0 overflow-hidden shadow-2xl bg-white rounded-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER - TIÊU ĐỀ MÀU CAM $primary (#f47c20) */}
        <div className="bg-white border-b border-slate-200 p-5 flex items-start justify-between shrink-0 gap-4">
          <div className="flex flex-col gap-1 flex-1 min-w-0 pr-2">
            <h3 className="flex items-start gap-2 text-xl font-extrabold m-0 text-[#f47c20] leading-snug">
              <UserPlus size={26} weight="duotone" className="text-[#f47c20] shrink-0 mt-0.5" />
              <span>Yêu cầu tham gia & Thêm học sinh: {classroom.name}</span>
            </h3>
            <p className="text-slate-500 text-sm m-0">Quản lý học sinh tham gia và duyệt các yêu cầu xin vào lớp</p>
          </div>
          <button
            className="text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 border border-slate-200 cursor-pointer p-2 rounded-full hover:bg-rose-50 shrink-0 ml-2"
            onClick={onClose}
          >
            <XCircle size={20} weight="bold" />
          </button>
        </div>

        {/* TAB BAR HEADER */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${modalTab === 'pending' ? 'bg-white text-[#2f8fa3] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setModalTab('pending')}
          >
            <UserPlus size={16} weight="bold" />
            <span>Yêu cầu chờ duyệt ({pendingRequests.length})</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${modalTab === 'add_existing' ? 'bg-white text-[#2f8fa3] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setModalTab('add_existing')}
          >
            <MagnifyingGlass size={16} weight="bold" />
            <span>Thêm từ hệ thống</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${modalTab === 'create_new' ? 'bg-white text-[#2f8fa3] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setModalTab('create_new')}
          >
            <Plus size={16} weight="bold" />
            <span>Tạo tài khoản mới</span>
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 bg-slate-50/50 overflow-y-auto">
          {/* TAB 1: PENDING REQUESTS */}
          {modalTab === 'pending' && (
            <>
              {loadingPendingList ? (
                <div className="text-center py-16 text-slate-500 font-medium flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#2f8fa3] border-t-transparent rounded-full animate-spin"></div>
                  Đang tải danh sách chờ...
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center gap-3 bg-white m-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="w-14 h-14 bg-[#2f8fa3]/10 rounded-full flex items-center justify-center text-[#2f8fa3] mb-1">
                    <CheckCircle size={30} weight="duotone" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-base m-0">Không có học sinh nào đang chờ duyệt</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">Tất cả yêu cầu xin vào lớp học đã được phê duyệt xử lý.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* TOOLBAR */}
                  <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 z-10 relative">
                    <div className="flex flex-col">
                      <span className="text-base font-extrabold text-slate-800 flex items-center gap-1">
                        Có <strong className="text-[#f47c20] text-xl font-black px-0.5">{pendingRequests.length}</strong> học sinh đang chờ
                      </span>
                      <span className="text-xs text-slate-500 font-medium mt-0.5">Vui lòng duyệt để học sinh có thể vào lớp</span>
                    </div>
                    <AnimatedAddButton
                      type="button"
                      onClick={handleApproveAllStudents}
                      disabled={processingActionId === 'all'}
                      icon={<CheckSquare size={18} weight="bold" className="shrink-0" />}
                      className="px-5 py-2.5 text-xs rounded-xl"
                    >
                      <span>{processingActionId === 'all' ? "Đang xử lý..." : "Duyệt tất cả"}</span>
                    </AnimatedAddButton>
                  </div>

                  {/* LIST */}
                  <div className="flex flex-col gap-3 p-4 sm:p-6 overflow-y-auto">
                    {pendingRequests.map((req) => {
                      const student = req.studentId || {};
                      const isProcessing = processingActionId === req._id;
                      return (
                        <div key={req._id} className="group flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:shadow-md hover:border-[#2f8fa3]/40 transition-all gap-4">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative shrink-0">
                              <img
                                src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || "HS")}&background=f47c20&color=fff&bold=true`}
                                alt={student.name}
                                className="w-12 h-12 rounded-full border-2 border-slate-100 shadow-xs object-cover"
                              />
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#f47c20] border-2 border-white rounded-full" title="Chờ duyệt"></span>
                            </div>

                            <div className="flex flex-col min-w-0 flex-1 gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-800 text-base leading-none capitalize truncate group-hover:text-[#2f8fa3] transition-colors" title={student.name || "Học sinh"}>
                                  {student.name || "Học sinh"}
                                </span>
                                {student.email && (
                                  <span className="text-xs text-slate-500 font-medium truncate bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                                    {student.email}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                <Clock size={13} weight="bold" className="shrink-0 text-[#2f8fa3]" />
                                <span>Gửi yêu cầu: {new Date(req.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRejectStudent(req._id)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border-none active:scale-95"
                            >
                              <XCircle size={15} weight="bold" />
                              <span>Từ chối</span>
                            </button>
                            <AnimatedAddButton
                              type="button"
                              onClick={() => handleApproveStudent(req._id)}
                              disabled={isProcessing}
                              icon={<CheckCircle size={16} weight="bold" className="shrink-0" />}
                              className="px-4 py-2 text-xs rounded-xl"
                            >
                              <span>Duyệt</span>
                            </AnimatedAddButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* TAB 2: ADD EXISTING STUDENT FROM SYSTEM */}
          {modalTab === 'add_existing' && (
            <form onSubmit={handleAddExistingStudentDirect} className="p-6 flex flex-col gap-4 flex-1 justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5 shrink-0">
                  <label htmlFor="studentSearchQueryModal" className="text-xs font-bold text-slate-700">
                    Tìm kiếm học sinh có sẵn trong hệ thống
                  </label>
                  <div className="relative">
                    <MagnifyingGlass size={18} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="studentSearchQueryModal"
                      type="text"
                      placeholder="Nhập tên, email hoặc SĐT học sinh để tìm kiếm..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-[#2f8fa3] focus:ring-2 focus:ring-[#2f8fa3]/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-h-[160px] max-h-[220px] overflow-y-auto bg-white border border-slate-200 rounded-xl p-2 shadow-inner">
                  {isSearchingStudent ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-medium">Đang tìm kiếm học sinh...</div>
                  ) : studentSearchResults.length > 0 ? (
                    studentSearchResults.map((st: any) => {
                      const isSelected = selectedStudentId === st._id;
                      return (
                        <div
                          key={st._id}
                          onClick={() => setSelectedStudentId(st._id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-cyan-50/80 border-[#2f8fa3] shadow-xs' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={st.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=2f8fa3&color=fff&bold=true`}
                              alt={st.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800">{st.name}</span>
                              <span className="text-[11px] text-slate-500">{st.email} {st.parentPhone ? `• SĐT PH: ${st.parentPhone}` : ''}</span>
                            </div>
                          </div>
                          {isSelected && <CheckCircle size={18} weight="fill" className="text-[#2f8fa3]" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500 font-medium">
                      {studentSearchQuery.trim() ? "Không tìm thấy học sinh nào khớp với từ khóa" : "Vui lòng nhập tên, email hoặc SĐT học sinh ở trên để tìm kiếm"}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 border-none cursor-pointer"
                  onClick={onClose}
                >
                  Hủy bỏ
                </button>
                <AnimatedAddButton
                  type="submit"
                  disabled={!selectedStudentId || isAddingStudent}
                  className="!text-xs !py-2 !px-5"
                >
                  {isAddingStudent ? "Đang thêm..." : "Thêm vào lớp"}
                </AnimatedAddButton>
              </div>
            </form>
          )}

          {/* TAB 3: CREATE NEW STUDENT DIRECTLY */}
          {modalTab === 'create_new' && (
            <form onSubmit={handleCreateNewStudentDirect} className="p-6 flex flex-col gap-3.5 flex-1 justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="modalStudentName" className="text-xs font-bold text-slate-700">Họ và tên học sinh *</label>
                  <input
                    id="modalStudentName"
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={newStudentForm.name}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="modalStudentEmail" className="text-xs font-bold text-slate-700">Tên đăng nhập / Email *</label>
                  <input
                    id="modalStudentEmail"
                    type="email"
                    required
                    placeholder="Ví dụ: nva.class12@classroom.com"
                    value={newStudentForm.email}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="modalStudentPassword" className="text-xs font-bold text-slate-700">Mật khẩu khởi tạo *</label>
                  <div className="relative">
                    <input
                      id="modalStudentPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Ví dụ: 123456"
                      value={newStudentForm.password}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0 flex items-center justify-center"
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="modalStudentGrade" className="text-xs font-bold text-slate-700">Khối lớp (VD: 4, 5, 7, 8, 9, 12)</label>
                    <input
                      id="modalStudentGrade"
                      type="text"
                      placeholder="Ví dụ: 10"
                      value={newStudentForm.gradeLevel}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, gradeLevel: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="modalStudentSchool" className="text-xs font-bold text-slate-700">Trường học chính quy</label>
                    <input
                      id="modalStudentSchool"
                      type="text"
                      placeholder="Ví dụ: THPT Chuyên Hà Nội - Amsterdam"
                      value={newStudentForm.school}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, school: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="modalStudentPhone" className="text-xs font-bold text-slate-700">SĐT cá nhân học sinh</label>
                    <input
                      id="modalStudentPhone"
                      type="text"
                      placeholder="Ví dụ: 0912345678"
                      value={newStudentForm.phone}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="modalStudentDob" className="text-xs font-bold text-slate-700">Ngày sinh</label>
                    <input
                      id="modalStudentDob"
                      type="date"
                      value={newStudentForm.dob}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, dob: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="modalStudentGender" className="text-xs font-bold text-slate-700">Giới tính</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          id="modalStudentGender"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 flex items-center justify-between outline-none focus:border-[#f47c20] cursor-pointer"
                        >
                          <span className={newStudentForm.gender ? "text-slate-800 font-bold" : "text-slate-400"}>
                            {newStudentForm.gender || "-- Chọn giới tính --"}
                          </span>
                          <CaretDown size={14} className="text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[180px] bg-white border border-slate-100 shadow-xl rounded-xl p-1 z-[10000]">
                        {["Nam", "Nữ", "Khác"].map((val) => (
                          <DropdownMenuItem
                            key={val}
                            onClick={() => setNewStudentForm({ ...newStudentForm, gender: val })}
                            className={`cursor-pointer text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors ${newStudentForm.gender === val
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="modalStudentParentPhone" className="text-xs font-bold text-slate-700">SĐT Phụ huynh (Chính)</label>
                    <input
                      id="modalStudentParentPhone"
                      type="text"
                      placeholder="Ví dụ: 0987654321"
                      value={newStudentForm.parentPhone}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="modalStudentParentRelationship" className="text-xs font-bold text-slate-700">Mối quan hệ phụ huynh</label>
                    <input
                      id="modalStudentParentRelationship"
                      type="text"
                      placeholder="Ví dụ: Bố, Mẹ, Người giám hộ..."
                      value={newStudentForm.parentRelationship}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, parentRelationship: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 border-none cursor-pointer"
                  onClick={onClose}
                >
                  Hủy bỏ
                </button>
                <AnimatedAddButton
                  type="submit"
                  disabled={isCreatingStudent}
                  className="!text-xs !py-2 !px-5"
                >
                  {isCreatingStudent ? "Đang tạo..." : "Tạo tài khoản học sinh"}
                </AnimatedAddButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
