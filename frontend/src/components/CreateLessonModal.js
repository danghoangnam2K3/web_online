'use client';

import React, { useState } from 'react';
import { X, Video, FileText, HelpCircle, PlusCircle } from 'lucide-react';

export default function CreateLessonModal({ isOpen, onClose, onCreateLesson, chapterTitle }) {
  const [lessonData, setLessonData] = useState({
    title: '',
    type: 'video',
    content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    content_text: '',
    duration_minutes: 30,
    min_watch_pct: 80
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lessonData.title) {
      alert('Vui lòng nhập tên bài giảng!');
      return;
    }
    onCreateLesson(lessonData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-modal border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Bước 2: Tạo Bài Giảng</h2>
            <p className="text-xs text-slate-500 font-medium">Thuộc: {chapterTitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên Bài Giảng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Bài 1: Luật Giao Thông Đường Bộ"
              value={lessonData.title}
              onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Loại Bài Giảng</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLessonData({ ...lessonData, type: 'video' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  lessonData.type === 'video'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Video className="w-5 h-5 mb-1 text-blue-600" />
                Video Bài Giảng
              </button>

              <button
                type="button"
                onClick={() => setLessonData({ ...lessonData, type: 'reading' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  lessonData.type === 'reading'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-5 h-5 mb-1 text-amber-600" />
                Tài Liệu Đọc
              </button>

              <button
                type="button"
                onClick={() => setLessonData({ ...lessonData, type: 'quiz' })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  lessonData.type === 'quiz'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-5 h-5 mb-1 text-purple-600" />
                Bài Kiểm Tra
              </button>
            </div>
          </div>

          {lessonData.type === 'video' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Đường Dẫn Video (Embed URL / MP4)</label>
              <input
                type="text"
                placeholder="https://www.youtube.com/embed/..."
                value={lessonData.content_url}
                onChange={(e) => setLessonData({ ...lessonData, content_url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          )}

          {lessonData.type === 'reading' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nội Dung Tài Liệu Đọc</label>
              <textarea
                rows={3}
                placeholder="Nhập nội dung văn bản quy định, luật giao thông..."
                value={lessonData.content_text}
                onChange={(e) => setLessonData({ ...lessonData, content_text: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời lượng ước tính (Phút)</label>
              <input
                type="number"
                value={lessonData.duration_minutes}
                onChange={(e) => setLessonData({ ...lessonData, duration_minutes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">% Thời gian xem bắt buộc</label>
              <input
                type="number"
                value={lessonData.min_watch_pct}
                onChange={(e) => setLessonData({ ...lessonData, min_watch_pct: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" /> Thêm Bài Giảng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
