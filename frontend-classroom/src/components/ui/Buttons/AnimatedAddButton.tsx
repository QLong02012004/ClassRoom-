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
          "px-5 py-2.5",
          "text-sm font-semibold no-underline",
          "text-[#f47c20] bg-white border-2 border-[#f47c20] hover:text-white",
          "cursor-pointer rounded-xl shadow-xs transition-all duration-300 ease-out",
          "active:scale-95 hover:shadow-md hover:border-[#f47c20]",
          "before:absolute before:left-0 before:top-0 before:-z-10 before:w-[300%] before:aspect-square before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-[#f47c20] before:scale-0 before:transition-transform before:duration-[700ms] before:ease-out hover:before:scale-100",
          "disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        {icon !== undefined ? icon : <Plus size={16} weight="bold" className="shrink-0 transition-transform group-hover:rotate-90 duration-300" />}
        <span className="relative z-10 flex items-center gap-1.5">{children || "Thêm mới"}</span>
      </button>
    );
  }
);

AnimatedAddButton.displayName = 'AnimatedAddButton';

export default AnimatedAddButton;
