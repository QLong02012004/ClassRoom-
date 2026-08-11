import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FileText, FileXls, DownloadSimple, CheckCircle, Sparkle, Info } from 'phosphor-react';
import { PrimaryButton } from '@/components/ui/Buttons/PrimaryButton';
import * as XLSX from 'xlsx';

interface TemplateGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateGuideModal({ isOpen, onClose }: TemplateGuideModalProps) {

  const handleDownloadSampleExcel = () => {
    try {
      const data = [
        ["Nội dung câu hỏi", "Phương án A", "Phương án B", "Phương án C", "Phương án D", "Đáp án đúng"],
        ["Thủ đô của Việt Nam là gì?", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "B"],
        ["Phương trình x + 5 = 10 có nghiệm là?", "x = 3", "x = 5", "x = 10", "x = 0", "B"],
        ["Đơn vị đo cường độ dòng điện là gì?", "Volt", "Ampere", "Watt", "Ohm", "B"]
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Mau_De_Thi");
      XLSX.writeFile(workbook, "Mau_De_Thi_Trac_Nghiem.xlsx");
    } catch (e) {
      // Fallback using CSV UTF-8 with BOM signature (\uFEFF) to fix Vietnamese characters in standard Excel
      const csvContent = "\uFEFFNội dung câu hỏi,Phương án A,Phương án B,Phương án C,Phương án D,Đáp án đúng\n"
        + "Thủ đô của Việt Nam là gì?,TP. Hồ Chí Minh,Hà Nội,Đà Nẵng,Hải Phòng,B\n"
        + "Phương trình x + 5 = 10 có nghiệm là?,x = 3,x = 5,x = 10,x = 0,B\n"
        + "Đơn vị đo cường độ dòng điện là gì?,Volt,Ampere,Watt,Ohm,B";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "Mau_De_Thi_Trac_Nghiem.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadSampleWord = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "CẤU TRÚC ĐỀ THI TRẮC NGHIỆM MẪU (WORD .DOCX)",
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Câu 1: Thủ đô của Việt Nam là gì?",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { before: 120, after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "A. TP. Hồ Chí Minh", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "B. Hà Nội", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "C. Đà Nẵng", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "D. Hải Phòng", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Đáp án: B", bold: true, size: 24 }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Câu 2: Phương trình x + 5 = 10 có nghiệm là?",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { before: 120, after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "A. x = 3", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "B. x = 5", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "C. x = 10", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "D. x = 0", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Đáp án: B", bold: true, size: 24 }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Câu 3: Đơn vị đo cường độ dòng điện trong hệ SI là gì?",
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { before: 120, after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "A. Volt (V)", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "B. Ampere (A)", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "C. Watt (W)", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "D. Ohm (Ω)", size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Đáp án: B", bold: true, size: 24 }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Mau_De_Thi_Word.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error creating docx file", error);
      // Clean fallback if anything fails
      const textContent = `CẤU TRÚC ĐỀ THI TRẮC NGHIỆM MẪU (WORD .DOCX)

Câu 1: Thủ đô của Việt Nam là gì?
A. TP. Hồ Chí Minh
B. Hà Nội
C. Đà Nẵng
D. Hải Phòng
Đáp án: B

Câu 2: Phương trình x + 5 = 10 có nghiệm là?
A. x = 3
B. x = 5
C. x = 10
D. x = 0
Đáp án: B

Câu 3: Đơn vị đo cường độ dòng điện trong hệ SI là gì?
A. Volt (V)
B. Ampere (A)
C. Watt (W)
D. Ohm (Ω)
Đáp án: B
`;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Mau_De_Thi_Word.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white p-0 rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#f47c20] flex items-center justify-center">
              <Info size={22} weight="bold" />
            </div>
            Hướng dẫn Định dạng File Mẫu (Word & Excel)
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mt-1">
            Định dạng tệp đúng chuẩn giúp hệ thống bóc tách câu hỏi chính xác 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 text-sm">
          {/* PHẦN 1: FILE EXCEL (.XLSX) */}
          <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileXls size={24} className="text-emerald-600" weight="duotone" />
                <h4 className="font-bold text-slate-800 text-base">1. Định dạng File Excel (.xlsx / .xls)</h4>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleExcel}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <DownloadSimple size={14} weight="bold" /> Tải file Excel mẫu
              </button>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Trang tính Excel gồm <strong>6 cột</strong> tương ứng từ cột A đến cột F (dòng 1 là Tiêu đề cột):
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200">Cột A (Câu hỏi)</th>
                    <th className="p-2 border-r border-slate-200">Cột B (Đáp án A)</th>
                    <th className="p-2 border-r border-slate-200">Cột C (Đáp án B)</th>
                    <th className="p-2 border-r border-slate-200">Cột D (Đáp án C)</th>
                    <th className="p-2 border-r border-slate-200">Cột E (Đáp án D)</th>
                    <th className="p-2">Cột F (Đáp án đúng)</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 font-medium divide-y divide-slate-100">
                  <tr>
                    <td className="p-2 border-r border-slate-100">Thủ đô của Việt Nam là gì?</td>
                    <td className="p-2 border-r border-slate-100">TP. Hồ Chí Minh</td>
                    <td className="p-2 border-r border-slate-100">Hà Nội</td>
                    <td className="p-2 border-r border-slate-100">Đà Nẵng</td>
                    <td className="p-2 border-r border-slate-100">Hải Phòng</td>
                    <td className="p-2 font-bold text-emerald-600">B</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PHẦN 2: FILE WORD (.DOCX) */}
          <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={24} className="text-blue-600" weight="duotone" />
                <h4 className="font-bold text-slate-800 text-base">2. Định dạng File Word (.docx)</h4>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleWord}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <DownloadSimple size={14} weight="bold" /> Tải file Word mẫu
              </button>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              File Word soạn theo cấu trúc câu hỏi rõ ràng. Mỗi câu hỏi gồm tên <strong>Câu [X]:</strong>, các lựa chọn <strong>A. B. C. D.</strong> và dòng <strong>Đáp án: [Chữ cái]</strong>:
            </p>

            <div className="bg-white border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-700 leading-relaxed shadow-xs">
              <p><strong className="text-blue-600">Câu 1:</strong> Thủ đô của Việt Nam là gì?</p>
              <p className="pl-3">A. TP. Hồ Chí Minh</p>
              <p className="pl-3">B. Hà Nội</p>
              <p className="pl-3">C. Đà Nẵng</p>
              <p className="pl-3">D. Hải Phòng</p>
              <p className="font-bold text-emerald-600 pl-3 mt-1">Đáp án: B</p>
            </div>

            <div className="flex items-center gap-2 text-xs bg-orange-50 text-orange-800 p-2.5 rounded-lg border border-orange-200">
              <Sparkle size={18} className="text-orange-500 flex-shrink-0" weight="fill" />
              <span><strong>Mẹo AI Gemini:</strong> Nếu dùng nút <strong>"Tạo đề bằng AI"</strong>, bạn chỉ cần upload file Word bài giảng lý thuyết bất kỳ, AI sẽ tự suy luận và tự tạo bộ câu hỏi trắc nghiệm cho bạn mà không cần định dạng thủ công!</span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 px-6 border-t border-slate-100 bg-slate-50/50">
          <PrimaryButton variant="solid" onClick={onClose} className="bg-[#f47c20] hover:bg-[#e06d15] text-white px-6 font-bold">
            Đã hiểu
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
