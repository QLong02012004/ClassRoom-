import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { analyticsService } from '../../../service/analytics.service';
import { useToast } from '../../../components/Styles/ToastContext';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PracticeQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  imageUrl?: string;
  tags?: string[];
}

export default function Practice() {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || '';
  const limit = parseInt(searchParams.get('limit') || '10');
  const navigate = useNavigate();
  const toast = useToast();

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!tag) {
      toast.error('Thiếu thông tin tag để luyện tập');
      navigate('/dashboard');
      return;
    }
    loadQuestions();
  }, [tag, limit]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getPracticeQuestions(tag, limit);
      if (res && res.data) {
        setQuestions(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải câu hỏi luyện tập');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      const confirmSubmit = window.confirm('Bạn chưa làm hết các câu hỏi. Vẫn muốn nộp bài?');
      if (!confirmSubmit) return;
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setIsSubmitted(true);
    toast.success(`Đã nộp bài! Bạn làm đúng ${correctCount}/${questions.length} câu.`);
  };

  const handleRetake = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    loadQuestions(); // Load a new random set
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500 font-medium text-lg">Đang chuẩn bị đề luyện tập...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <h2 className="text-xl font-bold text-slate-700 mb-4">Chưa có câu hỏi cho chuyên đề này</h2>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-[#FE6747] text-white rounded-lg font-medium hover:bg-[#e5593c]">
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Quay lại Dashboard
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-800">Luyện tập: {tag}</h1>
            <p className="text-sm text-slate-500 mt-1">Đang làm {questions.length} câu hỏi ngẫu nhiên</p>
          </div>
        </div>

        {isSubmitted && (
          <Card className="mb-8 border-[#FE6747] bg-[#FE6747]/5">
            <CardContent className="py-6 flex flex-col items-center text-center">
              <h2 className="text-3xl font-black text-[#FE6747] mb-2">{score}/{questions.length}</h2>
              <p className="text-slate-700 font-medium mb-6">
                Tỷ lệ chính xác: {Math.round((score / questions.length) * 100)}%
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={handleRetake}
                  className="px-6 py-2 bg-white border border-[#FE6747] text-[#FE6747] font-bold rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Luyện tập tiếp (Đề mới)
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {questions.map((q, qIndex) => {
            const userAnswer = answers[qIndex];
            const isCorrect = isSubmitted ? userAnswer === q.correctOptionIndex : null;

            return (
              <Card key={qIndex} className={`border ${isSubmitted ? (isCorrect ? 'border-green-300 bg-green-50/30' : 'border-red-300 bg-red-50/30') : 'border-slate-200'}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      Câu {qIndex + 1}: <span className="font-semibold">{q.questionText}</span>
                    </h3>
                    {isSubmitted && (
                      <div className="shrink-0 ml-4">
                        {isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {q.imageUrl && (
                    <img src={q.imageUrl} alt="Minh họa" className="max-w-full h-auto max-h-[300px] object-contain mb-4 rounded-lg border border-slate-200" />
                  )}

                  <div className="space-y-3">
                    {q.options.map((opt, optIndex) => {
                      const isSelected = userAnswer === optIndex;
                      
                      let optionClass = "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ";
                      
                      if (!isSubmitted) {
                        optionClass += isSelected 
                          ? "border-[#FE6747] bg-[#FE6747]/10" 
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50";
                      } else {
                        if (optIndex === q.correctOptionIndex) {
                          optionClass += "border-green-500 bg-green-100 font-bold";
                        } else if (isSelected) {
                          optionClass += "border-red-500 bg-red-100";
                        } else {
                          optionClass += "border-slate-200 opacity-50";
                        }
                      }

                      return (
                        <div 
                          key={optIndex} 
                          className={optionClass}
                          onClick={() => handleSelectOption(qIndex, optIndex)}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected && !isSubmitted ? 'border-[#FE6747]' : 
                            (isSubmitted && optIndex === q.correctOptionIndex) ? 'border-green-600' :
                            (isSubmitted && isSelected) ? 'border-red-600' : 'border-slate-300'
                          }`}>
                            {isSelected && !isSubmitted && <div className="w-2.5 h-2.5 bg-[#FE6747] rounded-full" />}
                            {isSubmitted && optIndex === q.correctOptionIndex && <div className="w-2.5 h-2.5 bg-green-600 rounded-full" />}
                            {isSubmitted && isSelected && optIndex !== q.correctOptionIndex && <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />}
                          </div>
                          <span className={`${isSubmitted && optIndex === q.correctOptionIndex ? 'text-green-800' : (isSubmitted && isSelected ? 'text-red-800' : 'text-slate-700')}`}>
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!isSubmitted && questions.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSubmit}
              className="px-8 py-3 bg-[#FE6747] text-white font-bold rounded-xl shadow-lg hover:bg-[#e5593c] hover:shadow-xl transition-all hover:-translate-y-1"
            >
              Nộp bài
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
