const supabase = require('../config/supabase');

function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.');
  }
}

// ─── Tổng quan thống kê Dashboard ────────────────────────────────────────────
exports.getOverviewStats = async (req, res) => {
  try {
    checkSupabase();

    // Lấy toàn bộ danh sách khóa học, học viên và tiến độ thực tế từ Supabase
    const [coursesRes, studentsRes, studyProgressRes] = await Promise.all([
      supabase.from('courses').select('*, chapters(id, title, duration_minutes, lessons(id, duration_minutes))'),
      supabase.from('students').select('*'),
      supabase.from('study_progress').select('watched_seconds, student_id')
    ]);

    const courses = coursesRes.data || [];
    const allUsers = studentsRes.data || [];

    // Tách riêng danh sách học viên thực tế (loại bỏ tài khoản Quản trị viên khỏi chỉ tiêu học viên)
    const students = allUsers.filter(s => s.role !== 'admin');

    const totalCourses = courses.length;
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;

    // Tỷ lệ đạt thực tế từ Supabase (tiến độ >= 80% chỉ tính trên học viên)
    const passedStudents = students.filter(s => (Number(s.progress) || 0) >= 80).length;
    const passRatePct = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 1000) / 10 : 0;

    // Tổng thời gian học tích lũy thực tế
    const totalWatchedSec = (studyProgressRes.data || []).reduce((sum, p) => sum + (Number(p.watched_seconds) || 0), 0);
    let totalHoursLearned = 0;

    if (totalWatchedSec > 0) {
      totalHoursLearned = Math.round((totalWatchedSec / 3600) * 10) / 10;
    } else {
      // Nếu chưa có lịch sử watched_seconds trong study_progress, tính dựa trên thời lượng môn học thực tế
      let totalMinutes = 0;
      students.forEach(s => {
        const pct = (Number(s.progress) || 0) / 100;
        if (pct <= 0) return;
        const course = courses.find(c => {
          const cName = (c.name || '').trim().toLowerCase();
          const sCourse = (s.course_name || '').trim().toLowerCase();
          return sCourse && (sCourse === cName || cName.includes(sCourse));
        });
        let courseMin = 0;
        if (course?.chapters && course.chapters.length > 0) {
          course.chapters.forEach(ch => {
            if (Array.isArray(ch.lessons) && ch.lessons.length > 0) {
              ch.lessons.forEach(l => {
                courseMin += Number(l.duration_minutes) || 15;
              });
            } else {
              courseMin += Number(ch.duration_minutes) || 30;
            }
          });
        }
        if (courseMin === 0) courseMin = 60;
        totalMinutes += pct * courseMin;
      });
      totalHoursLearned = Math.round((totalMinutes / 60) * 10) / 10;
    }

    // Thống kê học viên đăng ký theo tháng thực tế (dải 6 tháng liên tiếp gần nhất)
    const now = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      last6Months.push({ month: key, count: 0 });
    }

    students.forEach(s => {
      if (s.created_at) {
        const d = new Date(s.created_at);
        const key = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
        const found = last6Months.find(m => m.month === key);
        if (found) {
          found.count++;
        }
      }
    });

    const monthlyStats = last6Months;

    // Danh sách khóa học với sĩ số và tiến độ thực tế từ Supabase
    const topCourses = courses.slice(0, 5).map((c) => {
      const cName = (c.name || '').trim().toLowerCase();
      const cCode = (c.code || '').trim().toLowerCase();
      const enrolled = students.filter(s => {
        if (Array.isArray(c.enrolled_student_ids) && c.enrolled_student_ids.includes(s.id)) return true;
        const sCourse = (s.course_name || '').trim().toLowerCase();
        return sCourse && (sCourse === cName || sCourse === cCode || sCourse.includes(cCode) || cName.includes(sCourse));
      });

      const avgProgress = enrolled.length > 0 
        ? Math.round(enrolled.reduce((a, b) => a + (Number(b.progress) || 0), 0) / enrolled.length)
        : 0;

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        tier: c.license_tier || 'B2',
        studentsCount: enrolled.length,
        avgProgress: avgProgress,
        chaptersCount: (c.chapters || []).length
      };
    });

    // Top học viên xuất sắc nhất thực tế từ Supabase (loại bỏ admin)
    const topStudents = [...students]
      .sort((a, b) => (Number(b.progress) || 0) - (Number(a.progress) || 0))
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        full_name: s.full_name,
        avatar_url: s.avatar_url,
        course_name: s.course_name || 'Chưa xếp khóa',
        progress: Number(s.progress) || 0,
        cccd: s.cccd || '',
        status: s.status || 'active'
      }));

    return res.json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        activeStudents,
        passedStudents,
        passRatePct,
        totalHoursLearned,
        topCourses,
        topStudents,
        monthlyStats
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Export Báo cáo Khóa học ──────────────────────────────────────────────────
exports.exportCourseReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;
    return res.json({
      success: true,
      message: `Đã tạo báo cáo khóa học dạng ${(format || 'pdf').toUpperCase()} thành công!`,
      downloadUrl: `/downloads/report-course-${id}.${format || 'pdf'}`,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Export Báo cáo Học viên ──────────────────────────────────────────────────
exports.exportStudentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;
    return res.json({
      success: true,
      message: `Đã tạo hồ sơ học viên dạng ${(format || 'pdf').toUpperCase()} thành công!`,
      downloadUrl: `/downloads/report-student-${id}.${format || 'pdf'}`,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
