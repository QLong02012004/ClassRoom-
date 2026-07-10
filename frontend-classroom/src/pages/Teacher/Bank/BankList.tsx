import React, { useState, useEffect } from 'react';
import { bankService } from '../../../service/bank.service';
import type { IBankItem } from '../../../service/bank.service';
import { useToast } from '../../../components/Styles/ToastContext';
import { Plus, BookOpen, FileText, DotsThree, Trash, PencilSimple, Clock } from 'phosphor-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/dropdown-menu';
import QuizBuilder from '../../../components/ui/QuizBuilder/QuizBuilder';
import AssignmentBuilder from '../../../components/ui/AssignmentBuilder/AssignmentBuilder';

export default function BankList() {
    const toast = useToast();
    const [items, setItems] = useState<IBankItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
    const [isSavingQuiz, setIsSavingQuiz] = useState(false);

    const loadBankItems = async () => {
        try {
            setLoading(true);
            const res = await bankService.getMyBankItems();
            setItems(res.data || []);
        } catch (error) {
            toast.error("Không thể tải ngân hàng đề");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBankItems();
    }, []);

    const handleCreateBankQuiz = async (quizData: any) => {
        setIsSavingQuiz(true);
        try {
            await bankService.createBankItem({
                type: 'quiz',
                title: quizData.title,
                durationMinutes: quizData.durationMinutes,
                quizQuestions: quizData.questions,
                maxScore: quizData.questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0)
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
                maxScore: data.maxScore
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

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            {isCreatingQuiz ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <button 
                        onClick={() => setIsCreatingQuiz(false)}
                        className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                        ← Quay lại danh sách
                    </button>
                    <QuizBuilder
                        onSubmit={handleCreateBankQuiz}
                        onCancel={() => setIsCreatingQuiz(false)}
                        isSaving={isSavingQuiz}
                    />
                </div>
            ) : isCreatingAssignment ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <button 
                        onClick={() => setIsCreatingAssignment(false)}
                        className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                        ← Quay lại danh sách
                    </button>
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
                        <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20">
                            <Plus size={18} weight="bold" />
                            Soạn tài nguyên mới
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 bg-white rounded-xl shadow-xl border border-slate-100">
                        <DropdownMenuItem className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-3" onClick={() => setIsCreatingQuiz(true)}>
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                <FileText size={20} weight="fill" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-700">Đề Trắc nghiệm</p>
                                <p className="text-xs text-slate-500">Tạo bộ câu hỏi trắc nghiệm</p>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-3 mt-1" onClick={() => setIsCreatingAssignment(true)}>
                            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                                <BookOpen size={20} weight="fill" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-700">File Bài tập</p>
                                <p className="text-xs text-slate-500">Tải lên file PDF, Word...</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(item => (
                                <div key={item._id} className="border border-slate-200 rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`px-3 py-1 text-xs font-bold rounded-full ${item.type === 'quiz' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {item.type === 'quiz' ? 'Trắc nghiệm' : 'Bài tập'}
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100">
                                                    <DotsThree size={24} weight="bold" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-36 bg-white rounded-lg shadow-lg border border-slate-100 p-1">
                                                <DropdownMenuItem className="p-2 hover:bg-slate-50 rounded-md cursor-pointer flex items-center gap-2 text-slate-700 text-sm">
                                                    <PencilSimple size={16} /> Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="p-2 hover:bg-red-50 rounded-md cursor-pointer flex items-center gap-2 text-red-600 text-sm"
                                                    onClick={() => handleDelete(item._id)}
                                                >
                                                    <Trash size={16} /> Xóa
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1" title={item.title}>{item.title}</h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{item.description || "Không có mô tả"}</p>

                                    <div className="flex items-center gap-4 text-sm text-slate-500 border-t border-slate-100 pt-3">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <span className="text-slate-400">Điểm tối đa:</span> {item.maxScore}
                                        </div>
                                        {item.type === 'quiz' && item.durationMinutes && (
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Clock size={16} /> {item.durationMinutes} phút
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            </>
            )}
        </div>
    );
}
