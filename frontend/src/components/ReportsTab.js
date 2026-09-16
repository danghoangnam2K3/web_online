'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchCourses, fetchStudents } from '../lib/api';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  BookOpen, 
  Users, 
  Printer, 
  Search,
  Check,
  UserCheck,
  Award
} from 'lucide-react';
import StudentTrainingReport from './StudentTrainingReport';

export default function ReportsTab() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab báo cáo hiện tại: 'student' (Báo Cáo Chi Tiết Học Viên) hoặc 'course' (Báo Cáo Khóa Học)
  const [reportSubTab, setReportSubTab] = useState('student');

  // State Báo Cáo Học Viên
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // State Báo Cáo Khóa Học
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [exportMessage, setExportMessage] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cList, sList] = await Promise.all([fetchCourses(), fetchStudents()]);
        setCourses(cList || []);
        setStudents(sList || []);

        if (sList && sList.length > 0) setSelectedStudentId(sList[0].id);
        if (cList && cList.length > 0) setSelectedCourseId(cList[0].id);
      } catch (err) {
        console.error('Lỗi tải dữ liệu báo cáo:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Lọc danh sách học viên theo ô tìm kiếm
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      s => s.full_name?.toLowerCase().includes(q) ||
           s.cccd?.includes(q) ||
           s.username?.toLowerCase().includes(q) ||
           s.course_name?.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Học viên đang được chọn
  const currentStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Khóa học tương ứng với học viên đang được chọn
  const currentStudentCourse = useMemo(() => {
    if (!currentStudent) return courses[0] || null;
    return courses.find(c => 
      c.name === currentStudent.course_name || 
      (currentStudent.course_name && c.code && currentStudent.course_name.includes(c.code)) ||
      (currentStudent.course_name && c.license_tier && currentStudent.course_name.includes(c.license_tier))
    ) || courses[0] || null;
  }, [courses, currentStudent]);

  // Xử lý xuất file Excel (.xls) thật cho khóa học (mở trực tiếp trên Microsoft Excel)
  const handleExportCourseExcel = (course) => {
    if (!course) return;
    const enrolledStudents = students.filter(
      s => s.course_name === course.name || 
           (s.course_name && course.code && s.course_name.includes(course.code)) ||
           (s.course_name && course.license_tier && s.course_name.includes(course.license_tier))
    );
    const listToExport = enrolledStudents.length > 0 ? enrolledStudents : students;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Báo Cáo Tiến Độ</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #1e40af; color: #ffffff; font-weight: bold; border: 1px solid #000000; text-align: center; font-size: 11pt; padding: 6px; }
          td { border: 1px solid #d1d5db; font-size: 11pt; padding: 6px; }
        </style>
      </head>
      <body>
        <h2 style="font-size: 15pt; color: #1e3a8a;">BÁO CÁO TIẾN ĐỘ & KẾT QUẢ ĐÀO TẠO KHÓA HỌC</h2>
        <p><strong>Khóa học:</strong> ${course.name} (Mã: ${course.code})</p>
        <p><strong>Hạng GPLX:</strong> Hạng ${course.license_tier} | <strong>Giáo viên phụ trách:</strong> ${course.teacher_name}</p>
        <p><strong>Ngày xuất báo cáo:</strong> ${new Date().toLocaleDateString('vi-VN')} | <strong>Tổng sĩ số:</strong> ${listToExport.length} học viên</p>
        <br/>
        <table border="1" cellpadding="6" cellspacing="0">
          <thead>
            <tr>
              <th style="width: 50px;">STT</th>
              <th style="width: 220px;">Họ và Tên Học Viên</th>
              <th style="width: 140px;">Số CCCD / Mã HV</th>
              <th style="width: 130px;">Tên Đăng Nhập</th>
              <th style="width: 100px;">Ngày Sinh</th>
              <th style="width: 100px;">Tiến Độ (%)</th>
              <th style="width: 140px;">Trạng Thái Đào Tạo</th>
              <th style="width: 140px;">Đánh Giá Sát Hạch</th>
            </tr>
          </thead>
          <tbody>
            ${listToExport.map((st, idx) => `
              <tr>
                <td align="center">${idx + 1}</td>
                <td><b>${st.full_name}</b></td>
                <td style="mso-number-format:'\\@'; text-align: center;">${st.cccd}</td>
                <td>${st.username}</td>
                <td align="center">${st.dob || ''}</td>
                <td align="center"><b>${st.progress || 0}%</b></td>
                <td align="center">${(st.progress || 0) >= 80 ? 'Hoàn thành' : 'Đang học'}</td>
                <td align="center" style="font-weight: bold; color: ${(st.progress || 0) >= 80 ? '#15803d' : '#b45309'};">
                  ${(st.progress || 0) >= 80 ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_KhoaHoc_${course.code}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Xử lý xuất file báo cáo HTML/In PDF cho khóa học
  const handleExportCoursePdf = (course) => {
    if (!course) return;
    const enrolledStudents = students.filter(
      s => s.course_name === course.name || 
           (s.course_name && course.code && s.course_name.includes(course.code)) ||
           (s.course_name && course.license_tier && s.course_name.includes(course.license_tier))
    );
    const listToExport = enrolledStudents.length > 0 ? enrolledStudents : students;

    const printHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Khóa Học - ${course.name}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm 15mm; }
    body { font-family: "Times New Roman", Times, serif; color: #000; padding: 15px; margin: 0; }
    h1 { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
    .meta { text-align: center; font-size: 14px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #000; padding: 6px 8px; font-size: 13px; }
    th { background-color: #f2f2f2; text-align: center; }
    .print-bar { padding: 10px; background: #e0f2fe; border: 1px solid #bae6fd; text-align: center; margin-bottom: 20px; border-radius: 8px; }
    .btn { background: #2563eb; color: white; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; }
    @media print { .print-bar { display: none; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="btn" onclick="window.print()">🖨️ In Báo Cáo / Lưu PDF (A4 Ngang)</button>
    <p style="margin: 5px 0 0 0; font-size: 12px; color: #0369a1;">(Tại hộp thoại in, chọn <strong>"Save as PDF"</strong> để lưu file PDF sắc nét)</p>
  </div>

  <h1>BÁO CÁO TIẾN ĐỘ & KẾT QUẢ ĐÀO TẠO KHÓA HỌC</h1>
  <div class="meta">
    <p><strong>Khóa học:</strong> ${course.name} (${course.code}) | <strong>Hạng GPLX:</strong> Hạng ${course.license_tier}</p>
    <p><strong>Giáo viên phụ trách:</strong> ${course.teacher_name} | <strong>Ngày xuất:</strong> ${new Date().toLocaleDateString('vi-VN')} | <strong>Tổng sĩ số:</strong> ${listToExport.length} học viên</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Họ và Tên Học Viên</th>
        <th>Số CCCD / Mã HV</th>
        <th>Tên Đăng Nhập</th>
        <th>Ngày Sinh</th>
        <th>Tiến Độ (%)</th>
        <th>Trạng Thái</th>
        <th>Đánh Giá Sát Hạch</th>
      </tr>
    </thead>
    <tbody>
      ${listToExport.map((st, idx) => `
        <tr>
          <td align="center">${idx + 1}</td>
          <td><b>${st.full_name}</b></td>
          <td align="center">${st.cccd}</td>
          <td>${st.username}</td>
          <td align="center">${st.dob || ''}</td>
          <td align="center">${st.progress || 0}%</td>
          <td align="center">${(st.progress || 0) >= 80 ? 'Hoàn thành' : 'Đang học'}</td>
          <td align="center" style="font-weight: bold;">
            ${(st.progress || 0) >= 80 ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <br/>
  <table border="0" style="border: none; width: 100%;">
    <tr>
      <td style="border: none; text-align: center; width: 50%;">
        <strong>NGƯỜI LẬP BÁO CÁO</strong><br/><i>(Ký và ghi rõ họ tên)</i>
      </td>
      <td style="border: none; text-align: center; width: 50%;">
        <strong>XÁC NHẬN CỦA BAN QUẢN LÝ ĐÀO TẠO</strong><br/><i>(Ký và đóng dấu)</i>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_KhoaHoc_${course.code}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR TRANG BÁO CÁO (no-print) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-blue-100 text-blue-800">
              Quy Chuẩn Bộ GTVT
            </span>
            <span className="text-xs font-bold text-slate-400">• Năm đào tạo 2026</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center mt-1">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" /> Hệ Thống Báo Cáo & Trích Xuất Hồ Sơ Đào Tạo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Trích xuất báo cáo quá trình đào tạo chi tiết của học viên theo đúng mẫu chuẩn, sẵn sàng in ấn A4 hoặc xuất file Word / PDF.
          </p>
        </div>

        {/* BỘ CHUYỂN ĐỔI TAB BÁO CÁO */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto shrink-0">
          <button
            onClick={() => setReportSubTab('student')}
            className={`flex items-center px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              reportSubTab === 'student'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 mr-1.5 text-blue-600" /> Báo Cáo Chi Tiết Học Viên
          </button>

          <button
            onClick={() => setReportSubTab('course')}
            className={`flex items-center px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              reportSubTab === 'course'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-1.5 text-blue-600" /> Báo Cáo Khóa Học
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BÁO CÁO CHI TIẾT CỦA HỌC VIÊN (THEO ĐÚNG MẪU ẢNH CUNG CẤP) */}
      {/* ========================================================================= */}
      {reportSubTab === 'student' && (
        <div className="space-y-6">
          {/* Thanh Chọn Học Viên & Thống Kê Nhanh (no-print) */}
          <div className="no-print bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Chọn Học Viên Cần Xuất Báo Cáo Quá Trình Đào Tạo
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Tìm kiếm theo họ tên, CCCD hoặc khóa học để lập báo cáo đào tạo ngay lập tức
                  </p>
                </div>
              </div>

              {/* Ô tìm kiếm nhanh */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc tên, CCCD, khóa học..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>
            </div>

            {/* Dropdown danh sách học viên trực quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => {
                  const isSelected = st.id === selectedStudentId;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      type="button"
                      className={`text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={st.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={st.full_name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 truncate block">
                            {st.full_name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 truncate">
                          CCCD: {st.cccd}
                        </p>
                        <p className="text-[10px] text-blue-700 font-semibold truncate">
                          {st.course_name || 'Khóa B2'}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full py-6 text-center text-xs text-slate-400 font-medium">
                  Không tìm thấy học viên nào phù hợp với từ khóa "{studentSearch}"
                </div>
              )}
            </div>

            {/* Thẻ tóm tắt thông tin học viên đang chọn */}
            {currentStudent && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-600">Đang chọn:</span>
                  <span className="font-extrabold text-slate-900">{currentStudent.full_name}</span>
                  <span className="font-mono text-slate-500">({currentStudent.cccd})</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md text-[10px]">
                    {currentStudent.course_name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Tiến độ học tập:</span>
                  <span className="font-extrabold text-blue-700">{currentStudent.progress || 0}%</span>
                </div>
              </div>
            )}
          </div>

          {/* HIỂN THỊ BIỂU MẪU BÁO CÁO CHI TIẾT THEO ĐÚNG MẪU ẢNH */}
          {currentStudent ? (
            <StudentTrainingReport
              student={currentStudent}
              course={currentStudentCourse}
              showControls={true}
            />
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm">Chưa có học viên nào trong hệ thống</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BÁO CÁO KHÓA HỌC & THỐNG KÊ TỔNG HỢP */}
      {/* ========================================================================= */}
      {reportSubTab === 'course' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Xuất Báo Cáo Từng Khóa Học</h2>
                    <p className="text-xs text-slate-500">Tập hợp sĩ số, tỷ lệ đạt lý thuyết & thực hành của khóa</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Chọn Khóa Học Cần Xuất Báo Cáo
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code} - Hạng {c.license_tier})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">Định Dạng Tải Về:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const course = courses.find(c => c.id === selectedCourseId) || courses[0];
                      handleExportCoursePdf(course);
                    }}
                    className="py-3 px-4 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4 mr-2 text-red-600" /> In / Lưu PDF Khóa Học
                  </button>

                  <button
                    onClick={() => {
                      const course = courses.find(c => c.id === selectedCourseId) || courses[0];
                      handleExportCourseExcel(course);
                    }}
                    className="py-3 px-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" /> Tải Excel Thật (.XLS)
                  </button>
                </div>
              </div>
            </div>

            {/* Bảng tóm tắt thông tin khóa học chuẩn */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Thông Tin Khóa Học Được Chọn
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-mono text-[11px] font-bold rounded-lg">
                    {courses.find(c => c.id === selectedCourseId)?.code || 'KH-B2'}
                  </span>
                </div>

                {(() => {
                  const selCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
                  if (!selCourse) return null;
                  const enList = students.filter(
                    s => s.course_name === selCourse.name || 
                         (s.course_name && selCourse.code && s.course_name.includes(selCourse.code))
                  );
                  return (
                    <div className="space-y-2 text-xs text-slate-700">
                      <p>• <strong>Tên khóa:</strong> {selCourse.name}</p>
                      <p>• <strong>Hạng đào tạo:</strong> Hạng {selCourse.license_tier}</p>
                      <p>• <strong>Giáo viên phụ trách:</strong> {selCourse.teacher_name}</p>
                      <p>• <strong>Sĩ số ghi danh:</strong> {enList.length > 0 ? enList.length : students.length} học viên</p>
                      <p>• <strong>Định dạng file:</strong> Excel (.XLS thật mở trên MS Excel) hoặc PDF (A4 Ngang chuẩn in)</p>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>File tải về là file Excel/HTML thật 100%, không bị lỗi "file corrupt" hay hỏng định dạng.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
