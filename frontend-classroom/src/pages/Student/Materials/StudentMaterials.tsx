import React, { useState, useEffect } from "react";
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
  Target
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton";
import { bankService } from "../../../service/bank.service";
import styles from "../Assignments/StudentAssignments.module.scss";

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
        const res = (await bankService.getMyBankItems()) as any;
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

  const uniqueSubjects = Array.from(new Set(materials.map(m => m.subject).filter(Boolean)));

  const filteredMaterials = materials.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = item.title.toLowerCase().includes(searchLower) ||
      (item.subject && item.subject.toLowerCase().includes(searchLower)) ||
      (item.description && item.description.toLowerCase().includes(searchLower));
    
    const matchType = filterType === "all" || item.type === filterType;
    const matchSubject = filterSubject === "all" || item.subject === filterSubject;
    
    let matchTab = true;
    if (activeTab === "document") matchTab = item.type === "document";
    if (activeTab === "quiz") matchTab = item.type === "quiz";

    return matchSearch && matchType && matchSubject && matchTab;
  });

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + itemsPerPage);

  const docCount = materials.filter(m => m.type === "document").length;
  const quizCount = materials.filter(m => m.type === "quiz").length;

  return (
    <div className={styles.page}>
      {/* HEADER BANNER */}
      <div className={styles.pageHeader}>
        <div>
          <h2>Kho Tài Liệu Chung</h2>
          <p>Truy cập ngân hàng đề thi trắc nghiệm và tài liệu học tập được chia sẻ toàn trường</p>
        </div>
      </div>

      {/* FILTER PILL TABS */}
      <div className="flex items-center gap-2 flex-wrap pb-1 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "all"
              ? "bg-[#f47c20] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <BookOpen size={14} weight="bold" />
          Tất cả tài liệu ({materials.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("document")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "document"
              ? "bg-[#2f8fa3] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <FileText size={14} weight="bold" />
          File & Tài liệu ({docCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quiz")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "quiz"
              ? "bg-[#f47c20] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <HardDrives size={14} weight="bold" />
          Đề thi trắc nghiệm ({quizCount})
        </button>
      </div>

      {/* ADVANCED SEARCH & FILTER TOOLBAR */}
      <div className={styles.filterBar}>
        <div className={styles.searchInput}>
          <MagnifyingGlass size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên tài liệu, đề thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-2.5">
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
          <BookOpen size={44} className={styles.emptyIcon} />
          <h4>Không tìm thấy tài liệu nào</h4>
          <p>Hãy thử thay đổi từ khóa hoặc chọn lại bộ lọc môn học, loại bài.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className={styles.assignmentList}>
            {paginatedMaterials.map((item) => {
              const isQuiz = item.type === "quiz";
              return (
                <div key={item._id} className={styles.assignCard}>
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
                      onClick={() => {
                        if (!isQuiz && item.fileUrl) {
                          window.open(item.fileUrl, "_blank");
                        } else {
                          navigate(`/exams/${item._id}`);
                        }
                      }}
                    >
                      {isQuiz ? "Luyện tập ngay" : "Xem tài liệu"}{" "}
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
