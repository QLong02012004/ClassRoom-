import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

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
  let actionVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" = "default";
  if (actionType === 'danger') actionVariant = "destructive";

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="font-sans max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#f47c20] font-extrabold text-xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 text-sm mt-1 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel disabled={isLoading} onClick={() => onOpenChange(false)}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              if (!isLoading) {
                onConfirm();
              }
            }}
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
