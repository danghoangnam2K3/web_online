'use client';

import React, { useState } from 'react';
import { X, Video, ScrollText, PlusCircle, Clock, Percent, Link2, AlignLeft } from 'lucide-react';

export default function CreateLessonModal({ isOpen, onClose, onCreateLesson, chapterTitle }) {
  const [lessonData, setLessonData] = useState({
    title: '',
    type: 'video',         // 'video' | 'reading'
    content_url: '',
    content_text: '',
    duration_minutes: 30,
    min_watch_pct: 80      // Chỉ áp dụng cho video
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lessonData.title.trim()) {
      alert('Vui lòng nhập tên bài giảng!');
      return;
    }
    if (lessonData.type === 'video' && !lessonData.content_url.trim()) {
      alert('Vui lòng nhập URL video!');
      return;
    }
    onCreateLesson(lessonData);
    // Reset form
    setLessonData({
      title: '',
      type: 'video',
      content_url: '',
      content_text: '',
      duration_minutes: 30,
      min_watch_pct: 80
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden animate-modal">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-extrabold text-white text-lg shadow">
              +
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Tạo Bài Giảng Mới</h2>
              <p className="text-xs text-blue-200 mt-0.5 truncate max-w-xs">
                Thuộc chương: <span className="font-bold text-white">{chapterTitle}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Tên bài giảng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tên Bài Giảng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="VD: Bài 1 — Luật Giao Thông Đường Bộ Cơ Bản"
              value={lessonData.title}
              onChange={e => setLessonData({ ...lessonData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-shadow"
            />
          </div>

          {/* Loại bài giảng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Loại Bài Giảng</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Video */}
              <button
                type="button"
                onClick={() => setLessonData({ ...lessonData, type: 'video' })}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 text-sm font-bold transition-all gap-2 ${
                  lessonData.type === 'video'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-100'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  lessonData.type === 'video' ? 'bg-blue-100' : 'bg-slate-100'
                }`}>
                  <Video className={`w-5 h-5 ${lessonData.type === 'video' ? 'text-blue-600' : 'text-slate-500'}`} />
                </div>
                <div className="text-center">
                  <p>Video Bài Giảng</p>
                  <p className="text-[10px] font-normal text-slate-500 mt-0.5">YouTube, MP4...</p>
                </div>
              </button>

              {/* Tài liệu đọc */}
              <button
                type="button"
                onClick={() => setLessonData({ ...lessonData, type: 'reading' })}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 text-sm font-bold transition-all gap-2 ${
                  lessonData.type === 'reading'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md shadow-amber-100'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  lessonData.type === 'reading' ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                  <ScrollText className={`w-5 h-5 ${lessonData.type === 'reading' ? 'text-amber-600' : 'text-slate-500'}`} />
                </div>
                <div className="text-center">
                  <p>Tài Liệu Đọc</p>
                  <p className="text-[10px] font-normal text-slate-500 mt-0.5">Văn bản, quy định...</p>
                </div>
              </button>
            </div>

            {/* Info ghi chú loại */}
            <div className={`mt-2.5 p-2.5 rounded-lg text-[11px] flex items-center gap-2 ${
              lessonData.type === 'video'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {lessonData.type === 'video' ? (
                <><Video className="w-3.5 h-3.5 flex-shrink-0" /> Học viên phải xem đủ % thời gian video quy định mới qua bài tiếp theo</>
              ) : (
                <><ScrollText className="w-3.5 h-3.5 flex-shrink-0" /> Học viên phải kéo xuống cuối trang và nhấn "Hoàn Thành" mới qua bài tiếp</>
              )}
            </div>
          </div>

          {/* URL Video (chỉ hiện khi type = video) */}
          {lessonData.type === 'video' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-blue-600" />
                  Đường Dẫn Video <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="url"
                required={lessonData.type === 'video'}
                placeholder="https://www.youtube.com/embed/..."
                value={lessonData.content_url}
                onChange={e => setLessonData({ ...lessonData, content_url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Hỗ trợ YouTube Embed URL (youtube.com/embed/...) hoặc URL MP4 trực tiếp
              </p>
            </div>
          )}

          {/* Nội dung tài liệu đọc (chỉ hiện khi type = reading) */}
          {lessonData.type === 'reading' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-amber-600" />
                  Nội Dung Tài Liệu <span className="text-slate-400 font-normal">(hoặc nhập sau)</span>
                </span>
              </label>
              <textarea
                rows={4}
                placeholder="Nhập nội dung văn bản: luật giao thông, quy định biển báo, hướng dẫn an toàn..."
                value={lessonData.content_text}
                onChange={e => setLessonData({ ...lessonData, content_text: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              />
            </div>
          )}

          {/* Thời lượng & % Video */}
          <div className={`grid gap-3 ${lessonData.type === 'video' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Thời Lượng Ước Tính
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={480}
                  value={lessonData.duration_minutes}
                  onChange={e => setLessonData({ ...lessonData, duration_minutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 pr-14 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">phút</span>
              </div>
            </div>

            {lessonData.type === 'video' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-blue-500" /> % Phải Xem Tối Thiểu
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={lessonData.min_watch_pct}
                    onChange={e => setLessonData({ ...lessonData, min_watch_pct: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-blue-500">%</span>
                </div>
              </div>
            )}
          </div>

          {/* Ghi chú bài kiểm tra */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-700 flex items-start gap-2">
            <span className="text-purple-500 mt-0.5">💡</span>
            <span>
              <strong>Bài kiểm tra cuối chương</strong> sẽ được tự động tạo sau khi học viên hoàn thành 
              tất cả bài giảng trong chương. Không cần tạo riêng.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 shadow-sm transition-colors ${
                lessonData.type === 'video'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Thêm Bài Giảng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
