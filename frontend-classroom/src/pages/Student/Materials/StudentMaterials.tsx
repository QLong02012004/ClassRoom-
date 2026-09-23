import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@heroui/react";
import {
  FilePdf,
  MagnifyingGlass,
  CaretDown,
  BookOpen,
  ArrowRight,
  Clock,
  HardDrives,
  FileText,
  Target,
  ArrowCounterClockwise
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton";
import { BackButton } from "../../../components/ui/Buttons/BackButton";
import { SmartSearchBar, type SearchSuggestionItem } from "../../../components/ui/Inputs/SmartSearchBar";
import { materialService } from "../../../service/material.service";
import styles from "../Assignments/StudentAssignments.module.scss";

const removeAccents = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

export default function StudentMaterials() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = (await materialService.getPublicMaterials()) as any;
        if (res && res.data) {
          setMaterials(res.data);
        }
      } catch (error) {
        console.error("Failed to load materials", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterSubject, activeTab]);

  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.subject).filter(Boolean)));
  }, [materials]);

  // Smart suggestions for search bar dropdown
  const materialSuggestions = useMemo<SearchSuggestionItem[]>(() => {
    if (!searchTerm.trim()) return [];
    const tokens = removeAccents(searchTerm.toLowerCase().trim()).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];

    return materials
      .filter((m) => {
        const titleNorm = removeAccents((m.title || "").toLowerCase());
        const subjectNorm = removeAccents((m.subject || "").toLowerCase());
        const descNorm = removeAccents((m.description || "").toLowerCase());
        const authorNorm = removeAccents((m.author?.name || m.authorName || m.teacherName || "").toLowerCase());
        const typeKeywords = m.type === "quiz" ? "trac nghiem quiz de thi" : "tai lieu document file pdf word";
        const combined = `${titleNorm} ${subjectNorm} ${descNorm} ${authorNorm} ${typeKeywords}`;
        return tokens.every(token => combined.includes(token));
      })
      .slice(0, 6)
      .map((m) => ({
        id: m._id,
        title: m.title,
        subtitle: `${m.subject ? `${m.subject} • ` : ""}${m.type === "quiz" ? "Đề trắc nghiệm" : "Tài liệu học tập"}`,
        tag: m.type === "quiz" ? "Trắc nghiệm" : "Tài liệu",
        rawData: m,
      }));
  }, [materials, searchTerm]);

  // Smart accent-insensitive, tokenized search & filter logic
  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      // 1. Accent-insensitive tokenized search
      if (searchTerm.trim() !== "") {
        const tokens = removeAccents(searchTerm.toLowerCase().trim()).split(/\s+/).filter(Boolean);
        if (tokens.length > 0) {
          const titleNorm = removeAccents((item.title || "").toLowerCase());
          const subjectNorm = removeAccents((item.subject || "").toLowerCase());
          const descNorm = removeAccents((item.description || "").toLowerCase());
          const authorNorm = removeAccents((item.author?.name || item.authorName || item.teacherName || "").toLowerCase());
          const typeKeywords = item.type === "quiz" ? "trac nghiem quiz de thi" : "tai lieu document file pdf word sach";
          const combined = `${titleNorm} ${subjectNorm} ${descNorm} ${authorNorm} ${typeKeywords}`;
          const matchSearch = tokens.every(token => combined.includes(token));
          if (!matchSearch) return false;
        }
      }

      // 2. Type filter from dropdown
      if (filterType !== "all" && item.type !== filterType) return false;

      // 3. Subject filter from dropdown
      if (filterSubject !== "all" && item.subject !== filterSubject) return false;

      // 4. Tab filter (All / Document / Quiz)
      if (activeTab === "document" && item.type !== "document") return false;
      if (activeTab === "quiz" && item.type !== "quiz") return false;

      return true;
    });
  }, [materials, searchTerm, filterType, filterSubject, activeTab]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + itemsPerPage);

  const docCount = materials.filter(m => m.type === "document").length;
  const quizCount = materials.filter(m => m.type === "quiz").length;

  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1,
        });
      }
    };

    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab, materials.length, docCount, quizCount]);

  return (
    <div className={styles.page}>
      <div className="mb-4">
        <BackButton onClick={() => navigate("/classrooms")}>
          Quay lại danh sách lớp
        </BackButton>
      </div>

      {/* HEADER BANNER */}
      <div className={styles.pageHeader}>
        <div>
          <h2>Kho Tài Liệu Chung</h2>
          <p>Truy cập ngân hàng đề thi trắc nghiệm và tài liệu học tập được chia sẻ toàn trường</p>
        </div>
      </div>

      {/* FILTER PILL TABS WITH SMOOTH SLIDING INDICATOR */}
      <div className="flex items-center pb-2 border-b border-slate-100">
        <div className="relative inline-flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-inner max-w-full overflow-x-auto select-none">
          {/* Animated Sliding Pill */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-[#f47c20] to-[#ff8f3d] shadow-md shadow-orange-500/30 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
          />

          <button
            ref={el => { tabRefs.current["all"] = el; }}
            type="button"
            onClick={() => setActiveTab("all")}
            className={`relative z-10 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "all" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen size={16} weight={activeTab === "all" ? "fill" : "bold"} />
            <span>Tất cả tài liệu</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
                activeTab === "all"
                  ? "bg-white/25 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {materials.length}
            </span>
          </button>

          <button
            ref={el => { tabRefs.current["document"] = el; }}
            type="button"
            onClick={() => setActiveTab("document")}
            className={`relative z-10 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "document" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText size={16} weight={activeTab === "document" ? "fill" : "bold"} />
            <span>File & Tài liệu</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
                activeTab === "document"
                  ? "bg-white/25 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {docCount}
            </span>
          </button>

          <button
            ref={el => { tabRefs.current["quiz"] = el; }}
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`relative z-10 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "quiz" ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <HardDrives size={16} weight={activeTab === "quiz" ? "fill" : "bold"} />
            <span>Đề thi trắc nghiệm</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
                activeTab === "quiz"
                  ? "bg-white/25 text-white"
                  : "bg-slate-200/90 text-slate-600"
              }`}
            >
              {quizCount}
            </span>
          </button>
        </div>
      </div>

      {/* ADVANCED SEARCH & FILTER TOOLBAR */}
      <div className={styles.filterBar}>
        <div className="w-full sm:w-80 md:w-96">
          <SmartSearchBar
            placeholder="Tìm kiếm tài liệu, đề thi, bài giảng... (Ấn /)"
            value={searchTerm}
            onChange={setSearchTerm}
            suggestions={materialSuggestions}
            onSelectSuggestion={(item) => {
              setSearchTerm(item.title);
            }}
            recentSearchesKey="studentMaterialsSearches"
            enableShortcut={true}
            widthClass="w-full"
            inputClassName="w-full h-9 pl-9 pr-8 bg-white border border-slate-200/80 hover:border-slate-300 focus:border-[#f47c20] focus:ring-1 focus:ring-[#f47c20] transition-colors rounded-xl outline-none text-slate-700 placeholder:text-slate-400/80 text-xs font-medium shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3.5 py-2 outline-none hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 transition-colors min-w-[140px] h-[36px] cursor-pointer whitespace-nowrap">
              <span className="whitespace-nowrap">
                {filterType === "all" ? "Tất cả loại bài" : filterType === "quiz" ? "Trắc nghiệm" : "Tự luận / File"}
              </span>
              <CaretDown size={13} className="text-slate-400" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[170px] bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
              <DropdownMenuItem className="px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-slate-50" onClick={() => setFilterType("all")}>Tất cả loại bài</DropdownMenuItem>
              <DropdownMenuItem className="px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-slate-50" onClick={() => setFilterType("quiz")}>Trắc nghiệm</DropdownMenuItem>
              <DropdownMenuItem className="px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-slate-50" onClick={() => setFilterType("document")}>Tự luận / File</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3.5 py-2 outline-none hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 transition-colors min-w-[140px] h-[36px] cursor-pointer whitespace-nowrap">
              <span className="truncate max-w-[110px] whitespace-nowrap">
                {filterSubject === "all" ? "Tất cả môn học" : filterSubject}
              </span>
              <CaretDown size={13} className="text-slate-400 flex-shrink-0" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[190px] bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
              <DropdownMenuItem className="px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-slate-50" onClick={() => setFilterSubject("all")}>Tất cả môn học</DropdownMenuItem>
              {uniqueSubjects.map(sub => (
                <DropdownMenuItem className="px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-slate-50" key={String(sub)} onClick={() => setFilterSubject(String(sub))}>{sub}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(searchTerm.trim() !== "" || filterType !== "all" || filterSubject !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setFilterSubject("all");
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap h-[36px]"
              title="Đặt lại bộ lọc"
            >
              <ArrowCounterClockwise size={13} weight="bold" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* MATERIAL CARD GRID */}
      {loading ? (
        <div className={styles.assignmentList}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-slate-200 rounded-[20px] p-5 flex flex-col justify-between gap-4 animate-pulse min-h-[240px] shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-20 bg-slate-200 rounded-lg" />
                <div className="h-5 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
              </div>
              <div className="h-20 w-full bg-slate-100/90 rounded-xl mt-2 border border-slate-100" />
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-auto">
                <div className="h-6 w-20 bg-slate-100 rounded-lg" />
                <div className="h-8 w-24 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} className="text-slate-300" weight="duotone" />
          <h4 className="font-bold text-base text-slate-700 mt-2">
            {materials.length === 0 ? "Chưa có tài liệu nào" : "Không tìm thấy tài liệu phù hợp"}
          </h4>
          <p className="text-sm text-slate-500 max-w-sm text-center">
            {materials.length === 0
              ? "Hiện tại thư viện tài liệu chung chưa có tệp nào. Tài liệu mới do giáo viên tải lên sẽ xuất hiện tại đây."
              : "Hãy thử thay đổi từ khóa hoặc chọn lại bộ lọc môn học, định dạng."}
          </p>
          {materials.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setFilterSubject("all");
                setActiveTab("all");
              }}
              className="mt-3 px-4 py-2 bg-orange-50 text-[#f47c20] hover:bg-orange-100 border border-orange-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className={styles.assignmentList}>
            {paginatedMaterials.map((item) => {
              const isQuiz = item.type === "quiz";
              return (
                <div
                  key={item._id}
                  className={styles.assignCard}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (isQuiz) {
                      navigate(`/exams/${item._id}`);
                    } else {
                      navigate(`/materials/${item._id}`);
                    }
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div className="flex items-center gap-2.5 min-w-0 flex-wrap mb-1">
                      <span className={styles.classBadge}>
                        {item.subject || "TOÁN HỌC"}
                      </span>
                      <span className={styles.typeBadge}>
                        {isQuiz ? "TRẮC NGHIỆM" : "FILE TÀI LIỆU"}
                      </span>
                    </div>
                  </div>

                  <h4 className={styles.cardTitle}>{item.title}</h4>
                  <p className={styles.cardDesc}>
                    {item.description || "Tài liệu học tập được chia sẻ từ ngân hàng trường học."}
                  </p>

                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                      <Clock size={14} weight="bold" />
                      <span>Ngày tạo: <strong>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</strong></span>
                    </div>

                    <div className={styles.metaItem}>
                      <Target size={14} weight="bold" />
                      <span>
                        {isQuiz ? "Thang điểm:" : "Định dạng:"}{" "}
                        <strong>{isQuiz ? `${item.maxScore || 10} điểm` : "Tệp PDF / Word"}</strong>
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      {isQuiz ? <HardDrives size={14} weight="bold" /> : <FileText size={14} weight="bold" />}
                      <span>{isQuiz ? "Số câu:" : "Xem & Tải:"} <strong>{isQuiz ? `${item.questions?.length || 10} câu` : "Trực tiếp"}</strong></span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className="whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 whitespace-nowrap ${
                        isQuiz
                          ? "text-[#f47c20] bg-[#fff7ed] border border-[#fed7aa]"
                          : "text-[#2f8fa3] bg-[#f0f9fa] border border-[#b2e0e8]"
                      }`}>
                        {isQuiz ? <HardDrives size={12} weight="fill" /> : <FilePdf size={12} weight="fill" />}
                        {isQuiz ? "Đề thi" : "Tài liệu"}
                      </span>
                    </div>

                    <PrimaryButton
                      variant={isQuiz ? "default" : "outline"}
                      size="sm"
                      className="!text-xs font-extrabold ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isQuiz) {
                          navigate(`/exams/${item._id}`);
                        } else {
                          navigate(`/materials/${item._id}`);
                        }
                      }}
                    >
                      {isQuiz ? "Luyện tập ngay" : "Xem chi tiết"}{" "}
                      <ArrowRight size={13} weight="bold" />
                    </PrimaryButton>
                  </div>
                </div>
              );
            })}
          </div>

          {/* HEROUI PAGINATION */}
          {filteredMaterials.length > 0 && (
            <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-white rounded-2xl shadow-3xs mt-2">
              <Pagination.Summary className="text-sm text-slate-500 font-medium">
                Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredMaterials.length)} trong số {filteredMaterials.length} kết quả
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={currentPage === 1}
                    onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <Pagination.PreviousIcon />
                    Trang trước
                  </Pagination.Previous>
                </Pagination.Item>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === currentPage}
                      onPress={() => setCurrentPage(p)}
                      className={p === currentPage ? "bg-[#f47c20] text-white font-bold border-[#f47c20]" : "text-slate-600 font-medium hover:bg-slate-100"}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={currentPage === totalPages}
                    onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Trang sau
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
