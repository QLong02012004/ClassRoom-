import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Users } from 'lucide-react';
import { analyticsService } from '@/service/analytics.service';
import { useToast } from '@/components/Styles/ToastContext';

interface ErrorInsight {
  questionIndex: number;
  questionText: string;
  tags: string[];
  errorRate: number;
  totalStudents: number;
  wrongCount: number;
  correctOptionIndex: number;
  optionsDistribution: {
    optionIndex: number;
    optionText: string;
    count: number;
    isCorrect: boolean;
  }[];
}

interface ClassErrorInsightsProps {
  activityId: string;
}

export const ClassErrorInsights: React.FC<ClassErrorInsightsProps> = ({ activityId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ErrorInsight[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (activityId) {
      loadInsights();
    }
  }, [activityId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getClassErrorInsights(activityId);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải phân tích lỗi sai');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Đang phân tích dữ liệu lỗi sai...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center">
        <h4 className="text-lg font-bold text-slate-700 mb-2">Chưa có đủ dữ liệu</h4>
        <p className="text-slate-500 text-sm">Cần thêm học sinh làm bài để hệ thống có thể phân tích điểm mù kiến thức.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start shadow-sm">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="font-bold text-amber-800 text-sm mb-1">Cảnh báo điểm mù kiến thức</h4>
          <p className="text-amber-700 text-xs leading-relaxed">
            Hệ thống phát hiện các câu hỏi sau có tỷ lệ làm sai cao. Giáo viên nên dành 10-15 phút đầu giờ để chữa kỹ các lỗi tư duy phổ biến này.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item, idx) => {
          const chartData = item.optionsDistribution.map(opt => ({
            name: `Đáp án ${String.fromCharCode(65 + opt.optionIndex)}`,
            count: opt.count,
            isCorrect: opt.isCorrect,
            text: opt.optionText
          }));

          return (
            <Card key={idx} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Câu {item.questionIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded border border-red-200">
                    Sai {item.errorRate}%
                  </span>
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800 line-clamp-2 mt-2 leading-relaxed" title={item.questionText}>
                  {item.questionText}
                </CardTitle>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-medium bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {item.wrongCount}/{item.totalStudents} em chọn sai
                  </span>
                </div>
                
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <RechartsTooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white p-2 border border-slate-200 shadow-md rounded text-xs max-w-[200px]">
                                <div className="font-bold mb-1">{d.name} {d.isCorrect ? '(Đúng)' : '(Sai)'}</div>
                                <div className="text-slate-600 break-words line-clamp-3">{d.text}</div>
                                <div className="mt-1 font-semibold text-slate-800">Chọn: {d.count} hs</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isCorrect ? '#10b981' : '#f43f5e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
