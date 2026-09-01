import React from "react";
import { BackButton } from "@/components/ui/Buttons/BackButton";
import { SaveButton } from "@/components/ui/Buttons/SaveButton";
import { FileUploadButton } from "@/components/ui/Buttons/FileUploadButton";
import { Table } from "@heroui/react";
import {
  ClipboardText,
  CheckCircle,
  Users,
  Clock,
  FolderOpen,
  Paperclip,
  NotePencil,
  DownloadSimple,
} from "phosphor-react";
import FocusGradingModal from "./FocusGradingModal";
import { formatFileUrl, getFileExt, formatFileSize, formatCleanFileName, exportAssignmentToExcel } from "../../utils/classroomUtils";

interface AssignmentGradingViewProps {
  assignmentGrading?: any;
  focusGrading?: any;
  selectedAssignment?: any;
  setSelectedAssignment?: (assignment: any) => void;
  assignmentSubmissions?: any[];
  loadingSubmissions?: boolean;
  isSavingGrades?: boolean;
  handleSaveGrades?: () => void;
  gradingData?: any;
  setGradingData?: (data: any) => void;
  focusGradingSub?: any;
  setFocusGradingSub?: (sub: any) => void;
  getFileExt?: (filename?: string) => string;
  formatCleanFileName?: (rawName?: string, rawUrl?: string) => string;
  formatFileSize?: (bytes?: any) => string | null;
  formatFileUrl?: (url: string) => string;
}

export const AssignmentGradingView: React.FC<AssignmentGradingViewProps> = (props) => {
  const { assignmentGrading, focusGrading } = props;

  const selectedAssignment = props.selectedAssignment ?? assignmentGrading?.selectedAssignment;
  const setSelectedAssignment = props.setSelectedAssignment ?? assignmentGrading?.setSelectedAssignment;
  const assignmentSubmissions = props.assignmentSubmissions ?? assignmentGrading?.assignmentSubmissions ?? [];
  const loadingSubmissions = props.loadingSubmissions ?? assignmentGrading?.loadingSubmissions ?? false;
  const isSavingGrades = props.isSavingGrades ?? assignmentGrading?.isSavingGrades ?? false;
  const handleSaveGrades = props.handleSaveGrades ?? assignmentGrading?.handleSaveGrades;
  const gradingData = props.gradingData ?? focusGrading?.gradingData ?? {};
  const setGradingData = props.setGradingData ?? focusGrading?.setGradingData;
  const focusGradingSub = props.focusGradingSub ?? focusGrading?.focusGradingSub;
  const setFocusGradingSub = props.setFocusGradingSub ?? focusGrading?.setFocusGradingSub;
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 pt-2">
      {/* OUTSIDE BACK BUTTON */}
      <div>
        <BackButton onClick={() => setSelectedAssignment(null)}>
          Quay lại danh sách bài tập
        </BackButton>
      </div>

      {/* HEADER BANNER & STATS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <ClipboardText size={28} className="text-[#f47c20]" weight="duotone" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#f47c20] bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/60 inline-block mb-1">
                Bài tập tự luận
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                Chấm bài: {selectedAssignment.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thang điểm:</span>
              <span className="text-base font-extrabold text-[#f47c20]">{selectedAssignment.maxScore || 10} điểm</span>
            </div>
            <FileUploadButton
              label="Xuất file Excel"
              onClick={() => exportAssignmentToExcel(selectedAssignment, assignmentSubmissions, gradingData)}
              disabled={loadingSubmissions || assignmentSubmissions.length === 0}
            />
          </div>
        </div>

        {/* QUICK STATS CARDS */}
        {!loadingSubmissions && assignmentSubmissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-100">
            {/* Card 1: Tổng bài đã nộp */}
            <div className="bg-[#2f8fa3]/10 border border-[#2f8fa3]/20 rounded-3xl p-5 flex flex-col justify-between shadow-3xs relative overflow-hidden min-h-[135px]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-[#2f8fa3] uppercase tracking-wider block">TỔNG BÀI ĐÃ NỘP</span>
                  <strong className="text-3xl font-black text-slate-800 block mt-1">
                    {assignmentSubmissions.length} bài
                  </strong>
                </div>
                <div className="p-3 bg-white text-[#2f8fa3] rounded-2xl shadow-3xs shrink-0 flex items-center justify-center">
                  <Users size={22} weight="bold" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-[#2f8fa3] block">↗ Tiến độ bài tập</span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Sĩ số nộp bài thực tế từ học sinh</span>
              </div>
            </div>

            {/* Card 2: Đã chấm điểm */}
            <div className="bg-[#dcfce7]/50 border border-[#bbf7d0]/40 rounded-3xl p-5 flex flex-col justify-between shadow-3xs relative overflow-hidden min-h-[135px]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-[#15803d] uppercase tracking-wider block">ĐÃ CHẤM ĐIỂM</span>
                  <strong className="text-3xl font-black text-slate-800 block mt-1">
                    {assignmentSubmissions.filter((s: any) => s.status === "graded").length} / {assignmentSubmissions.length} bài
                  </strong>
                </div>
                <div className="p-3 bg-white text-[#15803d] rounded-2xl shadow-3xs shrink-0 flex items-center justify-center">
                  <CheckCircle size={22} weight="bold" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-[#15803d] block">↗ Tiến độ chấm điểm</span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {assignmentSubmissions.filter((s: any) => s.status === "graded").length === assignmentSubmissions.length
                    ? "Đã hoàn thành chấm toàn bộ bài nộp"
                    : "Đang tiến hành chấm bài nộp"}
                </span>
              </div>
            </div>

            {/* Card 3: Cần chấm điểm */}
            <div className="bg-[#fef3c7]/50 border border-[#fde68a]/40 rounded-3xl p-5 flex flex-col justify-between shadow-3xs relative overflow-hidden min-h-[135px]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-[#b45309] uppercase tracking-wider block">CẦN CHẤM ĐIỂM</span>
                  <strong className="text-3xl font-black text-slate-800 block mt-1">
                    {assignmentSubmissions.filter((s: any) => s.status !== "graded" && s.status !== "pending").length} bài
                  </strong>
                </div>
                <div className="p-3 bg-white text-[#b45309] rounded-2xl shadow-3xs shrink-0 flex items-center justify-center">
                  <Clock size={22} weight="bold" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-[#b45309] block">↗ Tồn đọng cần xử lý</span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {assignmentSubmissions.filter((s: any) => s.status !== "graded" && s.status !== "pending").length > 0
                    ? `Còn ${assignmentSubmissions.filter((s: any) => s.status !== "graded" && s.status !== "pending").length} bài chưa có điểm`
                    : "Đã chấm xong tất cả bài nộp"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUBMISSIONS TABLE CONTAINER */}
      {loadingSubmissions ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 font-semibold border border-slate-200/80 shadow-xs">
          Đang tải danh sách bài nộp của học sinh...
        </div>
      ) : assignmentSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <FolderOpen size={32} weight="duotone" />
          </div>
          <h4 className="text-base font-bold text-slate-700">Chưa có bài nộp nào</h4>
          <p className="text-xs text-slate-500 mt-1">Học sinh chưa nộp bài tập tự luận này.</p>
        </div>
      ) : (
        <Table>
          <Table.ScrollContainer className="min-h-[350px]">
            <Table.Content aria-label="Bảng bài nộp học sinh" className="min-w-[900px]">
              <Table.Header>
                <Table.Column id="stt" className="after:hidden text-center w-14 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                  STT
                </Table.Column>
                <Table.Column isRowHeader id="student" className="after:hidden min-w-[200px] py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                  Học sinh
                </Table.Column>
                <Table.Column id="status" className="after:hidden min-w-[180px] py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                  Trạng thái & Nộp bài
                </Table.Column>
                <Table.Column id="content" className="after:hidden min-w-[240px] py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                  Nội dung / File nộp
                </Table.Column>
                <Table.Column id="score" className="after:hidden min-w-[140px] text-center py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                  Điểm số ({selectedAssignment.maxScore || 10})
                </Table.Column>
                <Table.Column id="actions" className="after:hidden min-w-[130px] text-end py-3 text-xs font-bold uppercase text-slate-600 tracking-wider">
                  Hành động
                </Table.Column>
              </Table.Header>
              <Table.Body>
                {assignmentSubmissions.map((sub: any, idx: number) => {
                  const studentObj = typeof sub.studentId === "object" ? sub.studentId : { _id: sub.studentId, name: "Học sinh", email: "" };
                  const studentIdStr = studentObj._id;
                  const currentScore = gradingData[studentIdStr]?.score ?? "";
                  const isGraded = sub.status === "graded" || (currentScore !== "" && currentScore !== null && currentScore !== undefined);

                  return (
                    <Table.Row
                      key={sub._id || idx}
                      id={sub._id || idx}
                      className="hover:bg-orange-50/40 cursor-pointer transition-colors"
                      onClick={() => setFocusGradingSub(sub)}
                    >
                      {/* STT */}
                      <Table.Cell className="text-center">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 inline-flex items-center justify-center font-bold text-xs shadow-2xs">
                          {idx + 1}
                        </span>
                      </Table.Cell>

                      {/* HỌC SINH */}
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <img
                            src={studentObj.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(studentObj.name || "HS") + "&background=f47c20&color=fff&bold=true"}
                            alt="avatar"
                            className="w-10 h-10 rounded-full border-2 border-orange-100 object-cover shadow-2xs shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-slate-900 text-sm truncate">{studentObj.name}</span>
                            <span className="text-xs font-medium text-slate-500 truncate">{studentObj.email}</span>
                          </div>
                        </div>
                      </Table.Cell>

                      {/* TRẠNG THÁI & NỘP BÀI */}
                      <Table.Cell>
                        <div className="flex flex-col gap-1 items-start">
                          {sub.status === "graded" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Đã chấm
                            </span>
                          )}
                          {sub.status === "submitted" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-[#2f8fa3]/10 text-[#2f8fa3] border border-[#2f8fa3]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2f8fa3]" />
                              Đã nộp
                            </span>
                          )}
                          {sub.status === "late" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-[#fff7ed] text-[#f47c20] border border-[#fed7aa]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f47c20]" />
                              Nộp muộn
                            </span>
                          )}
                          {sub.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              Chưa nộp
                            </span>
                          )}
                          {sub.submittedAt && (
                            <span className="text-[11px] font-medium text-slate-400">
                              {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </Table.Cell>

                      {/* NỘI DUNG / FILE NỘP */}
                      <Table.Cell>
                        <div className="flex flex-col gap-1.5 max-w-[240px]">
                          {sub.submissionText && (
                            <p className="text-xs text-slate-700 font-medium line-clamp-1 italic">
                              "{sub.submissionText}"
                            </p>
                          )}
                          {sub.attachments && sub.attachments.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                <Paperclip size={13} className="text-[#f47c20]" weight="bold" />
                                {sub.attachments.length} file đính kèm
                              </span>
                            </div>
                          ) : (
                            !sub.submissionText && <span className="text-xs text-slate-400 italic">Không có file nộp</span>
                          )}
                        </div>
                      </Table.Cell>

                      {/* ĐIỂM SỐ */}
                      <Table.Cell className="text-center">
                        {currentScore !== "" && currentScore !== null && currentScore !== undefined ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-black rounded-full bg-[#2f8fa3]/10 text-[#2f8fa3] border border-[#2f8fa3]/30 shadow-2xs">
                            {currentScore} / {selectedAssignment.maxScore || 10}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-[#f47c20]/10 text-[#f47c20] border border-[#f47c20]/30 shadow-2xs">
                            Chưa có điểm
                          </span>
                        )}
                      </Table.Cell>

                      {/* HÀNH ĐỘNG */}
                      <Table.Cell className="text-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusGradingSub(sub);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-[#f47c20] text-[#f47c20] hover:text-white font-extrabold text-xs border border-orange-200/80 transition-all cursor-pointer shadow-2xs"
                        >
                          <NotePencil size={15} weight="bold" />
                          {isGraded ? "Sửa điểm" : "Chấm bài"}
                        </button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      {/* MODAL CHẤM BÀI CHI TIẾT (FOCUS GRADING DIALOG) */}
      <FocusGradingModal
        focusGradingSub={focusGradingSub}
        assignmentSubmissions={assignmentSubmissions}
        selectedAssignment={selectedAssignment}
        gradingData={gradingData}
        setGradingData={setGradingData}
        onClose={() => setFocusGradingSub(null)}
        onSelectSubmission={(sub) => setFocusGradingSub(sub)}
        onSaveGrades={handleSaveGrades}
        isSavingGrades={isSavingGrades}
        getFileExt={getFileExt}
        formatCleanFileName={formatCleanFileName}
        formatFileSize={formatFileSize}
        formatFileUrl={formatFileUrl}
      />
    </div>
  );
};

export default AssignmentGradingView;
