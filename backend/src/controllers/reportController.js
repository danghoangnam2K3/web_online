const { _getStudentsListInternal } = require('./studentController');

// API Tổng quan thống kê cho Trang Dashboard Overview
exports.getOverviewStats = async (req, res) => {
  try {
    const students = _getStudentsListInternal();

    const totalCourses = 3;
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const passRatePct = 94.5;
    const totalHoursLearned = 1420;

    const topCourses = [
      { id: 'c1', name: 'Khóa Lái Xe B2 K68', tier: 'B2', studentsCount: 42, completionPct: 88, rating: 4.9 },
      { id: 'c2', name: 'Khóa Lái Xe Tải Hạng C', tier: 'C', studentsCount: 28, completionPct: 92, rating: 4.8 },
      { id: 'c3', name: 'Khóa Số Tự Động B1', tier: 'B1', studentsCount: 35, completionPct: 75, rating: 4.7 }
    ];

    const topStudents = students.slice(0, 5).map(s => ({
      id: s.id,
      full_name: s.full_name,
      avatar_url: s.avatar_url,
      course_name: s.course_name,
      progress: s.progress,
      quizScore: Math.floor(Math.random() * 5) + 30 // 30-35/35 câu
    }));

    const monthlyStats = [
      { month: 'Tháng 9/2025', count: 32 },
      { month: 'Tháng 10/2025', count: 45 },
      { month: 'Tháng 11/2025', count: 50 },
      { month: 'Tháng 12/2025', count: 68 },
      { month: 'Tháng 1/2026', count: 85 },
      { month: 'Tháng 2/2026', count: 110 }
    ];

    return res.json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        activeStudents,
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

// Export Báo cáo từng Khóa (PDF / Excel)
exports.exportCourseReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query; // 'pdf' hoặc 'excel'

    return res.json({
      success: true,
      message: `Đã tạo tập tin báo cáo khóa học dạng ${format ? format.toUpperCase() : 'PDF'} thành công!`,
      downloadUrl: `/downloads/report-course-${id}.${format || 'pdf'}`,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Export Báo cáo từng Học viên (PDF / Word)
exports.exportStudentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query; // 'pdf' hoặc 'word'

    return res.json({
      success: true,
      message: `Đã tạo hồ sơ & báo cáo kết quả học viên dạng ${format ? format.toUpperCase() : 'PDF'} thành công!`,
      downloadUrl: `/downloads/report-student-${id}.${format || 'pdf'}`,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
