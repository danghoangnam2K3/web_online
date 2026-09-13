'use client';

import React, { useState } from 'react';
import {
  X,
  Play,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Lock,
  Eye,
  BookOpen,
  Clock,
  Layers,
  Video,
  ArrowLeft,
  ScrollText,
  Award,
  ExternalLink
} from 'lucide-react';

// Chuyển đổi mọi định dạng link video (YouTube watch/short/youtu.be, Google Drive, MP4, Vimeo) thành embed hợp lệ
function getVideoEmbed(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();

  // 1. Direct video file (.mp4, .webm, .ogg, .mov)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
    return { type: 'video', src: url };
  }

  // 2. YouTube (xử lý link watch?v=, youtu.be/, shorts/, embed/)
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
      originalUrl: url
    };
  }

  // 3. Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'iframe',
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      originalUrl: url
    };
  }

  // 4. Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[3]}`,
      originalUrl: url
    };
  }

  // 5. Generic URL
  return { type: 'iframe', src: url, originalUrl: url };
}

export default function CourseDemoModal({ isOpen, onClose, course }) {
  const [expandedChapters, setExpandedChapters] = useState({});
  const [activeLesson, setActiveLesson] = useState(null); // { chapterIdx, lessonIdx, lesson }
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  if (!isOpen || !course) return null;

  const chapters = course.chapters || [];
  const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);

  const toggleChapter = (idx) => {
    setExpandedChapters(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const openLesson = (chIdx, lIdx, lesson) => {
    setActiveLesson({ chapterIdx: chIdx, lessonIdx: lIdx, lesson });
    setScrolledToBottom(false);
    setShowQuiz(false);
  };

  const markLessonComplete = (chIdx, lIdx) => {
    const key = `${chIdx}-${lIdx}`;
    setCompletedLessons(prev => new Set([...prev, key]));
    setActiveLesson(null);
    setShowQuiz(false);
  };

  const handleReadingScroll = (e) => {
    const el = e.target;
    const isBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    if (isBottom) setScrolledToBottom(true);
  };

  const getLessonIcon = (type) => {
    if (type === 'video') return <Video className="w-4 h-4 text-blue-500" />;
    if (type === 'reading') return <ScrollText className="w-4 h-4 text-amber-500" />;
    if (type === 'quiz') return <HelpCircle className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  const getLessonTypeBadge = (type) => {
    if (type === 'video') return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">VIDEO</span>;
    if (type === 'reading') return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">ĐỌC</span>;
    if (type === 'quiz') return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700">QUIZ</span>;
    return null;
  };

  const isLessonCompleted = (chIdx, lIdx) => completedLessons.has(`${chIdx}-${lIdx}`);
  const completedCount = completedLessons.size;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-100 relative overflow-hidden">

        {/* Header Demo */}
        <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 text-white p-5 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-white/20 text-white text-[11px] font-bold rounded-md uppercase tracking-wide">
                  Chế Độ Đề Mô
                </span>
                <span className="px-2 py-0.5 bg-blue-500/50 text-white text-[11px] font-bold rounded-md">
                  Hạng {course.license_tier}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white mt-0.5 leading-tight">{course.name}</h2>
            </div>
          </div>

          {/* Progress bar demo */}
          <div className="flex items-center gap-3 text-xs text-white/80">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>{chapters.length} chương</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{totalLessons} bài giảng</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-emerald-200 font-bold">{completedCount}/{totalLessons} đã xem</span>
            </div>
          </div>

          {totalLessons > 0 && (
            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalLessons) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Sidebar - Danh sách chương */}
          <div className="w-72 flex-shrink-0 border-r border-slate-200 overflow-y-auto bg-slate-50/70">
            <div className="p-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">Nội Dung Khóa Học</p>
              {chapters.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  Khóa học chưa có chương bài nào.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {chapters.map((ch, chIdx) => {
                    const isExpanded = expandedChapters[chIdx] !== false; // default expanded
                    const chapterLessons = ch.lessons || [];
                    const chCompletedCount = chapterLessons.filter((_, lIdx) => isLessonCompleted(chIdx, lIdx)).length;
                    const chCompleted = chCompletedCount === chapterLessons.length && chapterLessons.length > 0;

                    return (
                      <div key={ch.id || chIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        {/* Chapter header */}
                        <button
                          onClick={() => toggleChapter(chIdx)}
                          className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {chCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-500">{chIdx + 1}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{ch.title}</p>
                              <p className="text-[10px] text-slate-400">
                                {chCompletedCount}/{chapterLessons.length} bài • {ch.duration_minutes || 0} phút
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                        </button>

                        {/* Lesson list */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 divide-y divide-slate-100">
                            {chapterLessons.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic p-3">Chưa có bài giảng</p>
                            ) : (
                              chapterLessons.map((lesson, lIdx) => {
                                const completed = isLessonCompleted(chIdx, lIdx);
                                const isActive = activeLesson?.chapterIdx === chIdx && activeLesson?.lessonIdx === lIdx;

                                return (
                                  <button
                                    key={lesson.id || lIdx}
                                    onClick={() => openLesson(chIdx, lIdx, lesson)}
                                    className={`w-full p-2.5 pl-4 flex items-center gap-2.5 text-left transition-all hover:bg-slate-50 ${
                                      isActive ? 'bg-violet-50 border-l-2 border-l-violet-500' : ''
                                    }`}
                                  >
                                    {completed ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-xs truncate ${isActive ? 'font-bold text-violet-700' : 'font-medium text-slate-700'}`}>
                                        {lesson.title}
                                      </p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        {getLessonIcon(lesson.type)}
                                        <span className="text-[10px] text-slate-400">{lesson.duration_minutes || 0} phút</span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })
                            )}

                            {/* Quiz chương */}
                            {ch.quiz && (
                              <button
                                onClick={() => openLesson(chIdx, 'quiz', { ...ch.quiz, type: 'quiz', title: `Bài Kiểm Tra: ${ch.title}` })}
                                className={`w-full p-2.5 pl-4 flex items-center gap-2.5 text-left transition-all hover:bg-purple-50 ${
                                  activeLesson?.chapterIdx === chIdx && activeLesson?.lessonIdx === 'quiz' ? 'bg-purple-50 border-l-2 border-l-purple-500' : ''
                                }`}
                              >
                                <Award className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-purple-700 truncate">Bài Kiểm Tra Chương</p>
                                  <span className="text-[10px] text-purple-400">Sau khi học xong các bài</span>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            {!activeLesson ? (
              /* Màn hình chào */
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center mb-5 shadow-sm">
                  <Play className="w-9 h-9 text-violet-600" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-2">Chọn Bài Giảng Để Xem Trước</h3>
                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                  Chọn một bài giảng từ danh sách bên trái để xem nội dung trong chế độ đề mô.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <Video className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <span className="text-blue-700 font-bold">Video Bài Giảng</span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <ScrollText className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <span className="text-amber-700 font-bold">Tài Liệu Đọc</span>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                    <Award className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <span className="text-purple-700 font-bold">Bài Kiểm Tra</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Nội dung bài giảng */
              <div className="flex flex-col h-full">
                {/* Lesson header */}
                <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => setActiveLesson(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getLessonIcon(activeLesson.lesson.type)}
                      {getLessonTypeBadge(activeLesson.lesson.type)}
                      <span className="text-xs text-slate-400">
                        {chapters[activeLesson.chapterIdx]?.title}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                      {activeLesson.lesson.title}
                    </h3>
                  </div>
                  {isLessonCompleted(activeLesson.chapterIdx, activeLesson.lessonIdx) && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã Hoàn Thành
                    </div>
                  )}
                </div>

                {/* Lesson content */}
                <div className="flex-1 overflow-y-auto" onScroll={activeLesson.lesson.type === 'reading' ? handleReadingScroll : undefined}>

                  {/* VIDEO */}
                  {activeLesson.lesson.type === 'video' && (() => {
                    const embed = getVideoEmbed(activeLesson.lesson.content_url);
                    return (
                      <div className="p-5">
                        <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-lg mb-3 relative border border-slate-800">
                          {embed ? (
                            embed.type === 'video' ? (
                              <video
                                src={embed.src}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                              >
                                Trình duyệt không hỗ trợ phát video này.
                              </video>
                            ) : (
                              <iframe
                                src={embed.src}
                                title={activeLesson.lesson.title}
                                className="w-full h-full border-0"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
                              <Play className="w-16 h-16 mb-3 opacity-40" />
                              <p className="text-sm">Chưa có URL video hoặc đường dẫn không hợp lệ</p>
                            </div>
                          )}
                        </div>

                        {/* Nút mở ngoài phòng trường hợp YouTube chặn embed hoặc user muốn xem trực tiếp */}
                        {activeLesson.lesson.content_url && (
                          <div className="mb-4 flex items-center justify-between text-xs px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600">
                            <span className="truncate max-w-sm font-mono text-[11px] text-slate-500">
                              {activeLesson.lesson.content_url}
                            </span>
                            <a
                              href={activeLesson.lesson.content_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 shrink-0"
                            >
                              <span>Xem trên YouTube / Web</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Yêu cầu xem ít nhất <strong>{activeLesson.lesson.min_watch_pct || 80}%</strong> thời lượng video để hoàn thành bài này.
                            Thời lượng: <strong>{activeLesson.lesson.duration_minutes || 0} phút</strong>
                          </span>
                        </div>
                      <button
                        onClick={() => markLessonComplete(activeLesson.chapterIdx, activeLesson.lessonIdx)}
                        disabled={isLessonCompleted(activeLesson.chapterIdx, activeLesson.lessonIdx)}
                        className="mt-4 w-full py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-default flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isLessonCompleted(activeLesson.chapterIdx, activeLesson.lessonIdx)
                          ? 'Đã Hoàn Thành Bài Này'
                          : 'Đánh Dấu Hoàn Thành (Demo)'}
                      </button>
                    </div>
                  );
                })()}

                  {/* READING */}
                  {activeLesson.lesson.type === 'reading' && (
                    <div className="p-5">
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-4">
                        <div className="p-4 border-b border-slate-100 bg-amber-50 flex items-center gap-2">
                          <ScrollText className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-amber-800">Tài Liệu Đọc</span>
                          <span className="ml-auto text-[11px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                            Kéo xuống cuối trang để hoàn thành
                          </span>
                        </div>
                        <div
                          className="p-6 text-sm text-slate-700 leading-relaxed overflow-y-auto max-h-80 space-y-3"
                          onScroll={handleReadingScroll}
                        >
                          {activeLesson.lesson.content_text ? (
                            <div className="whitespace-pre-wrap">{activeLesson.lesson.content_text}</div>
                          ) : (
                            <>
                              <p>📌 <strong>Nội dung tài liệu đọc của bài: {activeLesson.lesson.title}</strong></p>
                              <p>Đây là nội dung mẫu của tài liệu đọc. Trong hệ thống thực tế, nội dung này sẽ được admin nhập vào khi tạo bài giảng.</p>
                              <p>Học viên cần đọc hết toàn bộ nội dung và kéo xuống cuối trang, sau đó nhấn nút <strong>"Hoàn Thành Bài Đọc"</strong> để được tính là đã hoàn thành bài này.</p>
                              <p>─────────────────────────────────</p>
                              <p>Nội dung chi tiết của tài liệu sẽ xuất hiện ở đây. Hệ thống sẽ theo dõi quá trình đọc của học viên thông qua sự kiện cuộn trang.</p>
                              <p>Khi học viên kéo đến đây là đã đọc hết tài liệu. Nhấn nút bên dưới để hoàn thành.</p>
                            </>
                          )}
                          {/* Sentinel element */}
                          <div className="pt-4 border-t border-dashed border-slate-200 text-center text-[11px] text-emerald-600 font-bold">
                            ✅ Đã đọc đến cuối tài liệu
                          </div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 mb-3 transition-all ${
                        scrolledToBottom ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-slate-100 border border-slate-200 text-slate-500'
                      }`}>
                        {scrolledToBottom ? (
                          <><CheckCircle2 className="w-4 h-4" /> Đã đọc đến cuối tài liệu — Bạn có thể nhấn hoàn thành!</>
                        ) : (
                          <><Lock className="w-4 h-4" /> Hãy kéo xuống cuối tài liệu để mở khóa nút hoàn thành</>
                        )}
                      </div>

                      <button
                        onClick={() => markLessonComplete(activeLesson.chapterIdx, activeLesson.lessonIdx)}
                        disabled={!scrolledToBottom || isLessonCompleted(activeLesson.chapterIdx, activeLesson.lessonIdx)}
                        className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isLessonCompleted(activeLesson.chapterIdx, activeLesson.lessonIdx)
                          ? 'Đã Hoàn Thành Bài Đọc'
                          : 'Hoàn Thành Bài Đọc'}
                      </button>
                    </div>
                  )}

                  {/* QUIZ */}
                  {activeLesson.lesson.type === 'quiz' && (
                    <div className="p-5">
                      <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="w-5 h-5 text-purple-600" />
                          <h4 className="text-sm font-extrabold text-purple-900">Bài Kiểm Tra Cuối Chương</h4>
                        </div>
                        <p className="text-xs text-purple-700 leading-relaxed">
                          Đây là bài kiểm tra được tạo tự động sau khi học viên hoàn thành tất cả bài giảng trong chương. 
                          Bài kiểm tra giúp củng cố kiến thức và là điều kiện hoàn thành chương (nếu admin bật yêu cầu đạt bài kiểm tra).
                        </p>
                      </div>

                      {/* Sample quiz questions */}
                      <div className="space-y-4">
                        {[
                          { q: 'Câu hỏi mẫu 1: Tốc độ tối đa cho phép trong khu dân cư là bao nhiêu?', opts: ['40 km/h', '50 km/h', '60 km/h', '80 km/h'], ans: 1 },
                          { q: 'Câu hỏi mẫu 2: Khi gặp đèn đỏ, người điều khiển xe phải?', opts: ['Tăng tốc vượt qua', 'Dừng lại trước vạch dừng', 'Giảm tốc từ từ rồi qua', 'Còi hiệu xin đường'], ans: 1 },
                        ].map((q, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <p className="text-xs font-bold text-slate-800 mb-3">{q.q}</p>
                            <div className="space-y-2">
                              {q.opts.map((opt, oIdx) => (
                                <div key={oIdx} className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors ${
                                  oIdx === q.ans ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200'
                                }`}>
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                    oIdx === q.ans ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                                  }`}>
                                    {oIdx === q.ans && <div className="w-2 h-2 bg-white rounded-full" />}
                                  </div>
                                  {opt}
                                  {oIdx === q.ans && <span className="ml-auto text-[10px] font-bold text-emerald-600">✓ Đáp án đúng</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Trong chế độ đề mô, đáp án đúng được hiển thị để admin kiểm tra. Học viên sẽ chọn câu trả lời và nộp bài.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Eye className="w-3.5 h-3.5 text-violet-500" />
            <span>Chế độ <strong className="text-violet-700">Đề Mô</strong> — Chỉ dành cho admin kiểm tra nội dung</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Đóng Đề Mô
          </button>
        </div>
      </div>
    </div>
  );
}
