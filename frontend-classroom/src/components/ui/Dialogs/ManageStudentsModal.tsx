import React, { useState, useEffect } from "react";
import { UserPlus, MagnifyingGlass, Plus, CheckCircle, Clock, CheckSquare, XCircle, Eye, EyeSlash } from "phosphor-react";
import { useToast } from "../../Styles/ToastContext";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import { userService } from "../../../service/user.service";
import { authService } from "../../../service/auth.service";
import { AnimatedAddButton } from "../Buttons/AnimatedAddButton";

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
  const [newStudentForm, setNewStudentForm] = useState({ name: "", email: "", password: "", parentPhone: "" });
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
      setNewStudentForm({ name: "", email: "", password: "", parentPhone: "" });
      loadPendingRequests();
    }
  }, [isOpen, classroom, defaultTab]);

  // Tìm kiếm học sinh trong hệ thống
  useEffect(() => {
    if (isOpen && modalTab === "add_existing") {
      setIsSearchingStudent(true);
      const timer = setTimeout(() => {
        userService.getUsers({ role: 'student', search: studentSearchQuery.trim() })
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
    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const email = newStudentForm.email.trim().toLowerCase();

    if (!email || !strictEmailRegex.test(email)) {
      toast.error("Địa chỉ Email không đúng định dạng cú pháp chuẩn (ví dụ: student@school.edu.vn hoặc user@gmail.com)!");
      return;
    }

    const domain = email.split('@')[1] || '';
    const allowedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'edu.vn', 'school.edu.vn', 'classroom.com'];
    const isStandardDomain = allowedDomains.some(d => domain === d || domain.endsWith('.' + d));

    if (!isStandardDomain && (/[0-9]{3,}/.test(domain) || domain.length > 20)) {
      toast.error("Tên miền Email nghi vấn rác (ví dụ: chứa dãy số ngẫu nhiên)! Vui lòng sử dụng email thật.");
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

      toast.success(response?.message || `Tạo tài khoản học sinh "${newStudentForm.name}" thành công!`);
      setNewStudentForm({ name: "", email: "", password: "", parentPhone: "" });
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
        <div className="bg-white border-b border-slate-200 p-5 flex items-start justify-between shrink-0">
          <div className="flex flex-col gap-1">
            <h3 className="flex items-center gap-2 text-xl font-extrabold m-0 text-[#f47c20]">
              <UserPlus size={26} weight="duotone" className="text-[#f47c20]" />
              Yêu cầu tham gia & Thêm học sinh: {classroom.name}
            </h3>
            <p className="text-slate-500 text-sm m-0">Quản lý học sinh tham gia và duyệt các yêu cầu xin vào lớp</p>
          </div>
          <button
            className="text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 border border-slate-200 cursor-pointer p-2 rounded-full hover:bg-rose-50 shrink-0"
            onClick={onClose}
          >
            <XCircle size={20} weight="bold" />
          </button>
        </div>

        {/* TAB BAR HEADER */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${modalTab === 'pending' ? 'bg-white text-[#f47c20] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setModalTab('pending')}
          >
            <UserPlus size={16} weight="bold" />
            <span>Yêu cầu chờ duyệt ({pendingRequests.length})</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${modalTab === 'add_existing' ? 'bg-white text-[#f47c20] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setModalTab('add_existing')}
          >
            <MagnifyingGlass size={16} weight="bold" />
            <span>Thêm từ hệ thống</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${modalTab === 'create_new' ? 'bg-white text-[#f47c20] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
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
              {/* CLASS CODE STRIP */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50/60 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Mã tham gia lớp học:</span>
                  <span className="font-mono font-extrabold text-sm text-[#2f8fa3] bg-white border border-[#2f8fa3]/30 px-3 py-0.5 rounded-lg shadow-2xs">
                    {classroom.code || `CLASS-${classroom._id.substring(0, 4).toUpperCase()}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(classroom.code || `CLASS-${classroom._id.substring(0, 4).toUpperCase()}`);
                      toast.success("Đã chép mã lớp vào bộ nhớ tạm!");
                    }}
                    className="text-xs font-bold text-[#2f8fa3] hover:underline bg-transparent border-none cursor-pointer p-0 ml-1"
                  >
                    Sao chép mã
                  </button>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  💡 Gửi mã này cho học sinh nhập vào hệ thống xin tham gia
                </span>
              </div>

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
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">Học sinh nhập mã lớp <strong>{classroom.code}</strong> sẽ gửi yêu cầu xuất hiện ở đây để bạn phê duyệt.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* TOOLBAR */}
                  <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 z-10 relative">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">
                        Có <strong className="text-[#f47c20] text-base px-1">{pendingRequests.length}</strong> học sinh đang chờ
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">Vui lòng duyệt để học sinh có thể vào lớp</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApproveAllStudents}
                      disabled={processingActionId === 'all'}
                      className="px-4 py-2 bg-[#f47c20] hover:bg-[#e06d15] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border-none shrink-0"
                    >
                      <CheckSquare size={16} weight="bold" />
                      <span>{processingActionId === 'all' ? "Đang xử lý..." : "Duyệt tất cả"}</span>
                    </button>
                  </div>

                  {/* LIST */}
                  <div className="flex flex-col gap-3 p-4 sm:p-6 overflow-y-auto">
                    {pendingRequests.map((req) => {
                      const student = req.studentId || {};
                      const isProcessing = processingActionId === req._id;
                      return (
                        <div key={req._id} className="group flex flex-wrap items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-xs hover:shadow-md hover:border-[#2f8fa3]/50 transition-all gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                            <div className="relative shrink-0">
                              <img
                                src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || "HS")}&background=f47c20&color=fff&bold=true`}
                                alt={student.name}
                                className="w-11 h-11 rounded-full border-2 border-slate-100 shadow-xs object-cover"
                              />
                              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#f47c20] border-2 border-white rounded-full" title="Đang chờ"></div>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-extrabold text-slate-800 text-[14px] truncate group-hover:text-[#2f8fa3] transition-colors" title={student.name || "Học sinh"}>{student.name || "Học sinh"}</span>
                              <span className="text-[12px] text-slate-500 font-medium truncate mt-0.5" title={student.email}>
                                {student.email}
                              </span>
                              <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1.5 whitespace-nowrap">
                                <Clock size={13} weight="bold" className="shrink-0 text-[#2f8fa3]" />
                                <span>{new Date(req.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                            <button
                              type="button"
                              onClick={() => handleRejectStudent(req._id)}
                              disabled={isProcessing}
                              className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border-none"
                            >
                              <XCircle size={15} weight="bold" />
                              <span>Từ chối</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveStudent(req._id)}
                              disabled={isProcessing}
                              className="flex-1 sm:flex-none justify-center px-4 py-1.5 bg-[#f47c20] hover:bg-[#e06d15] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border-none"
                            >
                              <CheckCircle size={15} weight="bold" />
                              <span>Duyệt</span>
                            </button>
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
                      placeholder="Nhập tên, email hoặc SĐT học sinh..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20"
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
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-orange-50/80 border-[#f47c20] shadow-xs' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={st.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=f47c20&color=fff&bold=true`}
                              alt={st.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800">{st.name}</span>
                              <span className="text-[11px] text-slate-500">{st.email} {st.parentPhone ? `• SĐT PH: ${st.parentPhone}` : ''}</span>
                            </div>
                          </div>
                          {isSelected && <CheckCircle size={18} weight="fill" className="text-[#f47c20]" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500 font-medium">
                      {studentSearchQuery ? "Không tìm thấy học sinh nào khớp với từ khóa" : "Danh sách học sinh trên hệ thống"}
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

                <div className="flex flex-col gap-1">
                  <label htmlFor="modalStudentParentPhone" className="text-xs font-bold text-slate-700">SĐT Phụ huynh (Tùy chọn)</label>
                  <input
                    id="modalStudentParentPhone"
                    type="text"
                    placeholder="Ví dụ: 0912345678"
                    value={newStudentForm.parentPhone}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#f47c20]"
                  />
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
