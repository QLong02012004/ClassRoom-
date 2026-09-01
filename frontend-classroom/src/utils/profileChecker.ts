/**
 * ============================================================================
 * TÊN FILE: profileChecker.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/utils/profileChecker.ts
 * MỤC ĐÍCH:
 *   Tiện ích kiểm tra độ hoàn thiện Hồ sơ Cá nhân của Giáo viên (`checkTeacherProfileComplete`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Kiểm tra các trường thông tin bắt buộc: Giới tính, Ngày sinh, SĐT/Zalo, Bằng cấp/Trình độ, Môn học giảng dạy.
 *   - Trả về đối tượng `ProfileCheckResult` (isComplete, missingFields).
 * ============================================================================
 */

export interface ProfileCheckResult {
  isComplete: boolean;
  missingFields: string[];
}

export const checkTeacherProfileComplete = (user: any): ProfileCheckResult => {
  if (!user || user.role !== 'teacher') {
    return { isComplete: true, missingFields: [] };
  }

  const missingFields: string[] = [];

  if (!user.gender || !user.gender.trim()) {
    missingFields.push("Giới tính");
  }
  if (!user.dob || !user.dob.trim()) {
    missingFields.push("Ngày sinh");
  }
  if (!user.phone || !user.phone.trim()) {
    missingFields.push("Số điện thoại / Zalo");
  }
  if (!user.degree || !user.degree.trim()) {
    missingFields.push("Bằng cấp / Trình độ chuyên môn");
  }
  if (!user.subject || !user.subject.trim()) {
    missingFields.push("Môn học chuyên môn");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
};
