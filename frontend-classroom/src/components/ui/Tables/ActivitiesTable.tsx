import React, { useState, useMemo } from "react";
import { Table, Pagination, Checkbox, Button } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { Clock, CheckCircle, Paperclip, CalendarBlank, Trash } from "phosphor-react";
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
}

export interface ActivitiesTableProps {
  activities: ActivityItem[];
  totalStudents?: number;
  onViewResults?: (activity: ActivityItem) => void;
  onEdit?: (activity: ActivityItem) => void;
  onDelete?: (activity: ActivityItem) => void;
  onBulkDelete?: (activityIds: string[]) => void;
  onToggleStatus?: (activity: ActivityItem) => void;
  getQuizStatus?: (activity: ActivityItem) => { label: string; class: string };
  rowsPerPage?: number;
  readOnly?: boolean;
}

export const ActivitiesTable: React.FC<ActivitiesTableProps> = ({
  activities,
  totalStudents = 0,
  onViewResults,
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
      return activities.map(a => a._id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, activities]);

  const handleBulkDeleteClick = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedKeys(new Set());
    }
  };

  const defaultGetQuizStatus = (act: ActivityItem) => {
    const status = act.status || "open";
    if (status === "draft") return { label: "Bản nháp", class: "bg-slate-100 text-slate-600" };
    if (status === "closed") return { label: "Đã đóng", class: "bg-rose-100 text-rose-700" };
    return { label: "Đang mở", class: "bg-emerald-100 text-emerald-700" };
  };

  const getStatus = getQuizStatus || defaultGetQuizStatus;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* BULK ACTION TOOLBAR */}
      {selectedIds.length > 0 && onBulkDelete && !readOnly && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-slate-700">
            Đã chọn <strong className="text-primary">{selectedIds.length}</strong> bài tập / đề thi
          </span>
          <Button
            className="bg-rose-100 text-rose-600 hover:bg-rose-200 font-medium flex items-center gap-2"
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
            selectedKeys={selectedKeys}
            selectionMode={readOnly ? "none" : "multiple"}
            onSelectionChange={setSelectedKeys}
          >
            <Table.Header>
              {readOnly ? (
                <Table.Column className="after:hidden w-0 p-0 m-0 border-none" id="selection-hidden" />
              ) : (
                <Table.Column className="after:hidden" id="selection">
                  <Checkbox aria-label="Select all" slot="selection">
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </Table.Column>
              )}
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[60px]" id="stt">
                STT
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[190px]" id="type">
                Loại
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="title">
                Tiêu đề
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[160px]" id="meta">
                Hạn nộp
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 w-[130px]" id="progress">
                Tiến độ nộp bài
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3 text-center w-[145px]" id="status">
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
                  {readOnly ? <Table.Cell className="p-0 border-none w-0" /> : <Table.Cell className="pr-0" />}
                  <Table.Cell colSpan={6}>
                    <div className="py-10 text-center text-slate-500 font-medium">
                      Chưa có bài tập hoặc đề thi nào trong lớp.
                    </div>
                  </Table.Cell>
                  {readOnly ? <Table.Cell className="p-0 border-none w-0" /> : null}
                </Table.Row>
              ) : (
                paginatedItems.map((act, idx) => {
                  const actualIdx = (page - 1) * rowsPerPage + idx;
                  const isQuiz = act.type === "quiz";
                  const statusObj = getStatus(act);
                  const qCount = isQuiz ? (act.questions?.length || act.bankItemId?.quizQuestions?.length || 0) : 0;
                  const subCount = act.submissionCount || 0;
                  const percent = totalStudents > 0 ? Math.min(100, Math.round((subCount / totalStudents) * 100)) : 0;
                  const isGenericTitle = act.title?.trim().toLowerCase() === "bài tập về nhà" && act.category === "homework";

                  return (
                    <Table.Row key={act._id} id={act._id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                      {readOnly ? (
                        <Table.Cell className="p-0 border-none w-0" />
                      ) : (
                        <Table.Cell>
                          <Checkbox aria-label={`Select ${act.title}`} slot="selection">
                            <Checkbox.Content>
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                            </Checkbox.Content>
                          </Checkbox>
                        </Table.Cell>
                      )}

                      <Table.Cell className="font-medium text-slate-500">
                        #{actualIdx + 1}
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${isQuiz ? "bg-orange-50 text-orange-600 border border-orange-200/80" : "bg-indigo-50 text-indigo-600 border border-indigo-200/80"}`}>
                            {isQuiz ? "Trắc nghiệm" : "Tự luận / File"}
                          </span>
                          {act.category && (
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${act.category === "homework" ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                              {act.category === "homework" ? "Bài tập về nhà" : "Kiểm tra / Thi thử"}
                            </span>
                          )}
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex flex-col max-w-[320px]">
                          <span className="font-semibold text-slate-900 text-[15px] hover:text-orange-600 transition-colors line-clamp-1">
                            {isGenericTitle ? (act.description || "Bài tập về nhà") : act.title}
                          </span>
                          {!isGenericTitle && act.description && (
                            <span className="text-sm font-medium text-slate-500 line-clamp-1 mt-0.5">{act.description}</span>
                          )}
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex flex-col gap-1 text-xs text-slate-600">
                          {isQuiz ? (
                            <>
                              <div className="flex items-center gap-1">
                                <Clock size={14} className="text-amber-500" />
                                <span>{act.durationMinutes || 0} phút</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle size={14} className="text-emerald-500" />
                                <span>{qCount} câu hỏi</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1">
                                <Paperclip size={14} className="text-indigo-500" />
                                <span>{act.attachments?.length || 1} file</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarBlank size={14} className="text-rose-500" />
                                <span>Hạn: {act.dueDate ? new Date(act.dueDate).toLocaleDateString("vi-VN") : "Không hạn"}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex items-center text-xs">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70">{subCount}/{totalStudents} HS</span>
                        </div>
                      </Table.Cell>

                      <Table.Cell className="text-center min-w-[145px]">
                        <div className="flex items-center justify-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap inline-flex items-center gap-1.5 justify-center ${statusObj.class}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${act.status === "closed" ? "bg-rose-500" : act.status === "draft" ? "bg-slate-400" : "bg-emerald-500 animate-pulse"}`} />
                            <span className="whitespace-nowrap">{statusObj.label}</span>
                          </span>
                        </div>
                      </Table.Cell>

                      {readOnly ? (
                        <Table.Cell className="p-0 border-none w-0" />
                      ) : (
                        <Table.Cell>
                          <div className="flex items-center justify-end gap-1 relative">
                            <ActivityActionMenu
                              isQuiz={isQuiz}
                              isOpen={act.status === "open"}
                              isDraft={act.status === "draft"}
                              onViewResults={() => onViewResults && onViewResults(act)}
                              onToggleStatus={() => onToggleStatus && onToggleStatus(act)}
                              onEdit={() => onEdit && onEdit(act)}
                              onDelete={() => onDelete && onDelete(act)}
                            />
                          </div>
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
          {totalPages > 0 && (
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
                      className={p === page ? "bg-primary text-white font-bold border-primary" : "text-slate-600 font-medium hover:bg-slate-100"}
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
