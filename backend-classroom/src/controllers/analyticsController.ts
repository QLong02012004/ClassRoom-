import { Request, Response, NextFunction } from 'express';
import { QuizResultModel } from '../models/QuizResult';
import { ClassActivityModel } from '../models/ClassActivity';
import { BankItemModel } from '../models/BankItem';
import { ClassModel } from '../models/Class';

export const getStudentWeaknessRadar = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const studentId = (req as any).user?.id;
        if (!studentId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin học sinh" });
        }

        const quizResults = await QuizResultModel.find({ studentId });
        if (!quizResults.length) {
            return res.status(200).json({ message: "Chưa có dữ liệu làm bài", data: [] });
        }

        const weaknesses: Record<string, { total: number; wrong: number }> = {};

        for (const qr of quizResults) {
            const activity = await ClassActivityModel.findById(qr.quizId);
            if (!activity) continue;
            
            const bankItem = await BankItemModel.findById(activity.bankItemId);
            if (!bankItem || !bankItem.quizQuestions) continue;

            qr.answers.forEach((ans, i) => {
                const q = bankItem.quizQuestions![i];
                if (!q) return;

                const isWrong = ans !== q.correctOptionIndex;
                if (q.tags && q.tags.length > 0) {
                    q.tags.forEach(tag => {
                        if (!weaknesses[tag]) weaknesses[tag] = { total: 0, wrong: 0 };
                        weaknesses[tag].total += 1;
                        if (isWrong) weaknesses[tag].wrong += 1;
                    });
                }
            });
        }

        const radarData = Object.keys(weaknesses).map(tag => {
            const stats = weaknesses[tag] || { total: 0, wrong: 0 };
            const errorRate = stats.total > 0 ? Math.round((stats.wrong / stats.total) * 100) : 0;
            return {
                tag,
                total: stats.total,
                wrong: stats.wrong,
                errorRate
            };
        });

        // Chỉ lấy những tag có tỷ lệ sai >= 40% và sắp xếp giảm dần theo tỷ lệ sai
        const weakTags = radarData
            .filter(d => d.errorRate >= 40 && d.total >= 1) // Để demo dễ thì không giới hạn số câu tối thiểu
            .sort((a, b) => b.errorRate - a.errorRate)
            .slice(0, 5); // Lấy top 5

        res.status(200).json({
            message: "Lấy dữ liệu lỗ hổng kiến thức thành công",
            data: weakTags
        });

    } catch (error: any) {
        next(error);
    }
};

export const getActivityErrorInsights = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const activityId = req.params.id as string;
        
        const activity = await ClassActivityModel.findById(activityId);
        if (!activity) {
            return res.status(404).json({ message: "Không tìm thấy bài tập" });
        }

        const bankItem = await BankItemModel.findById(activity.bankItemId);
        if (!bankItem || !bankItem.quizQuestions) {
            return res.status(404).json({ message: "Ngân hàng đề không hợp lệ" });
        }

        const quizResults = await QuizResultModel.find({ quizId: activityId });
        if (!quizResults.length) {
            // Mock data cho Giáo viên xem cảnh báo nếu lớp chưa ai làm bài
            const mockErrors = bankItem.quizQuestions.slice(0, 3).map((q, index) => {
                const totalStudents = 45;
                const wrongCount = Math.floor(Math.random() * 15) + 25; // Random 25 -> 40 người sai
                const errorRate = Math.round((wrongCount / totalStudents) * 100);
                
                const optionsDistribution = q.options.map((opt, optIndex) => {
                    const isCorrect = optIndex === q.correctOptionIndex;
                    // Phân phối bừa số lượng người chọn các phương án
                    const count = isCorrect ? (totalStudents - wrongCount) : Math.floor(wrongCount / 3) + 2; 
                    return {
                        optionIndex: optIndex,
                        optionText: opt,
                        count,
                        isCorrect
                    }
                });

                return {
                    questionIndex: index,
                    questionText: q.questionText,
                    tags: q.tags || [],
                    errorRate,
                    totalStudents,
                    wrongCount,
                    correctOptionIndex: q.correctOptionIndex,
                    optionsDistribution
                };
            }).sort((a, b) => b.errorRate - a.errorRate);

            return res.status(200).json({ message: "Mock data for demo", data: mockErrors });
        }

        const totalStudents = quizResults.length;
        const questionsInsights = bankItem.quizQuestions.map((q, index) => {
            const optionsCount: Record<number, number> = {};
            q.options.forEach((_, optIndex) => optionsCount[optIndex] = 0);
            
            let wrongCount = 0;

            quizResults.forEach(qr => {
                const ans = qr.answers[index];
                if (ans !== undefined && ans >= 0) {
                    optionsCount[ans] = (optionsCount[ans] || 0) + 1;
                    if (ans !== q.correctOptionIndex) {
                        wrongCount++;
                    }
                }
            });

            const errorRate = Math.round((wrongCount / totalStudents) * 100);
            
            return {
                questionIndex: index,
                questionText: q.questionText,
                tags: q.tags || [],
                errorRate,
                totalStudents,
                wrongCount,
                correctOptionIndex: q.correctOptionIndex,
                optionsDistribution: Object.keys(optionsCount).map(optIndex => ({
                    optionIndex: parseInt(optIndex),
                    optionText: q.options[parseInt(optIndex)],
                    count: optionsCount[parseInt(optIndex)],
                    isCorrect: parseInt(optIndex) === q.correctOptionIndex
                }))
            };
        });

        // Filter for top wrong questions (> 60% error rate, or just top 3)
        const topErrors = questionsInsights
            .sort((a, b) => b.errorRate - a.errorRate)
            .slice(0, 3); // Lấy top 3 câu sai nhiều nhất

        res.status(200).json({
            message: "Lấy dữ liệu phân tích lỗi sai thành công",
            data: topErrors
        });

    } catch (error: any) {
        next(error);
    }
};

export const getPracticeQuestions = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { tag } = req.query;
        let limit = parseInt(req.query.limit as string) || 10;
        
        if (!tag || typeof tag !== 'string') {
            return res.status(400).json({ message: "Vui lòng cung cấp tag kiến thức" });
        }

        // Dùng aggregation để lấy ngẫu nhiên các câu hỏi từ các đề thi (BankItem) chứa tag này
        let questions = await BankItemModel.aggregate([
            { $match: { type: 'quiz' } },
            { $unwind: "$quizQuestions" },
            { $match: { "quizQuestions.tags": tag } },
            { $sample: { size: limit } },
            { $replaceRoot: { newRoot: "$quizQuestions" } }
        ]);

        if (!questions || questions.length === 0) {
            // Mock data để demo nếu chưa có câu hỏi thực tế trong DB
            questions = Array.from({ length: limit }).map((_, i) => ({
                questionText: `Câu hỏi giả lập số ${i + 1} cho chuyên đề: ${tag}`,
                options: [
                    `Đáp án A (sai)`,
                    `Đáp án B (đúng)`,
                    `Đáp án C (sai)`,
                    `Đáp án D (sai)`
                ],
                correctOptionIndex: 1,
                tags: [tag]
            }));
        }

        res.status(200).json({
            message: "Lấy câu hỏi luyện tập thành công",
            data: questions
        });

    } catch (error: any) {
        next(error);
    }
};
