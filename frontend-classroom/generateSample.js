import * as XLSX from "xlsx";
import * as fs from "fs";

// Dữ liệu mẫu
const data = [
  ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Đáp án đúng"],
  ["Thủ đô của Việt Nam là gì?", "Đà Nẵng", "Hà Nội", "TP.HCM", "Hải Phòng", "B"],
  ["Năm 1911, Bác Hồ ra đi tìm đường cứu nước tại bến cảng nào?", "Nhà Rồng", "Hải Phòng", "Đà Nẵng", "Nha Trang", "A"],
  ["Ai là người phát minh ra bóng đèn sợi đốt?", "Albert Einstein", "Isaac Newton", "Thomas Edison", "Nikola Tesla", "C"],
  ["Đỉnh núi cao nhất Việt Nam là?", "Phan Xi Păng", "Lang Biang", "Bà Đen", "Hàm Lợn", "1"],
  ["Chất nào sau đây chiếm tỉ lệ thể tích lớn nhất trong không khí?", "Oxy", "Carbon Dioxide", "Nitơ", "Khí hiếm", "C"]
];

// Tạo workbook và worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Thiết lập độ rộng cột cho đẹp
ws["!cols"] = [
  { wch: 60 }, // Câu hỏi
  { wch: 20 }, // Đáp án A
  { wch: 20 }, // Đáp án B
  { wch: 20 }, // Đáp án C
  { wch: 20 }, // Đáp án D
  { wch: 15 }, // Đáp án đúng
];

// Thêm sheet vào workbook
XLSX.utils.book_append_sheet(wb, ws, "DanhSachCauHoi");

// Lưu ra file
XLSX.writeFile(wb, "Mau_De_Thi_Trac_Nghiem.xlsx");

console.log("Đã tạo file Mau_De_Thi_Trac_Nghiem.xlsx thành công!");
