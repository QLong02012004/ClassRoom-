import React from 'react';
import { Plus } from 'phosphor-react';
import { cn } from '@/lib/utils'; // if you have it, else we just use template literal

interface AnimatedAddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const AnimatedAddButton = React.forwardRef<HTMLButtonElement, AnimatedAddButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative isolate overflow-hidden inline-flex items-center justify-center gap-2",
          "px-6 py-2.5",
          "text-base tracking-[1px] no-underline font-semibold",
          "text-[#FE6747] bg-transparent",
          "cursor-pointer border-2 border-[#FE6747] rounded-[10px]",
          "transition-colors duration-[800ms] ease-out",
          "active:scale-90",
          "hover:text-white",
          // Hiệu ứng lan tỏa từ góc trái trên
          "before:absolute before:-left-4 before:-top-4 before:-z-10",
          "before:h-12 before:w-12 before:rounded-full",
          "before:bg-[#FE6747] before:scale-0",
          "before:transition-transform before:duration-[800ms] before:ease-out",
          "hover:before:scale-[15]",
          className
        )}
        {...props}
      >
        <Plus size={20} weight="bold" className="shrink-0" />
        {children || "Thêm giáo viên"}
      </button>
    );
  }
);

AnimatedAddButton.displayName = 'AnimatedAddButton';
