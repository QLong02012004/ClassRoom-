import React, { useState, useEffect, useMemo } from 'react';
import { bankService } from '../../../service/bank.service';
import type { IBankItem } from '../../../service/bank.service';
import { useToast } from '../../../components/Styles/ToastContext';
import { Plus, BookOpen, FileText, DotsThree, Trash, PencilSimple, Clock, CaretDown, MagnifyingGlass, Funnel, Info, TextAa, ListChecks, DownloadSimple, CheckCircle, ClipboardText, Calculator } from 'phosphor-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/dropdown-menu';
import QuizBuilder from '../../../components/ui/QuizBuilder/QuizBuilder';
import AssignmentBuilder from '../../../components/ui/AssignmentBuilder/AssignmentBuilder';
import { Table, Checkbox, Pagination } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { BackButton } from '../../../components/ui/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { BankActionMenu } from '../../../components/ui/BankActionMenu';
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

    // State bộ lọc và tìm kiếm
    const [searchTerm, setSearchTerm] = useState("");
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

    const handleDelete = async (id: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa tài nguyên này khỏi ngân hàng?")) return;
        try {
            await bankService.deleteBankItem(id);
            toast.success("Xóa thành công!");
            loadBankItems();
        } catch {
            toast.error("Xóa thất bại!");
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

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} tài nguyên đã chọn khỏi ngân hàng?`)) return;
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
                        <div className="mb-4 bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
                            <span className="text-sm font-bold text-orange-800">Môn học cho học liệu này:</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none font-semibold bg-white text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        <span>Môn {selectedSubjectForAdmin}</span>
                                        <CaretDown size={14} className="text-slate-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1 w-44">
                                    {["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học"].map((subj) => (
                                        <DropdownMenuItem
                                            key={subj}
                                            onClick={() => setSelectedSubjectForAdmin(subj)}
                                            className="px-3 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-semibold transition-colors"
                                        >
                                            Môn {subj}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                        <div className="mb-4 bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
                            <span className="text-sm font-bold text-orange-800">Môn học cho học liệu này:</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none font-semibold bg-white text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        <span>Môn {selectedSubjectForAdmin}</span>
                                        <CaretDown size={14} className="text-slate-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1 w-44">
                                    {["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học"].map((subj) => (
                                        <DropdownMenuItem
                                            key={subj}
                                            onClick={() => setSelectedSubjectForAdmin(subj)}
                                            className="px-3 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-semibold transition-colors"
                                        >
                                            Môn {subj}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen size={28} className="text-primary" weight="fill" />
                                Ngân Hàng Đề & Tài Liệu
                            </h1>
                            <p className="text-slate-500 mt-1">Nơi soạn giảng và lưu trữ các đề trắc nghiệm, bài tập để giao cho nhiều lớp</p>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <PrimaryButton variant="default" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold border-2 h-auto">
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
                                    {/* SEARCH AND FILTER BAR */}
                                    <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between">
                                        <div className="relative w-full sm:w-[320px]">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                <MagnifyingGlass size={18} className="text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm tài nguyên theo tiêu đề..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-[140px] flex items-center justify-between relative hover:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                            <Funnel size={16} className="text-slate-400" />
                                                        </div>
                                                        <span>
                                                            {filterType === 'all' ? 'Tất cả loại' : filterType === 'quiz' ? 'Trắc nghiệm' : 'Bài tập'}
                                                        </span>
                                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                            <CaretDown size={14} className="text-slate-400" />
                                                        </div>
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1 min-w-[140px]">
                                                    <DropdownMenuItem onClick={() => { setFilterType('all'); setCurrentPage(1); }} className="px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-medium transition-colors">Tất cả loại</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setFilterType('quiz'); setCurrentPage(1); }} className="px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-medium transition-colors">Trắc nghiệm</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setFilterType('document'); setCurrentPage(1); }} className="px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-medium transition-colors">Bài tập</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-[140px] flex items-center justify-between relative hover:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                            <BookOpen size={16} className="text-slate-400" />
                                                        </div>
                                                        <span>
                                                            {filterSubject === 'all' ? 'Tất cả môn' : filterSubject}
                                                        </span>
                                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                            <CaretDown size={14} className="text-slate-400" />
                                                        </div>
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1 min-w-[140px]">
                                                    <DropdownMenuItem onClick={() => { setFilterSubject('all'); setCurrentPage(1); }} className="px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-medium transition-colors">Tất cả môn</DropdownMenuItem>
                                                    {["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học"].map((subj) => (
                                                        <DropdownMenuItem
                                                            key={subj}
                                                            onClick={() => { setFilterSubject(subj); setCurrentPage(1); }}
                                                            className="px-3 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-medium transition-colors"
                                                        >
                                                            {subj}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
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
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider w-[120px]" id="subject">

                                                    </Table.Column>
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider w-[280px]" id="title">Tiêu đề tài nguyên</Table.Column>
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center w-[120px]" id="maxScore">Điểm tối đa</Table.Column>
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center w-[120px]" id="duration">Thời gian</Table.Column>
                                                    <Table.Column className="after:hidden px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center w-[90px]" id="actions">Thao tác</Table.Column>
                                                </Table.Header>
                                                <Table.Body>
                                                    {currentItems.map(item => (
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
                                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full inline-block text-center leading-none bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                                                        {item.type === 'quiz' ? 'Trắc nghiệm' : 'Bài tập'}
                                                                    </span>
                                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full inline-block text-center leading-none bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                                                        {item.sharingStatus === 'CENTER_SHARED' ? 'Chung' : 'Cá nhân'}
                                                                    </span>
                                                                </div>
                                                            </Table.Cell>
                                                            <Table.Cell className="px-5 py-3.5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleOpenDetails(item); }}>
                                                                {item.subject ? (
                                                                    <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-blue-50 text-blue-600 leading-none inline-block">
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
                                                                <div className="flex items-center justify-center relative">
                                                                    <BankActionMenu
                                                                        onViewDetails={() => handleOpenDetails(item)}
                                                                        onEdit={() => handleOpenEdit(item)}
                                                                        onDelete={() => handleDelete(item._id)}
                                                                    />
                                                                </div>
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    ))}
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

            {/* Modal Xem chi tiết học liệu */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden bg-white p-0">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedDetailsItem?.type === 'quiz' ? 'bg-orange-100 text-orange-500' : 'bg-emerald-100 text-emerald-500'}`}>
                                {selectedDetailsItem?.type === 'quiz' ? <ClipboardText size={24} weight="duotone" /> : <Calculator size={24} weight="duotone" />}
                            </div>
                            {selectedDetailsItem?.title}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 mt-1 pl-[52px]">
                            Thông tin chi tiết được lưu trữ trong Ngân hàng học liệu.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedDetailsItem && (
                        <div className="flex-1 overflow-hidden p-6 flex flex-col md:flex-row gap-6">
                            {/* Cột trái: Thông tin chung */}
                            <ScrollArea className="w-full md:w-[320px] lg:w-[350px] flex-shrink-0 h-[450px]" type="auto">
                                <div className="space-y-4 pr-4">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Info size={18} className="text-orange-500" weight="duotone" /> 
                                    Thông tin chung
                                </h3>
                                <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                                        <span className="font-medium text-slate-500 text-sm">Loại tài nguyên:</span>
                                        <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${selectedDetailsItem.type === 'quiz' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                            {selectedDetailsItem.type === 'quiz' ? 'Trắc nghiệm' : 'Bài tập tự luận'}
                                        </span>
                                    </div>
                                    {selectedDetailsItem.subject && (
                                        <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                                            <span className="font-medium text-slate-500 text-sm">Môn học:</span>
                                            <span className="font-bold text-blue-600 text-sm">{selectedDetailsItem.subject}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                                        <span className="font-medium text-slate-500 text-sm">Phạm vi chia sẻ:</span>
                                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${selectedDetailsItem.sharingStatus === 'CENTER_SHARED' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {selectedDetailsItem.sharingStatus === 'CENTER_SHARED' ? 'Thư viện chung' : 'Cá nhân'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                                        <span className="font-medium text-slate-500 text-sm">Điểm tối đa:</span>
                                        <span className="font-bold text-slate-800 text-sm">{selectedDetailsItem.maxScore} điểm</span>
                                    </div>
                                    {selectedDetailsItem.type === 'quiz' && selectedDetailsItem.durationMinutes && (
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-500 text-sm">Thời gian làm bài:</span>
                                            <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                                                <Clock size={16} className="text-orange-500" />
                                                {selectedDetailsItem.durationMinutes} phút
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <TextAa size={18} className="text-orange-500" weight="duotone" />
                                        Mô tả chi tiết
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-200 whitespace-pre-wrap">
                                        {selectedDetailsItem.description || <span className="text-slate-400 italic">Không có mô tả chi tiết.</span>}
                                    </div>
                                </div>
                                </div>
                            </ScrollArea>

                            {/* Cột phải: Nội dung */}
                            <div className="flex-[1.5] border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                                {selectedDetailsItem.type === 'document' && selectedDetailsItem.fileUrl ? (
                                    <div className="h-full border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                                        <FileText size={64} weight="duotone" className="text-emerald-500 mb-4" />
                                        <h4 className="text-lg font-bold text-slate-800 mb-2">Tài liệu đính kèm</h4>
                                        <p className="text-slate-500 text-sm mb-6 max-w-xs">
                                            Học liệu này là dạng file tự luận. Bạn có thể tải file về để xem chi tiết nội dung.
                                        </p>
                                        <a
                                            href={selectedDetailsItem.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-white font-bold text-sm bg-emerald-500 hover:bg-emerald-600 transition-colors px-6 py-2.5 rounded-xl shadow-sm"
                                        >
                                            <DownloadSimple size={18} weight="bold" /> Tải xuống tài liệu
                                        </a>
                                    </div>
                                ) : selectedDetailsItem.type === 'quiz' && selectedDetailsItem.quizQuestions ? (
                                    <div className="flex flex-col h-full max-h-[500px]">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                <ListChecks size={18} className="text-orange-500" weight="duotone" />
                                                Danh sách câu hỏi
                                            </h3>
                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 font-bold text-xs rounded-full">
                                                {selectedDetailsItem.quizQuestions.length} câu
                                            </span>
                                        </div>
                                        <ScrollArea className="flex-1 pr-4 h-[400px]" type="auto">
                                            <div className="space-y-4">
                                                {selectedDetailsItem.quizQuestions.map((q: any, qIdx: number) => (
                                                <div key={q._id || qIdx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-orange-200 transition-colors">
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0 mt-0.5">
                                                            {qIdx + 1}
                                                        </div>
                                                        <p className="font-semibold text-slate-800 leading-snug text-sm">{q.questionText}</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10">
                                                        {q.options.map((opt: string, optIdx: number) => {
                                                            const isCorrect = optIdx === q.correctOptionIndex;
                                                            return (
                                                                <div key={optIdx} className={`p-2.5 rounded-lg text-sm flex items-center gap-2 ${isCorrect ? 'bg-orange-50 border border-orange-200 text-orange-800 font-medium' : 'bg-slate-50 border border-slate-100 text-slate-600'}`}>
                                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isCorrect ? 'bg-orange-500 text-white' : 'bg-white border border-slate-300 text-slate-500'}`}>
                                                                        {String.fromCharCode(65 + optIdx)}
                                                                    </div>
                                                                    <span className="flex-1">{opt}</span>
                                                                    {isCorrect && <CheckCircle size={16} weight="fill" className="text-orange-500 flex-shrink-0" />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                ) : (
                                    <div className="h-full border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 text-sm font-medium">
                                        Không có nội dung chi tiết
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="m-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowDetailsDialog(false)}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-colors"
                        >
                            Đóng
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


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
                                    <input
                                        id="edit-score"
                                        type="number"
                                        required
                                        min={1}
                                        value={editFormData.maxScore}
                                        onChange={(e) => setEditFormData({ ...editFormData, maxScore: parseInt(e.target.value) || 10 })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                    />
                                </div>
                                {editFormData.type === 'quiz' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-duration" className="font-semibold text-slate-700">Thời gian (phút)</Label>
                                        <input
                                            id="edit-duration"
                                            type="number"
                                            required
                                            min={1}
                                            value={editFormData.durationMinutes}
                                            onChange={(e) => setEditFormData({ ...editFormData, durationMinutes: parseInt(e.target.value) || 15 })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                        />
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
                                                    className="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold flex items-center justify-between"
                                                >
                                                    <span>Môn {editFormData.subject}</span>
                                                    <CaretDown size={14} className="text-slate-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1 w-44">
                                                {["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học"].map((subj) => (
                                                    <DropdownMenuItem
                                                        key={subj}
                                                        onClick={() => setEditFormData({ ...editFormData, subject: subj })}
                                                        className="px-3 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700 text-sm font-semibold transition-colors"
                                                    >
                                                        Môn {subj}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-sharing" className="font-semibold text-slate-700">Phạm vi chia sẻ</Label>
                                        <select
                                            id="edit-sharing"
                                            value={editFormData.sharingStatus}
                                            onChange={(e) => setEditFormData({ ...editFormData, sharingStatus: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold bg-white outline-none"
                                        >
                                            <option value="CENTER_SHARED">Chung (Toàn trung tâm)</option>
                                            <option value="PRIVATE">Cá nhân (Chỉ bạn)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <PrimaryButton
                                type="button"
                                variant="outline"
                                onClick={() => setShowEditDialog(false)}
                                className="font-semibold"
                                disabled={isSubmittingEdit}
                            >
                                Hủy
                            </PrimaryButton>
                            <PrimaryButton
                                type="submit"
                                className="bg-primary text-white font-semibold"
                                disabled={isSubmittingEdit}
                            >
                                {isSubmittingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                            </PrimaryButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
