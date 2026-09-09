const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client đã kết nối thành công!');
  } catch (err) {
    console.warn('⚠️ Kết nối Supabase thất bại, sử dụng fallback memory DB:', err.message);
  }
} else {
  console.log('ℹ️ Chưa cấu hình SUPABASE_URL / SUPABASE_ANON_KEY. Đang dùng bộ nhớ tạm Backend.');
}

module.exports = supabase;
