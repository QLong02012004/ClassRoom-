/**
 * @file FocusGradingModal.tsx
 * @description Component Modal Chấm điểm Tập trung (Focus Grading Modal)
 * - Dùng để hiển thị giao diện chấm điểm chi tiết từng bài nộp của học sinh (bài tập tự luận / file đính kèm).
 * - Cung cấp các nút chọn nhanh điểm số (Quick Score Chips: 10, 9.5, 8.5...), nhãn nhận xét nhanh (Quick Feedback Tags).
 * - Hỗ trợ chuyển đổi bài nộp học sinh nhanh bằng phím tắt (Left/Right arrow, [ / ]).
 * - Cho phép tải về hoặc mở xem file bài làm đính kèm trực tiếp.
 */

import React from "react";
import {
  FileText,
  Paperclip,
  FilePdf,
  Eye,
  DownloadSimple,
  PencilSimple,
  X,
  Check,
  WarningCircle,
  Clock,
} from "phosphor-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SecondaryButton } from "@/components/ui/Buttons/SecondaryButton";
import { handleDownloadOrOpenFile } from "@/utils/downloadHelper";
import { useToast } from "@/components/Styles/ToastContext";
import { format4DigitScore } from "@/utils/scoreFormatter";

export const QUICK_FEEDBACK_TAGS = [
  "Bài làm xuất sắc! ",
  "Trình bày sạch đẹp, tư duy tốt! ",
  "Cần chú ý lỗi tính toán nhỏ.",
  "Xem lại công thức bài 2.",
  "Chưa hoàn thành đủ số bài quy định.",
  "Cố gắng phát huy ở bài tiếp theo nhé! ",
];

interface FocusGradingModalProps {
  focusGradingSub: any | null;
  assignmentSubmissions: any[];
  selectedAssignment: any | null;
  gradingData: Record<string, { score: number | string; feedback: string }>;
  setGradingData: React.Dispatch<React.SetStateAction<Record<string, { score: number | string; feedback: string }>>>;
  onClose: () => void;
  onSelectSubmission: (sub: any) => void;
  onSaveGrades?: () => Promise<void> | void;
  isSavingGrades?: boolean;
  getFileExt: (filename?: string) => string;
  formatCleanFileName: (rawName?: string, rawUrl?: string) => string;
  formatFileSize: (bytes?: any) => string | null;
  formatFileUrl: (url: string) => string;
}

export default function FocusGradingModal({
  focusGradingSub,
  assignmentSubmissions,
  selectedAssignment,
  gradingData,
  setGradingData,
  onClose,
  onSelectSubmission,
  onSaveGrades,
  isSavingGrades,
  getFileExt,
  formatCleanFileName,
  formatFileSize,
  formatFileUrl,
}: FocusGradingModalProps) {
  const toast = useToast();
  const [previewModalFile, setPreviewModalFile] = React.useState<{
    name: string;
    url: string;
    ext: string;
    size: string;
    isExpiredBlob: boolean;
  } | null>(null);

  if (!focusGradingSub) return null;

  const fStudentObj =
    typeof focusGradingSub.studentId === "object"
      ? focusGradingSub.studentId
      : { _id: focusGradingSub.studentId, name: "Học sinh", email: "" };
  const fStudentIdStr = fStudentObj._id;
  const fRawScore =
    gradingData[fStudentIdStr]?.score ??
    (focusGradingSub.score !== undefined && focusGradingSub.score !== null ? focusGradingSub.score : "");
  const fCurrentScore = fRawScore !== undefined && fRawScore !== null ? String(fRawScore) : "";
  const fCurrentFeedback = gradingData[fStudentIdStr]?.feedback ?? "";
  const currentSubIdx = assignmentSubmissions.findIndex((s) => s._id === focusGradingSub._id);

  // Thang điểm tối đa (chuẩn 10.00 của trung tâm)
  const maxScore = 10;
  const isScoreSelected = (pts: number) => {
    if (fCurrentScore === "") return false;
    const num = parseFloat(String(fCurrentScore).replace(/,/g, "."));
    return !isNaN(num) && num === pts;
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/,/g, ".").trim();

    // 1. Cho phép xóa trống để nhập lại điểm từ đầu
    if (raw === "") {
      setGradingData((prev) => ({
        ...prev,
        [fStudentIdStr]: { ...prev[fStudentIdStr], score: "" },
      }));
      return;
    }

    // 2. Phát hiện và cảnh báo ngay khi nhập số âm
    if (raw.includes("-") || raw.startsWith("-")) {
      toast.error("Điểm số không được là số âm! Thang điểm quy định từ 00.00 đến 10.00.");
      setGradingData((prev) => ({
        ...prev,
        [fStudentIdStr]: { ...prev[fStudentIdStr], score: "00.00" },
      }));
      return;
    }

    // 3. Hỗ trợ bắt đầu bằng dấu chấm (ví dụ: ".5" -> "0.5")
    if (raw === ".") raw = "0.";

    // 4. Chỉ cho phép nhập số và tối đa 1 dấu chấm
    if (!/^\d*\.?\d*$/.test(raw)) {
      toast.warning("Vui lòng chỉ nhập ký tự số và dấu chấm (ví dụ: 08.50, 10.00)!");
      return;
    }

    // 5. Giới hạn tối đa 2 chữ số thập phân
    const parts = raw.split(".");
    if (parts.length === 2 && parts[1].length > 2) {
      toast.warning("Điểm số chỉ được tối đa 2 chữ số thập phân sau dấu chấm (XX.XX)!");
      raw = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }

    // 6. Phát hiện và cảnh báo ngay nếu nhập vượt quá 10.00
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 10) {
      toast.error("Điểm số không được vượt quá 10.00! Hệ thống đã tự động điều chỉnh về 10.00.");
      raw = "10.00";
    }

    setGradingData((prev) => ({
      ...prev,
      [fStudentIdStr]: { ...prev[fStudentIdStr], score: raw },
    }));
  };

  const handleScoreBlur = () => {
    const raw = String(fCurrentScore).trim();
    if (raw === "" || isNaN(parseFloat(raw))) {
      setGradingData((prev) => ({
        ...prev,
        [fStudentIdStr]: { ...prev[fStudentIdStr], score: "00.00" },
      }));
    } else {
      const formatted = format4DigitScore(raw);
      setGradingData((prev) => ({
        ...prev,
        [fStudentIdStr]: { ...prev[fStudentIdStr], score: formatted },
      }));
    }
  };

  const handleStepScore = (step: number) => {
    const raw = String(fCurrentScore).trim();
    const curr = raw === "" || isNaN(parseFloat(raw)) ? 0 : parseFloat(raw);

    if (step > 0 && curr >= 10) {
      toast.warning("Điểm tối đa là 10.00, không thể tăng thêm!");
      return;
    }
    if (step < 0 && curr <= 0) {
      toast.warning("Điểm tối thiểu là 00.00, không thể giảm thêm!");
      return;
    }

    const next = Math.min(10, Math.max(0, Math.round((curr + step) * 100) / 100));
    setGradingData((prev) => ({
      ...prev,
      [fStudentIdStr]: { ...prev[fStudentIdStr], score: format4DigitScore(next) },
    }));
  };

  const handleScoreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const isVirtual = String(focusGradingSub._id || "").startsWith("virtual_");
  const hasAttachments = Boolean(focusGradingSub.attachments && focusGradingSub.attachments.length > 0);
  const hasText = Boolean(focusGradingSub.submissionText && focusGradingSub.submissionText.trim().length > 0);
  const hasSubmitted = !isVirtual && (Boolean(focusGradingSub.submittedAt) || hasAttachments || hasText || focusGradingSub.status === "submitted" || focusGradingSub.status === "late");

  const isPastDue = selectedAssignment?.dueDate
    ? new Date().getTime() > new Date(selectedAssignment.dueDate).getTime()
    : false;

  let isLateSub = focusGradingSub.status === "late";
  let lateText = "";

  if (selectedAssignment?.dueDate && focusGradingSub.submittedAt) {
    const subTime = new Date(focusGradingSub.submittedAt).getTime();
    const dueTime = new Date(selectedAssignment.dueDate).getTime();
    if (dueTime > 0 && subTime > dueTime) {
      isLateSub = true;
      const diffMs = subTime - dueTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        const remHours = diffHours % 24;
        lateText = remHours > 0 ? `Trễ ${diffDays} ngày ${remHours} giờ` : `Trễ ${diffDays} ngày`;
      } else if (diffHours > 0) {
        const remMins = diffMins % 60;
        lateText = remMins > 0 ? `Trễ ${diffHours} giờ ${remMins} phút` : `Trễ ${diffHours} giờ`;
      } else {
        lateText = `Trễ ${Math.max(1, diffMins)} phút`;
      }
    }
  }

  return (
    <Dialog open={!!focusGradingSub} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="w-[96vw] max-w-[1440px] sm:max-w-[1440px] h-[92vh] max-h-[92vh] my-auto flex flex-col p-0 overflow-hidden rounded-[28px] gap-0 border border-slate-200/80 shadow-2xl bg-white">
        {/* HEADER MODAL */}
        <DialogHeader className="px-7 py-4 bg-gradient-to-r from-slate-50 via-orange-50/30 to-slate-50 border-b border-slate-100 flex flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={
                fStudentObj.avatar ||
                "https://ui-avatars.com/api/?name=" + encodeURIComponent(fStudentObj.name || "HS") + "&background=f47c20&color=fff&bold=true"
              }
              alt="avatar"
              className="w-11 h-11 rounded-full border-2 border-[#f47c20]/40 object-cover shadow-sm shrink-0"
            />
            <div className="flex flex-col min-w-0 truncate">
              <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2 truncate">
                Chấm bài chi tiết: <span className="text-[#f47c20] font-black truncate">{fStudentObj.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-slate-600 font-semibold truncate max-w-[200px] sm:max-w-none">{fStudentObj.email}</span>
                {hasSubmitted && focusGradingSub.submittedAt ? (
                  <>
                    <span>•</span>
                    <span className="text-slate-500 whitespace-nowrap">
                      Nộp bài lúc: <strong className="text-slate-700 font-bold">{new Date(focusGradingSub.submittedAt).toLocaleString("vi-VN")}</strong>
                    </span>
                    {isLateSub ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#fff7ed] text-[#f47c20] border border-[#fed7aa] shadow-3xs flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f47c20]" />
                        Nộp muộn {lateText ? `(${lateText})` : ""}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-3xs flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đúng hạn
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span>•</span>
                    {isPastDue ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-3xs flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Quá hạn • Chưa nộp bài
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shadow-3xs flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Chưa nộp bài (Đang làm)
                      </span>
                    )}
                  </>
                )}
              </DialogDescription>
            </div>
          </div>

          {/* NAV HỌC SINH & CLOSE BUTTON */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <span className="text-xs font-black text-[#2f8fa3] bg-[#2f8fa3]/10 px-3 py-1.5 rounded-xl border border-[#2f8fa3]/25 whitespace-nowrap">
              Học sinh {currentSubIdx + 1} / {assignmentSubmissions.length}
            </span>
            <button
              type="button"
              title="Phím tắt: Mũi tên trái (←) hoặc ["
              disabled={currentSubIdx <= 0}
              onClick={() => currentSubIdx > 0 && onSelectSubmission(assignmentSubmissions[currentSubIdx - 1])}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 transition-all cursor-pointer shadow-3xs flex items-center gap-1 whitespace-nowrap"
            >
              ← Trước <span className="text-[10px] font-normal text-slate-400 hidden lg:inline">(←)</span>
            </button>
            <button
              type="button"
              title="Phím tắt: Mũi tên phải (→) hoặc ]"
              disabled={currentSubIdx >= assignmentSubmissions.length - 1}
              onClick={() => currentSubIdx < assignmentSubmissions.length - 1 && onSelectSubmission(assignmentSubmissions[currentSubIdx + 1])}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-orange-50 hover:text-[#f47c20] hover:border-orange-200 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 transition-all cursor-pointer shadow-3xs flex items-center gap-1 whitespace-nowrap"
            >
              Sau → <span className="text-[10px] font-normal text-slate-400 hidden lg:inline">(→)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer ml-1 shrink-0"
              title="Đóng modal"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </DialogHeader>

        {/* BODY MODAL */}
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-y-auto md:overflow-hidden bg-slate-50/60 min-h-0">
          {/* CỘT TRÁI: BÀI LÀM CỦA HỌC SINH (Chiếm 7/12 không gian, cuộn độc lập) */}
          <div className="md:col-span-7 flex flex-col gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-3xs overflow-y-auto min-h-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <FileText size={17} className="text-[#2f8fa3]" weight="bold" />
                Nội dung bài làm & File nộp
              </h4>
            </div>

            {hasSubmitted ? (
              <>
                {focusGradingSub.submissionText ? (
                  <div className="bg-[#fffbf5] p-4 rounded-2xl text-xs text-slate-800 font-semibold leading-relaxed border border-[#fde8d3] whitespace-pre-wrap shadow-3xs">
                    "{focusGradingSub.submissionText}"
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 font-medium italic bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
                    Học sinh không nhập văn bản bài làm (chỉ nộp tệp đính kèm).
                  </div>
                )}

                {focusGradingSub.attachments && focusGradingSub.attachments.length > 0 && (
                  <div className="flex flex-col gap-3 mt-1">
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Paperclip size={16} className="text-[#f47c20]" weight="bold" />
                      File đính kèm ({focusGradingSub.attachments.length}):
                    </span>

                    <div className="flex flex-col gap-2.5">
                      {focusGradingSub.attachments.map((att: any, aIdx: number) => {
                        const ext = getFileExt(att.name || att.url);
                        const isImg = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "");
                        const isPdf = ext === "pdf";
                        const cleanName = formatCleanFileName(att.name, att.url);
                        const sizeStr = formatFileSize(att.size);
                        const fileUrl = formatFileUrl(att.url);

                        return (
                          <div
                            key={aIdx}
                            className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/90 hover:bg-orange-50/40 border border-slate-200/90 hover:border-[#f47c20]/50 rounded-2xl transition-all shadow-3xs group"
                          >
                            <div className="flex items-center gap-3 truncate min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isPdf ? "bg-rose-50 text-rose-500" : isImg ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-[#f47c20]"
                                  }`}
                              >
                                {isPdf ? (
                                  <FilePdf size={22} weight="fill" />
                                ) : isImg ? (
                                  <Eye size={22} weight="bold" />
                                ) : (
                                  <Paperclip size={22} weight="bold" />
                                )}
                              </div>
                              <div className="flex flex-col truncate min-w-0">
                                <span className="text-xs font-black text-slate-800 truncate group-hover:text-[#f47c20] transition-colors" title={cleanName}>
                                  {cleanName}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {ext ? ext.toUpperCase() : "FILE"} {sizeStr ? `• ${sizeStr}` : ""}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  let isExpired = false;
                                  if (fileUrl.startsWith("blob:")) {
                                    try {
                                      const res = await fetch(fileUrl);
                                      if (!res.ok) isExpired = true;
                                    } catch {
                                      isExpired = true;
                                    }
                                  }
                                  setPreviewModalFile({
                                    name: cleanName,
                                    url: fileUrl,
                                    ext: ext ? ext.toUpperCase() : "FILE",
                                    size: sizeStr || "",
                                    isExpiredBlob: isExpired,
                                  });
                                }}
                                className="px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:text-[#2f8fa3] bg-white hover:bg-cyan-50 border border-slate-200 hover:border-[#2f8fa3]/40 rounded-xl transition-all inline-flex items-center gap-1 shadow-3xs cursor-pointer"
                                title="Xem chi tiết thông tin tệp"
                              >
                                <Eye size={15} weight="bold" />
                                Xem trực tiếp
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadOrOpenFile(fileUrl, cleanName)}
                                className="px-3 py-1.5 text-xs font-extrabold text-[#f47c20] hover:text-white bg-orange-50 hover:bg-[#f47c20] border border-orange-200 hover:border-[#f47c20] rounded-xl transition-all inline-flex items-center gap-1 shadow-3xs cursor-pointer"
                                title="Tải về máy"
                              >
                                <DownloadSimple size={15} weight="bold" />
                                Tải file
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-rose-50/70 to-orange-50/30 border border-rose-200/70 rounded-2xl text-center gap-3.5 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                  <WarningCircle size={32} weight="fill" />
                </div>
                <div>
                  <h5 className="text-sm font-black text-rose-900 mb-1">Học sinh chưa nộp bài làm</h5>
                  <p className="text-xs text-rose-700/90 max-w-sm leading-relaxed">
                    Học sinh <strong>{fStudentObj.name}</strong> chưa gửi bài làm hoặc bất kỳ tệp đính kèm nào trên hệ thống cho bài tập trực tuyến này.
                  </p>
                </div>

                {selectedAssignment?.dueDate && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-rose-100 shadow-3xs">
                    <Clock size={15} className="text-slate-400 shrink-0" />
                    <span>Hạn nộp: <strong>{new Date(selectedAssignment.dueDate).toLocaleString("vi-VN")}</strong></span>
                    {isPastDue ? (
                      <span className="text-rose-600 font-bold ml-1">(Đã hết hạn nộp)</span>
                    ) : (
                      <span className="text-emerald-600 font-bold ml-1">(Còn hạn làm bài)</span>
                    )}
                  </div>
                )}

                <div className="w-full text-left bg-white/90 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed shadow-3xs flex items-start gap-2">
                  <span className="text-amber-500 font-bold text-sm leading-none shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <strong>Quyền hạn chấm & sửa điểm của Giáo viên:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                      <li>Nếu học sinh chưa nộp và <strong>còn hạn</strong>: Khuyến nghị chờ học sinh gửi bài trước khi cho điểm.</li>
                      <li>Nếu <strong>đã quá hạn nộp</strong>: Hệ thống tạm ghi nhận <strong>00.00 điểm</strong>. Giáo viên <strong>hoàn toàn có quyền sửa lại điểm số</strong> (ví dụ: cho nộp bù, thi lại) bất cứ khi nào.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: CHẤM ĐIỂM & NHẬN XÉT (Chiếm 5/12 không gian, cuộn độc lập) */}
          <div className="md:col-span-5 flex flex-col gap-5 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-3xs overflow-y-auto min-h-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <PencilSimple size={17} className="text-[#f47c20]" weight="bold" />
                Đánh giá & Cho điểm
              </h4>
            </div>

            {!hasSubmitted && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                isPastDue
                  ? "bg-rose-50/85 border-rose-200 text-rose-900"
                  : "bg-amber-50/85 border-amber-200 text-amber-900"
              }`}>
                <WarningCircle size={18} className={isPastDue ? "text-rose-600 shrink-0 mt-0.5" : "text-amber-600 shrink-0 mt-0.5"} weight="fill" />
                <div className="flex-1">
                  <p className="font-extrabold text-[12px]">
                    {isPastDue ? "Học sinh quá hạn nộp bài (Tạm ghi nhận 00.00 điểm)" : "Học sinh chưa nộp bài tập (Đang trong hạn làm bài)"}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {isPastDue
                      ? "Giáo viên hoàn toàn có quyền nhập điểm hoặc sửa lại điểm số bất kỳ lúc nào (ví dụ: học sinh nộp bù hoặc làm bài bổ sung)."
                      : "Bài tập vẫn đang trong thời gian làm bài. Không nên cho điểm khi học sinh chưa gửi bài."}
                  </p>
                  {isPastDue && (
                    <button
                      type="button"
                      onClick={() => {
                        setGradingData((prev) => ({
                          ...prev,
                          [fStudentIdStr]: {
                            score: "00.00",
                            feedback: "Học sinh không nộp bài tập trực tuyến quá thời hạn quy định.",
                          },
                        }));
                      }}
                      className="mt-2 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shadow-3xs cursor-pointer inline-flex items-center gap-1 transition-colors"
                    >
                      <Check size={13} weight="bold" /> Gán nhanh 00.00 điểm (Quá hạn)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Ô CHỌN ĐIỂM SỐ */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700">Điểm số (Thang điểm 00.00 - 10.00):</label>
                <span className="text-[11px] font-semibold text-slate-400">Luôn gồm 4 số (XX.XX) • Click hoặc gõ phím</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fCurrentScore}
                    placeholder="00.00"
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleScoreKeyDown}
                    onChange={handleScoreChange}
                    onBlur={handleScoreBlur}
                    className="w-36 h-13 text-center font-black text-2xl text-[#f47c20] bg-orange-50/70 border-2 border-[#f47c20] focus:border-[#f47c20] focus:ring-4 focus:ring-[#f47c20]/25 rounded-2xl outline-none transition-all shadow-sm cursor-text tracking-wider"
                  />
                </div>
                <span className="text-base font-black text-slate-600">/ 10.00 điểm</span>

                {/* STEPPER THAY ĐỔI ĐIỂM SỐ */}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    title="Giảm 0.5 điểm"
                    onClick={() => handleStepScore(-0.5)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#f47c20] font-black text-xs border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-3xs"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    title="Tăng 0.5 điểm"
                    onClick={() => handleStepScore(+0.5)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#f47c20] font-black text-xs border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-3xs"
                  >
                    +0.5
                  </button>
                </div>
              </div>

              {/* CHIPS ĐIỂM NHANH GỌN */}
              <div className="grid grid-cols-5 gap-1.5 mt-1 p-1.5 bg-slate-50/60 rounded-2xl border border-slate-200/80">
                {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6, 5, 0].map((pts) => {
                  const formattedVal = format4DigitScore(pts);
                  const active = isScoreSelected(pts);
                  return (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => {
                        setGradingData((prev) => ({
                          ...prev,
                          [fStudentIdStr]: {
                            ...prev[fStudentIdStr],
                            score: formattedVal,
                          },
                        }));
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${active
                        ? "bg-[#f47c20] text-white border-2 border-[#f47c20] shadow-sm scale-105"
                        : "bg-white hover:bg-orange-50 text-slate-500 hover:text-[#f47c20] border border-slate-200/90"
                        }`}
                    >
                      {formattedVal} đ
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ô NHẬN XÉT ĐA DÒNG */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                <span>Nhận xét của giáo viên:</span>
                <span className="text-[11px] font-normal text-slate-400">Click thẻ bên dưới để chèn nhanh</span>
              </label>
              <textarea
                rows={4}
                placeholder="Nhập lời khen hoặc nhận xét góp ý chi tiết cho học sinh..."
                value={fCurrentFeedback}
                onChange={(e) => {
                  setGradingData((prev) => ({
                    ...prev,
                    [fStudentIdStr]: {
                      ...prev[fStudentIdStr],
                      feedback: e.target.value,
                    },
                  }));
                }}
                className="w-full p-4 bg-slate-50/80 border border-slate-200 focus:border-[#f47c20] focus:ring-4 focus:ring-[#f47c20]/15 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 outline-none leading-relaxed transition-all shadow-3xs resize-none"
              />

              {/* GỢI Ý NHẬN XÉT THÔNG MINH */}
              <div className="flex flex-wrap gap-1.5 p-2 max-h-[140px] overflow-y-auto bg-slate-50/60 border border-slate-200/80 rounded-2xl">
                {QUICK_FEEDBACK_TAGS.map((tag, tIdx) => {
                  const isIncluded = fCurrentFeedback.includes(tag);
                  return (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() => {
                        setGradingData((prev) => {
                          const oldFb = prev[fStudentIdStr]?.feedback || "";
                          const newFb = oldFb
                            ? isIncluded
                              ? oldFb.replace(tag, "").replace(/\s+/g, " ").trim()
                              : `${oldFb} ${tag}`
                            : tag;
                          return {
                            ...prev,
                            [fStudentIdStr]: {
                              ...prev[fStudentIdStr],
                              feedback: newFb,
                            },
                          };
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${isIncluded
                        ? "bg-[#2f8fa3] text-white border border-[#2f8fa3] shadow-3xs"
                        : "bg-white hover:bg-orange-50 text-slate-600 hover:text-[#f47c20] border border-slate-200/90"
                        }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy & Đóng
          </button>

          <div className="flex items-center gap-3">
            {currentSubIdx < assignmentSubmissions.length - 1 && (
              <SecondaryButton
                type="button"
                size="lg"
                disabled={isSavingGrades}
                style={{ "--color": "#2f8fa3" } as React.CSSProperties}
                onClick={async () => {
                  if (onSaveGrades) {
                    await onSaveGrades();
                  }
                  onSelectSubmission(assignmentSubmissions[currentSubIdx + 1]);
                }}
              >
                {isSavingGrades ? "Đang lưu..." : "Lưu & Chấm tiếp →"}
              </SecondaryButton>
            )}
            <SecondaryButton
              type="button"
              size="lg"
              disabled={isSavingGrades}
              onClick={async () => {
                if (onSaveGrades) {
                  await onSaveGrades();
                }
                onClose();
              }}
            >
              <Check size={18} weight="bold" />
              {isSavingGrades ? "Đang lưu..." : "Hoàn tất & Đóng"}
            </SecondaryButton>
          </div>
        </div>
      </DialogContent>

      {/* IN-APP FILE PREVIEW DIALOG */}
      {previewModalFile && (
        <Dialog open={!!previewModalFile} onOpenChange={(open) => !open && setPreviewModalFile(null)}>
          <DialogContent showCloseButton className="w-[94vw] max-w-[1150px] sm:max-w-[1150px] max-h-[88vh] p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl z-50">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText size={20} className="text-[#f47c20]" weight="bold" />
                Xem chi tiết tệp bài nộp: <span className="text-[#f47c20] font-black">{previewModalFile.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Định dạng: {previewModalFile.ext} {previewModalFile.size ? `• Dung lượng: ${previewModalFile.size}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 flex flex-col items-center justify-center min-h-[280px]">
              {previewModalFile.isExpiredBlob ? (
                <div className="w-full p-6 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xl shadow-3xs">
                    📄
                  </div>
                  <h4 className="text-sm font-black text-slate-800">
                    Tệp đính kèm thuộc phiên thử nghiệm cũ
                  </h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-lg">
                    Học sinh đã đính kèm tệp <strong className="text-slate-900 font-bold">{previewModalFile.name}</strong> (Định dạng {previewModalFile.ext}, dung lượng {previewModalFile.size || "file"}). Tệp này từng được tạo dưới dạng URL RAM tạm trong phiên làm việc cũ nên đã hết hạn sau khi F5.
                  </p>
                  <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 text-xs text-slate-600 font-semibold w-full text-left shadow-3xs flex items-center gap-2">
                    <span className="text-amber-500 text-base">💡</span>
                    <span><strong>Lưu ý:</strong> Tất cả các bài nộp mới của học sinh hiện tại đã được hệ thống tự động tải lên Server/Cloud vĩnh viễn, không bao giờ bị hết hạn!</span>
                  </div>
                </div>
              ) : previewModalFile.ext === "PDF" || previewModalFile.url.includes("pdf") ? (
                <iframe
                  src={previewModalFile.url}
                  title={previewModalFile.name}
                  className="w-full h-[520px] rounded-2xl border border-slate-200 shadow-inner"
                />
              ) : ["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(previewModalFile.ext) || previewModalFile.url.startsWith("data:image") ? (
                <img
                  src={previewModalFile.url}
                  alt={previewModalFile.name}
                  className="max-h-[500px] max-w-full object-contain rounded-2xl shadow-md border border-slate-200"
                />
              ) : (
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-600 font-semibold mb-3">Tệp định dạng {previewModalFile.ext} không hỗ trợ xem trước trực tiếp.</p>
                  <button
                    type="button"
                    onClick={() => handleDownloadOrOpenFile(previewModalFile.url, previewModalFile.name)}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#f47c20] hover:bg-orange-600 rounded-xl shadow-sm cursor-pointer transition-colors"
                  >
                    Tải tệp về máy
                  </button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
