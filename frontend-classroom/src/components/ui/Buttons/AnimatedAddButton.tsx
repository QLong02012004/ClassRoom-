import React from 'react';
import { Plus } from 'phosphor-react';
import { cn } from '@/lib/utils'; // if you have it, else we just use template literal

interface AnimatedAddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const AnimatedAddButton = React.forwardRef<HTMLButtonElement, AnimatedAddButtonProps>(
  ({ children, className, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative isolate overflow-hidden inline-flex items-center justify-center gap-2",
          "px-5 py-2",
          "text-sm tracking-[0.5px] no-underline font-semibold",
          "text-white bg-[#f47c20] hover:bg-[#e06d15]",
          "cursor-pointer border-none rounded-[10px]",
          "transition-all duration-200 ease-out",
          "active:scale-95",
          "shadow-xs hover:shadow-md",
          className
        )}
        {...props}
      >
        {icon !== undefined ? icon : <Plus size={18} weight="bold" className="shrink-0" />}
        {children || "Thêm mới"}
      </button>
    );
  }
);

AnimatedAddButton.displayName = 'AnimatedAddButton';
