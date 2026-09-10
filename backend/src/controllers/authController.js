const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

function checkSupabaseEnv(res) {
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({
      success: false,
      message: 'Chưa cấu hình SUPABASE_URL hoặc SUPABASE_ANON_KEY trong file .env của backend!'
    });
    return false;
  }
  return true;
}

// ─── Đăng nhập bằng Tên đăng nhập hoặc Email ──────────────────────────────────
async function login(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const { username, email, password } = req.body;
  const identity = (username || email || '').trim();

  if (!identity || !password)
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu!' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Tìm thông tin người dùng / học viên trong bảng students trên Supabase
  let student = null;
  try {
    const { data: stData } = await supabase
      .from('students')
      .select('*')
      .or(`username.eq.${identity},email.eq.${identity}`)
      .maybeSingle();

    if (stData) student = stData;
  } catch (e) {
    console.error('Lỗi tìm kiếm học viên trong Supabase:', e.message);
  }

  // Nếu trong bảng students có lưu password và trùng khớp
  if (student && student.password && student.password === password) {
    return res.json({
      success: true,
      message: 'Đăng nhập thành công từ Supabase!',
      data: {
        user: {
          id: student.id,
          username: student.username,
          email: student.email,
          full_name: student.full_name,
          role: student.role || 'student',
          avatar_url: student.avatar_url,
          cccd: student.cccd,
          course_name: student.course_name,
          progress: student.progress,
        },
        token: `supabase-token-${student.id}`,
      }
    });
  }

  // 2. Thử đăng nhập qua dịch vụ Supabase Auth bằng Email
  const targetEmail = student ? student.email : (identity.includes('@') ? identity : `${identity}@driveedu.vn`);
  const { data, error } = await supabase.auth.signInWithPassword({ email: targetEmail, password });

  if (error) {
    return res.status(401).json({
      success: false,
      message: 'Tài khoản hoặc mật khẩu không chính xác trong Supabase!'
    });
  }

  return res.json({
    success: true,
    message: 'Đăng nhập thành công từ Supabase Auth!',
    data: {
      user: {
        id: data.user.id,
        username: student?.username || data.user.user_metadata?.username || identity,
        email: data.user.email,
        full_name: student?.full_name || data.user.user_metadata?.full_name || 'Người dùng',
        role: student?.role || data.user.user_metadata?.role || 'admin',
        avatar_url: student?.avatar_url || data.user.user_metadata?.avatar_url,
      },
      token: data.session.access_token,
    }
  });
}

// ─── Đăng ký ─────────────────────────────────────────────────────────────────
async function register(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const { email, password, full_name, username } = req.body;
  if (!email || !password || !full_name)
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin!' });
  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự!' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Đăng ký tài khoản trên Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, username: username || email.split('@')[0], role: 'student' } }
  });

  if (error) return res.status(400).json({ success: false, message: error.message });

  // Tự động tạo bản ghi trong bảng students trên Supabase
  const newStudent = {
    full_name,
    username: username || email.split('@')[0],
    email,
    cccd: 'CCCD-' + Math.floor(Math.random() * 1000000000),
    role: 'student',
    status: 'active'
  };

  await supabase.from('students').insert([newStudent]);

  return res.json({
    success: true,
    message: 'Đăng ký tài khoản Supabase thành công!',
    data: { user: { id: data.user?.id, email: data.user?.email } }
  });
}

// ─── Đổi mật khẩu trên Supabase ──────────────────────────────────────────────
async function changePassword(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const { user_id, new_password } = req.body;
  if (!user_id || !new_password)
    return res.status(400).json({ success: false, message: 'Thiếu thông tin cần thiết!' });
  if (new_password.length < 6)
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(400).json({ success: false, message: 'Cần Token hoặc Service Role Key để cập nhật mật khẩu!' });

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { error } = await supabase.auth.updateUser({ password: new_password });
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, message: 'Đổi mật khẩu trên Supabase thành công!' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { password: new_password });
  if (error) return res.status(400).json({ success: false, message: error.message });

  return res.json({ success: true, message: 'Đổi mật khẩu trên Supabase thành công!' });
}

// ─── Cập nhật thông tin tài khoản trên Supabase ──────────────────────────────
async function updateProfile(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const { full_name, phone, avatar_url, dob, cccd, gender, workplace, address, bio, email: reqEmail } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  let targetEmail = reqEmail;
  if (token) {
    try {
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data: authData } = await userSupabase.auth.updateUser({
        data: { full_name, phone, avatar_url, gender, workplace, address, bio }
      });
      if (authData?.user?.email) {
        targetEmail = authData.user.email;
      }
    } catch (e) {
      console.log('Auth session skipped:', e.message);
    }
  }

  if (targetEmail) {
    const baseUpdate = { updated_at: new Date().toISOString() };
    if (full_name  !== undefined) baseUpdate.full_name  = full_name;
    if (phone      !== undefined) baseUpdate.phone      = phone;
    if (avatar_url !== undefined) baseUpdate.avatar_url = avatar_url;
    if (dob        !== undefined) baseUpdate.dob        = (dob && String(dob).trim() !== '') ? dob : null;
    if (cccd       !== undefined) baseUpdate.cccd       = cccd;

    const fullUpdate = { ...baseUpdate };
    if (gender    !== undefined) fullUpdate.gender    = gender;
    if (workplace !== undefined) fullUpdate.workplace = workplace;
    if (address   !== undefined) fullUpdate.address   = address;
    if (bio       !== undefined) fullUpdate.bio       = bio;

    let { error } = await supabase.from('students').update(fullUpdate).eq('email', targetEmail);

    if (error && error.message && (error.message.includes('Could not find column') || error.message.includes('schema'))) {
      await supabase.from('students').update(baseUpdate).eq('email', targetEmail);
    }
  }

  return res.json({ success: true, message: 'Cập nhật thông tin trên Supabase thành công!' });
}

// ─── Upload avatar lên Supabase Storage ──────────────────────────────────────
async function uploadAvatar(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { base64, fileName, mimeType } = req.body;

  if (!base64 || !fileName)
    return res.status(400).json({ success: false, message: 'Thiếu dữ liệu ảnh!' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer     = Buffer.from(base64Data, 'base64');
  const filePath   = `public/${Date.now()}_${fileName}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: mimeType || 'image/jpeg',
      upsert: true
    });

  if (error) return res.status(400).json({ success: false, message: error.message });

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return res.json({ success: true, data: { url: urlData.publicUrl } });
}

// ─── Lấy hồ sơ học viên theo email từ Supabase ────────────────────────────────
async function getMyStudentProfile(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: 'Thiếu email!' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !student) {
    return res.json({ success: true, data: null });
  }

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      enrolled_at,
      courses (
        id, name, code, license_tier, teacher_name, thumbnail_url, description,
        chapters ( id, title, order_index, min_completion_pct )
      )
    `)
    .eq('student_id', student.id);

  return res.json({
    success: true,
    data: {
      ...student,
      enrollments: (enrollments || []).map(e => ({
        enrolled_at: e.enrolled_at,
        course: {
          ...e.courses,
          total_chapters: (e.courses?.chapters || []).length
        }
      }))
    }
  });
}

module.exports = { login, register, changePassword, updateProfile, uploadAvatar, getMyStudentProfile };
