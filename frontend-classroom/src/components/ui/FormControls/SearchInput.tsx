import React from "react";
import { MagnifyingGlass, X } from "phosphor-react";

interface SearchInputProps {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  id,
  placeholder = "Tìm kiếm...",
  value,
  onChange,
  className = "",
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <MagnifyingGlass
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#f47c20] focus:ring-1 focus:ring-[#f47c20] transition-colors rounded-full outline-none text-slate-700 placeholder:text-slate-400/80 text-xs font-medium"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0 font-bold text-xs"
        >
          <X size={13} weight="bold" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
