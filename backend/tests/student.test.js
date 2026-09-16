const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Logic xử lý học viên từ file Excel
function processExcelStudentRow(row, existingCccds = new Set()) {
  const fullName = String(row.full_name || row['Họ và tên'] || '').trim();
  const rawCccd = String(row.cccd || row['Số CCCD'] || '').trim().replace(/\D/g, '');

  if (!fullName) {
    return { valid: false, reason: 'Thiếu họ và tên học viên' };
  }
  if (!rawCccd || rawCccd.length !== 12) {
    return { valid: false, reason: 'Số CCCD không đúng định dạng 12 số' };
  }
  if (existingCccds.has(rawCccd)) {
    return { valid: false, reason: 'Số CCCD bị trùng lặp trong danh sách' };
  }

  const username = String(row.username || row['Tên đăng nhập'] || `hv${rawCccd}`).trim();
  const password = String(row.password || row['Mật khẩu'] || '123456').trim();

  return {
    valid: true,
    data: {
      full_name: fullName,
      cccd: rawCccd,
      username,
      password,
      role: 'student',
      status: 'active'
    }
  };
}

// Logic tính toán phần trăm hoàn thành khóa học
function calculateCourseProgress(completedLessonsCount, totalLessonsCount) {
  if (!totalLessonsCount || totalLessonsCount <= 0) return 0;
  const pct = Math.round((completedLessonsCount / totalLessonsCount) * 100);
  return Math.min(Math.max(pct, 0), 100);
}

// Logic đánh giá kết quả bài thi sát hạch lý thuyết (chuẩn >= 80% là Đạt)
function evaluateQuizResult(score, totalQuestions, passPercentThreshold = 80) {
  if (!totalQuestions || totalQuestions <= 0) return { percent: 0, isPassed: false };
  const percent = Math.round((score / totalQuestions) * 100);
  const isPassed = percent >= passPercentThreshold;
  return { percent, isPassed };
}

describe('1. Kiểm thử Logic Xử Lý & Validate Dữ Liệu Excel Học Viên (Batch Import)', () => {
  it('Chấp nhận dòng học viên chuẩn đầy đủ họ tên và CCCD 12 số', () => {
    const row = {
      'Họ và tên': 'Nguyễn Văn An',
      'Số CCCD': '001203009876'
    };
    const result = processExcelStudentRow(row);

    assert.equal(result.valid, true);
    assert.equal(result.data.full_name, 'Nguyễn Văn An');
    assert.equal(result.data.cccd, '001203009876');
    assert.equal(result.data.username, 'hv001203009876', 'Tự động sinh username hv{cccd} khi để trống');
    assert.equal(result.data.password, '123456', 'Gán mật khẩu mặc định 123456 khi để trống');
  });

  it('Từ chối khi thiếu họ và tên', () => {
    const row = {
      'Họ và tên': '',
      'Số CCCD': '001203009876'
    };
    const result = processExcelStudentRow(row);
    assert.equal(result.valid, false);
    assert.match(result.reason, /họ và tên/i);
  });

  it('Từ chối khi số CCCD không đủ 12 số', () => {
    const row = {
      'Họ và tên': 'Trần Thị Mai',
      'Số CCCD': '079123'
    };
    const result = processExcelStudentRow(row);
    assert.equal(result.valid, false);
    assert.match(result.reason, /CCCD/i);
  });

  it('Phát hiện trùng lặp số CCCD nội bộ trong danh sách Excel', () => {
    const existing = new Set(['001203009876']);
    const row = {
      'Họ và tên': 'Lê Văn Trùng',
      'Số CCCD': '001203009876'
    };
    const result = processExcelStudentRow(row, existing);
    assert.equal(result.valid, false);
    assert.match(result.reason, /trùng lặp/i);
  });
});

describe('2. Kiểm thử Logic Tính Toán Tiến Độ & Sát Hạch', () => {
  it('Tính đúng phần trăm hoàn thành bài học khóa học', () => {
    assert.equal(calculateCourseProgress(0, 10), 0);
    assert.equal(calculateCourseProgress(5, 10), 50);
    assert.equal(calculateCourseProgress(10, 10), 100);
    assert.equal(calculateCourseProgress(12, 10), 100, 'Không vượt quá 100%');
    assert.equal(calculateCourseProgress(0, 0), 0, 'Xử lý an toàn khi khóa học chưa có bài');
  });

  it('Đánh giá kết quả bài thi sát hạch lý thuyết chuẩn xác', () => {
    // 35 câu đạt 32 câu = 91% -> ĐẠT
    const passResult = evaluateQuizResult(32, 35);
    assert.equal(passResult.percent, 91);
    assert.equal(passResult.isPassed, true);

    // 35 câu chỉ đúng 20 câu = 57% -> KHÔNG ĐẠT
    const failResult = evaluateQuizResult(20, 35);
    assert.equal(failResult.percent, 57);
    assert.equal(failResult.isPassed, false);
  });
});
