import { useState, useCallback } from "react";
import { activityService } from "@/service/activity.service";
import { bankService } from "@/service/bank.service";
import { useToast } from "@/components/Styles/ToastContext";

interface UseBankAssignProps {
  classId?: string;
  loadQuizzes: () => void;
  loadAssignments: () => void;
  setAllActivities: React.Dispatch<React.SetStateAction<any[]>>;
  setAssignments: React.Dispatch<React.SetStateAction<any[]>>;
  handleOpenEditQuiz: (quizItem: any) => void;
}

export function useBankAssign({
  classId,
  loadQuizzes,
  loadAssignments,
  setAllActivities,
  setAssignments,
  handleOpenEditQuiz,
}: UseBankAssignProps) {
  const toast = useToast();

  // Bank items state
  const [isAssignFromBankOpen, setIsAssignFromBankOpen] = useState(false);
  const [previewBankItem, setPreviewBankItem] = useState<any>(null);
  const [selectedResourceDetails, setSelectedResourceDetails] = useState<any | null>(null);
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [selectedBankItem, setSelectedBankItem] = useState<any | null>(null);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [bankFilterType, setBankFilterType] = useState<"all" | "quiz" | "essay">("all");
  const [bankFilterOrigin, setBankFilterOrigin] = useState("all");
  const [bankModalPage, setBankModalPage] = useState(1);

  // Form giao bài
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDescription, setAssignDescription] = useState("");
  const [assignCategory, setAssignCategory] = useState("homework");
  const [assignCustomCategory, setAssignCustomCategory] = useState("");
  const [assignStartDate, setAssignStartDate] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignMaxScore, setAssignMaxScore] = useState(10);
  const [assignDurationMinutes, setAssignDurationMinutes] = useState(15);
  const [assignAllowMultiple, setAssignAllowMultiple] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Form Edit Activity
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("homework");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editMaxScore, setEditMaxScore] = useState(10);
  const [editAllowMultiple, setEditAllowMultiple] = useState(false);
  const [isSavingEditActivity, setIsSavingEditActivity] = useState(false);

  const loadBankItems = useCallback(async () => {
    setLoadingBank(true);
    try {
      const res = await bankService.getMyBankItems();
      setBankItems(res.data || []);
    } catch {
      toast.error("Không thể tải danh sách tài nguyên từ ngân hàng");
    } finally {
      setLoadingBank(false);
    }
  }, [toast]);

  const handleOpenAssignFromBank = useCallback(() => {
    setIsAssignFromBankOpen(true);
    loadBankItems();
  }, [loadBankItems]);

  const handleSelectBankItem = useCallback((item: any) => {
    setSelectedBankItem(item);
    setAssignTitle(item.title);
    setAssignDescription(item.description || "");
    setAssignMaxScore(item.maxScore || 10);
    setAssignDurationMinutes(item.durationMinutes || 15);

    const knownCategories = ["homework", "periodic", "mock_exam", "attitude"];
    if (item.category && !knownCategories.includes(item.category)) {
      setAssignCategory("custom");
      setAssignCustomCategory(item.category);
    } else {
      setAssignCategory(item.category || (item.type === "quiz" ? "periodic" : "homework"));
      setAssignCustomCategory("");
    }

    setAssignAllowMultiple(false);

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setAssignStartDate(now.toISOString().slice(0, 16));

    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
    setAssignDueDate(defaultDate.toISOString().slice(0, 16));
  }, []);

  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankItem || !classId) return;

    const finalCategory = assignCategory === "custom" ? assignCustomCategory : assignCategory;
    if (assignCategory === "custom" && !assignCustomCategory.trim()) {
      toast.error("Vui lòng nhập tên phân loại bài tập tùy chỉnh!");
      return;
    }

    if (assignDueDate) {
      const selectedTime = new Date(assignDueDate).getTime();
      if (!isNaN(selectedTime) && selectedTime < Date.now() - 60000) {
        toast.error("Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.");
        return;
      }
    }

    setIsAssigning(true);
    try {
      await activityService.assignActivity(classId, {
        bankItemId: selectedBankItem._id,
        title: assignTitle,
        description: assignDescription,
        category: finalCategory,
        startDate: assignStartDate,
        dueDate: assignDueDate,
        maxScore: assignMaxScore,
        durationMinutes: selectedBankItem.type === "quiz" ? assignDurationMinutes : undefined,
        allowMultipleSubmissions: assignAllowMultiple,
      });
      toast.success("Giao bài tập mới thành công!");

      setAssignTitle("");
      setAssignDescription("");
      setAssignCategory("homework");
      setAssignCustomCategory("");
      setAssignDueDate("");
      setAssignMaxScore(10);
      setAssignAllowMultiple(false);

      setIsAssignFromBankOpen(false);
      setSelectedBankItem(null);
      if (selectedBankItem.type === "quiz") {
        loadQuizzes();
      } else {
        loadAssignments();
      }
    } catch (err: any) {
      toast.error(err.message || "Giao bài tập thất bại!");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOpenEditActivity = useCallback(
    (act: any) => {
      if (act.type === "quiz") {
        handleOpenEditQuiz(act);
        return;
      }
      setEditingActivity(act);
      setEditTitle(act.title || "");
      setEditDescription(act.description || "");

      const knownCategories = ["homework", "periodic", "mock_exam", "attitude"];
      if (act.category && !knownCategories.includes(act.category)) {
        setEditCategory("custom");
        setEditCustomCategory(act.category);
      } else {
        setEditCategory(act.category || "homework");
        setEditCustomCategory("");
      }

      setEditMaxScore(act.maxScore || 10);
      setEditAllowMultiple(act.allowMultipleSubmissions ?? false);

      if (act.dueDate) {
        const d = new Date(act.dueDate);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setEditDueDate(d.toISOString().slice(0, 16));
      } else {
        const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setEditDueDate(d.toISOString().slice(0, 16));
      }
    },
    [handleOpenEditQuiz]
  );

  const handleConfirmEditActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    const finalCategory = editCategory === "custom" ? editCustomCategory : editCategory;
    if (editCategory === "custom" && !editCustomCategory.trim()) {
      toast.error("Vui lòng nhập tên phân loại tùy chỉnh!");
      return;
    }

    if (editDueDate) {
      const selectedTime = new Date(editDueDate).getTime();
      if (!isNaN(selectedTime) && selectedTime < Date.now() - 60000) {
        toast.error("Hạn nộp bài không được ở trong quá khứ! Vui lòng chọn thời gian trong tương lai.");
        return;
      }
    }

    setIsSavingEditActivity(true);
    try {
      const updatedData = {
        title: editTitle,
        description: editDescription,
        category: finalCategory,
        dueDate: editDueDate,
        maxScore: editMaxScore,
        allowMultipleSubmissions: editAllowMultiple,
      };
      const res = await activityService.updateActivity(editingActivity._id, updatedData);
      if (res) {
        setAllActivities((prev) =>
          prev.map((a) => (a._id === editingActivity._id ? { ...a, ...updatedData } : a))
        );
        setAssignments((prev) =>
          prev.map((a) => (a._id === editingActivity._id ? { ...a, ...updatedData } : a))
        );
        toast.success("Cập nhật thông tin bài tập thành công!");
        setEditingActivity(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Lỗi khi cập nhật bài tập!");
    } finally {
      setIsSavingEditActivity(false);
    }
  };

  return {
    isAssignFromBankOpen,
    setIsAssignFromBankOpen,
    previewBankItem,
    setPreviewBankItem,
    selectedResourceDetails,
    setSelectedResourceDetails,
    bankItems,
    loadingBank,
    selectedBankItem,
    setSelectedBankItem,
    bankSearchQuery,
    setBankSearchQuery,
    bankFilterType,
    setBankFilterType,
    bankFilterOrigin,
    setBankFilterOrigin,
    bankModalPage,
    setBankModalPage,
    assignTitle,
    setAssignTitle,
    assignDescription,
    setAssignDescription,
    assignCategory,
    setAssignCategory,
    assignCustomCategory,
    setAssignCustomCategory,
    assignStartDate,
    setAssignStartDate,
    assignDueDate,
    setAssignDueDate,
    assignMaxScore,
    setAssignMaxScore,
    assignDurationMinutes,
    setAssignDurationMinutes,
    assignAllowMultiple,
    setAssignAllowMultiple,
    isAssigning,
    editingActivity,
    setEditingActivity,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editCategory,
    setEditCategory,
    editCustomCategory,
    setEditCustomCategory,
    editDueDate,
    setEditDueDate,
    editMaxScore,
    setEditMaxScore,
    editAllowMultiple,
    setEditAllowMultiple,
    isSavingEditActivity,
    handleOpenAssignFromBank,
    handleSelectBankItem,
    handleConfirmAssign,
    handleOpenEditActivity,
    handleConfirmEditActivity,
  };
}
