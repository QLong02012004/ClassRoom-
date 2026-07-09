import React, { useState, useMemo } from 'react';
import { Table, Avatar as HeroAvatar, Chip, Checkbox, Button, Pagination } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { Trash } from "phosphor-react";
import { StudentActionMenu } from "./StudentActionMenu";
import type { Student } from "../../utils/mockDb";

interface StudentsTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: string, studentName: string) => void;
  onBulkDelete?: (studentIds: string[]) => void;
}

export const StudentsTable: React.FC<StudentsTableProps> = ({ students, onEdit, onDelete, onBulkDelete }) => {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [page, setPage] = useState(1);
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
      setSelectedKeys(new Set()); // Reset lại lựa chọn sau khi click
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
            onSelectionChange={setSelectedKeys}
          >
            <Table.Header>
              <Table.Column className="after:hidden" id="selection">
                <Checkbox aria-label="Select all" slot="selection">
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="stt">
                STT
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="name">
                Học sinh
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="code">
                Mã HS
              </Table.Column>
              <Table.Column className="after:hidden text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="contact">
                Liên hệ
              </Table.Column>
              <Table.Column className="after:hidden text-end text-xs font-bold uppercase text-slate-600 tracking-wider py-3" id="actions">
                Hành động
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {students.length === 0 ? (
                <Table.Row key="empty" id="empty">
                  <Table.Cell className="pr-0" />
                  <Table.Cell />
                  <Table.Cell />
                  <Table.Cell>
                    <div className="py-10 text-slate-500 font-medium">
                      Chưa có học sinh nào trong lớp.
                    </div>
                  </Table.Cell>
                  <Table.Cell />
                  <Table.Cell />
                </Table.Row>
              ) : (
                paginatedItems.map((student, idx) => {
                  const actualIdx = (page - 1) * ROWS_PER_PAGE + idx;
                  const initials = student.name.split(" ").map((n: string) => n[0]).slice(-2).join("").toUpperCase();

                  return (
                    <Table.Row key={student._id} id={student._id}>
                      <Table.Cell>
                        <Checkbox aria-label={`Select ${student.name}`} slot="selection" variant="secondary">
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                      </Table.Cell>
                      <Table.Cell className="font-medium text-slate-500">
                        #{actualIdx + 1}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <HeroAvatar size="sm" className="bg-primary text-white border border-slate-100 shadow-sm">
                            <HeroAvatar.Fallback className="text-xs font-semibold">{initials}</HeroAvatar.Fallback>
                          </HeroAvatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-[15px]">{student.name}</span>
                            <span className="text-sm font-medium text-slate-500 mt-0.5">{student.email || "Chưa có email"}</span>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip size="sm" variant="soft" className="bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                          {student.studentCode || `HS-${actualIdx + 1}`}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-slate-600">
                          {student.parentPhone || "Không có"}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center justify-end gap-1 relative">
                          <StudentActionMenu
                            onEdit={() => onEdit(student)}
                            onDelete={() => onDelete(student._id, student.name)}
                          />
                        </div>
                      </Table.Cell>
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
    </div>
  );
};
