/**
 * ============================================================================
 * TÊN FILE: scoreFormatter.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/utils/scoreFormatter.ts
 * MỤC ĐÍCH:
 *   Chuẩn hóa và kiểm tra định dạng điểm số bắt buộc từ 00.00 đến 10.00
 *   - Luôn hiển thị đủ 4 số: 2 số phần nguyên, dấu chấm '.', 2 số phần thập phân (XX.XX).
 *   - Thang điểm chuẩn: 00.00 <= Điểm <= 10.00.
 * ============================================================================
 */

/**
 * Định dạng điểm số thành chuỗi 4 chữ số XX.XX (từ 00.00 đến 10.00)
 * Ví dụ:
 *  - 10 -> "10.00"
 *  - 9.5 -> "09.50"
 *  - 8 -> "08.00"
 *  - 7.25 -> "07.25"
 *  - 0 -> "00.00"
 *  - 0.5 -> "00.50"
 *
 * @param val Giá trị điểm (number, string, null, undefined)
 * @returns Chuỗi định dạng chuẩn XX.XX
 */
export const format4DigitScore = (val: number | string | undefined | null): string => {
  if (val === "" || val === undefined || val === null) return "00.00";
  const str = String(val).replace(/,/g, ".").trim();
  const num = parseFloat(str);
  if (isNaN(num)) return "00.00";

  // Làm tròn tới 2 chữ số thập phân
  const rounded = Math.round(num * 100) / 100;
  // Giới hạn trong khoảng 00.00 đến 10.00
  const clamped = Math.min(10, Math.max(0, rounded));

  const intPart = Math.floor(clamped).toString().padStart(2, "0");
  const decPart = Math.round((clamped - Math.floor(clamped)) * 100)
    .toString()
    .padStart(2, "0");

  return `${intPart}.${decPart}`;
};

/**
 * Kiểm tra xem một chuỗi có phải là điểm hợp lệ (từ 00.00 đến 10.00) hay không
 */
export const isValidScore = (val: number | string): boolean => {
  if (val === "" || val === undefined || val === null) return false;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, "."));
  return !isNaN(num) && num >= 0 && num <= 10;
};
