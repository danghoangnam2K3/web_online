'use client';

import React, { useState } from 'react';
import { Printer, Download, FileText, CheckCircle2, UserCheck, Calendar, Building2, Award, Hash, Image as ImageIcon } from 'lucide-react';

// Dữ liệu thời lượng đào tạo chuẩn theo quy định Thông tư Bộ GTVT
export const DEFAULT_TRAINING_MODULES = [
  { id: 1, title: 'Pháp luật giao thông đường bộ', defaultDuration: '90 giờ' },
  { id: 2, title: 'Cấu tạo và sửa chữa thông thường', defaultDuration: '18 giờ' },
  { id: 3, title: 'Nghiệp vụ vận tải', defaultDuration: '14 giờ' },
  { id: 4, title: 'Đạo đức người lái xe và văn hóa giao thông', defaultDuration: '20 giờ' },
  { id: 5, title: 'Kỹ thuật lái xe', defaultDuration: '20 giờ' },
  { id: 6, title: 'Học phần mềm mô phỏng các tình huống giao thông', defaultDuration: '04 giờ' },
  { id: 7, title: 'Thực hành lái xe', defaultDuration: '84 giờ' },
];

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
  const [conclusion, setConclusion] = useState(
    initialConclusion || (student?.progress >= 80 ? 'Đáp ứng' : 'Đáp ứng')
  );
  const [modules, setModules] = useState(DEFAULT_TRAINING_MODULES);
  const [customTotalHours, setCustomTotalHours] = useState('250 giờ');
  const [isEditingHours, setIsEditingHours] = useState(false);

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

  // Xuất file Microsoft Word (.doc)
  const handleExportWord = () => {
    const tableRows = modules.map((m) => `
      <tr>
        <td style="border: 1px solid #000; text-align: center; padding: 6px 8px; font-size: 13pt;">${m.id}</td>
        <td style="border: 1px solid #000; text-align: left; padding: 6px 10px; font-size: 13pt;">${m.title}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 6px 8px; font-size: 13pt;">${m.defaultDuration}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Báo Cáo Quá Trình Đào Tạo - ${studentName}</title>
        <style>
          @page { size: A4; margin: 15mm 20mm; }
          body { font-family: 'Times New Roman', serif; color: #000; line-height: 1.4; }
          h2 { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
          .date-sub { text-align: center; font-style: italic; font-size: 13pt; margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 13pt; margin-top: 15px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #000; padding: 6px 8px; font-size: 13pt; }
          .no-border-table td { border: none; padding: 4px 6px; }
          .info-table td { border: 1px solid #000; }
          .signature-box { margin-top: 35px; width: 100%; }
          .signature-box td { border: none; text-align: center; vertical-align: top; width: 50%; font-size: 13pt; }
          .sig-title { font-weight: bold; text-transform: uppercase; }
          .sig-note { font-style: italic; font-size: 11pt; color: #444; }
          .sig-space { height: 75px; }
        </style>
      </head>
      <body>
        <h2>BÁO CÁO QUÁ TRÌNH ĐÀO TẠO CỦA HỌC VIÊN</h2>
        <div class="date-sub">(Ngày báo cáo: ${reportDate || '...... / ...... / 2026'})</div>

        <div class="section-title">I. Thông tin học viên:</div>
        <table class="info-table" style="border: 1px solid #000; width: 100%;">
          <tr>
            <td style="width: 72%; vertical-align: top; padding: 8px 12px; border: 1px solid #000;">
              <p style="margin: 4px 0;"><strong>1. Họ và tên:</strong> ${studentName}</p>
              <p style="margin: 4px 0;"><strong>2. Mã học viên:</strong> ${studentCode}</p>
              <p style="margin: 4px 0;"><strong>3. Ngày sinh:</strong> ${studentDob}</p>
              <p style="margin: 4px 0;"><strong>4. Mã khóa học:</strong> ${courseCode}</p>
              <p style="margin: 4px 0;"><strong>5. Hạng đào tạo:</strong> Hạng ${licenseTier}</p>
              <p style="margin: 4px 0;"><strong>6. Cơ sở đào tạo:</strong> ${trainingCenter}</p>
            </td>
            <td style="width: 28%; text-align: center; vertical-align: middle; padding: 8px; border: 1px solid #000;">
              ${avatarSrc ? `<img src="${avatarSrc}" width="115" height="150" style="object-fit: cover; border: 1px solid #999;" />` : `
                <div style="width: 115px; height: 150px; border: 1px dashed #333; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 11pt; color: #666;">
                  Ảnh 3x4
                </div>
              `}
            </td>
          </tr>
        </table>

        <div class="section-title">II. Thông tin quá trình đào tạo:</div>
        <table style="border: 1px solid #000; width: 100%;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #000; width: 10%; text-align: center;">STT</th>
              <th style="border: 1px solid #000; width: 62%; text-align: center;">Nội dung đào tạo</th>
              <th style="border: 1px solid #000; width: 28%; text-align: center;">Thời lượng đào tạo</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr>
              <td colspan="2" style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 6px 12px;">Tổng số thời gian:</td>
              <td style="border: 1px solid #000; text-align: center; font-weight: bold;">${customTotalHours}</td>
            </tr>
            <tr>
              <td colspan="2" style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 6px 12px;">Kết luận:</td>
              <td style="border: 1px solid #000; text-align: center; font-weight: bold;">${conclusion}</td>
            </tr>
          </tbody>
        </table>

        <table class="signature-box">
          <tr>
            <td>
              <div class="sig-title">XÁC NHẬN CỦA CƠ SỞ ĐÀO TẠO</div>
              <div class="sig-note">(Ký, ghi rõ họ tên và đóng dấu)</div>
              <div class="sig-space"></div>
            </td>
            <td>
              <div class="sig-title">XÁC NHẬN CỦA HỌC VIÊN</div>
              <div class="sig-note">(Ký, ghi rõ họ tên)</div>
              <div class="sig-space"></div>
              <div style="font-weight: bold;">${studentName}</div>
            </td>
          </tr>
        </table>
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
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center transition-all gap-1.5"
            >
              <Printer className="w-4 h-4" /> In Báo Cáo / Xuất PDF (A4)
            </button>

            <button
              onClick={handleExportWord}
              type="button"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center transition-all gap-1.5"
            >
              <FileText className="w-4 h-4" /> Xuất Word (.DOC)
            </button>
          </div>
        </div>
      )}

      {/* KHUNG HIỂN THỊ BIỂU MẪU A4 TIÊU CHUẨN */}
      <div className="flex justify-center bg-slate-100/70 p-2 sm:p-6 rounded-2xl border border-slate-200/80 overflow-x-auto">
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
