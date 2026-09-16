const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

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

    // Không trả về chuỗi hash mật khẩu ra client để bảo mật
    const sanitized = (data || []).map(s => {
      const { password, ...rest } = s;
      return rest;
    });

    return res.json({ success: true, data: sanitized });
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

    // Bảo mật: loại bỏ password khỏi phản hồi
    const { password, ...rest } = data;
    return res.json({ success: true, data: rest });
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

    // Băm mật khẩu bằng Bcrypt trước khi lưu vào CSDL (mặc định 123456 nếu để trống)
    const rawPassword = (password || '123456').toString().trim();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newStudent = {
      full_name,
      username,
      password: hashedPassword,
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

    // Không gửi mật khẩu hash về client
    if (data && data.password) delete data.password;

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản học viên thành công!',
      data
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Tạo danh sách học viên hàng loạt (Nhập từ file Excel) ────────────────────
exports.createStudentsBatch = async (req, res) => {
  try {
    checkSupabase();
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách học viên không hợp lệ hoặc đang trống!'
      });
    }

    // 1. Lấy danh sách username & cccd hiện có trong hệ thống để đối soát trùng
    const { data: existingRecords } = await supabase
      .from('students')
      .select('username, cccd');

    const existingUsernames = new Set((existingRecords || []).map(r => (r.username || '').toLowerCase()));
    const existingCccds = new Set((existingRecords || []).map(r => (r.cccd || '').trim()));

    const toInsert = [];
    const skipped = [];
    const seenBatchUsernames = new Set();
    const seenBatchCccds = new Set();

    students.forEach((st, idx) => {
      const full_name = (st.full_name || '').trim();
      let cccd = (st.cccd || '').toString().trim();
      let username = (st.username || '').toString().trim().toLowerCase();
      const password = (st.password || '123456').toString().trim();

      // Kiểm tra họ tên
      if (!full_name) {
        skipped.push({ row: idx + 1, name: full_name || 'Chưa rõ', reason: 'Thiếu họ và tên' });
        return;
      }

      // Kiểm tra CCCD
      if (!cccd) {
        skipped.push({ row: idx + 1, name: full_name, reason: 'Thiếu số CCCD' });
        return;
      }

      // Tự sinh username nếu để trống
      if (!username) {
        username = `hv${cccd}`;
      }

      // Kiểm tra trùng lặp với CSDL Supabase
      if (existingUsernames.has(username)) {
        skipped.push({ row: idx + 1, name: full_name, username, cccd, reason: `Tên đăng nhập "${username}" đã tồn tại` });
        return;
      }
      if (existingCccds.has(cccd)) {
        skipped.push({ row: idx + 1, name: full_name, username, cccd, reason: `Số CCCD "${cccd}" đã tồn tại` });
        return;
      }

      // Kiểm tra trùng lặp nội bộ trong chính file Excel tải lên
      if (seenBatchUsernames.has(username)) {
        skipped.push({ row: idx + 1, name: full_name, username, cccd, reason: `Tên đăng nhập "${username}" bị trùng trong file` });
        return;
      }
      if (seenBatchCccds.has(cccd)) {
        skipped.push({ row: idx + 1, name: full_name, username, cccd, reason: `Số CCCD "${cccd}" bị trùng trong file` });
        return;
      }

      seenBatchUsernames.add(username);
      seenBatchCccds.add(cccd);

      toInsert.push({
        full_name,
        username,
        password,
        dob: st.dob ? String(st.dob).trim() : null,
        cccd,
        email: st.email ? String(st.email).trim() : null,
        phone: st.phone ? String(st.phone).trim() : null,
        role: 'student',
        status: 'active',
        course_name: st.course_name ? String(st.course_name).trim() : 'Chưa xếp khóa',
        progress: 0,
        avatar_url: st.avatar_url || null
      });
    });

    if (toInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có học viên nào hợp lệ để nhập vào hệ thống!',
        skippedCount: skipped.length,
        skipped
      });
    }

    // 2. Mã hóa mật khẩu Bcrypt cho toàn bộ học viên trước khi lưu
    const toInsertWithHashedPasswords = await Promise.all(
      toInsert.map(async (row) => {
        const raw = (row.password || '123456').toString().trim();
        const hashedPassword = await bcrypt.hash(raw, 10);
        return {
          ...row,
          password: hashedPassword
        };
      })
    );

    // Chèn toàn bộ học viên hợp lệ vào bảng students
    const { data: insertedData, error: insertError } = await supabase
      .from('students')
      .insert(toInsertWithHashedPasswords)
      .select();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return res.status(201).json({
      success: true,
      message: `Đã tạo thành công ${insertedData.length} tài khoản học viên!`,
      createdCount: insertedData.length,
      skippedCount: skipped.length,
      skipped
    });
  } catch (err) {
    console.error('Lỗi tạo học viên hàng loạt:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi server khi tạo học viên hàng loạt'
    });
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
    
    // Nếu có cập nhật mật khẩu, tự động băm Bcrypt
    if (body.password !== undefined && String(body.password).trim() !== '') {
      const raw = String(body.password).trim();
      const isBcrypt = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(raw);
      baseUpdate.password = isBcrypt ? raw : await bcrypt.hash(raw, 10);
    }

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

    // Bảo mật: Không trả về mật khẩu hash
    if (data && data.password) delete data.password;

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

// ─── Lưu tiến độ & thời gian học tập của học viên ─────────────────────────
function isUuid(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

// ─── Lưu Tiến Độ Học Tập Thời Gian Thực Vào Supabase ─────────────────────────
exports.saveStudyProgress = async (req, res) => {
  try {
    checkSupabase();
    const { id: studentId } = req.params;
    const { course_id, chapter_id, lesson_id, seconds_added, total_studied_seconds, is_completed } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin studentId!' });
    }

    // Chuẩn hóa studentId sang UUID hợp lệ từ bảng students
    let resolvedStudentId = studentId;
    if (!isUuid(studentId)) {
      try {
        const { data: s } = await supabase
          .from('students')
          .select('id')
          .or(`username.eq.${studentId},email.eq.${studentId}`)
          .limit(1)
          .single();
        if (s && s.id) resolvedStudentId = s.id;
      } catch (e) {}
    }

    // Chuẩn hóa lesson_id sang UUID hợp lệ
    let resolvedLessonId = lesson_id;
    if (lesson_id && !isUuid(lesson_id) && chapter_id) {
      try {
        const { data: realLesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('chapter_id', chapter_id)
          .eq('type', 'quiz')
          .limit(1)
          .single();
        if (realLesson && realLesson.id) resolvedLessonId = realLesson.id;
      } catch (e) {}
    }

    // 1. Lưu vào bảng study_progress trong CSDL Supabase
    try {
      if (resolvedLessonId && isUuid(resolvedLessonId)) {
        const { data: existingProgress } = await supabase
          .from('study_progress')
          .select('*')
          .eq('student_id', resolvedStudentId)
          .eq('lesson_id', resolvedLessonId)
          .single();

        if (existingProgress) {
          const newWatched = Math.max(
            Number(existingProgress.watched_seconds) || 0,
            Number(total_studied_seconds) || 0,
            (Number(existingProgress.watched_seconds) || 0) + (Number(seconds_added) || 0)
          );
          await supabase
            .from('study_progress')
            .update({
              watched_seconds: newWatched,
              is_completed: is_completed !== undefined ? !!is_completed : existingProgress.is_completed,
              last_studied_at: new Date().toISOString()
            })
            .eq('id', existingProgress.id);
        } else {
          const initialWatched = Math.max(Number(total_studied_seconds) || 0, Number(seconds_added) || 0);
          await supabase
            .from('study_progress')
            .insert([{
              student_id: resolvedStudentId,
              lesson_id: resolvedLessonId,
              watched_seconds: initialWatched,
              is_completed: !!is_completed,
              last_studied_at: new Date().toISOString()
            }]);
        }
      }
    } catch (tblErr) {
      console.warn('Lưu study_progress warning:', tblErr.message);
    }

    // 2. Cập nhật % tiến độ tổng quát cho học viên trong bảng students
    try {
      if (resolvedStudentId) {
        // Tìm tổng số bài học của khóa học mà học viên tham gia
        let totalCourseLessons = 0;
        if (course_id) {
          const { data: chapters } = await supabase
            .from('chapters')
            .select('id, lessons(id)')
            .eq('course_id', course_id);
          if (chapters && chapters.length > 0) {
            totalCourseLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);
          }
        }

        const { data: allProg } = await supabase
          .from('study_progress')
          .select('watched_seconds, is_completed')
          .eq('student_id', resolvedStudentId);

        if (allProg && allProg.length > 0) {
          const completedCount = allProg.filter(p => p.is_completed).length;
          const denominator = totalCourseLessons > 0 ? totalCourseLessons : Math.max(1, allProg.length);
          const pct = Math.min(100, Math.round((completedCount / denominator) * 100));
          await supabase
            .from('students')
            .update({ progress: pct, updated_at: new Date().toISOString() })
            .eq('id', resolvedStudentId);
        }
      }
    } catch (err) {}

    return res.json({
      success: true,
      message: 'Lưu tiến độ học tập vào CSDL Supabase thành công!',
      data: {
        student_id: resolvedStudentId,
        chapter_id,
        lesson_id: resolvedLessonId,
        total_studied_seconds,
        is_completed
      }
    });
  } catch (err) {
    console.error('saveStudyProgress error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Lấy Tiến Độ Học Tập Của Học Viên Từ Supabase ─────────────────────────────
exports.getStudyProgress = async (req, res) => {
  try {
    checkSupabase();
    const { id: studentId } = req.params;

    let resolvedStudentId = studentId;
    if (!isUuid(studentId)) {
      try {
        const { data: s } = await supabase
          .from('students')
          .select('id')
          .or(`username.eq.${studentId},email.eq.${studentId}`)
          .limit(1)
          .single();
        if (s && s.id) resolvedStudentId = s.id;
      } catch (e) {}
    }

    let progressList = [];
    try {
      const { data } = await supabase
        .from('study_progress')
        .select('*')
        .eq('student_id', resolvedStudentId);
      if (data) progressList = data;
    } catch (e) {
      console.warn('Không thể truy vấn study_progress:', e.message);
    }

    return res.json({
      success: true,
      data: progressList
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Lưu Kết Quả Bài Kiểm Tra Trắc Nghiệm Vào Supabase ────────────────────────
exports.saveQuizAttempt = async (req, res) => {
  try {
    checkSupabase();
    const { id: studentId } = req.params;
    const { course_id, chapter_id, lesson_id, score, total_questions, is_passed, answers } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin studentId!' });
    }

    let resolvedStudentId = studentId;
    if (!isUuid(studentId)) {
      try {
        const { data: s } = await supabase
          .from('students')
          .select('id')
          .or(`username.eq.${studentId},email.eq.${studentId}`)
          .limit(1)
          .single();
        if (s && s.id) resolvedStudentId = s.id;
      } catch (e) {}
    }

    let resolvedLessonId = lesson_id;
    if (lesson_id && !isUuid(lesson_id) && chapter_id) {
      try {
        const { data: realLesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('chapter_id', chapter_id)
          .eq('type', 'quiz')
          .limit(1)
          .single();
        if (realLesson && realLesson.id) resolvedLessonId = realLesson.id;
      } catch (e) {}
    }

    let savedAttempt = null;
    try {
      const attemptPayload = {
        student_id: resolvedStudentId,
        score: Number(score) || 0,
        total_questions: Number(total_questions) || 0,
        is_passed: !!is_passed,
        answers: answers || {},
        attempted_at: new Date().toISOString()
      };
      if (resolvedLessonId && isUuid(resolvedLessonId)) {
        attemptPayload.lesson_id = resolvedLessonId;
      }

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([attemptPayload])
        .select()
        .single();
      if (!error && data) savedAttempt = data;
    } catch (qaErr) {
      console.warn('Lưu quiz_attempts warning:', qaErr.message);
    }

    // Đánh dấu hoàn thành bài học quiz trong bảng study_progress nếu đạt
    if (resolvedLessonId && isUuid(resolvedLessonId)) {
      try {
        const { data: existingProgress } = await supabase
          .from('study_progress')
          .select('id, watched_seconds')
          .eq('student_id', resolvedStudentId)
          .eq('lesson_id', resolvedLessonId)
          .single();

        if (existingProgress) {
          await supabase
            .from('study_progress')
            .update({
              is_completed: is_passed !== undefined ? !!is_passed : true,
              watched_seconds: (existingProgress.watched_seconds || 0) + 180,
              last_studied_at: new Date().toISOString()
            })
            .eq('id', existingProgress.id);
        } else {
          await supabase
            .from('study_progress')
            .insert([{
              student_id: resolvedStudentId,
              lesson_id: resolvedLessonId,
              watched_seconds: 180,
              is_completed: !!is_passed,
              last_studied_at: new Date().toISOString()
            }]);
        }
      } catch (spErr) {}
    }

    return res.status(200).json({
      success: true,
      message: 'Lưu kết quả bài kiểm tra vào CSDL Supabase thành công!',
      data: savedAttempt || {
        student_id: resolvedStudentId,
        chapter_id,
        lesson_id: resolvedLessonId,
        score,
        total_questions,
        is_passed,
        answers
      }
    });
  } catch (err) {
    console.error('Lỗi saveQuizAttempt:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Lấy Danh Sách Kết Quả Bài Kiểm Tra Của Học Viên Từ Supabase ─────────────
exports.getQuizAttempts = async (req, res) => {
  try {
    checkSupabase();
    const { id: studentId } = req.params;

    let resolvedStudentId = studentId;
    if (!isUuid(studentId)) {
      try {
        const { data: s } = await supabase
          .from('students')
          .select('id')
          .or(`username.eq.${studentId},email.eq.${studentId}`)
          .limit(1)
          .single();
        if (s && s.id) resolvedStudentId = s.id;
      } catch (e) {}
    }

    let attempts = [];
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', resolvedStudentId)
        .order('attempted_at', { ascending: false });
      if (!error && data) attempts = data;
    } catch (e) {
      console.warn('Lỗi lấy quiz_attempts:', e.message);
    }

    return res.json({
      success: true,
      data: attempts
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Dùng nội bộ bởi reportController ────────────────────────────────────────
exports._getStudentsListInternal = async () => {
  if (!supabase) return [];
  const { data } = await supabase.from('students').select('*');
  return data || [];
};



