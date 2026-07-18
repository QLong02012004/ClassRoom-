import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, BookOpen } from 'lucide-react';

interface Weakness {
  tag: string;
  total: number;
  wrong: number;
  errorRate: number;
}

interface WeaknessRadarProps {
  data: Weakness[];
  onPracticeClick: (tag: string) => void;
}

export const WeaknessRadar: React.FC<WeaknessRadarProps> = ({ data, onPracticeClick }) => {
  return (
    <Card className="border-[#ffebeb] bg-gradient-to-br from-white to-[#fff5f5] shadow-sm">
      <CardHeader className="pb-3 border-b border-[#ffebeb]">
        <CardTitle className="text-red-600 flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5" />
          Vùng kiến thức cần ôn khẩn cấp
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#ffebeb] hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">{item.tag}</span>
                    <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Lỗi sai {item.errorRate}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Sai {item.wrong}/{item.total} câu trong các bài đã làm</p>
                </div>
                <button 
                  onClick={() => onPracticeClick(item.tag)}
                  className="shrink-0 flex items-center justify-center gap-2 bg-[#FE6747] hover:bg-[#e5593c] text-white px-4 py-2 rounded-lg text-sm font-medium transition-transform hover:scale-105 active:scale-95 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Luyện tập ngay
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🎉</span>
            </div>
            <h4 className="font-semibold text-gray-800">Tuyệt vời!</h4>
            <p className="text-sm text-gray-500 max-w-[250px] mt-1">
              Bạn chưa có vùng kiến thức nào bị hổng nặng. Hãy tiếp tục phát huy nhé!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
