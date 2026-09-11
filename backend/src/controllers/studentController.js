const supabase = require('../config/supabase');

// Helper: kiểm tra kết nối Supabase
function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env (SUPABASE_URL, SUPABASE_ANON_KEY).');
  }
}

// ─── Lấy danh sách học viên ───────────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    checkSupabase();
    const { search, role, unassigned } = req.query;

    let query = supabase.from('students').select('*').order('created_at', { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,cccd.ilike.%${search}%`);
    }
    if (role && role !== 'ALL') {
      query = query.eq('role', role);
    }
    if (unassigned === 'true') {
      query = query.eq('course_name', 'Chưa xếp khóa');
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return res.json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Lấy chi tiết học viên ────────────────────────────────────────────────────
exports.getStudentById = async (req, res) => {
  try {
    checkSupabase();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Học viên không tồn tại' });
    }

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Tạo tài khoản học viên ───────────────────────────────────────────────────
exports.createStudent = async (req, res) => {
  try {
    checkSupabase();
    const { full_name, username, password, dob, cccd, email, role, avatar_url, phone } = req.body;

    if (!full_name || !username || !cccd) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập các thông tin bắt buộc: Họ tên, Tên đăng nhập, CCCD!'
      });
    }

    // Kiểm tra trùng username / cccd
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .or(`username.eq.${username},cccd.eq.${cccd}`)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập hoặc số CCCD đã tồn tại trong hệ thống!'
      });
    }

    const newStudent = {
      full_name,
      username,
      dob: dob || null,
      cccd,
      email: email || null,
      role: role || 'student',
      avatar_url: avatar_url || null,
      phone: phone || null,
      status: 'active',
      course_name: 'Chưa xếp khóa',
      progress: 0
    };

    const { data, error } = await supabase
      .from('students')
      .insert([newStudent])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản học viên thành công!',
      data
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Cập nhật thông tin học viên ──────────────────────────────────────────────
exports.updateStudent = async (req, res) => {
  try {
    checkSupabase();
    const { id } = req.params;
    const body = req.body || {};

    const baseUpdate = { updated_at: new Date().toISOString() };
    if (body.full_name !== undefined)   baseUpdate.full_name  = body.full_name;
    if (body.dob !== undefined)         baseUpdate.dob        = (body.dob && String(body.dob).trim() !== '') ? body.dob : null;
    if (body.cccd !== undefined)        baseUpdate.cccd       = body.cccd;
    if (body.email !== undefined)       baseUpdate.email      = body.email || null;
    if (body.phone !== undefined)       baseUpdate.phone      = body.phone || null;
    if (body.role !== undefined)        baseUpdate.role       = body.role;
    if (body.status !== undefined)      baseUpdate.status     = body.status;
    if (body.avatar_url !== undefined)  baseUpdate.avatar_url = body.avatar_url || null;
    if (body.course_name !== undefined) baseUpdate.course_name = body.course_name;
    if (body.progress !== undefined)    baseUpdate.progress   = parseInt(body.progress) || 0;
    if (body.password !== undefined && String(body.password).trim() !== '') baseUpdate.password = String(body.password).trim();

    // Thử cập nhật đầy đủ các trường (bao gồm gender, workplace, address, bio, password nếu bảng đã có)
    const fullUpdate = { ...baseUpdate };
    if (body.gender !== undefined)    fullUpdate.gender    = body.gender;
    if (body.workplace !== undefined) fullUpdate.workplace = body.workplace;
    if (body.address !== undefined)   fullUpdate.address   = body.address;
    if (body.bio !== undefined)       fullUpdate.bio       = body.bio;

    let { data, error } = await supabase
      .from('students')
      .update(fullUpdate)
      .eq('id', id)
      .select()
      .single();

    // Nếu bảng Supabase chưa tạo các cột phụ, fallback về cập nhật các cột chuẩn
    if (error && error.message && (error.message.includes('Could not find column') || error.message.includes('schema'))) {
      const fallback = await supabase
        .from('students')
        .update(baseUpdate)
        .eq('id', id)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Update student error:', error);
      return res.status(400).json({ success: false, message: error.message });
    }

    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });

    return res.json({
      success: true,
      message: 'Cập nhật thông tin học viên thành công!',
      data
    });
  } catch (err) {
    console.error('Update student exception:', err);
    return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
  }
};

// ─── Xóa học viên ─────────────────────────────────────────────────────────────
exports.deleteStudent = async (req, res) => {
  try {
    checkSupabase();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên để xóa' });

    return res.json({
      success: true,
      message: 'Xóa học viên thành công!',
      data
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Upload avatar học viên lên Supabase Storage ──────────────────────────────
exports.uploadAvatar = async (req, res) => {
  try {
    checkSupabase();
    const { base64, fileName, mimeType } = req.body;

    if (!base64 || !fileName) {
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu ảnh!' });
    }

    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `avatars/${Date.now()}_${cleanFileName}`;

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

    return res.json({
      success: true,
      message: 'Tải ảnh lên Supabase Storage thành công!',
      data: { url: urlData.publicUrl }
    });
  } catch (err) {
    console.error('uploadAvatar exception:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Dùng nội bộ bởi reportController ────────────────────────────────────────
exports._getStudentsListInternal = async () => {
  if (!supabase) return [];
  const { data } = await supabase.from('students').select('*');
  return data || [];
};


