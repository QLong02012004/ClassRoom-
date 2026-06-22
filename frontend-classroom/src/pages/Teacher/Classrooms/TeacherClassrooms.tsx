import React, { useState, useEffect, useRef } from "react";
import { Plus, Chalkboard, Users, Key, PencilSimple, Trash, CaretDown, Check } from "phosphor-react";
import { useToast } from "../../../components/Styles/ToastContext.tsx";
import { useNavigate } from "react-router-dom";
import { classroomService } from "../../../service/classroom.service";
import type { ITeacherClassroom } from "../../../service/classroom.service";
import styles from "./TeacherClassrooms.module.scss";

const SUBJECT_OPTIONS = [
  { value: "Toán học", emoji: "🔢", color: "#3b82f6" },
  { value: "Vật lý", emoji: "⚡", color: "#f59e0b" },
  { value: "Hóa học", emoji: "🧪", color: "#10b981" },
  { value: "Ngữ văn", emoji: "📖", color: "#8b5cf6" },
  { value: "Tiếng Anh", emoji: "🌍", color: "#06b6d4" },
  { value: "Lịch sử", emoji: "🏛️", color: "#d97706" },
  { value: "Địa lý", emoji: "🗺️", color: "#16a34a" },
  { value: "Sinh học", emoji: "🌱", color: "#84cc16" },
  { value: "Tin học", emoji: "💻", color: "#6366f1" },
];

export default function TeacherClassrooms() {
  const toast = useToast();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<ITeacherClassroom[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [classToDelete, setClassToDelete] = useState<ITeacherClassroom | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [newClass, setNewClass] = useState({ className: "", subject: "Toán học" });

  const selectedSubject = SUBJECT_OPTIONS.find(o => o.value === newClass.subject) || SUBJECT_OPTIONS[0];

  const loadData = async () => {
    try {
      const res = await classroomService.getTeacherClassrooms();
      if (res.data) {
        setClassrooms(res.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách lớp học");
    }
  };

  useEffect(() => {
    loadData();
    const handleOpenModal = () => setShowModal(true);
    window.addEventListener("open-new-class-modal", handleOpenModal);
    return () => {
      window.removeEventListener("open-new-class-modal", handleOpenModal);
    };
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateOrUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.className || !newClass.subject) {
      toast.error("Vui lòng điền đầy đủ thông tin tên lớp và môn học!");
      return;
    }

    try {
      if (editingId) {
        await classroomService.updateClassroom(editingId, newClass);
        toast.success(`Cập nhật lớp học thành công!`);
      } else {
        await classroomService.createClassroom(newClass);
        toast.success(`Tạo lớp học "${newClass.className}" thành công!`);
      }
      setNewClass({ className: "", subject: "Toán học" });
      setEditingId(null);
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(editingId ? "Đã xảy ra lỗi khi cập nhật lớp học!" : "Đã xảy ra lỗi khi tạo lớp học!");
    }
  };

  const handleEditClick = (e: React.MouseEvent, cls: ITeacherClassroom) => {
    e.stopPropagation();
    setEditingId(cls._id);
    setNewClass({ className: cls.name, subject: cls.subject || "Toán học" });
    setShowModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, cls: ITeacherClassroom) => {
    e.stopPropagation();
    setClassToDelete(cls);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      if (deleteType === 'soft') {
        await classroomService.softDeleteClassroom(classToDelete._id);
        toast.success(`Đã đưa lớp "${classToDelete.name}" vào lưu trữ.`);
      } else {
        await classroomService.hardDeleteClassroom(classToDelete._id);
        toast.success(`Đã xóa vĩnh viễn lớp "${classToDelete.name}".`);
      }
      setShowDeleteModal(false);
      setClassToDelete(null);
      loadData();
    } catch (error) {
      toast.error("Không thể xóa lớp học này!");
    }
  };

  return (
    <div className={styles.classroomsPage}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h2>Danh sách lớp học phụ trách</h2>
          <p>Quản lý các lớp ôn luyện thêm, theo dõi sĩ số và phân phối mã code.</p>
        </div>
        <button className={styles.btnCreateHeader} onClick={() => {
          setEditingId(null);
          setNewClass({ className: "", subject: "Toán học" });
          setShowModal(true);
        }}>
          <Plus size={18} weight="bold" />
          <span>Tạo lớp học mới</span>
        </button>
      </div>

      {/* GRID */}
      <div className={styles.classesGrid}>
        {classrooms.map((cls) => (
          <div
            key={cls._id}
            className={styles.classCard}
            onClick={() => navigate(`/classrooms/${cls._id}`)}
            style={{ cursor: "pointer", position: "relative" }}
          >
            <div className={styles.cardTop}>
              <div className="flex items-center gap-3">
                <div className={styles.iconBox}>
                  <Chalkboard size={22} weight="duotone" />
                </div>
                <span className={styles.subjectTag}>{cls.subject || 'Môn học chung'}</span>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 text-blue-500 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors" onClick={(e) => handleEditClick(e, cls)}>
                  <PencilSimple size={18} weight="bold" />
                </button>
                <button className="p-1.5 text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors" onClick={(e) => handleDeleteClick(e, cls)}>
                  <Trash size={18} weight="bold" />
                </button>
              </div>
            </div>

            <div className={styles.cardMiddle}>
              <h3 className={styles.classTitle}>{cls.name}</h3>
              <div className={styles.codeRow}>
                <Key size={14} weight="bold" />
                <span>Mã tham gia: <strong>{cls.code}</strong></span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.studentsCount}>
                <Users size={16} />
                <span>Sĩ số: {cls.students?.length || 0} học sinh</span>
              </div>
              <button
                className={styles.btnManage}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/classrooms/${cls._id}/students`);
                }}
              >
                Quản lý học sinh
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREATE / UPDATE */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.headerText}>
                <h3>{editingId ? "Cập nhật lớp học" : "Tạo lớp học mới"}</h3>
                <p>{editingId ? "Chỉnh sửa thông tin lớp học" : "Điền thông tin để bắt đầu lớp học của bạn"}</p>
              </div>
              <button className={styles.btnClose} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleCreateOrUpdateClass}>
                <div className={styles.formGroup}>
                  <label htmlFor="modalClassName">Tên lớp học</label>
                  <input
                    id="modalClassName"
                    type="text"
                    required
                    placeholder="Ví dụ: Lớp 12A1 - Toán Học"
                    value={newClass.className}
                    onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Môn học</label>
                  <div className={styles.customDropdown} ref={dropdownRef}>
                    {/* Trigger Button */}
                    <button
                      type="button"
                      className={`${styles.dropdownTrigger} ${dropdownOpen ? styles.dropdownOpen : ""}`}
                      onClick={() => setDropdownOpen(prev => !prev)}
                    >
                      <span className={styles.dropdownSelected}>
                        <span className={styles.subjectEmoji}>{selectedSubject.emoji}</span>
                        <span>{selectedSubject.value}</span>
                      </span>
                      <CaretDown
                        size={16}
                        weight="bold"
                        className={`${styles.dropdownCaret} ${dropdownOpen ? styles.caretUp : ""}`}
                      />
                    </button>

                    {/* Options Panel */}
                    {dropdownOpen && (
                      <div className={styles.dropdownPanel}>
                        {SUBJECT_OPTIONS.map((opt) => (
                          <button
                            type="button"
                            key={opt.value}
                            className={`${styles.dropdownOption} ${newClass.subject === opt.value ? styles.optionActive : ""}`}
                            onClick={() => {
                              setNewClass({ ...newClass, subject: opt.value });
                              setDropdownOpen(false);
                            }}
                          >
                            <span className={styles.optionLeft}>
                              <span
                                className={styles.optionDot}
                                style={{ background: opt.color }}
                              />
                              <span className={styles.optionEmoji}>{opt.emoji}</span>
                              <span className={styles.optionLabel}>{opt.value}</span>
                            </span>
                            {newClass.subject === opt.value && (
                              <Check size={15} weight="bold" className={styles.optionCheck} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className={styles.btnConfirm}>
                    {editingId ? "Cập nhật" : "Tạo lớp học"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {showDeleteModal && classToDelete && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.headerText}>
                <h3 className="text-red-600">Xóa lớp học</h3>
                <p>Chọn phương thức xóa cho "{classToDelete.name}"</p>
              </div>
              <button className={styles.btnClose} onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className="flex flex-col gap-4 mb-6">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="radio" name="deleteType" checked={deleteType === 'soft'} onChange={() => setDeleteType('soft')} className="mt-1" />
                  <div>
                    <strong className="block text-slate-800">Xóa tạm thời (Lưu trữ)</strong>
                    <span className="text-sm text-slate-500">Lớp học sẽ bị ẩn đi nhưng dữ liệu điểm số và học sinh vẫn được bảo lưu. Bạn có thể khôi phục sau này.</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-red-100 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                  <input type="radio" name="deleteType" checked={deleteType === 'hard'} onChange={() => setDeleteType('hard')} className="mt-1" />
                  <div>
                    <strong className="block text-red-700">Xóa vĩnh viễn</strong>
                    <span className="text-sm text-red-500">Toàn bộ dữ liệu lớp học, điểm số, và thành viên sẽ bị xóa vĩnh viễn. Không thể khôi phục!</span>
                  </div>
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowDeleteModal(false)}>Hủy</button>
                <button type="button" className={`${styles.btnConfirm} ${deleteType === 'hard' ? '!bg-red-600 hover:!bg-red-700' : ''}`} onClick={confirmDelete}>Xác nhận Xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
