'use client';

import React, { useState } from 'react';
import {
  X,
  Video,
  ScrollText,
  PlusCircle,
  Percent,
  Link2,
  AlignLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Film,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { uploadVideoApi } from '../lib/api';

export default function CreateLessonModal({ isOpen, onClose, onCreateLesson, chapterTitle, chapterDuration }) {
  const [lessonData, setLessonData] = useState({
    title: '',
    type: 'video',       // 'video' | 'reading'
    content_url: '',
    content_text: '',
    min_watch_pct: 80    // Chỉ áp dụng cho video
  });

  // State hỗ trợ upload từ máy tính
  const [videoSourceType, setVideoSourceType] = useState('upload'); // 'upload' | 'url'
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  if (!isOpen) return null;

  const normalizeVideoUrl = (rawUrl) => {
    if (!rawUrl) return '';
    const url = rawUrl.trim();
    // Tự động chuyển link YouTube bất kỳ sang embed URL
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    // Google Drive
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    return url;
  };

  // Xử lý khi người dùng chọn file video từ máy
  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov|mkv|avi)$/i.test(file.name)) {
      alert('Vui lòng chọn file video hợp lệ (MP4, WebM, MOV...)!');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      alert('Dung lượng video tối đa là 100MB!');
      return;
    }

    setVideoFile(file);
    setUploadError('');
    setUploadProgress(0);

    // Tự động gợi ý tên bài giảng nếu chưa nhập
    if (!lessonData.title.trim()) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setLessonData(prev => ({ ...prev, title: cleanTitle }));
    }

    // Tạo preview video xem trước ngay tức thì
    const localPreview = URL.createObjectURL(file);
    setVideoPreviewUrl(localPreview);

    // Tải video lên server
    setIsUploading(true);
    try {
      const res = await uploadVideoApi(file, (pct) => {
        setUploadProgress(pct);
      });
      if (res?.url) {
        setLessonData(prev => ({ ...prev, content_url: res.url }));
        setUploadProgress(100);
      }
    } catch (err) {
      console.error('Upload video error:', err);
      setUploadError(err.message || 'Lỗi khi tải video lên máy chủ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lessonData.title.trim()) {
      alert('Vui lòng nhập tên bài giảng!');
      return;
    }
    if (lessonData.type === 'video') {
      if (isUploading) {
        alert('Video đang được tải lên, vui lòng đợi trong giây lát!');
        return;
      }
      if (!lessonData.content_url.trim()) {
        alert('Vui lòng chọn video từ máy tính hoặc dán link video!');
        return;
      }
    }

    onCreateLesson({
      ...lessonData,
      content_url: lessonData.type === 'video' ? normalizeVideoUrl(lessonData.content_url) : ''
    });

    // Reset form
    setLessonData({
      title: '',
      type: 'video',
      content_url: '',
      content_text: '',
      min_watch_pct: 80
    });
    setVideoFile(null);
    setVideoPreviewUrl('');
    setUploadProgress(0);
    setUploadError('');
    onClose();
  };

  const handleClose = () => {
    if (isUploading) {
      const confirmed = window.confirm('Video đang được tải lên. Bạn có chắc muốn hủy?');
      if (!confirmed) return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden animate-modal my-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-5">
          <button
            onClick={handleClose}
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
                {chapterDuration > 0 && (
                  <span className="ml-2 text-blue-300">• {chapterDuration} phút</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

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
                  <p className="text-[10px] font-normal text-slate-500 mt-0.5">Từ máy tính, YouTube...</p>
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
                <><ScrollText className="w-3.5 h-3.5 flex-shrink-0" /> Học viên phải kéo xuống cuối trang và nhấn &quot;Hoàn Thành&quot; mới qua bài tiếp</>
              )}
            </div>
          </div>

          {/* ── NGUỒN VIDEO: Tải từ máy tính HOẶC Dán Link ── */}
          {lessonData.type === 'video' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Nguồn Video <span className="text-red-500">*</span>
              </label>

              {/* Sub-tabs: Chọn cách thêm video */}
              <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setVideoSourceType('upload')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    videoSourceType === 'upload'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  Tải Lên Từ Máy Tính
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSourceType('url')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    videoSourceType === 'url'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  Dán Link (YouTube/Web)
                </button>
              </div>

              {/* LỰA CHỌN 1: Tải lên file từ máy tính */}
              {videoSourceType === 'upload' && (
                <div className="space-y-3">
                  {!videoFile && !lessonData.content_url ? (
                    <label className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
                        className="hidden"
                        onChange={e => handleFileSelect(e.target.files?.[0])}
                      />
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Nhấn để chọn file video từ máy tính
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 text-center">
                        Hỗ trợ MP4, WebM, MOV... (Tối đa 100MB)
                      </p>
                    </label>
                  ) : (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Film className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                              {videoFile ? videoFile.name : 'Video đã tải lên'}
                            </p>
                            {videoFile && (
                              <p className="text-[10px] text-slate-400">
                                {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Nút đổi video */}
                        <label className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,video/*"
                            className="hidden"
                            onChange={e => handleFileSelect(e.target.files?.[0])}
                          />
                          <RotateCcw className="w-3 h-3" />
                          Đổi video khác
                        </label>
                      </div>

                      {/* Tiến trình Upload */}
                      {isUploading && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[11px] font-bold text-blue-700">
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Đang tải video lên máy chủ...
                            </span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Hoàn thành upload */}
                      {!isUploading && lessonData.content_url && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>Video đã tải lên thành công & sẵn sàng sử dụng!</span>
                        </div>
                      )}

                      {/* Báo lỗi upload */}
                      {uploadError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {uploadError}
                          </span>
                          <button
                            type="button"
                            onClick={() => videoFile && handleFileSelect(videoFile)}
                            className="font-bold underline ml-2 shrink-0"
                          >
                            Thử lại
                          </button>
                        </div>
                      )}

                      {/* Xem thử video mini */}
                      {videoPreviewUrl && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow border border-slate-700">
                          <video
                            src={videoPreviewUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* LỰA CHỌN 2: Dán link trực tuyến */}
              {videoSourceType === 'url' && (
                <div>
                  <input
                    type="url"
                    required={lessonData.type === 'video' && videoSourceType === 'url'}
                    placeholder="Dán link YouTube (youtube.com/watch?v=... hoặc youtu.be/...) hoặc link MP4..."
                    value={lessonData.content_url}
                    onChange={e => setLessonData({ ...lessonData, content_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    💡 Hỗ trợ link YouTube thường, Google Drive hoặc file MP4 trực tuyến.
                  </p>
                </div>
              )}
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

          {/* % xem video tối thiểu — chỉ video */}
          {lessonData.type === 'video' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-blue-500" /> % Phải Xem Tối Thiểu (để qua bài tiếp)
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={lessonData.min_watch_pct}
                  onChange={e => setLessonData({ ...lessonData, min_watch_pct: Number(e.target.value) })}
                  className="flex-1 accent-blue-600"
                />
                <div className="w-14 h-9 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                  {lessonData.min_watch_pct}%
                </div>
              </div>
            </div>
          )}

          {/* Ghi chú thời lượng */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <span className="mt-0.5">⏱️</span>
            <span>
              Thời lượng của bài giảng sẽ lấy theo <strong>thời gian của chương</strong>{chapterDuration > 0 ? ` (${chapterDuration} phút)` : ''}. Không cần nhập riêng cho từng bài.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-60 ${
                lessonData.type === 'video'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang Tải Video...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Thêm Bài Giảng
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
