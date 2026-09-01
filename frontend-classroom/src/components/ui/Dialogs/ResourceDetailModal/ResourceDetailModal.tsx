import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../dialog";
import { ScrollArea } from "../../scroll-area";
import { DownloadButton } from "../../Buttons/DownloadButton";
import {
  ClipboardText,
  Calculator,
  Info,
  TextAa,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  CaretLeft,
  CaretRight,
} from "phosphor-react";

export interface ResourceDetailItem {
  _id?: string;
  title: string;
  type?: "quiz" | "document" | string;
  subject?: string;
  sharingStatus?: string;
  maxScore?: number;
  durationMinutes?: number;
  description?: string;
  fileUrl?: string;
  attachments?: any[];
  questions?: any[];
  quizQuestions?: any[];
  bankItemId?: { quizQuestions?: any[] };
}

export interface ResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ResourceDetailItem | null;
  onViewQuizScores?: (item: ResourceDetailItem) => void;
  onSelectToAssign?: (item: ResourceDetailItem) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onViewQuizScores,
  onSelectToAssign,
}) => {
  const [qIndex, setQIndex] = useState(0);

  useEffect(() => {
    setQIndex(0);
  }, [item]);

  if (!item) return null;

  const isQuiz =
    item.type === "quiz" ||
    (item.questions && item.questions.length > 0) ||
    (item.quizQuestions && item.quizQuestions.length > 0) ||
    (item.bankItemId?.quizQuestions && item.bankItemId.quizQuestions.length > 0);

  const qList =
    item.questions ||
    item.quizQuestions ||
    item.bankItemId?.quizQuestions ||
    [];

  const downloadUrl =
    item.fileUrl ||
    (typeof item.attachments?.[0] === "string" ? item.attachments[0] : item.attachments?.[0]?.url || item.attachments?.[0]?.fileUrl) ||
    (item as any).attachmentUrl ||
    (typeof (item as any).files?.[0] === "string" ? (item as any).files[0] : (item as any).files?.[0]?.url) ||
    (typeof (item as any).file === "string" ? (item as any).file : (item as any).file?.url) ||
    (item as any).bankItemId?.fileUrl ||
    (typeof (item as any).bankItemId?.attachments?.[0] === "string" ? (item as any).bankItemId?.attachments[0] : (item as any).bankItemId?.attachments?.[0]?.url);

  const currentQ = qList[qIndex];
  const maxScore = item.maxScore || 10;
  const pointsPerQuestion = qList.length > 0 ? (maxScore / qList.length).toFixed(qList.length === 3 ? 1 : 0) : 2;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[980px] max-h-[92vh] flex flex-col overflow-hidden bg-white p-0 rounded-3xl">
        {/* Header */}
        <DialogHeader className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <DialogTitle className="text-lg font-extrabold flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isQuiz ? "bg-orange-100 text-[#f47c20]" : "bg-emerald-100 text-[#2f8fa3]"
              }`}
            >
              {isQuiz ? (
                <ClipboardText size={18} weight="duotone" />
              ) : (
                <Calculator size={18} weight="duotone" />
              )}
            </div>
            <span className={`truncate ${isQuiz ? "text-[#f47c20]" : "text-[#2f8fa3]"}`}>{item.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* 2-COLUMN LAYOUT: LEFT SIDEBAR + RIGHT CONTENT AREA */}
        <div className="flex-1 min-h-0 p-4 sm:p-5 flex flex-col md:flex-row gap-5 overflow-hidden">
          {/* Cột trái: Thông tin chung */}
          <ScrollArea className="w-full md:w-[310px] lg:w-[330px] flex-shrink-0 h-full" type="auto">
            <div className="space-y-3.5 pr-2.5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info size={18} className="text-[#f47c20]" weight="duotone" />
                Thông tin chung
              </h3>
              <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                  <span className="font-medium text-slate-500 text-sm">Loại tài nguyên:</span>
                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                      isQuiz
                        ? "bg-orange-50 border-orange-200 text-[#f47c20]"
                        : "bg-emerald-50 border-emerald-200 text-[#2f8fa3]"
                    }`}
                  >
                    {isQuiz ? "Trắc nghiệm" : "Bài tập tự luận"}
                  </span>
                </div>

                {item.subject && (
                  <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                    <span className="font-medium text-slate-500 text-sm">Môn học:</span>
                    <span className="font-bold text-blue-600 text-sm">{item.subject}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                  <span className="font-medium text-slate-500 text-sm">Phạm vi chia sẻ:</span>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
                      item.sharingStatus === "CENTER_SHARED"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.sharingStatus === "CENTER_SHARED" ? "Thư viện chung" : "Cá nhân"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                  <span className="font-medium text-slate-500 text-sm">Điểm tối đa:</span>
                  <span className="font-bold text-slate-800 text-sm">{item.maxScore || 10} điểm</span>
                </div>

                {isQuiz && item.durationMinutes && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500 text-sm">Thời gian làm bài:</span>
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                      <Clock size={16} className="text-[#f47c20]" />
                      {item.durationMinutes} phút
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <TextAa size={18} className="text-[#f47c20]" weight="duotone" />
                  Mô tả chi tiết
                </h3>
                <div className="bg-slate-50 p-3.5 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-200 whitespace-pre-wrap">
                  {item.description || <span className="text-slate-400 italic">Không có mô tả chi tiết.</span>}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Cột phải: Xem trước từng câu (Single Slide) HẶC File đính kèm */}
          <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 flex flex-col min-h-0 overflow-hidden">
            {isQuiz ? (
              qList.length > 0 ? (
                /* SINGLE QUESTION SLIDE PREVIEW EMBEDDED IN RIGHT COLUMN */
                <div className="flex flex-col flex-1 min-h-0 justify-between space-y-3">
                  {/* Question Box */}
                  <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#f47c20]">
                        CÂU HỎI {qIndex + 1} / {qList.length}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Điểm: {currentQ?.points || pointsPerQuestion}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {currentQ?.questionText || currentQ?.question}
                    </h4>
                  </div>

                  {/* Options Vertical Stack - Internal scroll if question text is very long */}
                  <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
                    {(currentQ?.options || []).map((opt: string, optIdx: number) => {
                      const isCorrect =
                        optIdx === currentQ.correctOptionIndex || optIdx === currentQ.correctAnswer;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2 px-3 rounded-2xl text-sm flex items-center justify-between transition-all ${
                            isCorrect
                              ? "bg-[#fff8f0] border border-[#f47c20] shadow-2xs"
                              : "bg-white border border-slate-200/90 text-slate-700 font-medium hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${
                                isCorrect
                                  ? "bg-[#f47c20] text-white shadow-xs"
                                  : "bg-slate-100 border border-slate-300 text-slate-600 font-bold"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <span
                              className={`text-xs sm:text-sm leading-snug ${
                                isCorrect ? "font-semibold text-slate-800" : "font-medium text-slate-700"
                              }`}
                            >
                              {opt}
                            </span>
                          </div>

                          {isCorrect && (
                            <span className="text-[#f47c20] font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase flex items-center gap-1 shrink-0 bg-orange-100/60 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                              ĐÁP ÁN ĐÚNG
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation Controls & Dot Indicators */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
                    <button
                      type="button"
                      disabled={qIndex === 0}
                      onClick={() => setQIndex((prev) => Math.max(0, prev - 1))}
                      className="px-3.5 py-1.5 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <CaretLeft size={15} weight="bold" />
                      Câu trước
                    </button>

                    <div className="flex items-center gap-1.5">
                      {qList.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQIndex(idx)}
                          className={`h-2.5 rounded-full transition-all cursor-pointer ${
                            idx === qIndex ? "w-6 bg-[#f47c20]" : "w-2.5 bg-slate-200 hover:bg-slate-300"
                          }`}
                          title={`Câu ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={qIndex === qList.length - 1}
                      onClick={() => setQIndex((prev) => Math.min(qList.length - 1, prev + 1))}
                      className="px-3.5 py-1.5 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
                    >
                      Câu sau
                      <CaretRight size={15} weight="bold" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-medium text-sm">
                  Chưa có danh sách câu hỏi chi tiết.
                </div>
              )
            ) : downloadUrl ? (
              <div className="h-full border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <FileText size={64} weight="duotone" className="text-[#2f8fa3] mb-4" />
                <h4 className="text-lg font-bold text-slate-800 mb-2">Tài liệu đính kèm</h4>
                <p className="text-slate-500 text-sm mb-6 max-w-xs">
                  Học liệu này là dạng file tự luận. Bạn có thể tải file về để xem chi tiết nội dung.
                </p>
                <DownloadButton href={downloadUrl} label="Tải xuống tài liệu" />
              </div>
            ) : (
              <div className="h-full border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <FileText size={64} weight="duotone" className="text-slate-400 mb-4" />
                <h4 className="text-lg font-bold text-slate-800 mb-2">Bài tập tự luận</h4>
                <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                  Bài tập này được thực hiện theo hướng dẫn trong phần <strong>Mô tả chi tiết</strong> bên trái. Không có tệp tài liệu đính kèm.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div>
            {isQuiz && onViewQuizScores && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewQuizScores(item);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#f47c20]/10 hover:bg-[#f47c20]/20 text-[#f47c20] font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                <Eye size={16} weight="bold" />
                Xem bảng điểm bài làm
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Đóng
            </button>
            {onSelectToAssign && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectToAssign(item);
                }}
                className="px-5 py-2 bg-[#f47c20] hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-2xs"
              >
                Giao bài ngay &rarr;
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceDetailModal;
