'use client';

import React from 'react';
import { X, FileText, Printer, Download } from 'lucide-react';
import StudentTrainingReport from './StudentTrainingReport';

export default function StudentReportModal({ isOpen, onClose, student, course }) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-50 rounded-2xl max-w-4xl w-full my-8 shadow-2xl border border-slate-200 relative flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Báo Cáo Quá Trình Đào Tạo Học Viên
              </h2>
              <p className="text-xs text-slate-500">
                Học viên: <strong className="text-slate-800">{student.full_name}</strong> (CCCD: {student.cccd})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung báo cáo cuộn mượt mà */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <StudentTrainingReport
            student={student}
            course={course}
            showControls={true}
          />
        </div>
      </div>
    </div>
  );
}
