const supabase = require('../config/supabase');

// Mock Data trong bộ nhớ tạm để hệ thống hoạt động ngay lập tức không cần cài sẵn Supabase
let initialCourses = [
  {
    id: 'c1',
    code: 'KH-B2-2026-01',
    name: 'Khóa Lý Thuyết & Thực Hành Lái Xe Ô Tô Hạng B2 K68',
    license_tier: 'B2',
    teacher_name: 'Thầy Nguyễn Văn Hùng',
    thumbnail_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600',
    description: 'Khóa học đào tạo kỹ năng lái xe ô tô hạng B2 quy chuẩn 2026 với 600 câu hỏi lý thuyết và mô phỏng.',
    status: 'active',
    created_at: '2026-01-15T08:00:00Z',
    chapters: [
      {
        id: 'ch1',
        title: 'Chương 1: Quy định chung và Hệ thống Biển báo Giao thông',
        order_index: 1,
        min_completion_pct: 80,
        lessons: [
          {
            id: 'l1',
            title: 'Bài 1: Luật Giao thông Đường bộ cơ bản',
            type: 'video',
            content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration_minutes: 30,
            min_watch_pct: 80
          },
          {
            id: 'l2',
            title: 'Bài 2: Tài liệu nhận diện 60 biển báo nguy hiểm & cấm',
            type: 'reading',
            content_text: 'Biển báo nguy hiểm có hình tam giác đều, nền vàng, viền đỏ...',
            duration_minutes: 20,
            min_watch_pct: 90
          },
          {
            id: 'l3',
            title: 'Bài 3: Trắc nghiệm kiểm tra Luật Giao thông (20 câu)',
            type: 'quiz',
            duration_minutes: 15,
            min_watch_pct: 80
          }
        ]
      },
      {
        id: 'ch2',
        title: 'Chương 2: Kỹ thuật Lái xe Sa hình & Mô phỏng 120 Tình huống',
        order_index: 2,
        min_completion_pct: 85,
        lessons: [
          {
            id: 'l4',
            title: 'Bài 1: Kỹ thuật ghép xe ngang và ghép xe dọc vào nơi đỗ',
            type: 'video',
            content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration_minutes: 45,
            min_watch_pct: 85
          }
        ]
      }
    ],
    enrolled_student_ids: ['hv1', 'hv2', 'hv3']
  },
  {
    id: 'c2',
    code: 'KH-C-2026-02',
    name: 'Khóa Lái Xe Tải Hạng C Chuyên Nghiệp',
    license_tier: 'C',
    teacher_name: 'Thầy Trần Đình Long',
    thumbnail_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600',
    description: 'Khóa học cấp tốc GPLX hạng C cho tài xế chuyên nghiệp lái xe tải trên 3.5 tấn.',
    status: 'active',
    created_at: '2026-02-01T09:00:00Z',
    chapters: [],
    enrolled_student_ids: ['hv4']
  },
  {
    id: 'c3',
    code: 'KH-B1-2026-03',
    name: 'Khóa Lái Xe Số Tự Động Hạng B11',
    license_tier: 'B1',
    teacher_name: 'Cô Lê Thị Mai',
    thumbnail_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    description: 'Đào tạo lái xe số tự động B1 cho cá nhân và gia đình, tập trung an toàn giao thông.',
    status: 'active',
    created_at: '2026-02-10T10:00:00Z',
    chapters: [],
    enrolled_student_ids: []
  }
];

// Lấy danh sách khóa học
exports.getAllCourses = async (req, res) => {
  try {
    const { search, tier } = req.query;
    let result = initialCourses;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    if (tier && tier !== 'ALL') {
      result = result.filter(c => c.license_tier === tier);
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy chi tiết khóa học theo ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = initialCourses.find(c => c.id === id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Khóa học không tồn tại' });
    }
    return res.json({ success: true, data: course });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Tạo khóa học mới (Chưa có bài giảng)
exports.createCourse = async (req, res) => {
  try {
    const { code, name, license_tier, teacher_name, thumbnail_url, description } = req.body;

    if (!code || !name || !license_tier || !teacher_name) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
    }

    const newCourse = {
      id: 'c_' + Date.now(),
      code,
      name,
      license_tier,
      teacher_name,
      thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600',
      description: description || '',
      status: 'active',
      created_at: new Date().toISOString(),
      chapters: [],
      enrolled_student_ids: []
    };

    initialCourses.unshift(newCourse);

    return res.status(201).json({ success: true, message: 'Tạo khóa học thành công!', data: newCourse });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Bước 1: Tạo Chương trong khóa học
exports.createChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, min_completion_pct } = req.body;

    const course = initialCourses.find(c => c.id === id);
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });

    const newChapter = {
      id: 'ch_' + Date.now(),
      title,
      order_index: course.chapters.length + 1,
      min_completion_pct: min_completion_pct ? Number(min_completion_pct) : 80,
      lessons: []
    };

    course.chapters.push(newChapter);
    return res.status(201).json({ success: true, message: 'Tạo chương mới thành công!', data: newChapter });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Bước 2: Tạo Bài Giảng trong Chương
exports.createLesson = async (req, res) => {
  try {
    const { id, chapterId } = req.params;
    const { title, type, content_url, content_text, duration_minutes, min_watch_pct } = req.body;

    const course = initialCourses.find(c => c.id === id);
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ success: false, message: 'Không tìm thấy chương' });

    const newLesson = {
      id: 'l_' + Date.now(),
      title,
      type: type || 'video',
      content_url: content_url || '',
      content_text: content_text || '',
      duration_minutes: duration_minutes ? Number(duration_minutes) : 15,
      min_watch_pct: min_watch_pct ? Number(min_watch_pct) : 80
    };

    chapter.lessons.push(newLesson);
    return res.status(201).json({ success: true, message: 'Thêm bài giảng thành công!', data: newLesson });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Bước 3: Cập nhật điều kiện hoàn thành chương
exports.updateChapterRules = async (req, res) => {
  try {
    const { id, chapterId } = req.params;
    const { min_completion_pct, min_watch_pct_default } = req.body;

    const course = initialCourses.find(c => c.id === id);
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });

    const chapter = course.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return res.status(404).json({ success: false, message: 'Không tìm thấy chương' });

    if (min_completion_pct !== undefined) chapter.min_completion_pct = Number(min_completion_pct);
    if (min_watch_pct_default !== undefined) {
      chapter.lessons.forEach(l => l.min_watch_pct = Number(min_watch_pct_default));
    }

    return res.json({ success: true, message: 'Đã cập nhật quy định hoàn thành chương!', data: chapter });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Bước 4: Add học viên chưa add vào khóa học
exports.enrollStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_ids } = req.body; // Array of student IDs

    const course = initialCourses.find(c => c.id === id);
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 học viên để thêm!' });
    }

    student_ids.forEach(sid => {
      if (!course.enrolled_student_ids.includes(sid)) {
        course.enrolled_student_ids.push(sid);
      }
    });

    return res.json({ success: true, message: `Đã thêm thành công ${student_ids.length} học viên vào khóa học!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
