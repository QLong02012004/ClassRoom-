export const formatFileUrl = (url: string): string => {
  if (!url) return "";
  let clean = url;
  if (clean.startsWith("data:")) {
    return clean.replace(/;name=[^;]+/, "");
  }
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("blob:")) {
    return clean;
  }
  const backendUrl = (
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(/\/api\/v1\/?$/, "");
  const cleanPath = clean.startsWith("/") ? clean : `/${clean}`;
  return `${backendUrl}${cleanPath}`;
};

export const getFileExt = (filename: string = ""): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
};

export const formatFileSize = (bytes?: any): string | null => {
  if (bytes === undefined || bytes === null || bytes === "") return null;
  if (typeof bytes === "string") {
    const trimmed = bytes.trim();
    if (/[a-zA-Z]+$/.test(trimmed)) return trimmed;
  }
  const num = typeof bytes === "number" ? bytes : parseFloat(String(bytes));
  if (isNaN(num) || num <= 0) return null;
  if (num < 1024) return num + " B";
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + " KB";
  return (num / (1024 * 1024)).toFixed(1) + " MB";
};

export const preparePdfUrl = (url: string): string => {
  if (!url) return "";
  return formatFileUrl(url);
};

export const formatCleanFileName = (rawName?: string, rawUrl?: string): string => {
  let name = rawName || "";
  if (!name && rawUrl) {
    try {
      const parts = rawUrl.split("/");
      name = decodeURIComponent(parts[parts.length - 1] || "file");
    } catch {
      name = "file";
    }
  }

  if (name.startsWith("data:") || name.length > 80 || (rawUrl && rawUrl.length > 200 && name.length > 50)) {
    let ext = getFileExt(name) || getFileExt(rawUrl || "");
    if (!ext) {
      if ((rawUrl || name).includes("pdf")) ext = "pdf";
      else if ((rawUrl || name).includes("word") || (rawUrl || name).includes("doc")) ext = "docx";
    }
    return `Tai_lieu_dinh_kem${ext ? `.${ext}` : ""}`;
  }

  if (/^\d{8,}_[0-9a-zA-Z]{5,}_/.test(name)) {
    name = name.replace(/^\d{8,}_[0-9a-zA-Z]{5,}_/, "");
  } else if (/^\d{10,}[-_]/.test(name)) {
    name = name.replace(/^\d{10,}[-_]/, "");
  }

  if (name.length > 28) {
    const ext = getFileExt(name);
    const base = name.substring(0, name.lastIndexOf(".")) || name;
    return base.substring(0, 16) + "..." + (ext ? `.${ext}` : "");
  }
  return name || "File_dinh_kem";
};

export const parseSmartScore = (rawInput: string | number, maxScore: number = 10): string => {
  let val = String(rawInput ?? "").replace(",", ".").trim();
  if (val === "" || val === "0" || val === "0.00" || val === "0.0") return "0.00";

  if (val.includes(".")) {
    const num = parseFloat(val);
    if (isNaN(num)) return "0.00";
    const clamped = Math.min(maxScore, Math.max(0, num));
    return clamped.toFixed(2);
  }

  const digits = val.replace(/\D/g, "");
  if (!digits) return "0.00";
  const num = parseInt(digits, 10);
  if (isNaN(num) || num === 0) return "0.00";

  let result = num;
  if (num > maxScore) {
    if (num <= maxScore * 10) {
      result = num / 10;
    } else if (num <= maxScore * 100) {
      result = num / 100;
    } else {
      result = maxScore;
    }
  }

  const clamped = Math.min(maxScore, Math.max(0, result));
  return clamped.toFixed(2);
};

export const formatFileName = (filename: string = ""): string => {
  return formatCleanFileName(filename);
};

export const exportAssignmentToExcel = (
  selectedAssignment: any,
  assignmentSubmissions: any[],
  gradingData: Record<string, { score: number | string; feedback: string }> = {}
) => {
  import("xlsx").then((XLSX) => {
    const rows = assignmentSubmissions.map((sub: any, idx: number) => {
      const studentObj = typeof sub.studentId === "object" ? sub.studentId : { _id: sub.studentId, name: "Học sinh", email: "" };
      const studentIdStr = studentObj._id;
      const scoreData = gradingData[studentIdStr];
      const score = scoreData?.score !== undefined && scoreData?.score !== ""
        ? scoreData.score
        : (sub.grade !== undefined && sub.grade !== null ? sub.grade : "Chưa có");
      const feedback = scoreData?.feedback ?? sub.feedback ?? "";

      let statusText = "Chưa nộp";
      if (sub.status === "graded") statusText = "Đã chấm điểm";
      else if (sub.status === "submitted") statusText = "Đã nộp bài";
      else if (sub.status === "late") statusText = "Nộp muộn";

      return {
        "STT": idx + 1,
        "Họ và tên": studentObj.name || "N/A",
        "Email": studentObj.email || "N/A",
        "Trạng thái": statusText,
        "Thời gian nộp bài": sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("vi-VN") : "Chưa nộp",
        "Ghi chú nộp bài": sub.submissionText || "",
        "Số file đính kèm": sub.attachments?.length || 0,
        "Điểm số": score,
        "Nhận xét của Giáo viên": feedback,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 28 },
      { wch: 16 },
      { wch: 22 },
      { wch: 30 },
      { wch: 16 },
      { wch: 12 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng điểm");

    const rawTitle = selectedAssignment?.title || "BaiTap";
    const sanitizedTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "_");
    const fileName = `BangDiem_${sanitizedTitle}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  });
};

