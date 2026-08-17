import React from "react";
import { Funnel, CaretDown } from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "../../../components/ui/dropdown-menu";

export interface DropdownFilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownFilterProps {
  label: string;
  value: string;
  options: DropdownFilterOption[];
  onChange: (key: string) => void;
  icon?: React.ReactNode;
  minWidthClass?: string;
  widthClass?: string;
  hasCustomInput?: boolean;
  customInputPlaceholder?: string;
  customInputLabel?: string;
  customInputValue?: string;
  onCustomInputChange?: (val: string) => void;
}

export const DropdownFilter: React.FC<DropdownFilterProps> = ({
  label,
  value,
  options,
  onChange,
  icon = <Funnel size={16} className="text-slate-400" />,
  minWidthClass = "min-w-[140px]",
  widthClass = "w-full md:w-auto",
  hasCustomInput = false,
  customInputPlaceholder = "Nhập...",
  customInputLabel = "Khác",
  customInputValue = "",
  onCustomInputChange
}) => {
  const selectedOption = options.find((o) => o.id === value);
  const displayLabel = selectedOption ? selectedOption.label : value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white ${minWidthClass} ${widthClass} flex items-center justify-between relative hover:bg-slate-50 transition-colors`}
        >
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {icon}
          </div>
          <span>
            {label} {value && value !== "all" ? `: ${displayLabel}` : ""}
          </span>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <CaretDown size={14} className="text-slate-400" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1.5 ${minWidthClass} max-h-72 overflow-y-auto flex flex-col gap-0.5`}>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onChange(option.id)}
            className="px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-medium transition-colors flex items-center gap-2 outline-none"
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span className="truncate">{option.label}</span>
          </DropdownMenuItem>
        ))}

        {hasCustomInput && onCustomInputChange && (
          <div
            className="border-t border-slate-100 mt-1 pt-2 px-1 flex flex-col gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">
              {customInputLabel}
            </span>
            <input
              type="text"
              placeholder={customInputPlaceholder}
              value={customInputValue}
              onChange={(e) => onCustomInputChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
            />
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
