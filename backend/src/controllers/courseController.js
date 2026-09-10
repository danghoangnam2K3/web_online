const supabase = require('../config/supabase');

function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env (SUPABASE_URL, SUPABASE_ANON_KEY).');
  }
}

// ─── Lấy danh sách khóa học (kèm chapters + lessons) ─────────────────────────
exports.getAllCourses = async (req, res) => {
  try {
    checkSupabase();
    const { search, tier } = req.query;

    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    if (tier && tier !== 'ALL') {
      query = query.eq('license_tier', tier);
    }

    const { data: coursesData, error: coursesError } = await query;
    if (coursesError) throw new Error(coursesError.message);

    // Thử lấy thêm chapters, lessons, enrollments một cách an toàn
    const result = await Promise.all((coursesData || []).map(async (course) => {
      let chapters = [];
      let enrolled_student_ids = [];

      try {
        const { data: chData } = await supabase
          .from('chapters')
          .select('*, lessons(*)')
          .eq('course_id', course.id)
          .order('order_index', { ascending: true });
        if (chData) chapters = chData;
      } catch (e) {
        console.warn('Lỗi lấy chapters cho khóa học:', course.id, e.message);
      }

      try {
        const { data: enData } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('course_id', course.id);
        if (enData) enrolled_student_ids = enData.map(e => e.student_id);
      } catch (e) {
        console.warn('Lỗi lấy enrollments cho khóa học:', course.id, e.message);
      }

      return {
        ...course,
        chapters,
        enrolled_student_ids
      };
    }));

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Lỗi getAllCourses:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Lấy chi tiết khóa học ────────────────────────────────────────────────────
exports.getCourseById = async (req, res) => {
  try {
    checkSupabase();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        chapters (
          *,
          lessons ( * )
        ),
        enrollments ( student_id )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Khóa học không tồn tại' });
    }

    const result = {
      ...data,
      chapters: (data.chapters || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(ch => ({
          ...ch,
          lessons: (ch.lessons || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        })),
      enrolled_student_ids: (data.enrollments || []).map(e => e.student_id),
      enrollments: undefined
    };

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Tạo khóa học mới ─────────────────────────────────────────────────────────
exports.createCourse = async (req, res) => {
  try {
    checkSupabase();
    const { code, name, license_tier, teacher_name, thumbnail_url, description } = req.body;

    if (!code || !name || !license_tier || !teacher_name) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([{
        code,
        name,
        license_tier,
        teacher_name,
        thumbnail_url: thumbnail_url || null,
        description: description || null,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(201).json({
      success: true,
      message: 'Tạo khóa học thành công!',
      data: { ...data, chapters: [], enrolled_student_ids: [] }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Tạo chương trong khóa học ───────────────────────────────────────────────
exports.createChapter = async (req, res) => {
  try {
    checkSupabase();
    const { id } = req.params;
    const { title, min_completion_pct } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Tiêu đề chương không được để trống!' });

    // Lấy order_index tiếp theo
    const { data: existing } = await supabase
      .from('chapters')
      .select('order_index')
      .eq('course_id', id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 1;

    const { data, error } = await supabase
      .from('chapters')
      .insert([{
        course_id: id,
        title,
        order_index: nextOrder,
        min_completion_pct: min_completion_pct ? Number(min_completion_pct) : 80
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(201).json({
      success: true,
      message: 'Tạo chương mới thành công!',
      data: { ...data, lessons: [] }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Tạo bài giảng trong chương ──────────────────────────────────────────────
exports.createLesson = async (req, res) => {
  try {
    checkSupabase();
    const { chapterId } = req.params;
    const { title, type, content_url, content_text, duration_minutes, min_watch_pct } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Tiêu đề bài giảng không được để trống!' });

    // Lấy order_index tiếp theo
    const { data: existing } = await supabase
      .from('lessons')
      .select('order_index')
      .eq('chapter_id', chapterId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 1;

    const { data, error } = await supabase
      .from('lessons')
      .insert([{
        chapter_id: chapterId,
        title,
        type: type || 'video',
        content_url: content_url || null,
        content_text: content_text || null,
        duration_minutes: duration_minutes ? Number(duration_minutes) : 15,
        min_watch_pct: min_watch_pct ? Number(min_watch_pct) : 80,
        order_index: nextOrder
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(201).json({ success: true, message: 'Thêm bài giảng thành công!', data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Cập nhật quy định hoàn thành chương ─────────────────────────────────────
exports.updateChapterRules = async (req, res) => {
  try {
    checkSupabase();
    const { chapterId } = req.params;
    const { min_completion_pct, min_watch_pct_default } = req.body;

    // Cập nhật chương
    if (min_completion_pct !== undefined) {
      const { error } = await supabase
        .from('chapters')
        .update({ min_completion_pct: Number(min_completion_pct) })
        .eq('id', chapterId);
      if (error) throw new Error(error.message);
    }

    // Cập nhật tất cả bài giảng trong chương
    if (min_watch_pct_default !== undefined) {
      const { error } = await supabase
        .from('lessons')
        .update({ min_watch_pct: Number(min_watch_pct_default) })
        .eq('chapter_id', chapterId);
      if (error) throw new Error(error.message);
    }

    return res.json({ success: true, message: 'Đã cập nhật quy định hoàn thành chương!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Thêm học viên vào khóa học ──────────────────────────────────────────────
exports.enrollStudents = async (req, res) => {
  try {
    checkSupabase();
    const { id } = req.params;
    const { student_ids } = req.body;

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 học viên!' });
    }

    // Lấy tên khóa học để cập nhật vào bảng students
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('name')
      .eq('id', id)
      .single();

    if (courseErr || !course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    }

    // Upsert enrollments (bỏ qua nếu đã tồn tại)
    const enrollRows = student_ids.map(sid => ({ course_id: id, student_id: sid }));
    const { error: enrollErr } = await supabase
      .from('enrollments')
      .upsert(enrollRows, { onConflict: 'course_id,student_id' });

    if (enrollErr) throw new Error(enrollErr.message);

    // Cập nhật course_name trong bảng students
    await supabase
      .from('students')
      .update({ course_name: course.name })
      .in('id', student_ids);

    return res.json({
      success: true,
      message: `Đã thêm thành công ${student_ids.length} học viên vào khóa học!`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
