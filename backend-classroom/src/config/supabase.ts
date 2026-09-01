/**
 * ============================================================================
 * TÊN FILE: supabase.ts
 * ĐƯỜNG DẪN: backend-classroom/src/config/supabase.ts
 * MỤC ĐÍCH:
 *   Khởi tạo và xuất Supabase Client dùng cho dịch vụ lưu trữ đám mây (Cloud Storage Bucket `classroom-files`).
 *
 * CÁCH THỨC HOẠT ĐỘNG:
 *   - Nạp `SUPABASE_URL` và `SUPABASE_KEY` từ file `.env`.
 *   - Tạo instance `createClient()` phục vụ tải file đính kèm (ảnh, PDF, word, nộp bài).
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_KEY trong file .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
