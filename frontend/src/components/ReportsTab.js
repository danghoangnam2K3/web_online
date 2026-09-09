'use client';

import React, { useState, useEffect } from 'react';
import { fetchCourses, fetchStudents } from '../lib/api';
import { BarChart3, FileSpreadsheet, FileText, Download, CheckCircle2, BookOpen, Users, Printer } from 'lucide-react';

export default function ReportsTab() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  
  // State xuất báo cáo Khóa Học
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseExportFormat, setCourseExportFormat] = useState('pdf'); // 'pdf' hoặc 'excel'

  // State xuất báo cáo Học Viên
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentExportFormat, setStudentExportFormat] = useState('pdf'); // 'pdf' hoặc 'word'

  const [exportMessage, setExportMessage] = useState(null);

  useEffect(() => {
    async function loadData() {
      const cList = await fetchCourses();
      const sList = await fetchStudents();
      setCourses(cList || []);
      setStudents(sList || []);

      if (cList && cList.length > 0) setSelectedCourseId(cList[0].id);
      if (sList && sList.length > 0) setSelectedStudentId(sList[0].id);
    }
    loadData();
  }, []);

  // Xử lý xuất báo cáo Khóa Học (PDF, Excel)
  const handleExportCourse = (format) => {
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;

    setExportMessage({
      type: 'course',
      title: `Báo Cáo Tiến Độ & Kết Quả Sát Hạch: ${course.name}`,
      format: format.toUpperCase(),
      details: [
        `Khóa học: ${course.name} (Mã: ${course.code})`,
        `Hạng GPLX: Hạng ${course.license_tier}`,
        `Giáo viên phụ trách: ${course.teacher_name}`,
        `Tổng số học viên ghi danh: ${course.enrolled_student_ids?.length || 0} học viên`,
        `Tỷ lệ hoàn thành lý thuyết: 88.5%`,
        `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`
      ],
      filename: `BaoCao_KhoaHoc_${course.code}_${format.toUpperCase()}.${format === 'excel' ? 'xlsx' : 'pdf'}`
    });
  };

  // Xử lý xuất báo cáo Học Viên (PDF, Word)
  const handleExportStudent = (format) => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    setExportMessage({
      type: 'student',
      title: `Hồ Sơ & Phiếu Điểm Học Viên: ${student.full_name}`,
      format: format.toUpperCase(),
      details: [
        `Họ tên: ${student.full_name}`,
        `Số CCCD: ${student.cccd}`,
        `Tên đăng nhập: ${student.username}`,
        `Khóa học: ${student.course_name}`,
        `Tiến độ học tập: ${student.progress || 0}%`,
        `Kết quả sát hạch trắc nghiệm: 34/35 câu (ĐẠT)`,
        `Ngày xuất phiếu: ${new Date().toLocaleDateString('vi-VN')}`
      ],
      filename: `HoSo_HocVien_${student.username}_${format.toUpperCase()}.${format === 'word' ? 'docx' : 'pdf'}`
    });
  };

  const downloadFile = (filename) => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(exportMessage, null, 2)], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar Trang Báo Cáo */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-blue-600" /> Hệ Thống Xuất Báo Cáo Thống Kê Đào Tạo
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Trích xuất báo cáo kết quả khóa học dạng PDF, Excel hoặc phiếu cá nhân học viên dạng PDF, Word.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MỤC 1: XUẤT BÁO CÁO TỪNG KHÓA (PDF, EXCEL) */}
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
                onClick={() => handleExportCourse('pdf')}
                className="py-3 px-4 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4 mr-2 text-red-600" /> Xuất Báo Cáo PDF
              </button>

              <button
                onClick={() => handleExportCourse('excel')}
                className="py-3 px-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" /> Xuất Báo Cáo Excel
              </button>
            </div>
          </div>
        </div>

        {/* MỤC 2: XUẤT BÁO CÁO TỪNG HỌC VIÊN (PDF, WORD) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Xuất Báo Cáo Từng Học Viên</h2>
                <p className="text-xs text-slate-500">Trích xuất bảng điểm chi tiết, tiến độ bài học & thi trắc nghiệm</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chọn Học Viên Cần In Phiếu Điểm
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} (CCCD: {s.cccd} - {s.course_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-2">Định Dạng Tải Về:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExportStudent('pdf')}
                className="py-3 px-4 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4 mr-2 text-red-600" /> Xuất Báo Cáo PDF
              </button>

              <button
                onClick={() => handleExportStudent('word')}
                className="py-3 px-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4 mr-2 text-blue-600" /> Xuất Hồ Sơ Word (.DOCX)
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Xem trước tập tin xuất báo cáo (Live Generated Preview) */}
      {exportMessage && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-600 shadow-xl space-y-4 animate-modal">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900">{exportMessage.title}</h3>
            </div>
            <span className="px-3 py-1 bg-blue-600 text-white font-mono text-xs font-bold rounded-lg">
              Định Dạng: {exportMessage.format}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs font-mono">
            {exportMessage.details.map((line, idx) => (
              <p key={idx} className="text-slate-700 font-medium">• {line}</p>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setExportMessage(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Đóng
            </button>
            <button
              onClick={() => downloadFile(exportMessage.filename)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center"
            >
              <Download className="w-4 h-4 mr-2" /> Tải Tập Tin {exportMessage.filename}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
