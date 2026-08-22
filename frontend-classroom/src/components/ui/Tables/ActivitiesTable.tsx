import React, { useState, useMemo } from "react";
import { Table, Button, Pagination } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { Clock, CheckCircle, Paperclip, CalendarBlank, Trash, Check, Minus } from "phosphor-react";
import { ActivityActionMenu } from "../ActionMenus/ActivityActionMenu";

export interface ActivityItem {
  _id: string;
  type: "quiz" | "document" | string;
  title: string;
  description?: string;
  category?: "homework" | "periodic" | "mock_exam" | string;
  status?: "open" | "closed" | "draft" | string;
  durationMinutes?: number;
  questions?: any[];
  bankItemId?: { quizQuestions?: any[] };
  attachments?: any[];
  dueDate?: string;
  createdAt: string;
  submissionCount?: number;
  gradedCount?: number;
  pendingGradeCount?: number;
}

export interface ActivitiesTableProps {
  activities: ActivityItem[];
  totalStudents?: number;
  onViewResults?: (activity: ActivityItem) => void;
  onViewDetails?: (activity: ActivityItem) => void;
  onEdit?: (activity: ActivityItem) => void;
  onDelete?: (activity: ActivityItem) => void;
  onBulkDelete?: (activityIds: string[]) => void;
  onToggleStatus?: (activity: ActivityItem) => void;
  getQuizStatus?: (activity: ActivityItem) => { label: string; class: string };
  rowsPerPage?: number;
  readOnly?: boolean;
}

const TableCheckbox = ({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer select-none ${
        checked || indeterminate
          ? "bg-[#f47c20] border-2 border-[#f47c20] text-white shadow-2xs scale-105"
          : "bg-white border-2 border-slate-300 hover:border-[#f47c20] text-transparent"
      }`}
    >
      {checked ? (
        <Check size={12} weight="bold" className="text-white shrink-0" />
      ) : indeterminate ? (
        <Minus size={12} weight="bold" className="text-white shrink-0" />
      ) : null}
    </button>
  );
};

export const ActivitiesTable: React.FC<ActivitiesTableProps> = ({
  activities,
  totalStudents = 0,
  onViewResults,
  onViewDetails,
  onEdit,
  onDelete,
  onBulkDelete,
  onToggleStatus,
  getQuizStatus,
  rowsPerPage = 6,
  readOnly = false,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(activities.length / rowsPerPage) || 1;
  const startIdx = activities.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIdx = Math.min(page * rowsPerPage, activities.length);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const paginatedItems = useMemo(() => {
    return activities.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [activities, page, rowsPerPage]);

  const selectedIds = useMemo(() => {
    if (selectedKeys === "all") {
      return activities.map((a) => a._id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, activities]);

  const isAllSelected = selectedIds.length === activities.length && activities.length > 0;
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const handleBulkDeleteClick = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedKeys(new Set());
    }
  };

  const defaultGetQuizStatus = (act: ActivityItem) => {
    const status = act.status || "open";
    if (status === "draft") return { label: "Bản nháp", class: "bg-slate-100 text-slate-600 border border-slate-200" };
    if (status === "closed") return { label: "Đã đóng", class: "bg-rose-50 text-rose-700 border border-rose-200" };
    
    if (act.type !== "quiz") {
      const subCount = act.submissionCount || 0;
      const gradedCount = act.gradedCount || 0;
      const pendingCount = act.pendingGradeCount !== undefined
        ? act.pendingGradeCount
        : Math.max(0, subCount - gradedCount);

      if (gradedCount > 0 && gradedCount >= subCount && subCount > 0) {
        return { label: "Đã chấm", class: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
      }
      return { label: `Chưa chấm (${pendingCount})`, class: "bg-orange-50 text-[#f47c20] border border-orange-200" };
    }

    return { label: "Đang mở", class: "bg-[#2f8fa3]/10 text-[#2f8fa3] border border-[#2f8fa3]/30" };
  };

  const getStatus = getQuizStatus || defaultGetQuizStatus;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* BULK ACTION TOOLBAR */}
      {selectedIds.length > 0 && onBulkDelete && !readOnly && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl shadow-sm animate-in fade-in duration-200">
          <span className="text-sm font-medium text-slate-700">
            Đã chọn <strong className="text-[#f47c20]">{selectedIds.length}</strong> bài tập / đề thi
          </span>
          <Button
            className="bg-rose-100 text-rose-600 hover:bg-rose-200 font-semibold flex items-center gap-2 rounded-xl"
            size="sm"
            onPress={handleBulkDeleteClick}
          >
            <Trash weight="bold" size={16} />
            Xóa các bài đã chọn
          </Button>
        </div>
      )}

      <Table>
        <Table.ScrollContainer className="min-h-[350px]">
          <Table.Content
            aria-label="Danh sách bài tập và đề thi"
            className="min-w-[800px]"
            selectionMode="none"
          >
            <Table.Header>
              {readOnly ? (
                <Table.Column className="after:hidden w-0 p-0 m-0 border-none" id="selection-hidden" />
              ) : (
                <Table.Column className="after:hidden w-[45px]" id="selection">
                  <TableCheckbox
                    checked={isAllSelected}
                    indeterminate={isPartiallySelected}
                    onChange={() => {
                      if (isAllSelected) {
                        setSelectedKeys(new Set());
                      } else {
                        setSelectedKeys(new Set(activities.map((a) => a._id)));
                      }
                    }}
                  />
                </Table.Column>
              )}
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[60px]" id="stt">
                STT
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[190px]" id="type">
                Loại
              </Table.Column>
              <Table.Column isRowHeader className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="title">
                Tiêu đề
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[160px]" id="meta">
                Hạn nộp
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[145px] whitespace-nowrap" id="progress">
                Tiến độ nộp bài
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 text-center w-[140px] whitespace-nowrap" id="status">
                Trạng thái
              </Table.Column>
              {readOnly ? (
                <Table.Column className="after:hidden w-0 p-0 m-0 border-none" id="actions-hidden" />
              ) : (
                <Table.Column className="after:hidden text-end text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="actions">
                  Hành động
                </Table.Column>
              )}
            </Table.Header>

            <Table.Body>
              {activities.length === 0 ? (
                <Table.Row key="empty" id="empty">
                  <Table.Cell colSpan={8} className="text-center py-10">
                    <div className="text-center text-slate-500 font-medium w-full">
                      Chưa có bài tập hoặc đề thi nào trong lớp.
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                paginatedItems.map((act, idx) => {
                  const actualIdx = (page - 1) * rowsPerPage + idx;
                  const rowId = String(act._id || `act-${actualIdx}`);
                  const isQuiz = act.type === "quiz";
                  const statusObj = getStatus(act);
                  const subCount = act.submissionCount || 0;
                  const qCount = act.questions?.length || act.bankItemId?.quizQuestions?.length || 0;
                  const fileCount = act.attachments?.length || 1;
                  const isChecked = selectedIds.includes(act._id) || selectedIds.includes(rowId);
                  const handleRowClick = () => {
                    if (onViewDetails) onViewDetails(act);
                    else if (onViewResults) onViewResults(act);
                  };

                  return (
                    <Table.Row
                      key={rowId}
                      id={rowId}
                      className={`transition-colors border-b border-slate-100 cursor-pointer ${
                        isChecked ? "bg-[#fff7ed] hover:bg-[#fff0e0]" : "hover:bg-slate-50/90"
                      }`}
                      onClick={handleRowClick}
                    >
                      {readOnly ? (
                        <Table.Cell className="p-0 border-none w-0" />
                      ) : (
                        <Table.Cell onClick={(e: any) => e.stopPropagation()}>
                          <TableCheckbox
                            checked={isChecked}
                            onChange={() => {
                              setSelectedKeys((prev) => {
                                const currentSet = new Set(prev === "all" ? activities.map((a) => a._id) : prev);
                                if (isChecked) {
                                  currentSet.delete(act._id);
                                } else {
                                  currentSet.add(act._id);
                                }
                                return currentSet;
                              });
                            }}
                          />
                        </Table.Cell>
                      )}

                      <Table.Cell className="font-medium text-slate-500 cursor-pointer" onClick={handleRowClick}>
                        #{actualIdx + 1}
                      </Table.Cell>

                      <Table.Cell className="cursor-pointer" onClick={handleRowClick}>
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${isQuiz ? "bg-[#f47c20]/10 text-[#f47c20] border border-[#f47c20]/30" : "bg-[#2f8fa3]/10 text-[#2f8fa3] border border-[#2f8fa3]/30"}`}>
                            {isQuiz ? "Trắc nghiệm" : "Tự luận / File"}
                          </span>
                          {act.category && (
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                              act.category === "homework"
                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                : act.category === "periodic" || act.category === "mock_exam"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}>
                              {
                                {
                                  homework: "Bài tập về nhà",
                                  periodic: "Kiểm tra định kỳ",
                                  mock_exam: "Thi thử",
                                  attitude: "Chuyên cần / Thái độ"
                                }[act.category] || act.category
                              }
                            </span>
                          )}
                        </div>
                      </Table.Cell>

                      <Table.Cell className="cursor-pointer" onClick={handleRowClick}>
                        <div className="flex flex-col max-w-[220px] overflow-hidden group">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-[#f47c20] transition-colors truncate block" title={act.title}>
                            {act.title}
                          </span>
                          {act.description && (
                            <span className="text-xs font-medium text-slate-500 truncate block mt-0.5" title={act.description}>{act.description}</span>
                          )}
                        </div>
                      </Table.Cell>

                      <Table.Cell className="cursor-pointer" onClick={handleRowClick}>
                        <div className="flex flex-col gap-1 text-xs text-slate-600">
                          <div className="flex items-center gap-1 font-semibold text-slate-700">
                            <CalendarBlank size={14} className="text-[#f47c20]" />
                            {act.dueDate ? `Hạn: ${new Date(act.dueDate).toLocaleDateString("vi-VN")}` : "Không giới hạn"}
                          </div>
                          {isQuiz ? (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock size={13} className="text-amber-500 flex-shrink-0" />
                              <span>
                                {act.durationMinutes ? `${act.durationMinutes}p` : "15p"}
                                {qCount > 0 ? ` (${qCount} câu)` : ""}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Paperclip size={13} className="text-[#2f8fa3] flex-shrink-0" />
                              <span>{fileCount} file đính kèm</span>
                            </div>
                          )}
                        </div>
                      </Table.Cell>

                      <Table.Cell className="cursor-pointer" onClick={handleRowClick}>
                        <div className="flex items-center text-xs">
                          <span className="font-bold text-[#2f8fa3] bg-[#2f8fa3]/10 px-3 py-1 rounded-full border border-[#2f8fa3]/25 whitespace-nowrap">
                            {subCount}/{totalStudents || 0} HS
                          </span>
                        </div>
                      </Table.Cell>

                      <Table.Cell className="text-center cursor-pointer whitespace-nowrap" onClick={handleRowClick}>
                        <div className="flex items-center justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap ${statusObj.class}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              act.status === "closed"
                                ? "bg-rose-500"
                                : act.status === "draft"
                                ? "bg-slate-400"
                                : statusObj.label === "Chưa chấm"
                                ? "bg-amber-500"
                                : "bg-emerald-500 animate-pulse"
                            }`} />
                            <span className="whitespace-nowrap">{statusObj.label}</span>
                          </span>
                        </div>
                      </Table.Cell>

                      {readOnly ? (
                        <Table.Cell className="p-0 border-none w-0" />
                      ) : (
                        <Table.Cell className="text-end" onClick={(e: any) => e.stopPropagation()}>
                          <ActivityActionMenu
                            isQuiz={isQuiz}
                            isOpen={act.status !== "closed"}
                            isDraft={act.status === "draft"}
                            onViewResults={() => onViewResults && onViewResults(act)}
                            onEdit={onEdit ? () => onEdit(act) : undefined}
                            onDelete={onDelete ? () => onDelete(act) : undefined}
                            onToggleStatus={onToggleStatus ? () => onToggleStatus(act) : undefined}
                          />
                        </Table.Cell>
                      )}
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        <Table.Footer>
          {activities.length > 0 && (
            <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-transparent">
              <Pagination.Summary className="text-sm text-slate-500 font-medium">
                Hiển thị {startIdx} đến {endIdx} trong số {activities.length} kết quả
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <Pagination.PreviousIcon />
                    Trang trước
                  </Pagination.Previous>
                </Pagination.Item>
                {pages.map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === page}
                      onPress={() => setPage(p)}
                      className={p === page ? "bg-[#f47c20] text-white font-bold border-[#f47c20]" : "text-slate-600 font-medium hover:bg-slate-100"}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page === totalPages}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Trang sau
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          )}
        </Table.Footer>
      </Table>
    </div>
  );
};

export default ActivitiesTable;
