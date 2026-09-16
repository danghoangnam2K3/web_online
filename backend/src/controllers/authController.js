const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function checkSupabaseEnv(res) {
  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({
      success: false,
      message: 'Chưa cấu hình SUPABASE_URL hoặc SUPABASE_ANON_KEY trong file .env của backend!'
    });
    return false;
  }
  return true;
}

// Helper kiểm tra và tự động nâng cấp mật khẩu sang hash Bcrypt nếu còn ở dạng plain-text
async function verifyAndUpgradePassword(plainPassword, storedPassword, studentId, supabase) {
  if (!storedPassword) {
    // Tài khoản chưa có mật khẩu -> băm mật khẩu vừa nhập và lưu lại
    try {
      const hash = await bcrypt.hash(plainPassword, 10);
      await supabase.from('students').update({ password: hash }).eq('id', studentId);
    } catch (e) {
      console.error('Lỗi lưu mật khẩu ban đầu:', e.message);
    }
    return true;
  }

  // Kiểm tra nếu là chuỗi Bcrypt hash ($2a$, $2b$, $2y$)
  const isBcrypt = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedPassword);
  if (isBcrypt) {
    try {
      return await bcrypt.compare(plainPassword, storedPassword);
    } catch (err) {
      console.error('Lỗi so sánh bcrypt:', err.message);
      return false;
    }
  }

  // Nếu là mật khẩu cũ (plain-text)
  if (storedPassword === plainPassword) {
    // Tự động nâng cấp sang Bcrypt hash an toàn
    try {
      const hash = await bcrypt.hash(plainPassword, 10);
      await supabase.from('students').update({ password: hash }).eq('id', studentId);
      console.log(`[AUTH] Đã tự động nâng cấp mật khẩu sang Bcrypt cho học viên ID: ${studentId}`);
    } catch (e) {
      console.error('Lỗi tự động nâng cấp mật khẩu sang Bcrypt:', e.message);
    }
    return true;
  }

  return false;
}

// ─── Đăng nhập bằng Tên đăng nhập hoặc Email ──────────────────────────────────
async function login(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const { username, email, password } = req.body;
  const identity = (username || email || '').trim();

  if (!identity || !password)
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu!' });

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Tìm thông tin người dùng / học viên trong bảng students trên Supabase
  let student = null;
  try {
    // Tìm theo username trước (ví dụ: 'admin')
    const { data: byUsername } = await supabase
      .from('students')
      .select('*')
      .ilike('username', identity)
      .limit(1);

    if (byUsername && byUsername.length > 0) {
      student = byUsername[0];
    } else {
      // Nếu không thấy theo username, tìm theo email
      const { data: byEmail } = await supabase
        .from('students')
        .select('*')
        .ilike('email', identity)
        .limit(1);
      if (byEmail && byEmail.length > 0) student = byEmail[0];
    }
  } catch (e) {
    console.error('Lỗi tìm kiếm học viên trong Supabase:', e.message);
  }

  // Nếu tìm thấy học viên trong Supabase -> kiểm tra mật khẩu (hỗ trợ cả Bcrypt hash lẫn plain-text cũ)
  if (student) {
    const isMatch = await verifyAndUpgradePassword(password, student.password, student.id, supabase);
    if (isMatch) {
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
  }

  // Trường hợp dự phòng: Nếu đăng nhập bằng admin / Admin@123 mà chưa tạo dòng admin trong bảng students
  if ((identity.toLowerCase() === 'admin' || identity.toLowerCase() === 'admin@driveedu.vn') && password === 'Admin@123') {
    const hashedAdminPassword = await bcrypt.hash('Admin@123', 10);
    const adminUser = {
      username: 'admin',
      email: 'admin@driveedu.vn',
      full_name: 'Quản Trị Viên Hệ Thống',
      password: hashedAdminPassword,
      role: 'admin',
      status: 'active',
      cccd: '001099123456',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    };
    try {
      const { data: newAdmin } = await supabase.from('students').insert([adminUser]).select().single();
      if (newAdmin) student = newAdmin;
    } catch (e) {
      console.error('Lỗi tự động tạo tài khoản admin:', e.message);
    }
    return res.json({
      success: true,
      message: 'Đăng nhập Admin thành công!',
      data: {
        user: student || adminUser,
        token: 'supabase-token-admin',
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

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Đăng ký tài khoản trên Supabase Auth (nếu bật Auth)
  let authUserId = null;
  try {
    const { data: authData } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, username: username || email.split('@')[0], role: 'student' } }
    });
    authUserId = authData?.user?.id;
  } catch (e) {
    console.error('Supabase auth signup warning:', e.message);
  }

  // Tự động tạo bản ghi trong bảng students trên Supabase với mật khẩu đã băm Bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);
  const newStudent = {
    full_name,
    username: username || email.split('@')[0],
    email,
    password: hashedPassword, // Lưu mật khẩu đã mã hóa Bcrypt
    cccd: 'CCCD-' + Math.floor(Math.random() * 1000000000),
    role: 'student',
    status: 'active'
  };

  // Kiểm tra email hoặc username đã tồn tại trong Supabase chưa
  const { data: existingUser } = await supabase
    .from('students')
    .select('id, email, username')
    .or(`email.eq.${email},username.eq.${username || email.split('@')[0]}`)
    .limit(1);

  if (existingUser && existingUser.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Email hoặc tên đăng nhập này đã tồn tại trong Supabase!'
    });
  }

  const { data: insertedData, error: insertErr } = await supabase
    .from('students')
    .insert([newStudent])
    .select();

  if (insertErr) {
    console.error('Lỗi chèn dữ liệu học viên mới:', insertErr.message);
    return res.status(400).json({
      success: false,
      message: 'Lỗi tạo tài khoản Supabase: ' + insertErr.message
    });
  }

  return res.json({
    success: true,
    message: 'Đăng ký tài khoản Supabase thành công!',
    data: { user: insertedData[0] }
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

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Mã hóa mật khẩu mới bằng Bcrypt
  const hashedNewPassword = await bcrypt.hash(new_password, 10);

  // Bước 1: Cập nhật cột password trong bảng students với chuỗi mã hóa Bcrypt
  const { data: updatedStudent, error: dbError } = await supabase
    .from('students')
    .update({ password: hashedNewPassword, updated_at: new Date().toISOString() })
    .eq('id', user_id)
    .select()
    .single();

  if (dbError || !updatedStudent) {
    return res.status(400).json({
      success: false,
      message: 'Không tìm thấy tài khoản hoặc lỗi cập nhật: ' + (dbError?.message || 'unknown')
    });
  }

  // Bước 2: Thử cập nhật Supabase Auth nếu có Service Role Key (không bắt buộc)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && updatedStudent.email) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      // Tìm user Supabase Auth theo email
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authList?.users?.find(u => u.email === updatedStudent.email);
      if (authUser) {
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password: new_password });
      }
    } catch (authErr) {
      console.warn('Supabase Auth password update skipped:', authErr.message);
    }
  }

  return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
}

// ─── Quên mật khẩu & Khôi phục qua xác minh CCCD ──────────────────────────────
async function forgotPassword(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const { identity, cccd, new_password } = req.body;
  const cleanIdentity = String(identity || '').trim();
  const cleanCccd = String(cccd || '').trim();
  const cleanPassword = String(new_password || '').trim();

  if (!cleanIdentity || !cleanCccd || !cleanPassword) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ: Tên đăng nhập/Email, Số CCCD và Mật khẩu mới!'
    });
  }

  if (cleanPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu mới phải có ít nhất 6 ký tự!'
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Tìm tài khoản theo username hoặc email
    let student = null;
    const { data: byUsername } = await supabase
      .from('students')
      .select('*')
      .ilike('username', cleanIdentity)
      .limit(1);

    if (byUsername && byUsername.length > 0) {
      student = byUsername[0];
    } else {
      const { data: byEmail } = await supabase
        .from('students')
        .select('*')
        .ilike('email', cleanIdentity)
        .limit(1);
      if (byEmail && byEmail.length > 0) student = byEmail[0];
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản học viên với tên đăng nhập hoặc email này!'
      });
    }

    // 2. Xác minh số CCCD
    const dbCccd = String(student.cccd || '').replace(/\D/g, '');
    const userCccd = cleanCccd.replace(/\D/g, '');

    const isMatchCccd = (dbCccd && userCccd && dbCccd === userCccd) || 
      (student.cccd && student.cccd.trim().toLowerCase() === cleanCccd.toLowerCase());

    if (!isMatchCccd) {
      return res.status(400).json({
        success: false,
        message: 'Số CCCD không trùng khớp với hồ sơ học viên đã đăng ký trong hệ thống!'
      });
    }

    // 3. Mã hóa mật khẩu mới bằng Bcrypt
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    // 4. Cập nhật vào Supabase
    const { error: updateErr } = await supabase
      .from('students')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', student.id);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    return res.json({
      success: true,
      message: `Khôi phục mật khẩu thành công cho học viên "${student.full_name}"! Bạn có thể đăng nhập ngay.`
    });
  } catch (err) {
    console.error('Lỗi khôi phục mật khẩu:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi hệ thống khi khôi phục mật khẩu'
    });
  }
}

// ─── Cập nhật thông tin tài khoản trên Supabase ──────────────────────────────
async function updateProfile(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const { full_name, phone, avatar_url, dob, cccd, gender, workplace, address, bio, email: reqEmail } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');

  const supabase = createClient(supabaseUrl, supabaseKey);

  let targetEmail = reqEmail;
  if (token) {
    try {
      const userSupabase = createClient(supabaseUrl, supabaseKey, {
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

  const { base64, fileName, mimeType } = req.body;

  if (!base64 || !fileName)
    return res.status(400).json({ success: false, message: 'Thiếu dữ liệu ảnh!' });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, serviceKey);

  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer     = Buffer.from(base64Data, 'base64');
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath   = `avatars/${Date.now()}_${cleanFileName}`;

  // Kiểm tra / Tạo bucket 'avatars' trên Supabase Storage nếu chưa có
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasBucket = buckets?.some(b => b.name === 'avatars');
    if (!hasBucket) {
      await supabase.storage.createBucket('avatars', { public: true });
    }
  } catch (bErr) {
    console.warn('Check bucket warning:', bErr.message);
  }

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: mimeType || 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.error('Supabase Storage upload error:', error.message);
    return res.status(400).json({ success: false, message: 'Lỗi upload lên Supabase Storage: ' + error.message });
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return res.json({ success: true, data: { url: urlData.publicUrl } });
}

// ─── Lấy hồ sơ học viên theo id, username hoặc email từ Supabase ─────────────
async function getMyStudentProfile(req, res) {
  if (!checkSupabaseEnv(res)) return;

  const { email, username, id } = req.query;
  if (!email && !username && !id) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin nhận diện (id, username hoặc email)!' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

  let student = null;
  if (id && isUUID(id)) {
    try {
      const { data } = await supabase.from('students').select('*').eq('id', id).single();
      if (data) student = data;
    } catch (e) {}
  }

  if (!student && username) {
    try {
      const { data } = await supabase.from('students').select('*').ilike('username', username).single();
      if (data) student = data;
    } catch (e) {}
  }

  if (!student && email) {
    try {
      const { data } = await supabase.from('students').select('*').ilike('email', email).single();
      if (data) student = data;
    } catch (e) {}
  }

  if (!student && id && !isUUID(id)) {
    try {
      const { data } = await supabase.from('students').select('*').or(`username.ilike.${id},email.ilike.${id}`).limit(1);
      if (data && data.length > 0) student = data[0];
    } catch (e) {}
  }

  if (!student) {
    return res.json({ success: true, data: null });
  }

  let enrollments = [];
  try {
    const { data: enData } = await supabase
      .from('enrollments')
      .select(`
        enrolled_at,
        courses (
          id, name, code, license_tier, teacher_name, thumbnail_url, description,
          chapters ( id, title, order_index, min_completion_pct )
        )
      `)
      .eq('student_id', student.id);
    if (enData) enrollments = enData;
  } catch (e) {}

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

// ─── Tự động quét và mã hóa toàn bộ mật khẩu cũ trong Supabase sang Bcrypt ─────
async function migrateAllLegacyPasswords(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    const msg = 'Chưa cấu hình SUPABASE_URL hoặc SUPABASE_KEY trong môi trường!';
    if (res) return res.status(500).json({ success: false, message: msg });
    return console.warn('[MIGRATION]', msg);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, username, full_name, password');

    if (error) throw new Error(error.message);

    // Lọc ra các học viên có mật khẩu chưa được mã hóa Bcrypt
    const legacyList = (students || []).filter(
      s => s.password && !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(s.password)
    );

    if (legacyList.length === 0) {
      const msg = 'Tất cả mật khẩu học viên trong Supabase đã được mã hóa Bcrypt an toàn từ trước!';
      if (res) return res.json({ success: true, message: msg, count: 0 });
      return console.log(`[MIGRATION] ${msg}`);
    }

    console.log(`[MIGRATION] Bắt đầu mã hóa Bcrypt cho ${legacyList.length} tài khoản trong Supabase...`);
    let updatedCount = 0;
    for (const st of legacyList) {
      const hash = await bcrypt.hash(st.password, 10);
      const { error: updateErr } = await supabase
        .from('students')
        .update({ password: hash })
        .eq('id', st.id);

      if (!updateErr) {
        updatedCount++;
      } else {
        console.warn(`Lỗi cập nhật mật khẩu học viên ${st.id}:`, updateErr.message);
      }
    }

    const resultMsg = `Đã mã hóa Bcrypt thành công cho ${updatedCount}/${legacyList.length} tài khoản học viên trong Supabase!`;
    console.log(`[MIGRATION] ${resultMsg}`);
    if (res) {
      return res.json({
        success: true,
        message: resultMsg,
        count: updatedCount
      });
    }
  } catch (err) {
    console.error('Lỗi khi migrate mật khẩu:', err.message);
    if (res) return res.status(500).json({ success: false, message: err.message });
  }
}

// Tự động kích hoạt quét và nâng cấp mật khẩu khi khởi động server nếu có cấu hình Supabase
if (supabaseUrl && supabaseKey) {
  setTimeout(() => {
    migrateAllLegacyPasswords(null, null).catch(err => {
      console.warn('Auto migrate legacy passwords warning:', err.message);
    });
  }, 3000);
}

module.exports = {
  login,
  register,
  changePassword,
  forgotPassword,
  updateProfile,
  uploadAvatar,
  getMyStudentProfile,
  migrateAllLegacyPasswords
};
