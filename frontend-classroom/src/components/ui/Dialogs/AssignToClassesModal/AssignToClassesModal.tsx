import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PaperPlaneTilt,
  ChalkboardTeacher,
  Users,
  MagnifyingGlass,
  CalendarBlank,
  CaretDown,
  X,
  SlidersHorizontal
} from 'phosphor-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { classroomService, type ITeacherClassroom } from '@/service/classroom.service';
import { activityService } from '@/service/activity.service';
import { useToast } from '@/components/Styles/ToastContext';
import NumberStepper from '@/components/ui/FormControls/NumberStepper';

export interface AssignToClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null; // BankItem or ResourceDetailItem
  onSuccess?: () => void;
}

export const AssignToClassesModal: React.FC<AssignToClassesModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const toast = useToast();

  // Danh sách lớp của giáo viên
  const [classrooms, setClassrooms] = useState<ITeacherClassroom[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classSearch, setClassSearch] = useState('');

  // Form cấu hình giao bài
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('homework');
  const [customCategory, setCustomCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load classrooms when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await classroomService.getTeacherClassrooms();
        if (res.data) {
          // Lọc các lớp đang hoạt động (Active)
          const activeClasses = res.data.filter(
            (c) => !c.status || c.status === 'Active'
          );
          setClassrooms(activeClasses);
        }
      } catch (err: any) {
        toast.error('Không thể tải danh sách lớp học của bạn');
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [isOpen, toast]);

  // Init form values when item changes
  useEffect(() => {
    if (!item) return;

    setTitle(item.title || '');
    setDescription(item.description || '');
    setMaxScore(item.maxScore || 10);
    setDurationMinutes(item.durationMinutes || 15);

    const isQuiz =
      item.type === 'quiz' ||
      (item.questions && item.questions.length > 0) ||
      (item.quizQuestions && item.quizQuestions.length > 0);

    const knownCategories = ['homework', 'periodic', 'mock_exam', 'attitude'];
    if (item.category && !knownCategories.includes(item.category)) {
      setCategory('custom');
      setCustomCategory(item.category);
    } else {
      setCategory(item.category || (isQuiz ? 'periodic' : 'homework'));
      setCustomCategory('');
    }

    setAllowMultiple(false);
    setSelectedClassIds([]);

    // Set default start date = now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setStartDate(now.toISOString().slice(0, 16));

    // Set default due date = 7 days later at 23:59
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    defaultDue.setHours(23, 59, 0, 0);
    defaultDue.setMinutes(defaultDue.getMinutes() - defaultDue.getTimezoneOffset());
    setDueDate(defaultDue.toISOString().slice(0, 16));
  }, [item]);

  const isQuiz = useMemo(() => {
    if (!item) return false;
    return (
      item.type === 'quiz' ||
      (item.questions && item.questions.length > 0) ||
      (item.quizQuestions && item.quizQuestions.length > 0) ||
      (item.bankItemId?.quizQuestions && item.bankItemId.quizQuestions.length > 0)
    );
  }, [item]);

  const questionCount = useMemo(() => {
    if (!item) return 0;
    return (
      item.quizQuestions?.length ||
      item.questions?.length ||
      item.bankItemId?.quizQuestions?.length ||
      0
    );
  }, [item]);

  // Lọc lớp theo ô tìm kiếm
  const filteredClassrooms = useMemo(() => {
    if (!classSearch.trim()) return classrooms;
    const q = classSearch.toLowerCase();
    return classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q))
    );
  }, [classrooms, classSearch]);

  // Chọn / bỏ chọn 1 lớp
  const toggleClassSelect = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  // Chọn tất cả lớp đang hiển thị
  const handleSelectAll = () => {
    const allIds = filteredClassrooms.map((c) => c._id);
    setSelectedClassIds((prev) => {
      const merged = new Set([...prev, ...allIds]);
      return Array.from(merged);
    });
  };

  // Bỏ chọn tất cả lớp đang hiển thị
  const handleDeselectAll = () => {
    const removingIds = new Set(filteredClassrooms.map((c) => c._id));
    setSelectedClassIds((prev) => prev.filter((id) => !removingIds.has(id)));
  };

  // Nút quick date
  const setQuickDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    setDueDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const handleSetStartNow = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    setStartDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  // Gửi giao bài cho nhiều lớp
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    if (selectedClassIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 lớp học để giao bài!');
      return;
    }

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài giao!');
      return;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() : category;
    if (category === 'custom' && !finalCategory) {
      toast.error('Vui lòng nhập tên phân loại bài tập tùy chỉnh!');
      return;
    }

    if (dueDate) {
      const dueTime = new Date(dueDate).getTime();
      if (!isNaN(dueTime) && dueTime < Date.now() - 60000) {
        toast.error('Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.');
        return;
      }
      if (startDate) {
        const startTime = new Date(startDate).getTime();
        if (dueTime <= startTime) {
          toast.error('Hạn nộp bài phải sau thời gian bắt đầu!');
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const bankItemId = item._id || item.bankItemId?._id || item.bankItemId;
      const res = await activityService.assignActivityToMultipleClasses({
        classIds: selectedClassIds,
        bankItemId,
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        maxScore: Number(maxScore),
        durationMinutes: isQuiz ? Number(durationMinutes) : undefined,
        allowMultipleSubmissions: allowMultiple,
      });

      toast.success(
        res.message || `Đã giao bài thành công cho ${selectedClassIds.length} lớp học!`
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Giao bài cho các lớp thất bại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[1150px] w-[95vw] max-h-[90vh] flex flex-col bg-white rounded-3xl p-6 overflow-hidden shadow-2xl border border-slate-100"
      >
        {/* HEADER */}
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0 text-[#f47c20] shadow-2xs">
              <PaperPlaneTilt size={22} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span>Chọn nhiều lớp để giao cùng một đề</span>
                {item.subject && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-orange-50 text-[#f47c20] border border-orange-200/80 rounded-md">
                    {item.subject}
                  </span>
                )}
                {isQuiz ? (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200/80 rounded-md">
                    {questionCount} câu trắc nghiệm
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/80 rounded-md">
                    Bài tập tự luận
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Tất cả học sinh trong các lớp được chọn sẽ nhận bài thi và nhận thông báo mới.
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* MAIN BODY: 2 COLUMNS (LEFT: CLASSROOM SELECTION, RIGHT: ASSIGNMENT SETTINGS) */}
        <form onSubmit={handleSubmit} className="mt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto pr-1">
            {/* COLUMN 1: CLASSROOM SELECTION (6 COLS) */}
            <div className="lg:col-span-6 flex flex-col gap-3 min-h-0">
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#f47c20] shadow-2xs">
                    <ChalkboardTeacher size={18} weight="duotone" />
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-wide">
                    Chọn lớp học nhận đề
                  </h3>
                  <span className="text-xs font-bold text-[#f47c20] bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full">
                    {selectedClassIds.length}/{classrooms.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-[#f47c20] hover:underline cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs font-bold text-slate-500 hover:underline cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* SEARCH CLASSES */}
              <div className="relative flex items-center">
                <MagnifyingGlass size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm theo tên lớp, mã lớp hoặc môn..."
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#f47c20] focus:bg-white transition-colors"
                />
                {classSearch && (
                  <button
                    type="button"
                    onClick={() => setClassSearch('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* CLASSROOMS LIST */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[300px] max-h-[460px] border border-slate-100 rounded-2xl p-2.5 bg-slate-50/50">
                {loadingClasses ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold">
                    <div className="w-6 h-6 border-2 border-[#f47c20] border-t-transparent rounded-full animate-spin mb-2" />
                    Đang tải danh sách lớp học...
                  </div>
                ) : filteredClassrooms.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold text-center px-4">
                    <ChalkboardTeacher size={36} className="text-slate-300 mb-2" />
                    {classSearch ? 'Không tìm thấy lớp học nào khớp với từ khóa' : 'Bạn chưa có lớp học nào đang hoạt động'}
                  </div>
                ) : (
                  filteredClassrooms.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls._id);
                    return (
                      <div
                        key={cls._id}
                        onClick={() => toggleClassSelect(cls._id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                          isSelected
                            ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-400/40 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 pointer-events-none">
                            <Checkbox
                              checked={isSelected}
                              tabIndex={-1}
                              className="size-5 rounded-md data-[state=checked]:bg-[#f47c20] data-[state=checked]:border-[#f47c20] data-[state=checked]:text-white"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {cls.name}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-2 mt-0.5">
                              {cls.subject && <span>Môn: {cls.subject}</span>}
                              {cls.code && (
                                <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-mono text-[10px]">
                                  {cls.code}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-600 font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                          <Users size={14} className="text-slate-500" />
                          <span>{cls.students?.length || 0} HS</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUMN 2: ASSIGNMENT CONFIGURATION (6 COLS) */}
            <div className="lg:col-span-6 flex flex-col gap-3 min-h-0">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#f47c20] shadow-2xs">
                  <SlidersHorizontal size={18} weight="duotone" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-wide">
                  Thiết lập thông tin bài giao
                </h3>
              </div>

              {/* TITLE */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-800">Tiêu đề bài giao *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề bài giao..."
                  className="w-full h-[42px] px-3.5 border border-slate-200 rounded-xl text-sm font-semibold focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none text-slate-800 bg-white"
                  required
                />
              </div>

              {/* CATEGORY & DURATION / MAX SCORE */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800">Phân loại</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full h-[42px] px-3.5 border border-slate-200 rounded-xl text-sm focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none flex items-center justify-between bg-white hover:bg-slate-50 text-slate-800 font-semibold transition-colors">
                      <span className="truncate">
                        {
                          {
                            homework: 'Bài tập về nhà',
                            periodic: 'Kiểm tra định kỳ',
                            mock_exam: 'Thi thử',
                            attitude: 'Chuyên cần',
                            custom: customCategory ? customCategory : '+ Khác...',
                          }[category] || category || 'Chọn loại...'
                        }
                      </span>
                      <CaretDown size={14} className="text-slate-400 shrink-0 ml-1" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-[180px] bg-white shadow-xl border border-slate-100 rounded-xl p-1 z-50">
                      <DropdownMenuItem onClick={() => setCategory('homework')} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-xs">
                        Bài tập về nhà
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCategory('periodic')} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-xs">
                        Kiểm tra định kỳ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCategory('mock_exam')} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-xs">
                        Thi thử
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCategory('attitude')} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-xs">
                        Chuyên cần
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCategory('custom')} className="cursor-pointer font-semibold text-orange-600 hover:bg-orange-50 rounded-lg px-3 py-2 text-xs border-t border-slate-100">
                        + Lựa chọn khác...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {category === 'custom' && (
                    <input
                      type="text"
                      placeholder="Nhập loại bài tập..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 mt-1 border border-orange-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500/20 bg-orange-50/30"
                      required
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800">
                    {isQuiz ? 'Thời gian (phút)' : 'Thang điểm'}
                  </label>
                  <div style={{ display: 'flex', height: '42px' }}>
                    {isQuiz ? (
                      <NumberStepper
                        value={durationMinutes}
                        onChange={(val) => setDurationMinutes(Number(val))}
                        min={1}
                        max={300}
                        step={5}
                        fullWidth
                      />
                    ) : (
                      <NumberStepper
                        value={maxScore}
                        onChange={(val) => setMaxScore(Number(val))}
                        min={1}
                        max={100}
                        step={1}
                        fullWidth
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* START DATE & DUE DATE */}
              <div className="grid grid-cols-2 gap-3">
                {/* START DATE */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-slate-800">Bắt đầu</label>
                    <button
                      type="button"
                      onClick={handleSetStartNow}
                      className="px-2 py-0.5 text-[11px] font-extrabold text-[#f47c20] bg-orange-50 hover:bg-orange-100 rounded transition-colors cursor-pointer"
                    >
                      Bây giờ
                    </button>
                  </div>
                  <div className="relative flex items-center w-full h-[42px]">
                    <div className="absolute left-3 pointer-events-none text-[#f47c20] z-10">
                      <CalendarBlank size={18} weight="duotone" />
                    </div>
                    <div className="w-full h-full pl-9 pr-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white text-slate-800 font-semibold flex items-center justify-between pointer-events-none">
                      <span className="truncate">
                        {startDate ? (
                          (() => {
                            const d = new Date(startDate);
                            if (isNaN(d.getTime())) return startDate;
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const hours = String(d.getHours()).padStart(2, '0');
                            const mins = String(d.getMinutes()).padStart(2, '0');
                            return `${day}/${month} - ${hours}:${mins}`;
                          })()
                        ) : (
                          <span className="text-slate-400">Chọn ngày</span>
                        )}
                      </span>
                      <CaretDown size={14} className="text-slate-400 shrink-0" />
                    </div>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onClick={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.showPicker?.();
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                    />
                  </div>
                </div>

                {/* DUE DATE */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-slate-800">Hạn nộp</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuickDueDate(1)}
                        className="px-1.5 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-orange-50 hover:bg-orange-100 rounded cursor-pointer"
                      >
                        +1N
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDueDate(3)}
                        className="px-1.5 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-orange-50 hover:bg-orange-100 rounded cursor-pointer"
                      >
                        +3N
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDueDate(7)}
                        className="px-1.5 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-orange-50 hover:bg-orange-100 rounded cursor-pointer"
                      >
                        +7N
                      </button>
                    </div>
                  </div>
                  <div className="relative flex items-center w-full h-[42px]">
                    <div className="absolute left-3 pointer-events-none text-[#f47c20] z-10">
                      <CalendarBlank size={18} weight="duotone" />
                    </div>
                    <div className="w-full h-full pl-9 pr-3 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white text-slate-800 font-semibold flex items-center justify-between pointer-events-none">
                      <span className="truncate">
                        {dueDate ? (
                          (() => {
                            const d = new Date(dueDate);
                            if (isNaN(d.getTime())) return dueDate;
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const hours = String(d.getHours()).padStart(2, '0');
                            const mins = String(d.getMinutes()).padStart(2, '0');
                            return `${day}/${month} - ${hours}:${mins}`;
                          })()
                        ) : (
                          <span className="text-slate-400">Chọn hạn</span>
                        )}
                      </span>
                      <CaretDown size={14} className="text-slate-400 shrink-0" />
                    </div>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      onClick={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.showPicker?.();
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                    />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-800">Mô tả / Dặn dò học sinh</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú thêm về yêu cầu hoặc lưu ý..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none text-slate-800 bg-white resize-none"
                />
              </div>

              {/* TOGGLE MULTIPLE SUBMISSIONS */}
              <div
                onClick={() => setAllowMultiple((prev) => !prev)}
                className="flex items-center gap-2.5 h-[42px] px-3.5 bg-slate-50/70 hover:bg-orange-50/40 rounded-xl border border-slate-200 hover:border-orange-200 mt-1 cursor-pointer transition-all select-none"
              >
                <div className="pointer-events-none flex items-center">
                  <Checkbox
                    id="allow-multiple"
                    checked={allowMultiple}
                    tabIndex={-1}
                    className="size-4.5 rounded-md data-[state=checked]:bg-[#f47c20] data-[state=checked]:border-[#f47c20] data-[state=checked]:text-white"
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer select-none">
                  Cho phép học sinh nộp bài lại nhiều lần
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="text-xs font-bold text-slate-500">
              {selectedClassIds.length > 0 ? (
                <span className="text-[#f47c20]">
                  Sẽ giao tới <strong className="font-extrabold">{selectedClassIds.length}</strong> lớp học được chọn
                </span>
              ) : (
                <span className="text-slate-400">Chưa chọn lớp học nào</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedClassIds.length === 0}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md ${
                  selectedClassIds.length === 0 || isSubmitting
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-[#f47c20] hover:bg-orange-600 active:scale-95 cursor-pointer shadow-orange-500/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang giao bài...
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt size={16} weight="bold" />
                    Giao bài cho {selectedClassIds.length > 0 ? `${selectedClassIds.length} lớp` : 'lớp'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignToClassesModal;
