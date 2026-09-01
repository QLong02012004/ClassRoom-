import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FolderOpen, BookBookmark, CaretDown, CalendarBlank, Question, Clock, Trophy, FilePdf, ArrowsCounterClockwise, Shuffle } from "phosphor-react";
import { SmartSearchBar } from "@/components/ui/Inputs/SmartSearchBar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Pagination } from "@heroui/react";
import { BackButton } from "@/components/ui/Buttons/BackButton";
import NumberStepper from "@/components/ui/FormControls/NumberStepper";
import { Checkbox as UiCheckbox } from "@/components/ui/checkbox";
import { PrimaryButton } from "@/components/ui/Buttons/PrimaryButton";
import { SecondaryButton } from "@/components/ui/Buttons/SecondaryButton";
import { ResourceDetailModal } from "@/components/ui/Dialogs/ResourceDetailModal/ResourceDetailModal";

interface AssignFromBankModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  bankAssign?: any;
  selectedBankItem?: any;
  setSelectedBankItem?: (item: any) => void;
  bankFilterType?: "all" | "quiz" | "essay";
  setBankFilterType?: (val: "all" | "quiz" | "essay") => void;
  bankSearchQuery?: string;
  setBankSearchQuery?: (val: string) => void;
  bankFilterOrigin?: string;
  setBankFilterOrigin?: (val: string) => void;
  loadingBank?: boolean;
  bankItems?: any[];
  bankModalPage?: number;
  setBankModalPage?: React.Dispatch<React.SetStateAction<number>>;
  handleSelectBankItem?: (item: any) => void;
  handleConfirmAssign?: (e: React.FormEvent) => void;
  assignTitle?: string;
  setAssignTitle?: (val: string) => void;
  assignDescription?: string;
  setAssignDescription?: (val: string) => void;
  assignCategory?: string;
  setAssignCategory?: (val: string) => void;
  assignCustomCategory?: string;
  setAssignCustomCategory?: (val: string) => void;
  assignStartDate?: string;
  setAssignStartDate?: (val: string) => void;
  assignDueDate?: string;
  setAssignDueDate?: (val: string) => void;
  assignMaxScore?: number;
  setAssignMaxScore?: (val: number) => void;
  assignDurationMinutes?: number;
  setAssignDurationMinutes?: (val: number) => void;
  assignAllowMultiple?: boolean;
  setAssignAllowMultiple?: (val: boolean) => void;
  isAssigning?: boolean;
}

export const AssignFromBankModal: React.FC<AssignFromBankModalProps> = (props) => {
  const { bankAssign } = props;

  const isOpen = props.isOpen ?? bankAssign?.isAssignFromBankOpen ?? false;
  const onClose = props.onClose ?? (() => bankAssign?.setIsAssignFromBankOpen(false));
  const selectedBankItem = props.selectedBankItem ?? bankAssign?.selectedBankItem;
  const setSelectedBankItem = props.setSelectedBankItem ?? bankAssign?.setSelectedBankItem;
  const bankSearchQuery = props.bankSearchQuery ?? bankAssign?.bankSearchQuery ?? "";
  const bankFilterType = props.bankFilterType ?? bankAssign?.bankFilterType ?? "all";
  const setBankFilterType = props.setBankFilterType ?? bankAssign?.setBankFilterType;
  const setBankSearchQuery = props.setBankSearchQuery ?? bankAssign?.setBankSearchQuery;
  const bankFilterOrigin = props.bankFilterOrigin ?? bankAssign?.bankFilterOrigin ?? "all";
  const setBankFilterOrigin = props.setBankFilterOrigin ?? bankAssign?.setBankFilterOrigin;
  const loadingBank = props.loadingBank ?? bankAssign?.loadingBank ?? false;
  const bankItems = props.bankItems ?? bankAssign?.bankItems ?? [];
  const bankModalPage = props.bankModalPage ?? bankAssign?.bankModalPage ?? 1;
  const setBankModalPage = props.setBankModalPage ?? bankAssign?.setBankModalPage;
  const handleSelectBankItem = props.handleSelectBankItem ?? bankAssign?.handleSelectBankItem;
  const handleConfirmAssign = props.handleConfirmAssign ?? bankAssign?.handleConfirmAssign;
  const assignTitle = props.assignTitle ?? bankAssign?.assignTitle ?? "";
  const setAssignTitle = props.setAssignTitle ?? bankAssign?.setAssignTitle;
  const assignDescription = props.assignDescription ?? bankAssign?.assignDescription ?? "";
  const setAssignDescription = props.setAssignDescription ?? bankAssign?.setAssignDescription;
  const assignCategory = props.assignCategory ?? bankAssign?.assignCategory ?? "homework";
  const setAssignCategory = props.setAssignCategory ?? bankAssign?.setAssignCategory;
  const assignCustomCategory = props.assignCustomCategory ?? bankAssign?.assignCustomCategory ?? "";
  const setAssignCustomCategory = props.setAssignCustomCategory ?? bankAssign?.setAssignCustomCategory;
  const assignDueDate = props.assignDueDate ?? bankAssign?.assignDueDate ?? "";
  const setAssignDueDate = props.setAssignDueDate ?? bankAssign?.setAssignDueDate;
  const assignMaxScore = props.assignMaxScore ?? bankAssign?.assignMaxScore ?? 10;
  const setAssignMaxScore = props.setAssignMaxScore ?? bankAssign?.setAssignMaxScore;
  const assignDurationMinutes = props.assignDurationMinutes ?? bankAssign?.assignDurationMinutes ?? 45;
  const setAssignDurationMinutes = props.setAssignDurationMinutes ?? bankAssign?.setAssignDurationMinutes;
  const assignAllowMultiple = props.assignAllowMultiple ?? bankAssign?.assignAllowMultiple ?? false;
  const setAssignAllowMultiple = props.setAssignAllowMultiple ?? bankAssign?.setAssignAllowMultiple;
  const isAssigning = props.isAssigning ?? bankAssign?.isAssigning ?? false;
  const [assignShuffleQuestions, setAssignShuffleQuestions] = React.useState<boolean>(false);
  const [viewingBankItem, setViewingBankItem] = React.useState<any>(null);
  const [localStartDate, setLocalStartDate] = React.useState<string>(() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const assignStartDate = props.assignStartDate ?? bankAssign?.assignStartDate ?? localStartDate;
  const setAssignStartDate = props.setAssignStartDate ?? bankAssign?.setAssignStartDate ?? setLocalStartDate;

  const filteredBankItems = React.useMemo(() => {
    if (!bankItems) return [];
    const searchLower = bankSearchQuery.toLowerCase();
    return bankItems.filter((item: any) => {
      const matchesSearch = (item.title?.toLowerCase().includes(searchLower)) || (item.description?.toLowerCase().includes(searchLower));
      const matchesType = bankFilterType === "all" ? true : item.type === bankFilterType;
      const matchesOrigin = bankFilterOrigin === "all" ? true : item.sharingStatus === bankFilterOrigin;
      return matchesSearch && matchesType && matchesOrigin;
    });
  }, [bankItems, bankSearchQuery, bankFilterType, bankFilterOrigin]);

  const itemsPerPage = 4;
  const totalBankPages = Math.max(1, Math.ceil(filteredBankItems.length / itemsPerPage));
  const currentBankItems = filteredBankItems.slice((bankModalPage - 1) * itemsPerPage, bankModalPage * itemsPerPage);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={!selectedBankItem
          ? "sm:max-w-[1020px] w-[96vw] h-[92vh] max-h-[820px] min-h-[600px] flex flex-col gap-1.5 bg-white rounded-3xl p-4 sm:p-5 overflow-hidden shadow-2xl border border-slate-100"
          : "sm:max-w-[820px] w-[96vw] max-h-[92vh] flex flex-col gap-3 bg-white rounded-3xl p-5 sm:p-6 overflow-y-auto shadow-2xl border border-slate-100"
        }
      >
        <DialogHeader className="flex-shrink-0 pb-1 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-[#f47c20] flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#f47c20]/10 border border-[#f47c20]/20 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <FolderOpen className="text-[#f47c20]" size={20} weight="duotone" />
            </div>
            Giao bài tập từ Ngân hàng đề
          </DialogTitle>
        </DialogHeader>

        {!selectedBankItem ? (
          <div className="mt-0.5 flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col gap-2 flex-shrink-0 p-2.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BookBookmark className="text-[#f47c20]" size={15} weight="duotone" />
                  Danh sách tài nguyên sẵn có
                </div>

                <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setBankFilterType("all")}
                    className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full transition-all cursor-pointer ${bankFilterType === "all"
                      ? "bg-[#f47c20] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Tất cả bài
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankFilterType("quiz")}
                    className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full transition-all cursor-pointer ${bankFilterType === "quiz"
                      ? "bg-[#f47c20] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Trắc nghiệm
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankFilterType("essay")}
                    className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full transition-all cursor-pointer ${bankFilterType === "essay"
                      ? "bg-[#2f8fa3] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Tự luận
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <SmartSearchBar
                  placeholder="Tìm kiếm bài tập từ ngân hàng..."
                  value={bankSearchQuery}
                  onChange={(val) => setBankSearchQuery(val)}
                  suggestions={bankItems.map((item: any) => ({
                    id: item._id,
                    title: item.title,
                    subtitle: item.type === 'quiz' ? `Trắc nghiệm • ${item.quizQuestions?.length || 0} câu` : `Tự luận`,
                    tag: item.sharingStatus === 'CENTER_SHARED' ? 'Thư viện' : 'Cá nhân',
                    rawData: item
                  }))}
                  onSelectSuggestion={(item) => {
                    if (item.rawData) {
                      handleSelectBankItem(item.rawData);
                    }
                  }}
                  recentSearchesKey="recent_searches_assign_bank"
                  enableShortcut={false}
                  widthClass="flex-1"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger className="min-w-[170px] justify-between px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none cursor-pointer bg-white flex items-center gap-2 font-semibold text-slate-700 hover:border-[#f47c20]/60 transition-colors shadow-2xs">
                    <span>{bankFilterOrigin === "all" ? "Tất cả nguồn" : bankFilterOrigin === "CENTER_SHARED" ? "Thư viện chung" : "Cá nhân"}</span>
                    <CaretDown size={14} className="text-slate-500 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white shadow-xl border border-slate-100 rounded-xl p-1 z-50">
                    <DropdownMenuItem onClick={() => setBankFilterOrigin("all")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                      Tất cả nguồn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBankFilterOrigin("CENTER_SHARED")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                      Thư viện chung
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBankFilterOrigin("PRIVATE")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                      Cá nhân
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {loadingBank ? (
              <div className="text-center py-12 text-slate-400 font-semibold text-sm">Đang tải dữ liệu ngân hàng đề...</div>
            ) : bankItems.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-300 rounded-2xl bg-slate-50/70 text-slate-500">
                <p className="font-bold text-slate-700">Ngân hàng đề của bạn đang trống</p>
                <p className="text-xs text-slate-400 mt-1">Hãy tạo đề thi/bài tập ở menu Ngân hàng trước khi giao.</p>
              </div>
            ) : filteredBankItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-semibold text-sm">
                Không tìm thấy tài nguyên nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
                <div className="flex flex-col justify-between flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto pr-1 py-0.5 min-h-0">
                    <div className="grid grid-cols-2 gap-2.5">
                      {currentBankItems.map((item: any) => (
                        <div
                          key={item._id}
                          onClick={() => setViewingBankItem(item)}
                          className="group border-2 border-slate-200/90 hover:border-[#f47c20] bg-white hover:bg-orange-50/20 rounded-2xl p-2.5 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden"
                          title="Bấm để xem trước chi tiết câu hỏi & đáp án"
                        >
                          {/* Header Badges: Type & Subject & Sharing Origin */}
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2.5 py-0.5 text-[10px] sm:text-xs font-extrabold rounded-md uppercase tracking-wider ${item.type === 'quiz' ? 'bg-orange-500/10 text-[#f47c20] border border-orange-500/20' : 'bg-[#2f8fa3]/10 text-[#2f8fa3] border border-[#2f8fa3]/20'}`}>
                                {item.type === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}
                              </span>
                              {item.subject && (
                                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                  {item.subject}
                                </span>
                              )}
                            </div>

                            {item.sharingStatus === 'CENTER_SHARED' ? (
                              <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                                Thư viện chung
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 rounded-md">
                                Cá nhân
                              </span>
                            )}
                          </div>

                          {/* Title & Description */}
                          <div className="flex flex-col gap-0.5 flex-1 justify-center py-0.5">
                            <h4 className="font-bold text-slate-900 group-hover:text-[#f47c20] text-sm sm:text-base line-clamp-1 transition-colors">
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-slate-600 line-clamp-1 leading-normal font-normal">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Rich Metadata Info Pill Bar */}
                          <div className="flex items-center gap-2 mt-1.5 py-1 px-2.5 bg-slate-100/80 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-semibold flex-wrap">
                            {item.type === 'quiz' ? (
                              <>
                                <span className="flex items-center gap-1.5 text-slate-800">
                                  <Question size={14} className="text-orange-500" />
                                  {item.quizQuestions?.length || 0} câu hỏi
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1.5 text-slate-800">
                                  <Clock size={14} className="text-[#2f8fa3]" />
                                  {item.durationMinutes || 15} phút
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="flex items-center gap-1.5 text-slate-800">
                                  <Trophy size={14} className="text-amber-500" />
                                  Thang điểm: {item.maxScore || 10}
                                </span>
                                {item.fileUrl && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                      <FilePdf size={14} />
                                      Có file đính kèm
                                    </span>
                                  </>
                                )}
                              </>
                            )}
                          </div>

                          {/* Footer Action Bar */}
                          <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                              <CalendarBlank size={14} className="text-slate-400" />
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Đã khởi tạo'}
                            </span>
                            <SecondaryButton
                              size="sm"
                              type="button"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleSelectBankItem(item);
                              }}
                            >
                              Giao ngay &rarr;
                            </SecondaryButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pagination Bar - Aligned strictly to the Right */}
                  {totalBankPages > 1 && (
                    <div className="flex justify-end w-full pt-1.5 pb-0 border-t border-slate-100 mt-1 flex-shrink-0 bg-white z-10">
                      <div className="ml-auto">
                        <Pagination className="gap-2">
                          <Pagination.Content>
                            <Pagination.Item>
                              <Pagination.Previous
                                isDisabled={bankModalPage === 1}
                                onPress={() => setBankModalPage((p) => Math.max(1, p - 1))}
                              >
                                Trang trước
                                <Pagination.PreviousIcon />
                              </Pagination.Previous>
                            </Pagination.Item>
                            {Array.from({ length: totalBankPages }, (_, i) => i + 1).map((p) => (
                              <Pagination.Item key={p}>
                                <Pagination.Link
                                  isActive={p === bankModalPage}
                                  onPress={() => setBankModalPage(p)}
                                  className={p === bankModalPage ? "bg-[#f47c20] text-white font-bold border-[#f47c20]" : "text-slate-600 font-medium hover:bg-slate-100"}
                                >
                                  {p}
                                </Pagination.Link>
                              </Pagination.Item>
                            ))}
                            <Pagination.Item>
                              <Pagination.Next
                                isDisabled={bankModalPage === totalBankPages}
                                onPress={() => setBankModalPage((p) => Math.min(totalBankPages, p + 1))}
                              >
                                Trang sau
                                <Pagination.NextIcon />
                              </Pagination.Next>
                            </Pagination.Item>
                          </Pagination.Content>
                        </Pagination>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleConfirmAssign} className="mt-1 flex flex-col justify-between flex-1 gap-2 min-h-0 overflow-hidden">
            <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 pr-1.5 py-0.5">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <BackButton
                  type="button"
                  onClick={() => setSelectedBankItem(null)}
                >
                  Quay lại chọn bài khác
                </BackButton>
                <span className="text-slate-300">|</span>
                <span className="text-xs sm:text-sm text-slate-600 font-bold truncate max-w-[400px]">Đang thiết lập giao bài</span>
              </div>

              {/* SELECTED RESOURCE PREVIEW BANNER CARD */}
              <div className="p-3 px-4 bg-gradient-to-r from-orange-50/80 via-amber-50/30 to-slate-50 border border-orange-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-orange-200 flex items-center justify-center flex-shrink-0 text-[#f47c20] shadow-2xs">
                    {selectedBankItem.type === 'quiz' ? <Question size={20} weight="duotone" /> : <FilePdf size={20} weight="duotone" />}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider ${selectedBankItem.type === 'quiz' ? 'bg-orange-500/10 text-[#f47c20] border border-orange-500/20' : 'bg-[#2f8fa3]/10 text-[#2f8fa3] border border-[#2f8fa3]/20'}`}>
                        {selectedBankItem.type === 'quiz' ? 'Đề thi Trắc nghiệm' : 'Bài tập Tự luận'}
                      </span>
                      {selectedBankItem.subject && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-white text-slate-700 rounded-md border border-slate-200">
                          {selectedBankItem.subject}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">{selectedBankItem.title}</h4>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 text-xs sm:text-sm font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5">
                  {selectedBankItem.type === 'quiz' ? (
                    <>
                      <Clock size={16} className="text-[#2f8fa3]" />
                      <span>{selectedBankItem.quizQuestions?.length || 0} câu hỏi • {selectedBankItem.durationMinutes || 15} phút</span>
                    </>
                  ) : (
                    <>
                      <Trophy size={16} className="text-amber-500" />
                      <span>Thang điểm gốc: {selectedBankItem.maxScore || 10}</span>
                    </>
                  )}
                </div>
              </div>

              {/* ROW 1: TIÊU ĐỀ & MÔ TẢ */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tiêu đề bài giao</label>
                  <input
                    type="text"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    className="w-full h-[42px] px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none font-semibold text-slate-800 bg-slate-50/40 focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mô tả chi tiết</label>
                  <input
                    type="text"
                    placeholder="Nhập ghi chú hoặc dặn dò..."
                    value={assignDescription}
                    onChange={(e) => setAssignDescription(e.target.value)}
                    className="w-full h-[42px] px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none font-semibold text-slate-800 bg-slate-50/40 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* ROW 2: THỜI GIAN BẮT ĐẦU & HẠN NỘP */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thời gian bắt đầu</label>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        const tzOffset = d.getTimezoneOffset() * 60000;
                        setAssignStartDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                      }}
                      className="px-2 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-[#f47c20]/10 hover:bg-[#f47c20]/20 rounded-md transition-colors cursor-pointer"
                    >
                      Bây giờ
                    </button>
                  </div>
                  <div className="relative flex items-center w-full h-[42px]">
                    <div className="absolute left-3.5 pointer-events-none text-[#f47c20] z-10">
                      <CalendarBlank size={18} weight="duotone" />
                    </div>
                    <div className="w-full h-full pl-9 pr-3.5 border border-slate-200 rounded-xl text-sm bg-slate-50/40 text-slate-800 font-bold flex items-center justify-between pointer-events-none shadow-2xs">
                      <span>
                        {assignStartDate ? (
                          (() => {
                            const d = new Date(assignStartDate);
                            if (isNaN(d.getTime())) return assignStartDate;
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            const hours = String(d.getHours()).padStart(2, '0');
                            const minutes = String(d.getMinutes()).padStart(2, '0');
                            return `${day}/${month}/${year} lúc ${hours}:${minutes}`;
                          })()
                        ) : (
                          <span className="text-slate-400 font-normal">DD/MM/YYYY - HH:mm</span>
                        )}
                      </span>
                      <CaretDown size={15} className="text-slate-400 shrink-0" />
                    </div>
                    <input
                      type="datetime-local"
                      value={assignStartDate}
                      onChange={(e) => setAssignStartDate(e.target.value)}
                      onClick={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.showPicker?.();
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hạn nộp</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 1);
                          d.setHours(23, 59, 0, 0);
                          const tzOffset = d.getTimezoneOffset() * 60000;
                          setAssignDueDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                        }}
                        className="px-2 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-[#f47c20]/10 hover:bg-[#f47c20]/20 rounded-md transition-colors cursor-pointer"
                      >
                        +1 Ngày
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 3);
                          d.setHours(23, 59, 0, 0);
                          const tzOffset = d.getTimezoneOffset() * 60000;
                          setAssignDueDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                        }}
                        className="px-2 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-[#f47c20]/10 hover:bg-[#f47c20]/20 rounded-md transition-colors cursor-pointer"
                      >
                        +3 Ngày
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 7);
                          d.setHours(23, 59, 0, 0);
                          const tzOffset = d.getTimezoneOffset() * 60000;
                          setAssignDueDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                        }}
                        className="px-2 py-0.5 text-[10px] font-extrabold text-[#f47c20] bg-[#f47c20]/10 hover:bg-[#f47c20]/20 rounded-md transition-colors cursor-pointer"
                      >
                        +7 Ngày
                      </button>
                    </div>
                  </div>
                  <div className="relative flex items-center w-full h-[42px]">
                    <div className="absolute left-3.5 pointer-events-none text-[#f47c20] z-10">
                      <CalendarBlank size={18} weight="duotone" />
                    </div>
                    <div className="w-full h-full pl-9 pr-3.5 border border-slate-200 rounded-xl text-sm bg-slate-50/40 text-slate-800 font-bold flex items-center justify-between pointer-events-none shadow-2xs">
                      <span>
                        {assignDueDate ? (
                          (() => {
                            const d = new Date(assignDueDate);
                            if (isNaN(d.getTime())) return assignDueDate;
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            const hours = String(d.getHours()).padStart(2, '0');
                            const minutes = String(d.getMinutes()).padStart(2, '0');
                            return `${day}/${month}/${year} lúc ${hours}:${minutes}`;
                          })()
                        ) : (
                          <span className="text-slate-400 font-normal">DD/MM/YYYY - HH:mm</span>
                        )}
                      </span>
                      <CaretDown size={15} className="text-slate-400 shrink-0" />
                    </div>
                    <input
                      type="datetime-local"
                      value={assignDueDate}
                      onChange={(e) => setAssignDueDate(e.target.value)}
                      onFocus={(e) => { e.target.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16); }}
                      onClick={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        target.showPicker?.();
                      }}
                      min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ROW 3: PHÂN LOẠI & ĐIỂM TỐI ĐA (HOẶC THỜI GIAN LÀM BÀI) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Phân loại bài tập</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full h-[42px] px-3.5 border border-slate-200 rounded-xl text-sm focus:border-[#f47c20] focus:ring-2 focus:ring-[#f47c20]/20 outline-none flex items-center justify-between bg-slate-50/40 hover:bg-white text-slate-800 font-semibold shadow-2xs transition-colors">
                      {
                        {
                          homework: "Bài tập về nhà",
                          periodic: "Kiểm tra định kỳ",
                          mock_exam: "Thi thử",
                          attitude: "Chuyên cần / Thái độ",
                          custom: assignCustomCategory ? assignCustomCategory : "+ Lựa chọn khác..."
                        }[assignCategory] || assignCategory || "Chọn phân loại..."
                      }
                      <CaretDown size={15} className="text-slate-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] bg-white shadow-xl border border-slate-100 rounded-xl p-1 z-50">
                      <DropdownMenuItem onClick={() => setAssignCategory("homework")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-xs sm:text-sm">
                        Bài tập về nhà
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssignCategory("periodic")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-xs sm:text-sm">
                        Kiểm tra định kỳ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssignCategory("mock_exam")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-xs sm:text-sm">
                        Thi thử
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssignCategory("attitude")} className="cursor-pointer font-semibold text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-xs sm:text-sm">
                        Chuyên cần / Thái độ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssignCategory("custom")} className="cursor-pointer font-semibold text-orange-600 hover:bg-orange-50 rounded-lg px-3 py-2 text-xs sm:text-sm border-t border-slate-100">
                        + Lựa chọn khác...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {assignCategory === "custom" && (
                    <input
                      type="text"
                      placeholder="Nhập loại bài tập tùy chỉnh..."
                      value={assignCustomCategory}
                      onChange={(e) => setAssignCustomCategory(e.target.value)}
                      className="w-full px-3.5 py-1.5 mt-0.5 border border-orange-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500/20 bg-orange-50/30"
                      required
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {selectedBankItem.type === 'quiz' ? 'Thời gian (phút)' : 'Điểm tối đa'}
                  </label>
                  <div style={{ display: 'flex', height: '42px' }}>
                    {selectedBankItem.type === 'quiz' ? (
                      <NumberStepper
                        value={assignDurationMinutes}
                        onChange={(val) => setAssignDurationMinutes(Number(val))}
                        min={1}
                        max={180}
                        step={1}
                        fullWidth
                      />
                    ) : (
                      <NumberStepper
                        value={assignMaxScore}
                        onChange={(val) => setAssignMaxScore(Number(val))}
                        min={1}
                        max={100}
                        step={1}
                        fullWidth
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* ROW 4: TÙY CHỌN NÂNG CAO */}
              <div className={`grid ${selectedBankItem?.type === 'quiz' ? 'grid-cols-2' : 'grid-cols-1'} gap-3.5`}>
                <div
                  onClick={() => setAssignAllowMultiple(!assignAllowMultiple)}
                  className={`flex items-center justify-between h-[46px] px-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${assignAllowMultiple
                    ? "bg-orange-50/80 border-[#f47c20] text-slate-900 shadow-2xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowsCounterClockwise
                      size={18}
                      className={assignAllowMultiple ? "text-[#f47c20]" : "text-slate-400"}
                      weight={assignAllowMultiple ? "bold" : "regular"}
                    />
                    <span className="font-bold text-xs sm:text-sm">
                      Nộp nhiều lần (nộp bổ sung)
                    </span>
                  </div>
                  <UiCheckbox
                    id="assignAllowMultiple"
                    checked={assignAllowMultiple}
                    tabIndex={-1}
                    className="w-5 h-5 border-2 border-slate-400 data-[state=unchecked]:bg-slate-50 data-[state=checked]:bg-[#f47c20] data-[state=checked]:border-[#f47c20] rounded-md transition-all shadow-2xs pointer-events-none"
                  />
                </div>

                {selectedBankItem?.type === 'quiz' && (
                  <div
                    onClick={() => setAssignShuffleQuestions(!assignShuffleQuestions)}
                    className={`flex items-center justify-between h-[46px] px-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${assignShuffleQuestions
                      ? "bg-orange-50/80 border-[#f47c20] text-slate-900 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shuffle
                        size={18}
                        className={assignShuffleQuestions ? "text-[#f47c20]" : "text-slate-400"}
                        weight={assignShuffleQuestions ? "bold" : "regular"}
                      />
                      <span className="font-bold text-xs sm:text-sm">
                        Đảo câu hỏi & đáp án
                      </span>
                    </div>
                    <UiCheckbox
                      id="assignShuffleQuestions"
                      checked={assignShuffleQuestions}
                      tabIndex={-1}
                      className="w-5 h-5 border-2 border-slate-400 data-[state=unchecked]:bg-slate-50 data-[state=checked]:bg-[#f47c20] data-[state=checked]:border-[#f47c20] rounded-md transition-all shadow-2xs pointer-events-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => { setSelectedBankItem(null); onClose(); }}
                className="px-5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <PrimaryButton
                type="submit"
                disabled={isAssigning}
                className="px-6 py-2 font-extrabold text-xs sm:text-sm"
              >
                {isAssigning ? "Đang giao bài..." : "Giao bài ngay"}
              </PrimaryButton>
            </div>
          </form>
        )}
      </DialogContent>

      {/* MODAL XEM CHI TIẾT CÂU HỎI & ĐÁP ÁN TRƯỚC KHI GIAO BÀI */}
      <ResourceDetailModal
        isOpen={!!viewingBankItem}
        onClose={() => setViewingBankItem(null)}
        item={viewingBankItem}
        onSelectToAssign={(item) => {
          setViewingBankItem(null);
          handleSelectBankItem(item);
        }}
      />
    </Dialog>
  );
};

export default AssignFromBankModal;
