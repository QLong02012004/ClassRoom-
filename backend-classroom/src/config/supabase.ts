import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_KEY trong file .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
