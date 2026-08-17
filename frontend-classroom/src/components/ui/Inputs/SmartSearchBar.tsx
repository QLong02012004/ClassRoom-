import React, { useState, useEffect, useRef } from "react";
import { MagnifyingGlass, Clock } from "phosphor-react";

export interface SearchSuggestionItem {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  rawData?: any;
}

interface SmartSearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: SearchSuggestionItem[];
  onSelectSuggestion: (item: SearchSuggestionItem) => void;
  recentSearchesKey: string;
  enableShortcut?: boolean;
  className?: string;
  widthClass?: string;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  placeholder = "Tìm kiếm...",
  value,
  onChange,
  suggestions,
  onSelectSuggestion,
  recentSearchesKey,
  enableShortcut = true,
  className = "",
  widthClass = "w-full md:w-[420px]"
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(recentSearchesKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Shortcut key '/' listener
  useEffect(() => {
    if (!enableShortcut) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableShortcut]);

  const addToRecentSearches = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem(recentSearchesKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addToRecentSearches(value);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${widthClass} ${className}`}>
      <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        onKeyDown={handleKeyDown}
        className="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#f47c20] focus:ring-1 focus:ring-[#f47c20] transition-colors rounded-xl shadow-2xs outline-none text-slate-700 placeholder:text-slate-400/80 text-sm font-medium"
      />
      {value && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0 font-bold text-sm z-10"
        >
          ×
        </button>
      )}

      {/* SUGGESTIONS & RECENT SEARCHES DROPDOWN */}
      {isFocused && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-[9999] overflow-hidden py-2 animate-[dropdownSlide_0.2s_ease-out]">
          {/* Matches suggestions */}
          {value.trim() && suggestions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kết quả trùng khớp
              </div>
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onMouseDown={() => {
                    onChange(item.title);
                    addToRecentSearches(item.title);
                    setIsFocused(false);
                    onSelectSuggestion(item);
                  }}
                  className="px-3 py-2 hover:bg-slate-50 flex justify-between items-center cursor-pointer transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-700 truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-[10px] text-slate-400 font-medium">{item.subtitle}</span>
                    )}
                  </div>
                  {item.tag && (
                    <span className="text-[10px] font-mono font-bold text-[#f47c20] bg-[#f47c20]/8 px-1.5 py-0.5 rounded border border-[#f47c20]/10 uppercase shrink-0">
                      {item.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty suggestions state */}
          {value.trim() && suggestions.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
              Không tìm thấy kết quả phù hợp
            </div>
          )}

          {/* Recent searches history */}
          {!value.trim() && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                <span>Tìm kiếm gần đây</span>
                {recentSearches.length > 0 && (
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRecentSearches([]);
                      localStorage.removeItem(recentSearchesKey);
                    }}
                    className="text-[9px] text-[#f47c20] hover:underline cursor-pointer border-none bg-transparent p-0"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              {recentSearches.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-400 font-medium">
                  Chưa có tìm kiếm gần đây
                </div>
              ) : (
                recentSearches.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      onChange(item);
                      setIsFocused(false);
                    }}
                    className="px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors text-xs text-slate-600 font-semibold"
                  >
                    <Clock size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
