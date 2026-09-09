'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Info,
  BookOpen,
  Plus,
  Video,
  FileText,
  HelpCircle,
  Users,
  Settings,
  CheckCircle,
  UserPlus,
  Clock,
  Award,
  Layers,
  ChevronRight,
  Sliders
} from 'lucide-react';
import {
  createChapterApi,
  createLessonApi,
  updateChapterRulesApi,
  enrollStudentsApi,
  fetchStudents
} from '../lib/api';
import CreateLessonModal from './CreateLessonModal';

export default function CourseDetailModal({ isOpen, onClose, course, onUpdateCourse }) {
  const [activeSubTab, setActiveSubTab] = useState('intro'); // 'intro' hoặc 'lessons'
  
  // States cho bài học & quy trình 3 bước + add học viên
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [minChapterPct, setMinChapterPct] = useState(80);
  const [selectedChapterForLesson, setSelectedChapterForLesson] = useState(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  // States cho bước 3: Điều kiện hoàn thành
  const [ruleChapterId, setRuleChapterId] = useState('');
  const [ruleMinChapterPct, setRuleMinChapterPct] = useState(80);
  const [ruleMinWatchPct, setRuleMinWatchPct] = useState(80);

  // States cho Add Học Viên
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      loadUnassignedStudents();
      if (course.chapters && course.chapters.length > 0) {
        setRuleChapterId(course.chapters[0].id);
        setRuleMinChapterPct(course.chapters[0].min_completion_pct || 80);
      }
    }
  }, [isOpen, course]);

  async function loadUnassignedStudents() {
    const list = await fetchStudents('', 'ALL', true);
    setUnassignedStudents(list);
  }

  if (!isOpen || !course) return null;

  // Bước 1: Tạo Chương
  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    const res = await createChapterApi(course.id, newChapterTitle, minChapterPct);
    if (res?.success) {
      setNewChapterTitle('');
      onUpdateCourse();
    }
  };

  // Bước 2: Tạo Bài giảng trong Chương
  const handleCreateLesson = async (lessonData) => {
    if (!selectedChapterForLesson) return;
    const res = await createLessonApi(course.id, selectedChapterForLesson.id, lessonData);
    if (res?.success) {
      onUpdateCourse();
    }
  };

  // Bước 3: Cập nhật điều kiện hoàn thành
  const handleSaveRules = async (e) => {
    e.preventDefault();
    if (!ruleChapterId) return;
    const res = await updateChapterRulesApi(
      course.id,
      ruleChapterId,
      ruleMinChapterPct,
      ruleMinWatchPct
    );
    if (res?.success) {
      alert('Đã cập nhật quy định hoàn thành chương và mở bài giảng!');
      onUpdateCourse();
    }
  };

  // Bước 4: Add Học Viên chưa add vào khóa
  const handleEnrollStudents = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 học viên chưa có khóa!');
      return;
    }
    setEnrolling(true);
    const res = await enrollStudentsApi(course.id, selectedStudentIds);
    if (res?.success) {
      alert(res.message);
      setSelectedStudentIds([]);
      loadUnassignedStudents();
      onUpdateCourse();
    }
    setEnrolling(false);
  };

  const toggleSelectStudent = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sId => sId !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-modal border border-slate-100 relative overflow-hidden">
        
        {/* Header Chi Tiết Khóa Học */}
        <div className="gradient-card-header text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <img
              src={course.thumbnail_url}
              alt={course.name}
              className="w-20 h-20 rounded-xl object-cover ring-2 ring-white/20 shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500 text-white">
                  Hạng {course.license_tier}
                </span>
                <span className="text-xs text-blue-200 font-mono font-semibold">
                  Mã: {course.code}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white mt-1">{course.name}</h1>
              <p className="text-xs text-blue-100 mt-1 flex items-center">
                Giáo viên: <strong className="ml-1 text-white">{course.teacher_name}</strong>
              </p>
            </div>
          </div>

          {/* 2 Mục chính: "Giới thiệu" và "Bài học" */}
          <div className="flex space-x-2 mt-6 border-b border-white/15">
            <button
              onClick={() => setActiveSubTab('intro')}
              className={`flex items-center space-x-2 px-5 py-2.5 font-bold text-sm rounded-t-lg transition-all border-b-2 ${
                activeSubTab === 'intro'
                  ? 'bg-white text-blue-900 border-blue-500 shadow'
                  : 'text-blue-100 hover:bg-white/10 border-transparent'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Mục Giới Thiệu</span>
            </button>

            <button
              onClick={() => setActiveSubTab('lessons')}
              className={`flex items-center space-x-2 px-5 py-2.5 font-bold text-sm rounded-t-lg transition-all border-b-2 ${
                activeSubTab === 'lessons'
                  ? 'bg-white text-blue-900 border-blue-500 shadow'
                  : 'text-blue-100 hover:bg-white/10 border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Mục Bài Học & Đào Tạo</span>
              {course.chapters && (
                <span className="ml-1.5 px-2 py-0.2 text-[11px] bg-blue-600 text-white rounded-full">
                  {course.chapters.length} chương
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* MỤC 1: GIỚI THIỆU KHÓA HỌC */}
          {activeSubTab === 'intro' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Info className="w-5 h-5 text-blue-600 mr-2" /> Thông Tin Tổng Quan Khóa Học
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 font-semibold uppercase block">Tên khóa học</span>
                    <span className="font-bold text-slate-800">{course.name}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 font-semibold uppercase block">Mã quản lý</span>
                    <span className="font-mono font-bold text-blue-700">{course.code}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 font-semibold uppercase block">Hạng đào tạo sát hạch</span>
                    <span className="font-bold text-blue-800">Giấy phép lái xe hạng {course.license_tier}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 font-semibold uppercase block">Giáo viên phụ trách</span>
                    <span className="font-bold text-slate-800">{course.teacher_name}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Mô tả khóa học</h4>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed">
                    {course.description || 'Chưa có mô tả khóa học chi tiết.'}
                  </div>
                </div>
              </div>

              {/* Thông số học viên ghi danh */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-2" /> Học Viên Đã Ghi Danh ({course.enrolled_student_ids?.length || 0})
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Chuyển sang tab <strong className="text-blue-700">"Mục Bài Học"</strong> để thêm học viên mới từ danh sách học viên tự do.
                </p>

                {course.enrolled_student_ids && course.enrolled_student_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {course.enrolled_student_ids.map((id, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold flex items-center"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Mã HV: {id}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-semibold">
                    Khóa học vừa được khởi tạo, chưa có học viên. Vui lòng chuyển sang "Mục Bài Học" để phân bổ học viên vào lớp.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MỤC 2: QUY TRÌNH TẠO BÀI HỌC (3 BƯỚC + ADD HỌC VIÊN) */}
          {activeSubTab === 'lessons' && (
            <div className="space-y-8">
              
              {/* BƯỚC 1: TẠO CHƯƠNG */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Bước 1: Tạo Chương Mới Cho Khóa Học</h3>
                    <p className="text-xs text-slate-500">Phân chia lộ trình học lý thuyết, biển báo, sa hình hoặc tình huống mô phỏng</p>
                  </div>
                </div>

                <form onSubmit={handleAddChapter} className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="VD: Chương 1: Luật Giao thông & Biển báo cấm..."
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  <div className="w-full sm:w-44 flex items-center space-x-1">
                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">% Hoàn thành:</span>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={minChapterPct}
                      onChange={(e) => setMinChapterPct(e.target.value)}
                      className="w-16 px-2 py-2 border rounded-lg text-sm text-center font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Thêm Chương
                  </button>
                </form>
              </div>

              {/* BƯỚC 2: DANH SÁCH CHƯƠNG VÀ TẠO BÀI GIẢNG */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Bước 2: Tạo Bài Giảng Của Chương</h3>
                      <p className="text-xs text-slate-500">Bài giảng bao gồm: Video bài giảng, Tài liệu đọc, hoặc Bài kiểm tra trắc nghiệm</p>
                    </div>
                  </div>
                </div>

                {course.chapters && course.chapters.length > 0 ? (
                  <div className="space-y-4">
                    {course.chapters.map((ch, idx) => (
                      <div key={ch.id || idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                        <div className="p-4 bg-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
                          <div>
                            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-2">
                              Chương {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{ch.title}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              (Yêu cầu: {ch.min_completion_pct || 80}% để hoàn thành)
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedChapterForLesson(ch);
                              setIsLessonModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg flex items-center shadow-sm w-fit"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Bài Giảng Cho Chương
                          </button>
                        </div>

                        {/* Danh sách bài giảng trong Chương */}
                        <div className="p-4 space-y-2">
                          {ch.lessons && ch.lessons.length > 0 ? (
                            ch.lessons.map((lesson, lIdx) => (
                              <div
                                key={lesson.id || lIdx}
                                className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center space-x-3">
                                  {lesson.type === 'video' && <Video className="w-4 h-4 text-blue-600" />}
                                  {lesson.type === 'reading' && <FileText className="w-4 h-4 text-amber-600" />}
                                  {lesson.type === 'quiz' && <HelpCircle className="w-4 h-4 text-purple-600" />}
                                  <div>
                                    <span className="font-bold text-slate-800">{lesson.title}</span>
                                    <span className="text-[11px] text-slate-400 ml-2">
                                      ({lesson.duration_minutes || 15} phút - Yêu cầu học {lesson.min_watch_pct || 80}%)
                                    </span>
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-100 text-slate-600">
                                  {lesson.type}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic text-center py-2">
                              Chương này chưa có bài giảng. Nhấn "Thêm Bài Giảng" để tạo Video hoặc Trắc nghiệm.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
                    ⚠️ Chưa có chương nào. Hãy thực hiện <strong>Bước 1</strong> tạo Chương trước khi thêm Bài giảng.
                  </p>
                )}
              </div>

              {/* BƯỚC 3: QUY ĐỊNH ĐIỀU KIỆN HOÀN THÀNH */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Bước 3: Tạo Điều Kiện Hoàn Thành Chương & Mở Bài Giảng</h3>
                    <p className="text-xs text-slate-500">Quy định % thời gian học để hoàn thành chương và % học bài 1 mới qua bài 2</p>
                  </div>
                </div>

                <form onSubmit={handleSaveRules} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Chương Cần Cấu Hình</label>
                    <select
                      value={ruleChapterId}
                      onChange={(e) => setRuleChapterId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold outline-none bg-white"
                    >
                      {course.chapters?.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      % Thời gian học tối thiểu hoàn thành chương
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={ruleMinChapterPct}
                        onChange={(e) => setRuleMinChapterPct(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold outline-none"
                      />
                      <span className="ml-2 font-bold text-xs text-slate-600">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      % Hoàn thành Bài 1 mới mở Bài 2
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={ruleMinWatchPct}
                        onChange={(e) => setRuleMinWatchPct(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold outline-none"
                      />
                      <span className="ml-2 font-bold text-xs text-slate-600">%</span>
                    </div>
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center shadow"
                    >
                      <Sliders className="w-3.5 h-3.5 mr-1.5" /> Lưu Điều Kiện Hoàn Thành
                    </button>
                  </div>
                </form>
              </div>

              {/* BƯỚC 4 / ADD HỌC VIÊN CHƯA ADD VÀO KHÓA */}
              <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm space-y-4 bg-gradient-to-br from-blue-50/40 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                      4
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Thêm Học Viên Vào Khóa Học</h3>
                      <p className="text-xs text-slate-500">
                        Lấy học viên chưa được xếp khóa từ trang <strong className="text-blue-700">"Học Viên"</strong> để add vào khóa học này.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleEnrollStudents}
                    disabled={enrolling || selectedStudentIds.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center shadow"
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    {enrolling ? 'Đang thêm...' : `Xác Nhận Thêm (${selectedStudentIds.length}) Học Viên`}
                  </button>
                </div>

                {/* Danh sách các học viên tự do (Chưa xếp khóa) */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {unassignedStudents.length > 0 ? (
                    unassignedStudents.map((st) => {
                      const isChecked = selectedStudentIds.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => toggleSelectStudent(st.id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <img
                              src={st.avatar_url}
                              alt={st.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <span className="font-bold text-xs text-slate-900 block">{st.full_name}</span>
                              <span className="text-[11px] text-slate-500">
                                CCCD: {st.cccd} • Tên ĐN: {st.username}
                              </span>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                            Chưa có khóa học
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed rounded-lg bg-white">
                      Tất cả học viên đã được phân bổ vào các khóa học khác. (Để có học viên mới, hãy tạo thêm tài khoản tại mục "Học viên").
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg"
          >
            Đóng Trang Chi Tiết
          </button>
        </div>
      </div>

      {/* Modal Con tạo bài giảng Step 2 */}
      <CreateLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        onCreateLesson={handleCreateLesson}
        chapterTitle={selectedChapterForLesson?.title || ''}
      />
    </div>
  );
}
