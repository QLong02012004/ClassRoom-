import React, { useState, useEffect, useMemo } from 'react';
import { bankService } from '../../../service/bank.service';
import type { IBankItem } from '../../../service/bank.service';
import { useToast } from '../../../components/Styles/ToastContext';
import { Plus, BookOpen, FileText, DotsThree, Trash, PencilSimple, Clock, CaretDown, MagnifyingGlass, Funnel } from 'phosphor-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/dropdown-menu';
import QuizBuilder from '../../../components/ui/QuizBuilder/QuizBuilder';
import AssignmentBuilder from '../../../components/ui/AssignmentBuilder/AssignmentBuilder';
import { Table, Checkbox, Pagination } from "@heroui/react";
import type { Selection } from "@heroui/react";
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { BackButton } from '../../../components/ui/BackButton';
import { useAuth } from '../../../context/AuthContext';
import { BankActionMenu } from '../../../components/ui/BankActionMenu';
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
                                                        <Table.Row key={item._id} id={item._id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                                                            <Table.Cell className="px-5 py-3.5">
                                                                <Checkbox aria-label={`Select ${item.title}`} slot="selection">
                                                                    <Checkbox.Content>
                                                                        <Checkbox.Control>
                                                                            <Checkbox.Indicator />
                                                                        </Checkbox.Control>
                                                                    </Checkbox.Content>
                                                                </Checkbox>
                                                            </Table.Cell>
                                                            <Table.Cell className="px-5 py-3.5">
                                                                <div className="flex items-center gap-1.5 flex-nowrap">
                                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full inline-block text-center leading-none bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                                                        {item.type === 'quiz' ? 'Trắc nghiệm' : 'Bài tập'}
                                                                    </span>
                                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full inline-block text-center leading-none bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                                                        {item.sharingStatus === 'CENTER_SHARED' ? 'Chung' : 'Cá nhân'}
                                                                    </span>
                                                                </div>
                                                            </Table.Cell>
                                                            <Table.Cell className="px-5 py-3.5">
                                                                {item.subject ? (
                                                                    <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-blue-50 text-blue-600 leading-none inline-block">
                                                                        {item.subject}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300 font-medium">—</span>
                                                                )}
                                                            </Table.Cell>
                                                            <Table.Cell className="px-5 py-3.5">
                                                                <div className="font-semibold text-slate-800 max-w-[200px] truncate" title={item.title}>
                                                                    {item.title}
                                                                </div>
                                                            </Table.Cell>
                                                            <Table.Cell className="px-5 py-3.5 text-center font-medium text-slate-700">
                                                                {item.maxScore} điểm
                                                            </Table.Cell>
                                                            <Table.Cell className="px-5 py-3.5 text-center font-medium text-slate-600">
                                                                {item.type === 'quiz' && item.durationMinutes ? (
                                                                    <span className="inline-flex items-center gap-1 justify-center">
                                                                        <Clock size={14} /> {item.durationMinutes} phút
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">—</span>
                                                                )}
                                                            </Table.Cell>
                                                            <Table.Cell className="px-5 py-3.5 text-center">
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
                <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen size={24} className="text-primary" />
                            Chi tiết học liệu
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Thông tin chi tiết được lưu trữ trong Ngân hàng học liệu.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedDetailsItem && (
                        <div className="space-y-4 py-4 text-slate-700">
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                                <span className="font-semibold text-slate-500 text-sm">Tiêu đề:</span>
                                <span className="col-span-2 font-bold text-slate-900 text-base">{selectedDetailsItem.title}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                                <span className="font-semibold text-slate-500 text-sm">Loại:</span>
                                <span className="col-span-2">
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${selectedDetailsItem.type === 'quiz' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {selectedDetailsItem.type === 'quiz' ? 'Trắc nghiệm' : 'Bài tập'}
                                    </span>
                                </span>
                            </div>
                            {selectedDetailsItem.subject && (
                                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                                    <span className="font-semibold text-slate-500 text-sm">Môn học:</span>
                                    <span className="col-span-2 font-semibold text-blue-600">{selectedDetailsItem.subject}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                                <span className="font-semibold text-slate-500 text-sm">Phạm vi chia sẻ:</span>
                                <span className="col-span-2">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${selectedDetailsItem.sharingStatus === 'CENTER_SHARED' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {selectedDetailsItem.sharingStatus === 'CENTER_SHARED' ? 'Chung (Toàn trung tâm)' : 'Cá nhân (Chỉ bạn)'}
                                    </span>
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                                <span className="font-semibold text-slate-500 text-sm">Điểm tối đa:</span>
                                <span className="col-span-2 font-semibold">{selectedDetailsItem.maxScore} điểm</span>
                            </div>
                            {selectedDetailsItem.type === 'quiz' && selectedDetailsItem.durationMinutes && (
                                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                                    <span className="font-semibold text-slate-500 text-sm">Thời gian làm bài:</span>
                                    <span className="col-span-2 font-semibold">{selectedDetailsItem.durationMinutes} phút</span>
                                </div>
                            )}
                            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
                                <span className="font-semibold text-slate-500 text-sm">Mô tả chi tiết:</span>
                                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic whitespace-pre-wrap mt-1 border border-slate-100">
                                    {selectedDetailsItem.description || "Không có mô tả chi tiết."}
                                </div>
                            </div>

                            {selectedDetailsItem.type === 'document' && selectedDetailsItem.fileUrl && (
                                <div className="flex flex-col gap-2 pt-2">
                                    <span className="font-semibold text-slate-500 text-sm">File đính kèm:</span>
                                    <a
                                        href={selectedDetailsItem.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary hover:underline font-bold text-sm bg-orange-50 w-fit px-3 py-1.5 rounded-lg border border-orange-100"
                                    >
                                        <FileText size={16} /> Tải xuống file tài liệu
                                    </a>
                                </div>
                            )}

                            {selectedDetailsItem.type === 'quiz' && selectedDetailsItem.quizQuestions && (
                                <div className="flex flex-col gap-2 pt-2">
                                    <span className="font-semibold text-slate-500 text-sm">Danh sách câu hỏi ({selectedDetailsItem.quizQuestions.length} câu):</span>
                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 border border-slate-100 rounded-xl p-3 bg-slate-50">
                                        {selectedDetailsItem.quizQuestions.map((q: any, qIdx: number) => (
                                            <div key={q._id || qIdx} className="bg-white p-3 rounded-lg border border-slate-100 text-xs shadow-sm">
                                                <p className="font-bold text-slate-800 mb-1.5">Câu {qIdx + 1}: {q.questionText}</p>
                                                <div className="grid grid-cols-2 gap-1.5 pl-2">
                                                    {q.options.map((opt: string, optIdx: number) => (
                                                        <div key={optIdx} className={`p-1.5 rounded ${optIdx === q.correctOptionIndex ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-50 text-slate-600'}`}>
                                                            {String.fromCharCode(65 + optIdx)}. {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <PrimaryButton
                            type="button"
                            onClick={() => setShowDetailsDialog(false)}
                            className="bg-primary text-white font-semibold"
                        >
                            Đóng
                        </PrimaryButton>
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
