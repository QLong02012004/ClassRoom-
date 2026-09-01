/**
 * ============================================================================
 * TÊN FILE: main.tsx
 * ĐƯỜNG DẪN: frontend-classroom/src/main.tsx
 * MỤC ĐÍCH:
 *   Điểm khởi chạy chính (Frontend Entry Point) gắn ứng dụng React vào DOM element `#root`.
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Nạp style toàn cục `index.css` và dữ liệu giả lập `mockDb.ts`.
 *   - Bắt và ngăn chặn các lỗi unhandled rejection do tiện ích mở rộng trình duyệt (IDM 200.js) gây ra.
 *   - Khởi tạo React App trong `StrictMode`.
 * ============================================================================
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/mockDb.ts'
import App from './App.tsx'

// Intercept & suppress third-party extension errors (e.g., IDM 200.js M_ID errors)
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const msg = reason?.message || String(reason || "");
  const stack = reason?.stack || "";
  if (msg.includes("M_ID") || stack.includes("200.js")) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
