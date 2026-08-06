import React from "react";
import { useNavigate } from "react-router-dom";
import { WarningCircle, User, ArrowRight } from "phosphor-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PrimaryButton } from "@/components/ui/Buttons/PrimaryButton";

interface ProfileWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

export const ProfileWarningModal: React.FC<ProfileWarningModalProps> = ({
  isOpen,
  onClose,
  missingFields,
}) => {
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <WarningCircle size={28} weight="bold" />
            </div>
            <div>
              <DialogTitle className="text-slate-900 text-lg font-extrabold">
                Cần hoàn thiện hồ sơ trước khi tạo lớp
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hệ thống yêu cầu Giáo viên cập nhật đầy đủ thông tin cá nhân và trình độ chuyên môn để học sinh và nhà trường theo dõi trước khi khởi tạo lớp học.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {missingFields.length > 0 && (
          <div className="my-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Các thông tin còn thiếu trong hồ sơ của bạn:
            </span>
            <div className="flex flex-wrap gap-2">
              {missingFields.map((field, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-amber-100/80 text-amber-800 font-bold text-xs rounded-lg border border-amber-200 inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <PrimaryButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Để sau
          </PrimaryButton>
          <PrimaryButton
            type="button"
            onClick={handleGoToProfile}
            className="bg-[#f47c20] hover:bg-[#e06d15] text-white font-bold text-xs px-5 py-2.5 rounded-xl border-none shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <User size={16} weight="bold" />
            <span>Cập nhật hồ sơ ngay</span>
            <ArrowRight size={14} weight="bold" />
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
