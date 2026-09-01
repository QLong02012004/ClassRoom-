/**
 * ============================================================================
 * TÊN FILE: downloadHelper.ts
 * ĐƯỜNG DẪN: frontend-classroom/src/utils/downloadHelper.ts
 * MỤC ĐÍCH:
 *   Tiện ích hỗ trợ tải và xem tập tin đính kèm mượt mà (`handleDownloadOrOpenFile`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Chuyển đổi dữ liệu Base64 Data URL sang Blob URL.
 *   - Mở tệp trực tiếp trong tab mới trình duyệt để xem tài liệu PDF/Hình ảnh hoặc tải về mà không bị trình duyệt Chrome chặn CORS cross-origin.
 * ============================================================================
 */

export const handleDownloadOrOpenFile = async (fileUrl: string, fileName: string) => {
  if (!fileUrl) {
    console.warn("[Download Helper] ⚠️ No file URL provided.");
    alert("Không tìm thấy đường dẫn file đính kèm!");
    return;
  }

  console.log(`[Download Helper] 🚀 Opening file: "${fileName}"`, { url: fileUrl.substring(0, 100) });

  // 1. Handle Base64 Data URLs (convert to Blob & open directly in a new tab)
  if (fileUrl.startsWith("data:")) {
    try {
      console.log(`[Download Helper] 📦 Converting Base64 Data URL to Blob...`);
      const parts = fileUrl.split(",");
      if (parts.length > 1) {
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);

        // Open directly in a new tab for native viewing & saving
        const win = window.open(blobUrl, "_blank");
        if (!win || win.closed || typeof win.closed === "undefined") {
          // If popup blocker triggers, open in current window or prompt
          const link = document.createElement("a");
          link.href = blobUrl;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        console.log(`[Download Helper] ✅ Base64 file opened in new tab: "${fileName}"`);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
        return;
      }
    } catch (e) {
      console.error("[Download Helper] ❌ Failed to parse data URL into blob:", e);
      alert("Lỗi khi mở dữ liệu file Base64!");
    }
  }

  // 2. Handle Blob URLs & HTTP URLs
  console.log(`[Download Helper] 🌐 Opening file URL in new tab: ${fileUrl}`);
  window.open(fileUrl, "_blank", "noopener,noreferrer");
};
