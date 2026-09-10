const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client kết nối thành công!');
  } catch (err) {
    console.warn('⚠️ Kết nối Supabase thất bại:', err.message);
  }
} else {
  console.log('⚠️ Chưa cấu hình SUPABASE_URL / SUPABASE_ANON_KEY trong file .env');
}

module.exports = supabase;
