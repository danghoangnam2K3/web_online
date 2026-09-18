import React, { useState, useEffect } from 'react';
import { Printer, Download, FileText, CheckCircle2, UserCheck, Calendar, Building2, Award, Hash, Image as ImageIcon, BookOpen, Clock } from 'lucide-react';
import { fetchCourseById, fetchCourses, fetchStudentProgressApi } from '../lib/api';

function formatExactTime(totalSec) {
  if (!totalSec || totalSec <= 0) return '0 phút 00 giây';
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const padSec = String(secs).padStart(2, '0');
  if (hrs > 0) {
    return `${hrs} giờ ${mins} phút ${padSec} giây`;
  }
  return `${mins} phút ${padSec} giây`;
}

function isUuid(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function toUuid(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (isUuid(s)) return s;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const pad = '1234567890abcdef1234567890abcdef';
  const fullHex = (hex + pad).slice(0, 32);
  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(13, 16)}-8${fullHex.slice(17, 20)}-${fullHex.slice(20, 32)}`;
}

export default function StudentTrainingReport({
  student,
  course,
  reportDate: initialReportDate,
  trainingCenter: initialCenter,
  conclusion: initialConclusion,
  editable = false,
  showControls = true
}) {
  const currentDateFormatted = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const [reportDate, setReportDate] = useState(initialReportDate || currentDateFormatted());
  const [trainingCenter, setTrainingCenter] = useState(
    initialCenter || 'Trung Tâm Đào Tạo & Sát Hạch Lái Xe DriveEdu'
  );
  const [conclusion, setConclusion] = useState(initialConclusion || 'Đáp ứng');
  const [modules, setModules] = useState([]);
  const [customTotalHours, setCustomTotalHours] = useState('0 phút 00 giây');
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [fullCourseData, setFullCourseData] = useState(course || null);
  const [studentProgressList, setStudentProgressList] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // 1. Tự động tìm nạp Khóa học & các Chương/Bài học trực tiếp từ CSDL Supabase
  useEffect(() => {
    let isMounted = true;

    async function resolveCourse() {
      try {
        let foundCourseId = course?.id;

        // Nếu course chưa được truyền vào hoặc chưa có ID, tự động tra cứu từ Supabase theo student
        if (!foundCourseId) {
          const allCourses = await fetchCourses();
          if (Array.isArray(allCourses) && allCourses.length > 0) {
            const studentCourseName = (student?.course_name || '').trim().toLowerCase();
            const studentCourseId = student?.course_id;

            const matched = allCourses.find(c => {
              if (studentCourseId && c.id === studentCourseId) return true;
              if (Array.isArray(c.enrolled_student_ids) && student?.id && c.enrolled_student_ids.includes(student.id)) return true;
              const cName = (c.name || '').trim().toLowerCase();
              const cCode = (c.code || '').trim().toLowerCase();
              if (studentCourseName && (cName === studentCourseName || cCode === studentCourseName)) return true;
              if (studentCourseName && (cName.includes(studentCourseName) || studentCourseName.includes(cName))) return true;
              if (studentCourseName && (cCode.includes(studentCourseName) || studentCourseName.includes(cCode))) return true;
              return false;
            }) || allCourses[0];

            if (matched) {
              foundCourseId = matched.id;
            }
          }
        }

        // Tải chi tiết các chương (chapters) và bài học (lessons) của khóa học từ Supabase
        if (foundCourseId) {
          const detailedCourse = await fetchCourseById(foundCourseId);
          if (isMounted && detailedCourse) {
            setFullCourseData(detailedCourse);
            return;
          }
        }

        if (isMounted && course) {
          setFullCourseData(course);
        }
      } catch (err) {
        console.warn('Không thể tải dữ liệu khóa học từ Supabase:', err);
        if (isMounted && course) setFullCourseData(course);
      }
    }

    resolveCourse();

    return () => {
      isMounted = false;
    };
  }, [course, student]);

  // 2. Tải tiến độ học tập thực tế của học viên từ CSDL Supabase (bảng study_progress)
  useEffect(() => {
    if (student?.id) {
      setLoadingDb(true);
      fetchStudentProgressApi(student.id)
        .then(data => {
          setStudentProgressList(Array.isArray(data) ? data : []);
        })
        .catch(err => console.warn('Không thể tải tiến độ học từ Supabase:', err))
        .finally(() => setLoadingDb(false));
    }
  }, [student]);

  // 3. Hiển thị tất cả các chương bài học của khóa học cùng thời lượng thực tế từ CSDL Supabase (từng giờ, phút, giây)
  useEffect(() => {
    // BUG FIX: Không render nếu dữ liệu chưa load xong (tránh flash "0 phút")
    if (loadingDb) return;

    const chapters = fullCourseData?.chapters || [];
    const studentPct = Number(student?.progress) || 0;
    const sortedChapters = [...chapters].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    // Lấy tiến độ lưu trong localStorage làm fallback / đồng bộ realtime
    let localChapterProgress = {};
    if (typeof window !== 'undefined' && (student?.id || student?.username) && fullCourseData?.id) {
      try {
        const key1 = `driveedu_progress_${student.id}_${fullCourseData.id}`;
        const key2 = `driveedu_progress_${student.username}_${fullCourseData.id}`;
        const raw1 = localStorage.getItem(key1);
        const raw2 = localStorage.getItem(key2);
        if (raw1) localChapterProgress = JSON.parse(raw1);
        else if (raw2) localChapterProgress = JSON.parse(raw2);
      } catch (e) {}
    }

    // BUG FIX: Build lookup map từ lesson_id thật → chapter để match chính xác
    // Tránh dùng toUuid() hash fake vì backend lưu UUID thật từ bảng lessons
    const lessonIdToChapterId = {};
    sortedChapters.forEach(ch => {
      (ch.lessons || []).forEach(l => {
        if (l.id) lessonIdToChapterId[l.id] = ch.id;
      });
    });

    // BUG FIX: Gom tất cả study_progress records theo chapter_id thực
    // Mỗi record trong DB có lesson_id = UUID thật → tra ngược ra chapter
    const chapterSecMap = {}; // { chapterId: totalSeconds }
    const chapterCompMap = {}; // { chapterId: isCompleted }
    const lessonStudiedSet = new Set(); // lesson_id đã học

    (studentProgressList || []).forEach(r => {
      if (!r) return;
      const watched = Number(r.watched_seconds) || 0;
      const isComp = !!r.is_completed;
      const rLessonId = r.lesson_id;

      // Cách 1: Dùng r.lessons?.chapter_id (join từ backend)
      let chId = r.lessons?.chapter_id || null;

      // Cách 2+: Tra từ lesson lookup map (chính xác và không cần join)
      if (!chId && rLessonId && lessonIdToChapterId[rLessonId]) {
        chId = lessonIdToChapterId[rLessonId];
      }

      // Cách 3: Nếu r.lesson_id trùng với ch.id (trường hợp chapter_id bị lưu nhầm vào lesson_id)
      if (!chId && rLessonId) {
        const directCh = sortedChapters.find(c => c.id === rLessonId);
        if (directCh) chId = directCh.id;
      }

      if (chId) {
        chapterSecMap[chId] = (chapterSecMap[chId] || 0) + watched;
        if (isComp) chapterCompMap[chId] = true;
        if (watched > 0 && rLessonId) lessonStudiedSet.add(rLessonId);
      }
    });

    const studiedRows = [];
    let totalSec = 0;

    sortedChapters.forEach((ch, chIdx) => {
      const lessons = [...(ch.lessons || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      // Giây từ DB
      let chapterStudiedSec = chapterSecMap[ch.id] || 0;

      // BUG FIX: Lấy max giữa DB và localStorage (không bỏ sót giờ)
      const localSec = Number(
        localChapterProgress[ch.id]?.studiedSeconds ||
        localChapterProgress[toUuid(ch.id)]?.studiedSeconds ||
        0
      );
      chapterStudiedSec = Math.max(chapterStudiedSec, localSec);

      // Thống kê các bài học đã học trong chương
      const studiedLessonNames = lessons
        .filter(l => lessonStudiedSet.has(l.id))
        .map((l, lIdx) => l.title?.trim() || `Bài ${lIdx + 1}`);

      totalSec += chapterStudiedSec;

      // Chuẩn hóa tên tiêu đề chương
      const rawTitle = (ch.title || '').trim();
      let displayTitle = '';
      const match = rawTitle.match(/^chương\s*(\d+)[:\s-]*(.*)$/i) || rawTitle.match(/^chuong\s*(\d+)[:\s-]*(.*)$/i);
      if (match) {
        const num = match[1] || (chIdx + 1);
        const rest = (match[2] || '').trim();
        displayTitle = rest ? `Chương ${num}: ${rest}` : `Chương ${num}`;
      } else {
        displayTitle = `Chương ${chIdx + 1}: ${rawTitle}`;
      }

      if (studiedLessonNames.length > 0 && lessons.length > 0) {
        displayTitle += ` (Đã học ${studiedLessonNames.length}/${lessons.length} bài: ${studiedLessonNames.join(', ')})`;
      }

      studiedRows.push({
        id: chIdx + 1,
        title: displayTitle,
        defaultDuration: formatExactTime(chapterStudiedSec)
      });
    });

    if (studiedRows.length > 0) {
      setModules(studiedRows);
      setCustomTotalHours(formatExactTime(totalSec));
      setConclusion(studentPct >= 80 ? 'Đáp ứng' : `Chưa đáp ứng (Tiến độ: ${studentPct}%)`);
    } else {
      setModules([
        {
          id: 1,
          title: 'Chương 1: Quy định chung và Hệ thống Biển báo Giao thông',
          defaultDuration: '0 phút 00 giây'
        }
      ]);
      setCustomTotalHours('0 phút 00 giây');
      setConclusion(studentPct >= 80 ? 'Đáp ứng' : `Chưa đáp ứng (Tiến độ: ${studentPct}%)`);
    }
  }, [fullCourseData, student, studentProgressList, loadingDb]);


  // Format ngày sinh
  const formatDob = (dobStr) => {
    if (!dobStr) return '................................';
    try {
      if (dobStr.includes('-')) {
        const parts = dobStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dobStr;
    } catch (e) {
      return dobStr;
    }
  };

  // Tính toán thông tin hiển thị
  const studentName = student?.full_name || 'Nguyễn Văn An';
  const studentCode = student?.cccd || student?.id?.substring(0, 12) || '038098001122';
  const studentDob = formatDob(student?.dob);
  const courseCode = course?.code || 'KH-B2-2026-01';
  const licenseTier = course?.license_tier || (student?.course_name?.includes('C') ? 'C' : student?.course_name?.includes('B1') ? 'B1' : 'B2');
  const avatarSrc = student?.avatar_url || '';

  // Xử lý in ấn
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Cập nhật số giờ từng môn
  const handleDurationChange = (index, value) => {
    const updated = [...modules];
    updated[index].defaultDuration = value;
    setModules(updated);
  };

  // Xuất file Microsoft Word (.doc) chuẩn 100% không bị lỗi hỏng file
  const handleExportWord = () => {
    const tableRows = modules.map((m) => `
      <tr>
        <td style="border: 1px solid #000000; text-align: center; padding: 6px 8px; font-size: 13pt; font-family: 'Times New Roman', serif;">${m.id}</td>
        <td style="border: 1px solid #000000; text-align: left; padding: 6px 10px; font-size: 13pt; font-family: 'Times New Roman', serif;">${m.title}</td>
        <td style="border: 1px solid #000000; text-align: center; padding: 6px 8px; font-size: 13pt; font-family: 'Times New Roman', serif;">${m.defaultDuration}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Báo Cáo Quá Trình Đào Tạo - ${studentName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt;
            margin: 42.5pt 56.7pt 42.5pt 56.7pt;
            mso-header-margin: 36.0pt;
            mso-footer-margin: 36.0pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 13pt;
            color: #000000;
            line-height: 1.35;
          }
          h2 {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 2pt;
            text-transform: uppercase;
            font-family: 'Times New Roman', serif;
          }
          p.date-sub {
            text-align: center;
            font-style: italic;
            font-size: 13pt;
            margin-top: 0pt;
            margin-bottom: 14pt;
          }
          p.section-title {
            font-weight: bold;
            font-size: 13pt;
            margin-top: 10pt;
            margin-bottom: 5pt;
          }
          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          td, th {
            font-family: 'Times New Roman', serif;
          }
        </style>
      </head>
      <body lang="VI">
        <div class="Section1">
          <h2>BÁO CÁO QUÁ TRÌNH ĐÀO TẠO CỦA HỌC VIÊN</h2>
          <p class="date-sub">(Ngày báo cáo: ${reportDate || '...... / ...... / 2026'})</p>

          <p class="section-title">I. Thông tin học viên:</p>
          <table border="1" cellpadding="6" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #000000;">
            <tr>
              <td width="72%" style="border: 1px solid #000000; vertical-align: top; padding: 8px 12px;">
                <p style="margin: 4px 0;"><strong>1. Họ và tên:</strong> ${studentName}</p>
                <p style="margin: 4px 0;"><strong>2. Mã học viên:</strong> ${studentCode}</p>
                <p style="margin: 4px 0;"><strong>3. Ngày sinh:</strong> ${studentDob}</p>
                <p style="margin: 4px 0;"><strong>4. Mã khóa học:</strong> ${courseCode}</p>
                <p style="margin: 4px 0;"><strong>5. Hạng đào tạo:</strong> Hạng ${licenseTier}</p>
                <p style="margin: 4px 0;"><strong>6. Cơ sở đào tạo:</strong> ${trainingCenter}</p>
              </td>
              <td width="28%" align="center" style="border: 1px solid #000000; vertical-align: middle; padding: 8px; text-align: center;">
                <table border="1" cellpadding="0" cellspacing="0" width="115" height="150" style="border-collapse: collapse; border: 1px solid #000000; margin: 0 auto; text-align: center;">
                  <tr>
                    <td align="center" style="vertical-align: middle; background-color: #f2f2f2; font-size: 11pt; font-weight: bold; padding: 10px;">
                      ẢNH THẺ 3x4
                      <br/>
                      <span style="font-size: 9pt; font-weight: normal; color: #555555;">(Dán ảnh thẻ)</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p class="section-title">II. Thông tin quá trình đào tạo:</p>
          <table border="1" cellpadding="6" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #000000;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th width="10%" style="border: 1px solid #000000; text-align: center; font-weight: bold; padding: 6px;">STT</th>
                <th width="62%" style="border: 1px solid #000000; text-align: center; font-weight: bold; padding: 6px;">Nội dung đào tạo</th>
                <th width="28%" style="border: 1px solid #000000; text-align: center; font-weight: bold; padding: 6px;">Thời lượng đào tạo</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr>
                <td colspan="2" style="border: 1px solid #000000; text-align: right; font-weight: bold; padding: 6px 12px;">Tổng số thời gian:</td>
                <td style="border: 1px solid #000000; text-align: center; font-weight: bold; padding: 6px;">${customTotalHours}</td>
              </tr>
              <tr>
                <td colspan="2" style="border: 1px solid #000000; text-align: right; font-weight: bold; padding: 6px 12px;">Kết luận:</td>
                <td style="border: 1px solid #000000; text-align: center; font-weight: bold; padding: 6px;">${conclusion}</td>
              </tr>
            </tbody>
          </table>

          <br/>
          <table border="0" cellpadding="4" cellspacing="0" width="100%">
            <tr>
              <td width="50%" align="center" style="vertical-align: top; text-align: center;">
                <p style="margin: 0; font-weight: bold; text-transform: uppercase;">XÁC NHẬN CỦA CƠ SỞ ĐÀO TẠO</p>
                <p style="margin: 2px 0 0 0; font-style: italic; font-size: 11pt; color: #444444;">(Ký, ghi rõ họ tên và đóng dấu)</p>
                <br/><br/><br/><br/>
                <p style="margin: 0; font-weight: bold;">${trainingCenter}</p>
              </td>
              <td width="50%" align="center" style="vertical-align: top; text-align: center;">
                <p style="margin: 0; font-weight: bold; text-transform: uppercase;">XÁC NHẬN CỦA HỌC VIÊN</p>
                <p style="margin: 2px 0 0 0; font-style: italic; font-size: 11pt; color: #444444;">(Ký, ghi rõ họ tên)</p>
                <br/><br/><br/><br/>
                <p style="margin: 0; font-weight: bold; text-transform: uppercase;">${studentName}</p>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_DaoTao_${student?.username || studentCode}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Xuất file HTML độc lập (mở bất kỳ trình duyệt nào, in hoặc lưu PDF không bao giờ lỗi)
  const handleExportHtml = () => {
    const tableRows = modules.map((m) => `
      <tr>
        <td style="border: 1px solid #000; text-align: center; padding: 8px;">${m.id}</td>
        <td style="border: 1px solid #000; text-align: left; padding: 8px 12px;">${m.title}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 8px;">${m.defaultDuration}</td>
      </tr>
    `).join('');

    const standaloneHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Quá Trình Đào Tạo - ${studentName}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 20mm; }
    body { font-family: "Times New Roman", Times, serif; color: #000; max-width: 800px; margin: 20px auto; padding: 20px; line-height: 1.45; }
    h1 { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
    .date-sub { text-align: center; font-style: italic; font-size: 14px; margin-bottom: 20px; }
    .section-title { font-weight: bold; font-size: 15px; margin-top: 15px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #000; padding: 6px 10px; font-size: 14px; }
    .no-border td { border: none; }
    .signature { display: flex; justify-content: space-between; margin-top: 35px; text-align: center; }
    .signature > div { width: 48%; }
    .sig-title { font-weight: bold; text-transform: uppercase; }
    .sig-note { font-style: italic; font-size: 12px; color: #555; }
    .sig-space { height: 90px; }
    .print-btn-bar { text-align: center; margin-bottom: 25px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
    .print-btn { background: #16a34a; color: white; padding: 8px 18px; font-size: 14px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; }
    @media print { .print-btn-bar { display: none; } body { margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="print-btn" onclick="window.print()">🖨️ In Báo Cáo / Lưu Dưới Dạng PDF (A4)</button>
    <p style="margin: 6px 0 0 0; font-size: 12px; color: #15803d;">(Tại hộp thoại in, chọn "Save as PDF" / "Lưu dưới dạng PDF" để xuất PDF chuẩn đẹp)</p>
  </div>

  <h1>BÁO CÁO QUÁ TRÌNH ĐÀO TẠO CỦA HỌC VIÊN</h1>
  <div class="date-sub">(Ngày báo cáo: ${reportDate || '...... / ...... / 2026'})</div>

  <div class="section-title">I. Thông tin học viên:</div>
  <table style="border: 1px solid #000;">
    <tr>
      <td style="width: 72%; vertical-align: top; padding: 12px; border-right: 1px solid #000;">
        <p style="margin: 4px 0;"><strong>1. Họ và tên:</strong> ${studentName}</p>
        <p style="margin: 4px 0;"><strong>2. Mã học viên:</strong> ${studentCode}</p>
        <p style="margin: 4px 0;"><strong>3. Ngày sinh:</strong> ${studentDob}</p>
        <p style="margin: 4px 0;"><strong>4. Mã khóa học:</strong> ${courseCode}</p>
        <p style="margin: 4px 0;"><strong>5. Hạng đào tạo:</strong> Hạng ${licenseTier}</p>
        <p style="margin: 4px 0;"><strong>6. Cơ sở đào tạo:</strong> ${trainingCenter}</p>
      </td>
      <td style="width: 28%; text-align: center; vertical-align: middle; padding: 10px;">
        <div style="width: 120px; height: 160px; border: 1px solid #000; margin: 0 auto; display: flex; align-items: center; justify-content: center; background: #fafafa; font-weight: bold; font-size: 12px;">
          ẢNH THẺ 3x4
        </div>
      </td>
    </tr>
  </table>

  <div class="section-title">II. Thông tin quá trình đào tạo:</div>
  <table>
    <thead>
      <tr style="background-color: #f5f5f5;">
        <th style="width: 10%; text-align: center;">STT</th>
        <th style="width: 62%; text-align: center;">Nội dung đào tạo</th>
        <th style="width: 28%; text-align: center;">Thời lượng đào tạo</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      <tr>
        <td colspan="2" style="text-align: right; font-weight: bold; padding: 8px 12px;">Tổng số thời gian:</td>
        <td style="text-align: center; font-weight: bold;">${customTotalHours}</td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: right; font-weight: bold; padding: 8px 12px;">Kết luận:</td>
        <td style="text-align: center; font-weight: bold;">${conclusion}</td>
      </tr>
    </tbody>
  </table>

  <div class="signature">
    <div>
      <div class="sig-title">XÁC NHẬN CỦA CƠ SỞ ĐÀO TẠO</div>
      <div class="sig-note">(Ký, ghi rõ họ tên và đóng dấu)</div>
      <div class="sig-space"></div>
      <div style="font-weight: bold;">${trainingCenter}</div>
    </div>
    <div>
      <div class="sig-title">XÁC NHẬN CỦA HỌC VIÊN</div>
      <div class="sig-note">(Ký, ghi rõ họ tên)</div>
      <div class="sig-space"></div>
      <div style="font-weight: bold; text-transform: uppercase;">${studentName}</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_DaoTao_${student?.username || studentCode}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* THANH ĐIỀU KHIỂN & CÔNG CỤ NHANH (Bị ẩn khi in bằng CSS no-print) */}
      {showControls && (
        <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tùy chỉnh thông tin báo cáo */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Ngày báo cáo
              </label>
              <input
                type="text"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Kết luận
              </label>
              <select
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Đáp ứng">Đáp ứng (Đạt)</option>
                <option value="Chưa đáp ứng">Chưa đáp ứng</option>
                <option value="Hoàn thành xuất sắc">Hoàn thành xuất sắc</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tùy chỉnh số giờ
              </label>
              <button
                type="button"
                onClick={() => setIsEditingHours(!isEditingHours)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  isEditingHours 
                    ? 'bg-amber-50 text-amber-700 border-amber-300' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isEditingHours ? '✓ Xong số giờ' : '✏️ Chỉnh số giờ'}
              </button>
            </div>
          </div>

          {/* Các nút hành động chính */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                type="button"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center transition-all gap-1.5"
                title="Mở hộp thoại in và chọn 'Lưu dưới dạng PDF'"
              >
                <Printer className="w-4 h-4" /> In / Lưu PDF (A4)
              </button>

              <button
                onClick={handleExportWord}
                type="button"
                className="px-3.5 py-2 bg-blue-800 hover:bg-blue-900 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center transition-all gap-1.5"
                title="Tải file Word chuẩn mở trực tiếp trên Microsoft Word"
              >
                <FileText className="w-4 h-4" /> Tải Word (.DOC)
              </button>

              <button
                onClick={handleExportHtml}
                type="button"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center transition-all gap-1.5"
                title="Tải file HTML độc lập mở trên mọi trình duyệt không cần Word"
              >
                <Download className="w-4 h-4" /> Tải HTML
              </button>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-0.5">
              (Chọn <strong>"Lưu dưới dạng PDF"</strong> tại hộp thoại In để lưu file PDF sắc nét)
            </p>
          </div>
        </div>
      )}

      {/* KHUNG HIỂN THỊ BIỂU MẪU A4 TIÊU CHUẨN */}
      {loadingDb && (
        <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          <span className="text-sm font-medium">Đang tải dữ liệu thời gian học từ hệ thống...</span>
        </div>
      )}
      <div className={`flex justify-center bg-slate-100/70 p-2 sm:p-6 rounded-2xl border border-slate-200/80 overflow-x-auto ${loadingDb ? 'opacity-30 pointer-events-none' : ''}`}>
        <div
          id="printable-student-report"
          className="w-full max-w-[794px] bg-white text-black p-8 sm:p-12 shadow-2xl rounded-sm border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0"
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            color: '#000000',
            lineHeight: 1.45,
            minHeight: '1050px',
          }}
        >
          {/* 1. TIÊU ĐỀ BÁO CÁO */}
          <div className="text-center mb-6">
            <h1 className="text-[19px] sm:text-[22px] font-bold tracking-tight uppercase leading-snug">
              BÁO CÁO QUÁ TRÌNH ĐÀO TẠO CỦA HỌC VIÊN
            </h1>
            <p className="text-[14px] sm:text-[15px] italic mt-1 text-slate-800">
              (Ngày báo cáo: <span className="font-semibold">{reportDate || '...................'}</span>)
            </p>
          </div>

          {/* 2. MỤC I. THÔNG TIN HỌC VIÊN */}
          <div className="mb-6">
            <h2 className="text-[15px] sm:text-[16px] font-bold mb-2">
              I. Thông tin học viên:
            </h2>

            {/* Bảng khung viền Thông tin & Ảnh thẻ */}
            <div className="border border-black flex flex-row">
              {/* Cột trái: 6 mục thông tin học viên */}
              <div className="flex-1 p-3.5 sm:p-4 text-[13.5px] sm:text-[14.5px] space-y-2 border-r border-black">
                <div className="flex items-baseline">
                  <span className="font-normal w-32 shrink-0">1. Họ và tên:</span>
                  <span className="font-bold uppercase text-[14px] sm:text-[15px]">{studentName}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-normal w-32 shrink-0">2. Mã học viên:</span>
                  <span className="font-semibold font-mono">{studentCode}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-normal w-32 shrink-0">3. Ngày sinh:</span>
                  <span className="font-semibold">{studentDob}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-normal w-32 shrink-0">4. Mã khóa học:</span>
                  <span className="font-semibold">{courseCode}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-normal w-32 shrink-0">5. Hạng đào tạo:</span>
                  <span className="font-bold">Hạng {licenseTier}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-normal w-32 shrink-0">6. Cơ sở đào tạo:</span>
                  <span className="font-semibold">{trainingCenter}</span>
                </div>
              </div>

              {/* Cột phải: Khung ảnh thẻ 3x4 (Tỷ lệ và bố cục đúng theo ảnh cung cấp) */}
              <div className="w-[150px] sm:w-[170px] p-3 flex flex-col items-center justify-center bg-slate-50/40 print:bg-transparent shrink-0">
                <div className="w-[110px] h-[145px] sm:w-[120px] sm:h-[155px] border border-black flex items-center justify-center overflow-hidden bg-black print:bg-black shadow-inner">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={studentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-black text-white flex flex-col items-center justify-center p-2 text-center text-xs">
                      <ImageIcon className="w-6 h-6 mb-1 opacity-75" />
                      <span className="text-[11px] font-sans font-bold">ẢNH THẺ 3x4</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. MỤC II. THÔNG TIN QUÁ TRÌNH ĐÀO TẠO */}
          <div className="mb-8">
            <h2 className="text-[15px] sm:text-[16px] font-bold mb-2">
              II. Thông tin quá trình đào tạo:
            </h2>

            {/* Bảng 7 môn đào tạo quy chuẩn Bộ GTVT */}
            <table className="w-full border-collapse border border-black text-[13.5px] sm:text-[14px]">
              <thead>
                <tr className="bg-slate-100/60 print:bg-transparent">
                  <th className="border border-black py-2.5 px-2 text-center font-bold w-[12%] sm:w-[10%]">
                    STT
                  </th>
                  <th className="border border-black py-2.5 px-3 text-center font-bold w-[60%] sm:w-[62%]">
                    Nội dung đào tạo
                  </th>
                  <th className="border border-black py-2.5 px-2 text-center font-bold w-[28%]">
                    Thời lượng đào tạo
                  </th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="border border-black py-2 px-2 text-center font-semibold">
                      {m.id}
                    </td>
                    <td className="border border-black py-2 px-3 text-left">
                      {m.title}
                    </td>
                    <td className="border border-black py-2 px-2 text-center">
                      {isEditingHours ? (
                        <input
                          type="text"
                          value={m.defaultDuration}
                          onChange={(e) => handleDurationChange(idx, e.target.value)}
                          className="w-24 text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                        />
                      ) : (
                        <span>{m.defaultDuration}</span>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Dòng Tổng số thời gian: */}
                <tr>
                  <td
                    colSpan={2}
                    className="border border-black py-2 px-4 text-right font-bold text-[14px]"
                  >
                    Tổng số thời gian:
                  </td>
                  <td className="border border-black py-2 px-2 text-center font-bold text-[14px]">
                    {isEditingHours ? (
                      <input
                        type="text"
                        value={customTotalHours}
                        onChange={(e) => setCustomTotalHours(e.target.value)}
                        className="w-24 text-center border border-blue-400 rounded px-1 py-0.5 text-xs font-bold"
                      />
                    ) : (
                      customTotalHours
                    )}
                  </td>
                </tr>

                {/* Dòng Kết luận: */}
                <tr>
                  <td
                    colSpan={2}
                    className="border border-black py-2 px-4 text-right font-bold text-[14px]"
                  >
                    Kết luận:
                  </td>
                  <td className="border border-black py-2 px-2 text-center font-bold text-[14.5px]">
                    {conclusion}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. PHẦN CHỮ KÝ XÁC NHẬN CHÂN TRANG */}
          <div className="pt-4 flex justify-between items-start text-center text-[13.5px] sm:text-[14.5px]">
            {/* Cột trái: Cơ sở đào tạo */}
            <div className="w-[48%] space-y-1">
              <p className="font-bold uppercase tracking-tight">
                XÁC NHẬN CỦA CƠ SỞ ĐÀO TẠO
              </p>
              <p className="italic text-[12px] text-slate-700 print:text-black">
                (Ký, ghi rõ họ tên và đóng dấu)
              </p>
              {/* Khoảng trống ký tên & đóng dấu */}
              <div className="h-24 sm:h-28 flex items-center justify-center">
                <span className="text-[11px] italic text-slate-300 print:hidden select-none">
                  (Dấu & chữ ký người đại diện cơ sở)
                </span>
              </div>
              <p className="font-semibold text-slate-700 print:text-black">
                {trainingCenter}
              </p>
            </div>

            {/* Cột phải: Học viên */}
            <div className="w-[48%] space-y-1">
              <p className="font-bold uppercase tracking-tight">
                XÁC NHẬN CỦA HỌC VIÊN
              </p>
              <p className="italic text-[12px] text-slate-700 print:text-black">
                (Ký, ghi rõ họ tên)
              </p>
              {/* Khoảng trống ký tên */}
              <div className="h-24 sm:h-28 flex items-center justify-center">
                <span className="text-[11px] italic text-slate-300 print:hidden select-none">
                  (Chữ ký học viên)
                </span>
              </div>
              <p className="font-bold uppercase text-[14px] sm:text-[15px]">
                {studentName}
              </p>
            </div>
          </div>

          {/* Ghi chú chân trang in ấn chuẩn quy định */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[11px] italic text-slate-500 print:text-slate-400">
            Biểu mẫu báo cáo kết quả quá trình đào tạo học viên lái xe quy chuẩn Bộ GTVT - Hệ thống Quản Lý Đào Tạo DriveEdu
          </div>
        </div>
      </div>
    </div>
  );
}
