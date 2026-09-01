/**
 * ============================================================================
 * TÊN FILE: utils.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/lib/utils.ts
 * MỤC ĐÍCH:
 *   Cung cấp hàm tiện ích `cn()` ghép nối CSS Classnames động.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Sử dụng `clsx` xử lý biểu thức điều kiện class và `twMerge` gộp phẳng các class CSS bị trùng lặp.
 * ============================================================================
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCleanFileName(filename?: string, defaultExt: string = ""): string {
  if (!filename) return "Tài liệu đính kèm";

  // If it's a data base64 URL or contains raw base64 header
  if (filename.startsWith("data:") || filename.length > 100) {
    let ext = defaultExt;
    if (filename.includes("application/pdf") || filename.includes(".pdf")) ext = "pdf";
    else if (filename.includes("wordprocessingml") || filename.includes("msword") || filename.includes(".doc")) ext = "docx";
    else if (filename.includes("image/png")) ext = "png";
    else if (filename.includes("image/jpeg")) ext = "jpg";
    return `Tai_lieu_dinh_kem${ext ? `.${ext}` : ""}`;
  }

  let cleanName = filename.split('/').pop() || filename;
  cleanName = cleanName.split('?')[0];

  // Remove leading timestamps/hashes like 1723456789-
  cleanName = cleanName.replace(/^\d{10,}[-_]/, '');

  if (cleanName.length <= 26) return cleanName;

  const lastDotIndex = cleanName.lastIndexOf('.');
  if (lastDotIndex > 0 && lastDotIndex > cleanName.length - 8) {
    const ext = cleanName.substring(lastDotIndex);
    const base = cleanName.substring(0, lastDotIndex);
    return `${base.substring(0, 16)}...${ext}`;
  }

  return `${cleanName.substring(0, 24)}...`;
}
