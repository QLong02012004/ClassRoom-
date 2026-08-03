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
          "px-6 py-2.5",
          "text-base tracking-[1px] no-underline font-semibold",
          "text-[#f47c20] bg-transparent",
          "cursor-pointer border-2 border-[#f47c20] rounded-[10px]",
          "transition-colors duration-[800ms] ease-out",
          "active:scale-90",
          "hover:text-white",
          // Hiệu ứng lan tỏa từ góc trái trên
          "before:absolute before:left-0 before:top-0 before:-z-10",
          "before:w-[300%] before:aspect-square before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full",
          "before:bg-[#f47c20] before:scale-0",
          "before:transition-transform before:duration-[800ms] before:ease-out",
          "hover:before:scale-100",
          className
        )}
        {...props}
      >
        {icon !== undefined ? icon : <Plus size={20} weight="bold" className="shrink-0" />}
        {children || "Thêm mới"}
      </button>
    );
  }
);

AnimatedAddButton.displayName = 'AnimatedAddButton';
