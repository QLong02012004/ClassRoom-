/**
 * @file EditActivityModal.tsx
 * @description Component Modal Chỉnh sửa Hoạt động / Bài tập (Edit Activity Modal)
 * - Dùng để giáo viên cập nhật thông tin chi tiết của bài tập tự luận hoặc đề thi đã giao trong lớp.
 * - Quản lý tiêu đề, mô tả, phân loại bài tập (Bài tập về nhà, Kiểm tra định kỳ, Thi thử, Chuyên cần, tùy chỉnh...).
 * - Cài đặt thời hạn nộp (Due Date Picker), thang điểm tối đa (Max Score Stepper) và tùy chọn cho phép nộp nhiều lần.
 */

import React from "react";
import { PencilSimple, CaretDown } from "phosphor-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import NumberStepper from "@/components/ui/FormControls/NumberStepper";
import { Checkbox } from "@/components/ui/checkbox";
import PrimaryButton from "@/components/ui/Buttons/PrimaryButton";

interface EditActivityModalProps {
  editingActivity: any | null;
  onClose: () => void;
  onConfirmEdit: (e: React.FormEvent) => void;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editCategory: string;
  setEditCategory: (val: string) => void;
  editCustomCategory: string;
  setEditCustomCategory: (val: string) => void;
  editDueDate: string;
  setEditDueDate: (val: string) => void;
  editMaxScore: number;
  setEditMaxScore: (val: number) => void;
  editAllowMultiple: boolean;
  setEditAllowMultiple: (val: boolean) => void;
  isSavingEditActivity: boolean;
}

export default function EditActivityModal({
  editingActivity,
  onClose,
  onConfirmEdit,
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
}: EditActivityModalProps) {
  if (!editingActivity) return null;

  const categoryLabels: Record<string, string> = {
    homework: "Bài tập về nhà",
    periodic: "Kiểm tra định kỳ",
    mock_exam: "Thi thử",
    attitude: "Chuyên cần / Thái độ",
    custom: editCustomCategory ? editCustomCategory : "+ Lựa chọn khác...",
  };

  return (
    <Dialog open={!!editingActivity} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <PencilSimple className="text-orange-500" size={22} weight="bold" />
            Chỉnh sửa thông tin bài tập
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Cập nhật tiêu đề, hạn nộp, mô tả và cài đặt bài giao cho lớp học.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onConfirmEdit} className="mt-3 flex flex-col gap-3">
          {/* Row 1: Title & Description */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Tiêu đề bài giao</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-medium text-slate-800"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Mô tả chi tiết</label>
              <input
                type="text"
                placeholder="Nhập ghi chú hoặc dặn dò..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Category & Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Phân loại bài tập</label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none flex items-center justify-between bg-white text-slate-700">
                  {categoryLabels[editCategory] || editCategory || "Chọn phân loại..."}
                  <CaretDown size={14} className="text-slate-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] bg-white shadow-lg border border-slate-100 z-50">
                  <DropdownMenuItem onClick={() => setEditCategory("homework")} className="cursor-pointer font-medium text-slate-700 hover:bg-slate-50 rounded-md px-3 py-2 outline-none">
                    Bài tập về nhà
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditCategory("periodic")} className="cursor-pointer font-medium text-slate-700 hover:bg-slate-50 rounded-md px-3 py-2 outline-none">
                    Kiểm tra định kỳ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditCategory("mock_exam")} className="cursor-pointer font-medium text-slate-700 hover:bg-slate-50 rounded-md px-3 py-2 outline-none">
                    Thi thử
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditCategory("attitude")} className="cursor-pointer font-medium text-slate-700 hover:bg-slate-50 rounded-md px-3 py-2 outline-none">
                    Chuyên cần / Thái độ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditCategory("custom")} className="cursor-pointer font-semibold text-orange-600 hover:bg-orange-50 rounded-md px-3 py-2 outline-none border-t border-slate-100">
                    + Lựa chọn khác...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {editCategory === "custom" && (
                <input
                  type="text"
                  placeholder="Nhập loại bài tập tùy chỉnh..."
                  value={editCustomCategory}
                  onChange={(e) => setEditCustomCategory(e.target.value)}
                  className="w-full px-3 py-1.5 mt-1 border border-orange-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-orange-500 bg-orange-50/30"
                  required
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>Hạn nộp</span>
                <span className="text-[10px] text-orange-500 font-normal lowercase">(chọn ngày & giờ)</span>
              </label>
              <input
                type="datetime-local"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                onFocus={(e) => { e.target.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16); }}
                onClick={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                  target.showPicker?.();
                }}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none cursor-pointer bg-white text-slate-700 font-medium"
                required
              />
            </div>
          </div>

          {/* Row 3: Max score & Allow Multiple Submissions */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Điểm tối đa</label>
              <div style={{ display: 'flex' }}>
                <NumberStepper
                  value={editMaxScore}
                  onChange={(val) => setEditMaxScore(Number(val))}
                  min={1}
                  max={100}
                  step={1}
                  fullWidth
                />
              </div>
            </div>

            <div className="flex items-center gap-2 h-[38px] px-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <Checkbox
                id="editAllowMultiple"
                checked={editAllowMultiple}
                onCheckedChange={(checked) => setEditAllowMultiple(checked as boolean)}
              />
              <label htmlFor="editAllowMultiple" className="cursor-pointer m-0 font-semibold text-xs text-slate-700 select-none whitespace-nowrap">
                Cho phép nộp nhiều lần
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <PrimaryButton
              type="submit"
              disabled={isSavingEditActivity}
              className="px-4 py-1.5 font-semibold"
            >
              {isSavingEditActivity ? "Đang lưu..." : "Cập nhật ngay"}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
