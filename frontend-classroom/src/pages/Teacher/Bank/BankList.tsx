import React, { useState, useEffect, useMemo } from 'react';
import { bankService } from '../../../service/bank.service';
import type { IBankItem } from '../../../service/bank.service';
import { useToast } from '../../../components/Styles/ToastContext';
import { SmartSearchBar, type SearchSuggestionItem } from '../../../components/ui/Inputs/SmartSearchBar';
import { DropdownFilter } from '../../../components/ui/Dropdowns/DropdownFilter';
import { Plus, BookOpen, FileText, DotsThree, Trash, PencilSimple, Clock, CaretDown, MagnifyingGlass, Funnel, Info, TextAa, ListChecks, DownloadSimple, CheckCircle, ClipboardText, Calculator } from 'phosphor-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/dropdown-menu';
import QuizBuilder from '../../../components/ui/Builders/QuizBuilder/QuizBuilder';
import AssignmentBuilder from '../../../components/ui/Builders/AssignmentBuilder/AssignmentBuilder';
import { Table, Checkbox, Pagination } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { PrimaryButton } from '../../../components/ui/Buttons/PrimaryButton';
import { BackButton } from '../../../components/ui/Buttons/BackButton';
import { useAuth } from '../../../context/AuthContext';
import NumberStepper from '../../../components/ui/FormControls/NumberStepper';
import { SaveButton } from '../../../components/ui/Buttons/SaveButton';
import { BankActionMenu } from '../../../components/ui/ActionMenus/BankActionMenu';
import { ResourceDetailModal } from '../../../components/ui/Dialogs/ResourceDetailModal/ResourceDetailModal';
import { ScrollArea } from '../../../components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { Trash as TrashIcon } from 'phosphor-react';

export default function BankList() {
    const toast = useToast();
    const [items, setItems] = useState<IBankItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
    const [isSavingQuiz, setIsSavingQuiz] = useState(false);

    // Phân quyền Admin chọn môn học
    const { user } = useAuth();
    const [selectedSubjectForAdmin, setSelectedSubjectForAdmin] = useState("Toán");

    // State chọn nhiều
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

    // States Xem chi tiết và Chỉnh sửa
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [selectedDetailsItem, setSelectedDetailsItem] = useState<IBankItem | null>(null);

    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: "",
        title: "",
        description: "",
        maxScore: 10,
        durationMinutes: 15,
        subject: "Toán",
        sharingStatus: "PRIVATE" as "CENTER_SHARED" | "PRIVATE",
        type: "quiz" as "quiz" | "document"
    });
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    // States Dialog xác nhận xóa
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    // State bộ lọc và tìm kiếm
    const [searchTerm, setSearchTerm] = useState("");
    const searchSuggestions = useMemo<SearchSuggestionItem[]>(() => {
        if (!searchTerm.trim()) return [];
        const query = searchTerm.toLowerCase();
        return items
            .filter(item => item.title.toLowerCase().includes(query))
            .slice(0, 5)
            .map(item => ({
                id: item._id,
                title: item.title,
                subtitle: `${item.type === 'quiz' ? 'Trắc nghiệm' : 'Tài liệu'} • ${item.subject || 'Khác'}`,
                tag: item.maxScore ? `${item.maxScore}đ` : undefined,
                rawData: item
            }));
    }, [items, searchTerm]);

    const [filterType, setFilterType] = useState("all");
    const [filterSubject, setFilterSubject] = useState("all");

    // Lọc dữ liệu
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchType = filterType === "all" || item.type === filterType;
            const matchSubject = filterSubject === "all" || item.subject === filterSubject;
            return matchSearch && matchType && matchSubject;
        });
    }, [items, searchTerm, filterType, filterSubject]);

    // State phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const startIdx = filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endIdx = Math.min(currentPage * itemsPerPage, filteredItems.length);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const loadBankItems = async () => {
        try {
            setLoading(true);
            const res = await bankService.getMyBankItems();
            setItems(res.data || []);
            setCurrentPage(1); // Reset về trang 1 khi load mới
            setSelectedKeys(new Set()); // Reset selected keys
        } catch (error) {
            toast.error("Không thể tải ngân hàng đề");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBankItems();
    }, []);

    const selectedIds = useMemo(() => {
        if (selectedKeys === "all") {
            return items.map(item => item._id);
        }
        return Array.from(selectedKeys) as string[];
    }, [selectedKeys, items]);

    const handleCreateBankQuiz = async (quizData: any) => {
        setIsSavingQuiz(true);
        try {
            await bankService.createBankItem({
                type: 'quiz',
                title: quizData.title,
                durationMinutes: quizData.durationMinutes,
                quizQuestions: quizData.questions,
                maxScore: quizData.questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0),
                subject: user?.role === 'admin' ? selectedSubjectForAdmin : undefined
            });
            toast.success("Lưu đề thi vào ngân hàng thành công!");
            setIsCreatingQuiz(false);
            loadBankItems();
        } catch (err: any) {
            toast.error(err.message || "Tạo đề thi thất bại!");
            throw err;
        } finally {
            setIsSavingQuiz(false);
        }
    };


    const handleCreateBankAssignment = async (data: any) => {
        setIsSavingQuiz(true);
        try {
            await bankService.createBankItem({
                type: 'document',
                title: data.title,
                description: data.description,
                fileUrl: data.fileUrl,
                maxScore: data.maxScore,
                subject: user?.role === 'admin' ? selectedSubjectForAdmin : undefined
            });
            toast.success("Lưu bài tập vào ngân hàng thành công!");
            setIsCreatingAssignment(false);
            loadBankItems();
        } catch (err: any) {
            toast.error(err.message || "Tạo bài tập thất bại!");
            throw err;
        } finally {
            setIsSavingQuiz(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            await bankService.deleteBankItem(deleteTargetId);
            toast.success("Xóa thành công!");
            loadBankItems();
        } catch {
            toast.error("Xóa thất bại!");
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleOpenDetails = (item: IBankItem) => {
        setSelectedDetailsItem(item);
        setShowDetailsDialog(true);
    };

    const handleOpenEdit = (item: IBankItem) => {
        setEditFormData({
            id: item._id,
            title: item.title,
            description: item.description || "",
            maxScore: item.maxScore || 10,
            durationMinutes: item.durationMinutes || 15,
            subject: item.subject || "Toán",
            sharingStatus: item.sharingStatus || "PRIVATE",
            type: item.type
        });
        setShowEditDialog(true);
    };

    const handleUpdateBankItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingEdit(true);
        try {
            const res = await bankService.updateBankItem(editFormData.id, {
                title: editFormData.title,
                description: editFormData.description,
                maxScore: editFormData.maxScore,
                durationMinutes: editFormData.type === 'quiz' ? editFormData.durationMinutes : undefined,
                subject: editFormData.subject,
                sharingStatus: editFormData.sharingStatus
            });
            toast.success("Cập nhật học liệu thành công!", 3000);
            setItems(prev => prev.map(item => item._id === editFormData.id ? { ...item, ...res.data } : item));
            setShowEditDialog(false);
        } catch (error: any) {
            toast.error(error.message || "Cập nhật thất bại!", 3000);
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setBulkDeleteConfirmOpen(true);
    };

    const confirmBulkDelete = async () => {
        try {
            setLoading(true);
            await Promise.all(selectedIds.map(id => bankService.deleteBankItem(id)));
            toast.success(`Đã xóa ${selectedIds.length} tài nguyên thành công!`);
            loadBankItems();
        } catch {
            toast.error("Một số hoặc toàn bộ tài nguyên không thể xóa!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            {isCreatingQuiz ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <BackButton
                        onClick={() => setIsCreatingQuiz(false)}
                        className="mb-4"
                    >
                        Quay lại danh sách
                    </BackButton>
                    {user?.role === 'admin' && (
                        <div className="mb-4 bg-[#2f8fa3]/5 border border-[#2f8fa3]/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-200 flex-wrap">
                            <span className="text-sm font-bold text-[#2f8fa3]">Môn học cho học liệu này:</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="px-4 py-1.5 border border-[#2f8fa3]/30 rounded-lg text-sm outline-none font-semibold bg-white text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                                    >
                                        <span>Môn {selectedSubjectForAdmin}</span>
                                        <CaretDown size={14} className="text-slate-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1 w-48 max-h-60 overflow-y-auto">
                                    {["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "Tin học", "GDCD", "Âm nhạc", "Mỹ thuật", "Thể dục"].map((subj) => (
                                        <DropdownMenuItem
                                            key={subj}
                                            onClick={() => setSelectedSubjectForAdmin(subj)}
                                            className="px-3 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-semibold transition-colors"
                                        >
                                            Môn {subj}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuItem
                                        onClick={() => {
                                            const custom = window.prompt("Nhập tên môn học khác:", "Tiếng Pháp");
                                            if (custom && custom.trim()) {
                                                setSelectedSubjectForAdmin(custom.trim());
                                            }
                                        }}
                                        className="px-3 py-1.5 hover:bg-[#2f8fa3]/10 rounded-md cursor-pointer text-[#2f8fa3] text-sm font-bold transition-colors border-t border-slate-100 mt-1"
                                    >
                                        + Môn khác...
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {selectedSubjectForAdmin && !["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "Tin học", "GDCD", "Âm nhạc", "Mỹ thuật", "Thể dục"].includes(selectedSubjectForAdmin) && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-[#2f8fa3]">Tên môn:</span>
                                    <input
                                        type="text"
                                        value={selectedSubjectForAdmin}
                                        onChange={(e) => setSelectedSubjectForAdmin(e.target.value)}
                                        placeholder="Nhập tên môn..."
                                        className="px-3 py-1 border border-[#2f8fa3]/30 rounded-lg text-sm font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2f8fa3]/30"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <QuizBuilder
                        onSubmit={handleCreateBankQuiz}
                        onCancel={() => setIsCreatingQuiz(false)}
                        isSaving={isSavingQuiz}
                    />
                </div>
            ) : isCreatingAssignment ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <BackButton
                        onClick={() => setIsCreatingAssignment(false)}
                        className="mb-4"
                    >
                        Quay lại danh sách
                    </BackButton>
                    {user?.role === 'admin' && (
                        <div className="mb-4 bg-[#2f8fa3]/5 border border-[#2f8fa3]/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-200 flex-wrap">
                            <span className="text-sm font-bold text-[#2f8fa3]">Môn học cho học liệu này:</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="px-4 py-1.5 border border-[#2f8fa3]/30 rounded-lg text-sm outline-none font-semibold bg-white text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                                    >
                                        <span>Môn {selectedSubjectForAdmin}</span>
                                        <CaretDown size={14} className="text-slate-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1 w-48 max-h-60 overflow-y-auto">
                                    {["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "Tin học", "GDCD", "Âm nhạc", "Mỹ thuật", "Thể dục"].map((subj) => (
                                        <DropdownMenuItem
                                            key={subj}
                                            onClick={() => setSelectedSubjectForAdmin(subj)}
                                            className="px-3 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-semibold transition-colors"
                                        >
                                            Môn {subj}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuItem
                                        onClick={() => {
                                            const custom = window.prompt("Nhập tên môn học khác:", "Tiếng Pháp");
                                            if (custom && custom.trim()) {
                                                setSelectedSubjectForAdmin(custom.trim());
                                            }
                                        }}
                                        className="px-3 py-1.5 hover:bg-[#2f8fa3]/10 rounded-md cursor-pointer text-[#2f8fa3] text-sm font-bold transition-colors border-t border-slate-100 mt-1"
                                    >
                                        + Môn khác...
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {selectedSubjectForAdmin && !["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "Tin học", "GDCD", "Âm nhạc", "Mỹ thuật", "Thể dục"].includes(selectedSubjectForAdmin) && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-[#2f8fa3]">Tên môn:</span>
                                    <input
                                        type="text"
                                        value={selectedSubjectForAdmin}
                                        onChange={(e) => setSelectedSubjectForAdmin(e.target.value)}
                                        placeholder="Nhập tên môn..."
                                        className="px-3 py-1 border border-[#2f8fa3]/30 rounded-lg text-sm font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2f8fa3]/30"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <AssignmentBuilder
                        onSubmit={handleCreateBankAssignment}
                        onCancel={() => setIsCreatingAssignment(false)}
                        isSaving={isSavingQuiz}
                    />
                </div>
            ) : (
                <>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h1 className="text-2xl font-bold text-[#f47c20] flex items-center gap-2">
                            <BookOpen size={28} className="text-[#f47c20]" weight="fill" />
                            Ngân Hàng Đề & Tài Liệu
                        </h1>
                        <p className="text-slate-500 mt-1">Nơi soạn giảng và lưu trữ các đề trắc nghiệm, bài tập để giao cho nhiều lớp</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Tài nguyên của bạn</h2>
                            {loading ? (
                                <div className="text-center py-10 text-slate-400">Đang tải...</div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                    <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">Ngân hàng của bạn đang trống</p>
                                    <p className="text-slate-400 text-sm mt-1">Hãy bấm "Soạn tài nguyên mới" để bắt đầu</p>
                                </div>
                            ) : (
                                <>
                                    {/* SEARCH, FILTER AND ACTION BAR */}
                                    <div className="mb-4 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                                        <div className="flex flex-col sm:flex-row gap-2.5 flex-1 items-stretch sm:items-center">
                                            <SmartSearchBar
                                                placeholder="Tìm kiếm tài nguyên theo tiêu đề..."
                                                value={searchTerm}
                                                onChange={(val) => {
                                                    setSearchTerm(val);
                                                    setCurrentPage(1);
                                                }}
                                                suggestions={searchSuggestions}
                                                onSelectSuggestion={(item) => {
                                                    setSelectedDetailsItem(item.rawData);
                                                    setShowDetailsDialog(true);
                                                }}
                                                recentSearchesKey="teacherBankSearches"
                                                widthClass="w-full sm:w-[320px]"
                                            />
                                            <div className="flex gap-2">
                                                <DropdownFilter
                                                    label="Loại"
                                                    value={filterType}
                                                    onChange={(key) => {
                                                        setFilterType(key);
                                                        setCurrentPage(1);
                                                    }}
                                                    options={[
                                                        { id: "all", label: "Tất cả loại" },
                                                        { id: "quiz", label: "Trắc nghiệm" },
                                                        { id: "document", label: "Bài tập" }
                                                    ]}
                                                    minWidthClass="min-w-[140px]"
                                                />

                                                <DropdownFilter
                                                    label="Môn học"
                                                    value={filterSubject}
                                                    onChange={(key) => {
                                                        setFilterSubject(key);
                                                        setCurrentPage(1);
                                                    }}
                                                    options={[
                                                        { id: "all", label: "Tất cả môn" },
                                                        ...Array.from(new Set(items.map(item => item.subject).filter(Boolean) as string[])).map(subj => ({
                                                            id: subj,
                                                            label: subj
                                                        }))
                                                    ]}
                                                    icon={<BookOpen size={16} className="text-slate-400" />}
                                                    minWidthClass="min-w-[180px]"
                                                    hasCustomInput={true}
                                                    customInputLabel="Môn khác"
                                                    customInputPlaceholder="Nhập tên môn..."
                                                    customInputValue={filterSubject === 'all' ? '' : filterSubject}
                                                    onCustomInputChange={(val) => {
                                                        setFilterSubject(val.trim() === '' ? 'all' : val);
                                                        setCurrentPage(1);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <PrimaryButton variant="default" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold border-2 h-auto shrink-0 self-end lg:self-auto">
                                                    <Plus size={18} weight="bold" />
                                                    Soạn tài nguyên mới
                                                </PrimaryButton>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-72 p-2 bg-white rounded-xl shadow-xl border border-slate-100">
                                                <DropdownMenuItem className="p-3 hover:bg-primary/10 focus:bg-primary/10 rounded-lg cursor-pointer flex items-center gap-3 transition-colors" onClick={() => setIsCreatingQuiz(true)}>
                                                    <div className="bg-orange-100 !text-orange-600 p-2 rounded-lg">
                                                        <FileText size={20} weight="fill" className="!text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold !text-slate-700">Đề Trắc nghiệm</p>
                                                        <p className="text-xs !text-slate-500">Tạo bộ câu hỏi trắc nghiệm</p>
                                                    </div>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="p-3 hover:bg-primary/10 focus:bg-primary/10 rounded-lg cursor-pointer flex items-center gap-3 mt-1 transition-colors" onClick={() => setIsCreatingAssignment(true)}>
                                                    <div className="bg-emerald-100 !text-emerald-600 p-2 rounded-lg">
                                                        <BookOpen size={20} weight="fill" className="!text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold !text-slate-700">File Bài tập</p>
                                                        <p className="text-xs !text-slate-500">Tải lên file PDF, Word...</p>
                                                    </div>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* BULK ACTION TOOLBAR */}
                                    {selectedIds.length > 0 && (
                                        <div className="mb-4 flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg shadow-sm animate-in fade-in duration-200">
                                            <span className="text-sm font-medium text-slate-700">
                                                Đã chọn <strong className="text-primary">{selectedIds.length}</strong> tài nguyên
                                            </span>
                                            <PrimaryButton
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleBulkDelete}
                                                className="flex items-center gap-2"
                                            >
                                                <Trash weight="bold" size={16} />
                                                Xóa các tài nguyên đã chọn
                                            </PrimaryButton>
                                        </div>
                                    )}

                                    <Table>
                                        <Table.ScrollContainer className="min-h-[400px]">
                                            <Table.Content
                                                aria-label="Danh sách tài nguyên ngân hàng đề"
                                                className="min-w-[800px] w-full border-collapse"
                                                selectedKeys={selectedKeys}
                                                selectionMode="multiple"
                                                selectionBehavior="toggle"
                                                onSelectionChange={setSelectedKeys}
                                            >
                                                <Table.Header>
                                                    <Table.Column className="after:hidden w-[50px] px-5 py-3.5" id="selection">
                                                        <Checkbox aria-label="Select all" slot="selection">
                                                            <Checkbox.Content>
                                                                <Checkbox.Control>
                                                                    <Checkbox.Indicator />
                                                                </Checkbox.Control>
                                                            </Checkbox.Content>
                                                        </Checkbox>
                                                    </Table.Column>
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider w-[240px]" id="type">Loại + Trạng thái</Table.Column>
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider w-[160px]" id="subject">Môn học</Table.Column>
                                                    <Table.Column isRowHeader className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider w-[280px]" id="title">Tiêu đề tài nguyên</Table.Column>
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center w-[120px]" id="maxScore">Điểm tối đa</Table.Column>
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center w-[120px]" id="duration">Thời gian</Table.Column>
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center w-[120px]" id="actions">Thao tác</Table.Column>
                                                </Table.Header>
                                                <Table.Body>
                                                    {currentItems.length === 0 ? (
                                                        <Table.Row>
                                                            <Table.Cell className="px-5 py-12 text-center text-slate-500 font-medium" colSpan={7}>
                                                                <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                                                                    <MagnifyingGlass size={48} weight="duotone" className="text-[#f47c20] bg-[#f47c20]/10 p-3.5 rounded-full" />
                                                                    <p className="font-extrabold text-slate-800 text-sm">Không tìm thấy tài nguyên</p>
                                                                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">Không tìm thấy tài nguyên học liệu nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                                                                </div>
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    ) : (
                                                        currentItems.map(item => (
                                                            <Table.Row
                                                                key={item._id}
                                                                id={item._id}
                                                                className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 cursor-pointer"
                                                            >
                                                                <Table.Cell className="px-5 py-3.5">
                                                                    <Checkbox aria-label={`Select ${item.title}`} slot="selection">
                                                                        <Checkbox.Content>
                                                                            <Checkbox.Control>
                                                                                <Checkbox.Indicator />
                                                                            </Checkbox.Control>
                                                                        </Checkbox.Content>
                                                                    </Checkbox>
                                                                </Table.Cell>
                                                                <Table.Cell className="px-5 py-3.5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleOpenDetails(item); }}>
                                                                    <div className="flex items-center gap-1.5 flex-nowrap">
                                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full inline-block text-center leading-none whitespace-nowrap ${item.type === 'quiz'
                                                                            ? 'bg-[#f47c20]/10 text-[#f47c20] border border-[#f47c20]/30'
                                                                            : 'bg-[#2f8fa3]/10 text-[#2f8fa3] border border-[#2f8fa3]/30'
                                                                            }`}>
                                                                            {item.type === 'quiz' ? 'Trắc nghiệm' : 'Bài tập'}
                                                                        </span>
                                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full inline-block text-center leading-none whitespace-nowrap ${item.sharingStatus === 'CENTER_SHARED'
                                                                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                                            }`}>
                                                                            {item.sharingStatus === 'CENTER_SHARED' ? 'Chung' : 'Cá nhân'}
                                                                        </span>
                                                                    </div>
                                                                </Table.Cell>
                                                                <Table.Cell className="px-5 py-3.5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleOpenDetails(item); }}>
                                                                    {item.subject ? (
                                                                        <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-[#2f8fa3]/10 text-[#2f8fa3] border border-[#2f8fa3]/20 leading-none inline-block">
                                                                            {item.subject}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-300 font-medium">—</span>
                                                                    )}
                                                                </Table.Cell>
                                                                <Table.Cell className="px-5 py-3.5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleOpenDetails(item); }}>
                                                                    <div className="font-semibold text-slate-800 max-w-[200px] truncate" title={item.title}>
                                                                        {item.title}
                                                                    </div>
                                                                </Table.Cell>
                                                                <Table.Cell className="px-5 py-3.5 text-center font-medium text-slate-700" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleOpenDetails(item); }}>
                                                                    {item.maxScore} điểm
                                                                </Table.Cell>
                                                                <Table.Cell className="px-5 py-3.5 text-center font-medium text-slate-600" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleOpenDetails(item); }}>
                                                                    {item.type === 'quiz' && item.durationMinutes ? (
                                                                        <span className="inline-flex items-center gap-1 justify-center">
                                                                            <Clock size={14} /> {item.durationMinutes} phút
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-300">—</span>
                                                                    )}
                                                                </Table.Cell>
                                                                <Table.Cell className="px-5 py-3.5 text-center" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                                                                    <div className="flex items-center justify-center gap-1.5 relative">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenEdit(item)}
                                                                            className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors cursor-pointer"
                                                                            title="Chỉnh sửa"
                                                                        >
                                                                            <PencilSimple size={18} weight="bold" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDelete(item._id)}
                                                                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors cursor-pointer"
                                                                            title="Xóa tài nguyên"
                                                                        >
                                                                            <Trash size={18} weight="bold" />
                                                                        </button>
                                                                    </div>
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        ))
                                                    )}
                                                </Table.Body>
                                            </Table.Content>
                                        </Table.ScrollContainer>
                                        {totalPages > 0 && (
                                            <Table.Footer>
                                                <Pagination size="sm" className="flex items-center justify-between w-full p-4 border-t border-slate-200 bg-transparent">
                                                    <Pagination.Summary className="text-sm text-slate-500 font-medium">
                                                        Hiển thị {startIdx} đến {endIdx} trong số {filteredItems.length} kết quả
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
                                                        {pages.map((p) => (
                                                            <Pagination.Item key={p}>
                                                                <Pagination.Link
                                                                    isActive={p === currentPage}
                                                                    onPress={() => setCurrentPage(p)}
                                                                    className={p === currentPage ? "bg-primary text-white font-bold border-primary" : "text-slate-600 font-medium hover:bg-slate-100"}
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
                                            </Table.Footer>
                                        )}
                                    </Table>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Modal Xem chi tiết học liệu (dùng chung ResourceDetailModal) */}
            <ResourceDetailModal
                isOpen={showDetailsDialog}
                onClose={() => setShowDetailsDialog(false)}
                item={selectedDetailsItem}
            />


            {/* Modal Chỉnh sửa học liệu */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-[480px] bg-white">
                    <form onSubmit={handleUpdateBankItem}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <PencilSimple size={24} className="text-primary" />
                                Chỉnh sửa học liệu
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Cập nhật thông tin tài nguyên trong ngân hàng.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 text-sm">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title" className="font-semibold text-slate-700">Tiêu đề tài nguyên</Label>
                                <input
                                    id="edit-title"
                                    required
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-desc" className="font-semibold text-slate-700">Mô tả chi tiết</Label>
                                <textarea
                                    id="edit-desc"
                                    rows={3}
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-score" className="font-semibold text-slate-700">Điểm tối đa</Label>
                                    <div className="h-[41px]">
                                        <NumberStepper
                                            value={editFormData.maxScore}
                                            onChange={(val) => setEditFormData({ ...editFormData, maxScore: Number(val) || 10 })}
                                            min={1}
                                            max={100}
                                            step={1}
                                            fullWidth
                                        />
                                    </div>
                                </div>
                                {editFormData.type === 'quiz' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-duration" className="font-semibold text-slate-700">Thời gian (phút)</Label>
                                        <div className="h-[41px]">
                                            <NumberStepper
                                                value={editFormData.durationMinutes}
                                                onChange={(val) => setEditFormData({ ...editFormData, durationMinutes: Number(val) || 15 })}
                                                min={1}
                                                max={180}
                                                step={1}
                                                fullWidth
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {user?.role === 'admin' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2 flex flex-col">
                                        <Label className="font-semibold text-slate-700 mb-1">Môn học</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold flex items-center justify-between cursor-pointer"
                                                >
                                                    <span>Môn {editFormData.subject}</span>
                                                    <CaretDown size={14} className="text-slate-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1 w-48 max-h-60 overflow-y-auto">
                                                {["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "Tin học", "GDCD", "Âm nhạc", "Mỹ thuật", "Thể dục"].map((subj) => (
                                                    <DropdownMenuItem
                                                        key={subj}
                                                        onClick={() => setEditFormData({ ...editFormData, subject: subj })}
                                                        className="px-3 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-semibold transition-colors"
                                                    >
                                                        Môn {subj}
                                                    </DropdownMenuItem>
                                                ))}
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        const custom = window.prompt("Nhập tên môn học khác:", "Tiếng Pháp");
                                                        if (custom && custom.trim()) {
                                                            setEditFormData({ ...editFormData, subject: custom.trim() });
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 hover:bg-orange-50 rounded-md cursor-pointer text-orange-600 text-sm font-bold transition-colors border-t border-slate-100 mt-1"
                                                >
                                                    + Môn khác...
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-sharing" className="font-semibold text-slate-700">Phạm vi chia sẻ</Label>
                                        <select
                                            id="edit-sharing"
                                            value={editFormData.sharingStatus}
                                            onChange={(e) => setEditFormData({ ...editFormData, sharingStatus: e.target.value as any })}
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold bg-slate-50 outline-none cursor-not-allowed"
                                            disabled
                                        >
                                            <option value="CENTER_SHARED">Chung (Toàn trung tâm)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="flex items-center gap-3">
                            <PrimaryButton
                                type="button"
                                variant="outline"
                                onClick={() => setShowEditDialog(false)}
                                className="font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 h-[41px] rounded-xl px-5 py-0 flex items-center justify-center transition-colors"
                                disabled={isSubmittingEdit}
                            >
                                Hủy
                            </PrimaryButton>
                            <SaveButton
                                type="submit"
                                disabled={isSubmittingEdit}
                            >
                                {isSubmittingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                            </SaveButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* AlertDialog xác nhận xóa 1 tài nguyên */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent size="default">
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-red-50">
                            <TrashIcon size={24} weight="bold" className="text-red-500" />
                        </AlertDialogMedia>
                        <AlertDialogTitle className="text-slate-900">Xóa tài nguyên?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tài nguyên này sẽ bị xóa vĩnh viễn khỏi ngân hàng đề. Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            variant="solid"
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-600 focus-visible:ring-red-500"
                        >
                            Xóa tài nguyên
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog xác nhận xóa nhiều tài nguyên */}
            <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
                <AlertDialogContent size="default">
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-red-50">
                            <TrashIcon size={24} weight="bold" className="text-red-500" />
                        </AlertDialogMedia>
                        <AlertDialogTitle className="text-slate-900">Xóa {selectedIds.length} tài nguyên?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedIds.length} tài nguyên đã chọn sẽ bị xóa vĩnh viễn khỏi ngân hàng đề. Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            variant="solid"
                            onClick={confirmBulkDelete}
                            className="bg-red-500 hover:bg-red-600 focus-visible:ring-red-500"
                        >
                            Xóa {selectedIds.length} tài nguyên
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
