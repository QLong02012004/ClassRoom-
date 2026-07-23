import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CustomConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  actionType?: 'danger' | 'warning' | 'success' | 'default';
}

export function CustomConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Đồng ý",
  cancelText = "Hủy bỏ",
  isLoading = false,
  actionType = 'default',
}: CustomConfirmDialogProps) {
  
  // Determine color based on action type
  let confirmBtnClass = "bg-[#222] text-white hover:bg-black"; // default
  if (actionType === 'danger') confirmBtnClass = "bg-red-600 text-white hover:bg-red-700";
  if (actionType === 'warning') confirmBtnClass = "bg-orange-500 text-white hover:bg-orange-600";
  if (actionType === 'success') confirmBtnClass = "bg-emerald-600 text-white hover:bg-emerald-700";
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-fit border-none bg-transparent shadow-none p-0 !ring-0 !outline-none"
      >
        <div className="w-[340px] sm:w-[400px] h-fit bg-[#fffafa] rounded-[12px] border border-[#cecece] flex flex-col items-start justify-between p-6 gap-[18px] relative font-sans shadow-xl">
          <DialogTitle className="text-[#222] font-[800] text-[20px] leading-tight p-0 m-0 w-11/12">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[14px] font-[400] text-[#333] m-0 p-0 text-left leading-relaxed">
            {description}
          </DialogDescription>

          <div className="w-full h-auto flex items-center justify-between gap-[20px] mt-2">
            <button
              onClick={() => {
                if (!isLoading) onConfirm();
              }}
              disabled={isLoading}
              className={`w-1/2 py-2.5 border-none rounded-[6px] cursor-pointer transition-colors font-bold text-[15px] disabled:opacity-50 flex items-center justify-center ${confirmBtnClass}`}
            >
              {isLoading ? "..." : confirmText}
            </button>
            <button
              onClick={() => {
                if (!isLoading) onOpenChange(false);
              }}
              disabled={isLoading}
              className="w-1/2 py-2.5 border-none rounded-[6px] cursor-pointer bg-[#ececec] text-[#222] hover:bg-[#ddd] transition-colors font-bold text-[15px] disabled:opacity-50"
            >
              {cancelText}
            </button>
          </div>

          <button
            onClick={() => {
              if (!isLoading) onOpenChange(false);
            }}
            disabled={isLoading}
            className="absolute top-[20px] right-[20px] w-6 h-6 flex items-center justify-center bg-transparent border-none rounded-[6px] cursor-pointer hover:bg-[#ddd] hover:text-white transition-colors text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 162 162"
              className="h-2.5 w-2.5"
            >
              <path
                strokeLinecap="round"
                strokeWidth={17}
                stroke="currentColor"
                d="M9.01074 8.98926L153.021 153"
              />
              <path
                strokeLinecap="round"
                strokeWidth={17}
                stroke="currentColor"
                d="M9.01074 153L153.021 8.98926"
              />
            </svg>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
