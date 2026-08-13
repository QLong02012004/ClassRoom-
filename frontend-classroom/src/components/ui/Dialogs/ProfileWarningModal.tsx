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
import { SecondaryButton } from "@/components/ui/Buttons/SecondaryButton";

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
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-3xl border border-slate-100 shadow-2xl bg-white">
        {/* Đường viền màu gradient phía trên sử dụng tông màu secondary (#2f8fa3) */}
        <div className="h-2 bg-gradient-to-r from-[#2f8fa3] via-[#4db0c4] to-[#a9d6e5] w-full" />
        
        <div className="p-6 flex flex-col items-center text-center">
          {/* Icon cảnh báo tròn to ở giữa sử dụng tông màu cam (#f47c20) */}
          <div className="w-16 h-16 rounded-full bg-orange-50/80 text-[#f47c20] flex items-center justify-center border-2 border-[#f47c20]/20 shadow-xs mb-4">
            <WarningCircle size={36} weight="fill" />
          </div>
          
          <DialogTitle className="text-slate-900 text-xl font-black tracking-tight leading-tight">
            Cần hoàn thiện hồ sơ trước khi tạo lớp
          </DialogTitle>
          
          <DialogDescription className="text-sm text-slate-500 mt-2.5 leading-relaxed max-w-md">
            Hệ thống yêu cầu Giáo viên cập nhật đầy đủ thông tin cá nhân và trình độ chuyên môn để học sinh và nhà trường theo dõi trước khi khởi tạo lớp học.
          </DialogDescription>

          {missingFields.length > 0 && (
            <div className="w-full mt-5 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80 text-left">
              <span className="text-xs font-extrabold text-slate-800 block mb-2.5">
                Các thông tin còn thiếu trong hồ sơ của bạn:
              </span>
              <div className="flex flex-wrap gap-2.5">
                {missingFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 bg-white text-[#2f8fa3] font-bold text-xs rounded-xl border border-[#2f8fa3]/25 shadow-3xs inline-flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2f8fa3] shrink-0"></span>
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer với màu nền Slate nhạt tách biệt */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <PrimaryButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Để sau
          </PrimaryButton>
          <SecondaryButton
            type="button"
            onClick={handleGoToProfile}
          >
            <User size={16} weight="bold" />
            <span>Cập nhật hồ sơ ngay</span>
            <ArrowRight size={14} weight="bold" />
          </SecondaryButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
