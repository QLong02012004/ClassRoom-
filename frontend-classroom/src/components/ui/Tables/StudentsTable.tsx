import React, { useState, useMemo } from 'react';
import { Table, Avatar as HeroAvatar, Checkbox, Button, Pagination } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { Trash, PencilSimple } from "phosphor-react";
import type { Student } from "../../../utils/mockDb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../dialog";
import { Input } from "../input";
import { Label } from "../label";

interface StudentsTableProps {
  students: Student[];
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string, studentName: string) => void;
  onBulkDelete?: (studentIds: string[]) => void;
  readOnly?: boolean;
}

export const StudentsTable: React.FC<StudentsTableProps> = ({ students, onEdit, onDelete, onBulkDelete, readOnly = false }) => {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [page, setPage] = useState(1);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const ROWS_PER_PAGE = 10;

  // Logic phân trang
  const totalPages = Math.ceil(students.length / ROWS_PER_PAGE);
  const startIdx = (page - 1) * ROWS_PER_PAGE + 1;
  const endIdx = Math.min(page * ROWS_PER_PAGE, students.length);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const paginatedItems = useMemo(() => {
    return students.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  }, [students, page]);

  // Tính toán mảng ID học sinh đang được chọn
  const selectedIds = useMemo(() => {
    if (selectedKeys === "all") {
      return students.map(s => s._id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, students]);

  const handleBulkDeleteClick = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedKeys(new Set());
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* BULK ACTION TOOLBAR */}
      {selectedIds.length > 0 && onBulkDelete && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-slate-700">
            Đã chọn <strong className="text-primary">{selectedIds.length}</strong> học sinh
          </span>
          <Button
            className="bg-rose-100 text-rose-600 hover:bg-rose-200 font-medium flex items-center gap-2"
            size="sm"
            onPress={handleBulkDeleteClick}
          >
            <Trash weight="bold" size={16} />
            Xóa các học sinh đã chọn
          </Button>
        </div>
      )}

      <Table>
        <Table.ScrollContainer className="min-h-[400px]">
          <Table.Content
            aria-label="Danh sách học sinh"
            className="min-w-[800px]"
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            selectionBehavior="toggle"
            onSelectionChange={setSelectedKeys}
          >
            <Table.Header>
              {readOnly ? (
                <Table.Column className="after:hidden w-0 p-0 m-0 border-none" id="selection-hidden" />
              ) : (
                <Table.Column className="after:hidden" id="selection">
                  <Checkbox aria-label="Select all" slot="selection" variant="secondary">
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </Table.Column>
              )}
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="stt">
                STT
              </Table.Column>
              <Table.Column isRowHeader className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="name">
                Học sinh
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="grade_school">
                Khối / Trường học
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="personal_info">
                Thông tin cá nhân
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="parent_contact">
                Liên hệ phụ huynh
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
              {students.length === 0 ? (
                <Table.Row key="empty" id="empty">
                  <Table.Cell colSpan={7} className="text-center py-10">
                    <div className="text-slate-500 font-medium text-center w-full">
                      Chưa có học sinh nào trong lớp.
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                paginatedItems.map((student, idx) => {
                  const actualIdx = (page - 1) * ROWS_PER_PAGE + idx;
                  const initials = student.name.split(" ").map((n: string) => n[0]).slice(-2).join("").toUpperCase();

                  const handleRowCellClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setViewStudent(student);
                  };

                  const handlePointerDown = (e: React.PointerEvent) => {
                    e.stopPropagation();
                  };

                  return (
                    <Table.Row key={student._id} id={student._id} className="hover:bg-slate-50/80 transition-colors">
                      {readOnly ? (
                        <Table.Cell className="p-0 border-none w-0" />
                      ) : (
                        <Table.Cell>
                          <Checkbox aria-label={`Select ${student.name}`} slot="selection" variant="secondary">
                            <Checkbox.Content>
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                            </Checkbox.Content>
                          </Checkbox>
                        </Table.Cell>
                      )}
                      <Table.Cell
                        className="font-medium text-slate-500 cursor-pointer"
                        onClick={handleRowCellClick}
                        onPointerDown={handlePointerDown}
                      >
                        #{actualIdx + 1}
                      </Table.Cell>
                      <Table.Cell
                        className="cursor-pointer"
                        onClick={handleRowCellClick}
                        onPointerDown={handlePointerDown}
                      >
                        <div className="flex items-center gap-3">
                          <HeroAvatar size="sm" className="bg-primary text-white border border-slate-100 shadow-sm">
                            <HeroAvatar.Fallback className="text-xs font-semibold">{initials}</HeroAvatar.Fallback>
                          </HeroAvatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-[15px] hover:text-[#f47c20] transition-colors">{student.name}</span>
                            <span className="text-xs font-medium text-slate-500 mt-0.5">{student.email || "Chưa có email"}</span>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell
                        className="cursor-pointer"
                        onClick={handleRowCellClick}
                        onPointerDown={handlePointerDown}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                            {student.gradeLevel ? `Khối ${student.gradeLevel}` : "Chưa xếp khối"}
                          </span>
                          <span className="text-xs text-blue-900/80 font-semibold truncate max-w-[160px]" title={student.school || "Chưa cập nhật"}>
                            {student.school || "Chưa có trường"}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell
                        className="cursor-pointer"
                        onClick={handleRowCellClick}
                        onPointerDown={handlePointerDown}
                      >
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-semibold text-slate-700">
                            {student.gender || "Chưa rõ"}{student.dob ? ` • ${new Date(student.dob).toLocaleDateString('vi-VN')}` : ""}
                          </span>
                          <span className="text-slate-500 font-medium">
                            SĐT: {student.phone || "Chưa cập nhật"}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell
                        className="cursor-pointer"
                        onClick={handleRowCellClick}
                        onPointerDown={handlePointerDown}
                      >
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-semibold text-slate-800">
                            {student.parentPhone || "Không có"}
                          </span>
                          {student.parentRelationship && (
                            <span className="text-slate-500 font-medium">
                              Quan hệ: {student.parentRelationship}
                            </span>
                          )}
                        </div>
                      </Table.Cell>
                      {readOnly ? (
                        <Table.Cell className="p-0 border-none w-0" />
                      ) : (
                        <Table.Cell onClick={(e) => e.stopPropagation()} onPointerDown={handlePointerDown}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onEdit && onEdit(student)}
                              className="w-9 h-9 rounded-xl text-[#f47c20] bg-orange-50 hover:bg-orange-100/90 transition-all cursor-pointer border border-orange-200/80 shadow-xs flex items-center justify-center shrink-0"
                              title="Chỉnh sửa học sinh"
                            >
                              <PencilSimple size={20} weight="bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete && onDelete(student._id, student.name)}
                              className="w-9 h-9 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100/90 transition-all cursor-pointer border border-rose-200/80 shadow-xs flex items-center justify-center shrink-0"
                              title="Xóa học sinh khỏi lớp"
                            >
                              <Trash size={20} weight="bold" />
                            </button>
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
                Hiển thị {startIdx} đến {endIdx} trong số {students.length} kết quả
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

      {/* MODAL XEM CHI TIẾT HỒ SƠ HỌC SINH (Giao diện 2 cột như Edit Modal - ReadOnly) */}
      <Dialog open={!!viewStudent} onOpenChange={(open) => !open && setViewStudent(null)}>
        <DialogContent className="sm:max-w-[860px] p-0 overflow-hidden rounded-2xl gap-0">
          <DialogHeader className="px-6 pt-5 pb-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                👁️ Chi tiết hồ sơ học sinh
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Xem thông tin cá nhân, tài khoản đăng nhập, khối lớp, trường học và phụ huynh liên hệ.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-6 grid grid-cols-2 gap-x-7 gap-y-5 max-h-[75vh] overflow-y-auto">
            {/* ── CỘT TRÁI ── */}
            <div className="space-y-5">
              {/* Tài khoản & Cá nhân */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-1 h-3.5 bg-[#f47c20] rounded-full" />
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Tài khoản & Cá nhân</span>
                </div>
                <div className="space-y-3">
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-slate-600">Họ và tên</Label>
                    <Input
                      readOnly
                      value={viewStudent?.name || ""}
                      className="h-9 rounded-xl border-slate-200 bg-slate-50 text-slate-800 font-bold text-sm cursor-default"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-slate-600">Tên đăng nhập / Email</Label>
                    <Input
                      readOnly
                      value={viewStudent?.email || "Chưa có email"}
                      className="h-9 rounded-xl border-slate-200 bg-slate-50 text-slate-800 font-medium text-sm cursor-default"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                      <Label className="text-xs font-bold text-slate-600">Ngày sinh</Label>
                      <Input
                        readOnly
                        value={viewStudent?.dob ? new Date(viewStudent.dob).toLocaleDateString('vi-VN') : "Chưa cập nhật"}
                        className="h-9 rounded-xl border-slate-200 bg-slate-50 text-slate-700 text-sm cursor-default"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs font-bold text-slate-600">Giới tính</Label>
                      <Input
                        readOnly
                        value={viewStudent?.gender || "Chưa rõ"}
                        className="h-9 rounded-xl border-slate-200 bg-slate-50 text-slate-700 font-semibold text-sm cursor-default"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SĐT Cá nhân */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-1 h-3.5 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Liên lạc học sinh</span>
                </div>
                <div className="space-y-3">
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-slate-600">SĐT Cá nhân</Label>
                    <Input
                      readOnly
                      value={viewStudent?.phone || "Chưa cập nhật"}
                      className="h-9 rounded-xl border-slate-200 bg-slate-50 text-slate-700 text-sm cursor-default"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── CỘT PHẢI ── */}
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-1 h-3.5 bg-blue-500 rounded-full" />
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Trường học & Phụ huynh</span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                      <Label className="text-xs font-bold text-slate-600">Khối lớp</Label>
                      <Input
                        readOnly
                        value={viewStudent?.gradeLevel ? `Khối ${viewStudent.gradeLevel}` : "Chưa xếp khối"}
                        className="h-9 rounded-xl border-slate-200 bg-slate-50 text-blue-700 font-bold text-sm cursor-default"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs font-bold text-slate-600">Trường học ban ngày</Label>
                      <Input
                        readOnly
                        value={viewStudent?.school || "Chưa cập nhật"}
                        className="h-9 rounded-xl border-slate-200 bg-slate-50 text-blue-900 font-bold text-sm cursor-default"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                      <Label className="text-xs font-bold text-slate-600">SĐT Phụ huynh (Chính)</Label>
                      <Input
                        readOnly
                        value={viewStudent?.parentPhone || "Chưa có"}
                        className="h-9 rounded-xl border-slate-200 bg-slate-50 text-slate-800 font-bold text-sm cursor-default"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs font-bold text-slate-600">Mối quan hệ</Label>
                      <Input
                        readOnly
                        value={viewStudent?.parentRelationship || "Chưa xác định"}
                        className="h-9 rounded-xl border-slate-200 bg-slate-50 text-slate-800 font-bold text-sm cursor-default"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 font-medium">
              💡 Chế độ xem chi tiết hồ sơ học sinh (Chỉ đọc).
            </span>
            <button
              type="button"
              onClick={() => setViewStudent(null)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
