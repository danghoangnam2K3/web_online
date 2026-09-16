'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, FileSpreadsheet, Download, Upload, CheckCircle2, AlertTriangle, AlertCircle, Users, BookOpen, ArrowRight, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchCourses, createStudentsBatchApi } from '../lib/api';

export default function ImportStudentsModal({ isOpen, onClose, onSuccess }) {
  const [courses, setCourses] = useState([]);
  const [selectedDefaultCourse, setSelectedDefaultCourse] = useState('Chưa xếp khóa');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  // Ngăn chặn trình duyệt mở file tự động nếu người dùng kéo thả trượt ra ngoài vùng dropzone
  useEffect(() => {
    if (!isOpen) return;

    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);

    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchCourses()
        .then(data => setCourses(Array.isArray(data) ? data : []))
        .catch(() => setCourses([]));
      // Reset state
      setFile(null);
      setFileName('');
      setParsedRows([]);
      setFileError('');
      setImportResult(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ─── 1. TẢI FILE EXCEL MẪU ───────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Họ và tên': 'Nguyễn Văn Minh',
        'Số CCCD': '038203001234',
        'Tên đăng nhập': 'vanminh01',
        'Mật khẩu': '123456',
        'Ngày sinh': '2001-05-15',
        'Số điện thoại': '0912345678',
        'Email': 'vanminh@gmail.com',
        'Khóa học': 'Khóa B2 K68'
      },
      {
        'Họ và tên': 'Trần Thị Thu Thảo',
        'Số CCCD': '038203005678',
        'Tên đăng nhập': '',
        'Mật khẩu': '',
        'Ngày sinh': '2002-09-20',
        'Số điện thoại': '0987654321',
        'Email': 'thuthao@gmail.com',
        'Khóa học': 'Bk13'
      },
      {
        'Họ và tên': 'Lê Hoàng Long',
        'Số CCCD': '038203009999',
        'Tên đăng nhập': 'hoanglong',
        'Mật khẩu': '654321',
        'Ngày sinh': '1999-12-08',
        'Số điện thoại': '0909112233',
        'Email': '',
        'Khóa học': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Định dạng độ rộng cột cho đẹp mắt
    worksheet['!cols'] = [
      { wch: 24 }, // Họ và tên
      { wch: 18 }, // Số CCCD
      { wch: 18 }, // Tên đăng nhập
      { wch: 14 }, // Mật khẩu
      { wch: 14 }, // Ngày sinh
      { wch: 16 }, // Số điện thoại
      { wch: 26 }, // Email
      { wch: 22 }  // Khóa học
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachHocVien');
    XLSX.writeFile(workbook, 'Mau_Nhap_Hoc_Vien_DriveEdu.xlsx');
  };

  // Helper tìm giá trị cột linh hoạt không phân biệt hoa thường và khoảng trắng
  const findRowValue = (row, candidates) => {
    if (!row || typeof row !== 'object') return '';
    const keys = Object.keys(row);
    for (const cand of candidates) {
      const cleanCand = cand.toLowerCase().replace(/[\s_\-\:]+/g, '');
      const matchedKey = keys.find(k => k.toLowerCase().replace(/[\s_\-\:]+/g, '') === cleanCand);
      if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
        return row[matchedKey];
      }
    }
    return '';
  };

  // ─── 2. ĐỌC VÀ CHUẨN HÓA DỮ LIỆU TỪ FILE EXCEL ──────────────────────────────
  const processExcelFile = (uploadedFile) => {
    if (!uploadedFile) return;

    setFileError('');
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = uploadedFile.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValidExt) {
      setFileError('Vui lòng chọn file có định dạng Excel (.xlsx, .xls) hoặc .csv!');
      return;
    }

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setLoading(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel không có sheet nào!');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          setFileError('File Excel không có dữ liệu hoặc bảng tính trống!');
          setParsedRows([]);
          setLoading(false);
          return;
        }

        // Chuẩn hóa và gán nhãn trạng thái hợp lệ
        const rows = jsonData.map((row, idx) => {
          const full_name = String(findRowValue(row, ['Họ và tên', 'Họ tên', 'Họ và Tên', 'Full Name', 'Name', 'Tên']) || '').trim();
          let cccd = String(findRowValue(row, ['Số CCCD', 'CCCD', 'Số CMND', 'CMND', 'Mã định danh', 'Identity']) || '').trim();
          let username = String(findRowValue(row, ['Tên đăng nhập', 'Tài khoản', 'Username', 'Ten dang nhap', 'Login']) || '').trim().toLowerCase();
          const password = String(findRowValue(row, ['Mật khẩu', 'Password', 'Pass', 'Mat khau']) || '').trim();
          
          let rawDob = findRowValue(row, ['Ngày sinh', 'Ngày Sinh', 'DOB', 'BirthDate', 'Ngay sinh']);
          let dob = '';
          if (rawDob instanceof Date) {
            if (!isNaN(rawDob.getTime())) {
              const y = rawDob.getFullYear();
              const m = String(rawDob.getMonth() + 1).padStart(2, '0');
              const d = String(rawDob.getDate()).padStart(2, '0');
              dob = `${y}-${m}-${d}`;
            }
          } else if (typeof rawDob === 'number' && rawDob > 10000) {
            try {
              const excelDate = new Date(Math.round((rawDob - 25569) * 86400 * 1000));
              if (!isNaN(excelDate.getTime())) {
                const y = excelDate.getFullYear();
                const m = String(excelDate.getMonth() + 1).padStart(2, '0');
                const d = String(excelDate.getDate()).padStart(2, '0');
                dob = `${y}-${m}-${d}`;
              }
            } catch (err) {}
          } else if (rawDob) {
            const str = String(rawDob).trim();
            const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (ddmmyyyy) {
              dob = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
            } else {
              dob = str;
            }
          }

          const phone = String(findRowValue(row, ['Số điện thoại', 'SĐT', 'Điện thoại', 'Phone', 'SDT', 'Telephone']) || '').trim();
          const email = String(findRowValue(row, ['Email', 'Thư điện tử', 'Mail']) || '').trim();
          const course_name = String(findRowValue(row, ['Khóa học', 'Khóa Học', 'Khóa', 'Course', 'Lớp', 'Khoa hoc']) || '').trim();

          // Kiểm tra tính hợp lệ
          const errors = [];
          if (!full_name) errors.push('Thiếu họ tên');
          if (!cccd) errors.push('Thiếu số CCCD');

          // Tự sinh username nếu để trống
          const finalUsername = username || (cccd ? `hv${cccd}` : `hv_${idx + 1}`);
          const finalPassword = password || '123456';

          return {
            rawIdx: idx + 1,
            full_name,
            cccd,
            username: finalUsername,
            isUsernameAuto: !username,
            password: finalPassword,
            isPasswordAuto: !password,
            dob,
            phone,
            email,
            course_name,
            isValid: errors.length === 0,
            errors
          };
        });

        setParsedRows(rows);
      } catch (err) {
        console.error('Lỗi đọc file Excel:', err);
        setFileError('Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file!');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setFileError('Không thể đọc dữ liệu file!');
      setLoading(false);
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  // ─── 3. TIẾN HÀNH TẠO HỌC VIÊN HÀNG LOẠT ─────────────────────────────────────
  const handleSubmitBatch = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('Không có dòng dữ liệu hợp lệ nào để nhập!');
      return;
    }

    const payload = validRows.map(r => ({
      full_name: r.full_name,
      username: r.username,
      password: r.password,
      cccd: r.cccd,
      dob: r.dob || null,
      phone: r.phone || null,
      email: r.email || null,
      course_name: r.course_name || (selectedDefaultCourse !== 'Chưa xếp khóa' ? selectedDefaultCourse : 'Chưa xếp khóa')
    }));

    setSubmitting(true);
    setImportResult(null);

    try {
      const res = await createStudentsBatchApi(payload);
      setImportResult({
        success: true,
        message: res.message || `Đã tạo thành công ${res.createdCount || payload.length} tài khoản học viên!`,
        createdCount: res.createdCount || payload.length,
        skippedCount: res.skippedCount || 0,
        skipped: res.skipped || []
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setImportResult({
        success: false,
        message: err.message || 'Lỗi khi nhập dữ liệu học viên hàng loạt'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-modal">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Nhập Tài Khoản Học Viên Hàng Loạt
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tải lên file Excel (.xlsx, .xls) hoặc CSV để tự động tạo tài khoản học viên
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Modal (Cuộn được) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Thông báo kết quả sau khi gửi API */}
          {importResult && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              importResult.success 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              {importResult.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm">{importResult.message}</p>
                {importResult.skipped && importResult.skipped.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="font-semibold text-amber-800">Các dòng bị bỏ qua do trùng hoặc thiếu thông tin:</p>
                    <ul className="list-disc pl-5 text-amber-900 space-y-0.5">
                      {importResult.skipped.slice(0, 5).map((sk, idx) => (
                        <li key={idx}>
                          Dòng {sk.row}: <strong>{sk.name}</strong> - {sk.reason}
                        </li>
                      ))}
                      {importResult.skipped.length > 5 && (
                        <li className="italic">Và {importResult.skipped.length - 5} dòng khác...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BƯỚC 1: Tải file mẫu & Hướng dẫn */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" /> Bước 1: Chuẩn bị file dữ liệu
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tải file mẫu Excel chuẩn để điền thông tin học viên (đã có sẵn các cột quy định)
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" /> Tải File Excel Mẫu (.xlsx)
            </button>
          </div>

          {/* BƯỚC 2: Khu vực Kéo thả & Chọn file */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-600" /> Bước 2: Tải lên file Excel chứa danh sách học viên
            </h4>

            {fileError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <div
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.01] shadow-inner'
                  : fileName
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processExcelFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 pointer-events-none">
                <FileSpreadsheet className="w-6 h-6" />
              </div>

              {fileName ? (
                <div className="pointer-events-none">
                  <p className="text-sm font-bold text-slate-900">{fileName}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    ✓ Đã nhận diện {parsedRows.length} dòng dữ liệu ({validCount} hợp lệ)
                  </p>
                  <span className="inline-block mt-2 text-[11px] text-slate-400 hover:text-blue-600 underline">
                    Bấm để chọn file khác
                  </span>
                </div>
              ) : (
                <div className="pointer-events-none">
                  <p className="text-sm font-bold text-slate-800">
                    Kéo thả file Excel vào đây hoặc <span className="text-emerald-600 underline">Bấm để chọn file</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hỗ trợ định dạng .xlsx, .xls hoặc .csv (dung lượng tối đa 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* BƯỚC 3: Tùy chọn gán khóa học mặc định */}
          {parsedRows.length > 0 && (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-blue-900 block">
                  Khóa học áp dụng mặc định:
                </label>
                <p className="text-[11px] text-blue-600 mt-0.5">
                  Áp dụng cho những học viên chưa được chỉ định khóa học trong file Excel
                </p>
              </div>

              <select
                value={selectedDefaultCourse}
                onChange={(e) => setSelectedDefaultCourse(e.target.value)}
                className="px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              >
                <option value="Chưa xếp khóa">Chưa xếp khóa học</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} (Hạng {c.license_tier})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BƯỚC 4: BẢNG XEM TRƯỚC DỮ LIỆU TRÍCH XUẤT (DATA PREVIEW) */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Bảng Xem Trước Dữ Liệu</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full">
                    {validCount} hợp lệ
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-100 text-red-800 rounded-full">
                      {invalidCount} lỗi
                    </span>
                  )}
                </h4>

                <span className="text-[11px] text-slate-400">
                  Hiển thị {parsedRows.length} dòng
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">#</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3 font-mono">CCCD</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3 font-mono">Mật khẩu</th>
                      <th className="py-2.5 px-3">Ngày sinh</th>
                      <th className="py-2.5 px-3">SĐT</th>
                      <th className="py-2.5 px-3">Khóa học</th>
                      <th className="py-2.5 px-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={r.isValid ? 'hover:bg-slate-50/80' : 'bg-red-50/40'}>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">
                          {r.rawIdx}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {r.full_name || <span className="text-red-500 italic">Trống</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">
                          {r.cccd || <span className="text-red-500 italic">Trống</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          @{r.username}
                          {r.isUsernameAuto && (
                            <span className="ml-1 text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1 py-0.2 rounded">
                              Tự sinh
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {r.password}
                          {r.isPasswordAuto && (
                            <span className="ml-1 text-[9px] text-slate-400 italic">(123456)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {r.dob || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {r.phone || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`font-semibold ${
                            r.course_name ? 'text-blue-700 font-bold' : 'text-slate-400 italic'
                          }`}>
                            {r.course_name || (selectedDefaultCourse !== 'Chưa xếp khóa' ? selectedDefaultCourse : 'Chưa xếp khóa')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hợp lệ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200" title={r.errors.join(', ')}>
                              <AlertCircle className="w-3 h-3 text-red-600" /> {r.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal: Hành động */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            {parsedRows.length > 0 ? (
              <span>
                Sẵn sàng tạo <strong>{validCount}</strong> tài khoản học viên hợp lệ.
                {invalidCount > 0 && <span className="text-amber-700"> (Bỏ qua {invalidCount} dòng lỗi)</span>}
              </span>
            ) : (
              <span>Vui lòng tải lên file Excel để xem trước dữ liệu học viên.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors w-full sm:w-auto"
            >
              {importResult?.success ? 'Đóng' : 'Hủy'}
            </button>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleSubmitBatch}
                disabled={validCount === 0 || submitting}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md transition-all w-full sm:w-auto ${
                  validCount === 0 || submitting
                    ? 'bg-slate-400 cursor-not-allowed opacity-70'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Tiến Hành Tạo {validCount} Học Viên
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
