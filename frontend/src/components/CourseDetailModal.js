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
  CheckCircle2,
  UserPlus,
  Clock,
  Award,
  Layers,
  ChevronRight,
  Sliders,
  Eye,
  Edit3,
  Save,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Percent,
  Shield,
  ArrowRight,
  ScrollText,
  Lock,
  Unlock,
  Timer,
  GraduationCap,
  RotateCcw
} from 'lucide-react';
import {
  createChapterApi,
  createLessonApi,
  updateChapterRulesApi,
  enrollStudentsApi,
  fetchStudents,
  updateCourseApi
} from '../lib/api';
import CreateLessonModal from './CreateLessonModal';
import { useAuth } from '../lib/AuthContext';

export default function CourseDetailModal({ isOpen, onClose, course, onUpdateCourse }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeSubTab, setActiveSubTab] = useState('intro'); // 'intro' | 'lessons'

  // ── States cho Tab Giới Thiệu (Chỉnh sửa) ───────────────────────────────────
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    teacher_name: '',
    license_tier: '',
    thumbnail_url: ''
  });
  const [savingIntro, setSavingIntro] = useState(false);

  // ── States cho Bước 1: Tạo Chương ───────────────────────────────────────────
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDuration, setNewChapterDuration] = useState(60);
  const [creatingChapter, setCreatingChapter] = useState(false);

  // ── States cho Bước 2: Tạo Bài Giảng ────────────────────────────────────────
  const [selectedChapterForLesson, setSelectedChapterForLesson] = useState(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  // ── States cho Bước 3: Điều Kiện Hoàn Thành ─────────────────────────────────
  // Điều kiện áp dụng TOÀN BỘ tất cả chương & bài giảng
  const [conditions, setConditions] = useState({
    // Điều kiện 1 - Thời gian & Bài kiểm tra
    min_completion_pct: 80,        // % thời gian tối thiểu của chương
    require_quiz_pass: false,      // Cần đạt bài kiểm tra chương không

    // Điều kiện 2 - Tuần tự học
    require_sequential: false,     // Cần hoàn thành bài trước rồi mới sang bài tiếp
    min_watch_pct_video: 80,       // % video phải xem để qua bài tiếp
    require_scroll_reading: true   // Tài liệu đọc phải kéo xuống cuối & nhấn hoàn thành
  });
  const [savingConditions, setSavingConditions] = useState(false);

  // ── States cho Add Học Viên ───────────────────────────────────────────────────
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      loadUnassignedStudents();
      setEditForm({
        name: course.name || '',
        description: course.description || '',
        teacher_name: course.teacher_name || '',
        license_tier: course.license_tier || '',
        thumbnail_url: course.thumbnail_url || ''
      });
      setIsEditingIntro(false);
      setActiveSubTab('intro');
    }
  }, [isOpen, course]);

  async function loadUnassignedStudents() {
    try {
      const list = await fetchStudents('', 'ALL', true);
      setUnassignedStudents(list || []);
    } catch { setUnassignedStudents([]); }
  }

  if (!isOpen || !course) return null;

  // ── Lưu thông tin giới thiệu ─────────────────────────────────────────────────
  const handleSaveIntro = async (e) => {
    e.preventDefault();
    setSavingIntro(true);
    try {
      await updateCourseApi(course.id, editForm);
      setIsEditingIntro(false);
      onUpdateCourse();
    } catch (err) {
      alert('Lỗi lưu thông tin: ' + err.message);
    } finally {
      setSavingIntro(false);
    }
  };

  // ── Bước 1: Tạo Chương ───────────────────────────────────────────────────────
  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    setCreatingChapter(true);
    try {
      const res = await createChapterApi(course.id, {
        title: newChapterTitle,
        duration_minutes: newChapterDuration,
        min_completion_pct: conditions.min_completion_pct
      });
      if (res?.success) {
        setNewChapterTitle('');
        setNewChapterDuration(60);
        onUpdateCourse();
      }
    } catch (err) {
      alert('Lỗi tạo chương: ' + err.message);
    } finally {
      setCreatingChapter(false);
    }
  };

  // ── Bước 2: Tạo Bài Giảng ────────────────────────────────────────────────────
  const handleCreateLesson = async (lessonData) => {
    if (!selectedChapterForLesson) return;
    try {
      await createLessonApi(course.id, selectedChapterForLesson.id, lessonData);
      onUpdateCourse();
    } catch (err) {
      alert('Lỗi tạo bài giảng: ' + err.message);
    }
  };

  // ── Bước 3: Lưu Điều Kiện (áp dụng toàn bộ) ─────────────────────────────────
  const handleSaveConditions = async (e) => {
    e.preventDefault();
    if (!course.chapters || course.chapters.length === 0) {
      alert('Khóa học chưa có chương! Hãy tạo chương trước.');
      return;
    }
    setSavingConditions(true);
    try {
      // Áp dụng cho từng chương
      for (const chapter of course.chapters) {
        await updateChapterRulesApi(course.id, chapter.id, conditions);
      }
      alert(`✅ Đã lưu điều kiện hoàn thành cho ${course.chapters.length} chương!`);
      onUpdateCourse();
    } catch (err) {
      alert('Lỗi lưu điều kiện: ' + err.message);
    } finally {
      setSavingConditions(false);
    }
  };

  // ── Add Học Viên ──────────────────────────────────────────────────────────────
  const handleEnrollStudents = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 học viên!');
      return;
    }
    setEnrolling(true);
    try {
      const res = await enrollStudentsApi(course.id, selectedStudentIds);
      if (res?.success) {
        alert(res.message);
        setSelectedStudentIds([]);
        loadUnassignedStudents();
        onUpdateCourse();
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const totalLessons = (course.chapters || []).reduce(
    (sum, ch) => sum + (ch.lessons?.length || 0), 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-modal border border-slate-100 relative overflow-hidden">

        {/* ── Header ── */}
        <div className="gradient-card-header text-white p-6 relative flex-shrink-0">
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500 text-white">
                  Hạng {course.license_tier}
                </span>
                <span className="text-xs text-blue-200 font-mono font-semibold">
                  Mã: {course.code}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Chế Độ Chỉnh Sửa
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white mt-1 truncate">{course.name}</h1>
              <p className="text-xs text-blue-100 mt-1 flex items-center gap-3">
                <span>Giáo viên: <strong className="text-white">{course.teacher_name}</strong></span>
                <span className="text-blue-200/60">|</span>
                <span>{course.chapters?.length || 0} chương • {totalLessons} bài giảng</span>
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 border-b border-white/15">
            <button
              onClick={() => setActiveSubTab('intro')}
              className={`flex items-center space-x-2 px-5 py-2.5 font-bold text-sm rounded-t-lg transition-all border-b-2 ${
                activeSubTab === 'intro'
                  ? 'bg-white text-blue-900 border-blue-500 shadow'
                  : 'text-blue-100 hover:bg-white/10 border-transparent'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Giới Thiệu</span>
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
              <span>Bài Học</span>
              {course.chapters && course.chapters.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[11px] bg-blue-600 text-white rounded-full">
                  {course.chapters.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">

          {/* ══════════════════════════════════════════════════════
              MỤC 1: GIỚI THIỆU KHÓA HỌC (có thể chỉnh sửa)
          ══════════════════════════════════════════════════════ */}
          {activeSubTab === 'intro' && (
            <div className="space-y-5">

              {/* Card thông tin */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" /> Thông Tin Tổng Quan Khóa Học
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditingIntro(!isEditingIntro)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isEditingIntro
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      {isEditingIntro ? (
                        <><RotateCcw className="w-3.5 h-3.5" /> Hủy Chỉnh Sửa</>
                      ) : (
                        <><Edit3 className="w-3.5 h-3.5" /> Chỉnh Sửa Thông Tin</>
                      )}
                    </button>
                  )}
                </div>

                {isEditingIntro && isAdmin ? (
                  /* Form chỉnh sửa */
                  <form onSubmit={handleSaveIntro} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên Khóa Học <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Tên khóa học..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Giáo Viên Phụ Trách</label>
                        <input
                          type="text"
                          value={editForm.teacher_name}
                          onChange={e => setEditForm({ ...editForm, teacher_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Tên giáo viên..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Hạng Đào Tạo</label>
                        <select
                          value={editForm.license_tier}
                          onChange={e => setEditForm({ ...editForm, license_tier: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          {['B1', 'B2', 'C', 'D', 'E', 'FC'].map(t => (
                            <option key={t} value={t}>Hạng {t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">URL Ảnh Đại Diện</label>
                        <input
                          type="url"
                          value={editForm.thumbnail_url}
                          onChange={e => setEditForm({ ...editForm, thumbnail_url: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Mô Tả Khóa Học</label>
                      <textarea
                        rows={4}
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Mô tả chi tiết về khóa học, mục tiêu, đối tượng học viên..."
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsEditingIntro(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={savingIntro}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingIntro ? 'Đang lưu...' : 'Lưu Thông Tin'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Chế độ xem */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3.5 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">Tên khóa học</span>
                      <span className="font-bold text-slate-800">{course.name}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">Mã quản lý</span>
                      <span className="font-mono font-bold text-blue-700">{course.code}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">Hạng đào tạo</span>
                      <span className="font-bold text-blue-800">GPLX Hạng {course.license_tier}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">Giáo viên phụ trách</span>
                      <span className="font-bold text-slate-800">{course.teacher_name}</span>
                    </div>
                    <div className="md:col-span-2 p-3.5 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">Mô tả khóa học</span>
                      <p className="text-slate-700 leading-relaxed text-sm">
                        {course.description || 'Chưa có mô tả khóa học chi tiết.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card học viên ghi danh */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> 
                  Học Viên Đã Ghi Danh ({course.enrolled_student_ids?.length || 0})
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Chuyển sang tab <strong className="text-blue-700">"Bài Học"</strong> để thêm học viên mới từ danh sách học viên tự do.
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
                    Khóa học vừa được khởi tạo, chưa có học viên. Vui lòng chuyển sang "Bài Học" để phân bổ học viên.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              MỤC 2: BÀI HỌC (Quy trình 3 bước)
          ══════════════════════════════════════════════════════ */}
          {activeSubTab === 'lessons' && (
            <div className="space-y-6">

              {/* Banner học viên không có quyền */}
              {!isAdmin && (
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Bạn đang xem chương trình học dưới quyền Học Viên (Chỉ được phép xem, không chỉnh sửa).</span>
                </div>
              )}

              {/* ── BƯỚC 1: TẠO CHƯƠNG ───────────────────────────── */}
              {isAdmin && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Tạo Chương Mới</h3>
                      <p className="text-[11px] text-slate-500">Phân chia lộ trình học thành các chương với thời gian cụ thể</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <form onSubmit={handleAddChapter} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        required
                        placeholder="VD: Chương 1 — Luật Giao Thông & Biển Báo..."
                        value={newChapterTitle}
                        onChange={e => setNewChapterTitle(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <Timer className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                          type="number"
                          min={10}
                          max={480}
                          value={newChapterDuration}
                          onChange={e => setNewChapterDuration(Number(e.target.value))}
                          className="w-16 text-center text-sm font-bold text-slate-800 bg-transparent outline-none"
                        />
                        <span className="text-xs text-slate-500 whitespace-nowrap">phút</span>
                      </div>
                      <button
                        type="submit"
                        disabled={creatingChapter}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {creatingChapter ? 'Đang tạo...' : 'Thêm Chương'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ── BƯỚC 2: DANH SÁCH CHƯƠNG & TẠO BÀI GIẢNG ────── */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                    {isAdmin ? '2' : '1'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Danh Sách Chương & Bài Giảng</h3>
                    <p className="text-[11px] text-slate-500">
                      Mỗi chương gồm: Bài giảng Video / Tài Liệu Đọc → Bài Kiểm Tra Chương
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  {course.chapters && course.chapters.length > 0 ? (
                    <div className="space-y-4">
                      {course.chapters.map((ch, idx) => (
                        <div key={ch.id || idx} className="border border-slate-200 rounded-xl overflow-hidden">
                          {/* Chapter header */}
                          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 text-sm">{ch.title}</span>
                                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" /> {ch.duration_minutes || 0} phút
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" /> {ch.lessons?.length || 0} bài giảng
                                  </span>
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <Percent className="w-3 h-3" /> Hoàn thành: {ch.min_completion_pct || 80}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedChapterForLesson(ch);
                                  setIsLessonModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm whitespace-nowrap transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Thêm Bài Giảng
                              </button>
                            )}
                          </div>

                          {/* Lessons list */}
                          <div className="divide-y divide-slate-100">
                            {ch.lessons && ch.lessons.length > 0 ? (
                              <>
                                {ch.lessons.map((lesson, lIdx) => (
                                  <div
                                    key={lesson.id || lIdx}
                                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        lesson.type === 'video' ? 'bg-blue-100' :
                                        lesson.type === 'reading' ? 'bg-amber-100' : 'bg-purple-100'
                                      }`}>
                                        {lesson.type === 'video' && <Video className="w-3.5 h-3.5 text-blue-600" />}
                                        {lesson.type === 'reading' && <ScrollText className="w-3.5 h-3.5 text-amber-600" />}
                                        {lesson.type === 'quiz' && <HelpCircle className="w-3.5 h-3.5 text-purple-600" />}
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-800 text-xs block">{lesson.title}</span>
                                        <span className="text-[11px] text-slate-400">
                                          {lesson.duration_minutes || 0} phút
                                          {lesson.type === 'video' && ` • Phải xem ${lesson.min_watch_pct || 80}%`}
                                          {lesson.type === 'reading' && ' • Kéo xuống cuối trang'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                        lesson.type === 'video' ? 'bg-blue-100 text-blue-700' :
                                        lesson.type === 'reading' ? 'bg-amber-100 text-amber-700' :
                                        'bg-purple-100 text-purple-700'
                                      }`}>
                                        {lesson.type === 'video' ? 'Video' : lesson.type === 'reading' ? 'Đọc' : 'Quiz'}
                                      </span>
                                    </div>
                                  </div>
                                ))}

                                {/* Bài kiểm tra chương - badge cuối */}
                                <div className="p-3.5 bg-purple-50/50 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                      <Award className="w-3.5 h-3.5 text-purple-600" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-purple-800 text-xs block">Bài Kiểm Tra Cuối Chương</span>
                                      <span className="text-[11px] text-purple-400">
                                        Tự động mở sau khi học viên hoàn thành tất cả bài giảng
                                        {conditions.require_quiz_pass && ' • Cần đạt bài kiểm tra để hoàn thành chương'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">
                                    Auto Quiz
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="p-5 text-center">
                                <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-xs text-slate-400 italic">
                                  {isAdmin ? 'Chương này chưa có bài giảng. Nhấn "Thêm Bài Giảng" để tạo.' : 'Chương này chưa có bài giảng.'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-amber-200 rounded-xl bg-amber-50">
                      <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-amber-800">Khóa học chưa có chương bài giảng</p>
                      <p className="text-xs text-amber-600 mt-1">Hãy tạo chương ở Bước 1 phía trên trước.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── BƯỚC 3: ĐIỀU KIỆN HOÀN THÀNH (Admin only) ──── */}
              {isAdmin && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                      3
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Điều Kiện Hoàn Thành</h3>
                      <p className="text-[11px] text-slate-500">
                        Áp dụng cho <strong className="text-emerald-700">toàn bộ</strong> chương & bài giảng trong khóa học này
                      </p>
                    </div>
                  </div>
                  <div className="p-5">
                    <form onSubmit={handleSaveConditions} className="space-y-5">

                      {/* Điều Kiện 1: Thời gian & Bài kiểm tra */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">1</div>
                          <h4 className="text-sm font-bold text-blue-900">Điều Kiện Thời Gian & Bài Kiểm Tra</h4>
                        </div>

                        {/* % Thời gian tối thiểu */}
                        <div>
                          <label className="block text-xs font-bold text-blue-800 mb-2">
                            Phải học tối thiểu bao nhiêu % thời gian của chương?
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <input
                                type="range"
                                min={50}
                                max={100}
                                step={5}
                                value={conditions.min_completion_pct}
                                onChange={e => setConditions({ ...conditions, min_completion_pct: Number(e.target.value) })}
                                className="w-full accent-blue-600"
                              />
                              <div className="flex justify-between text-[10px] text-blue-500 mt-0.5">
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                              </div>
                            </div>
                            <div className="w-16 h-10 rounded-lg bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              {conditions.min_completion_pct}%
                            </div>
                          </div>
                        </div>

                        {/* Checkbox cần đạt bài kiểm tra */}
                        <div
                          onClick={() => setConditions({ ...conditions, require_quiz_pass: !conditions.require_quiz_pass })}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                            conditions.require_quiz_pass
                              ? 'bg-white border-blue-400 shadow-sm'
                              : 'bg-white/70 border-blue-200 hover:border-blue-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            conditions.require_quiz_pass
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-slate-300'
                          }`}>
                            {conditions.require_quiz_pass && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Cần đạt bài kiểm tra chương</p>
                            <p className="text-[11px] text-slate-500">
                              Học viên phải qua bài kiểm tra cuối chương mới được tính là hoàn thành chương đó
                            </p>
                          </div>
                          <Award className={`w-4 h-4 ml-auto flex-shrink-0 ${conditions.require_quiz_pass ? 'text-blue-600' : 'text-slate-300'}`} />
                        </div>
                      </div>

                      {/* Điều Kiện 2: Học tuần tự */}
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">2</div>
                          <h4 className="text-sm font-bold text-emerald-900">Điều Kiện Học Tuần Tự</h4>
                        </div>

                        {/* Checkbox cần hoàn thành bài trước */}
                        <div
                          onClick={() => setConditions({ ...conditions, require_sequential: !conditions.require_sequential })}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                            conditions.require_sequential
                              ? 'bg-white border-emerald-400 shadow-sm'
                              : 'bg-white/70 border-emerald-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            conditions.require_sequential
                              ? 'bg-emerald-600 border-emerald-600'
                              : 'border-slate-300'
                          }`}>
                            {conditions.require_sequential && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Cần hoàn thành bài trước mới sang bài tiếp theo</p>
                            <p className="text-[11px] text-slate-500">
                              Học viên chưa học bài trước thì không thể xem bài mới — học từng bài theo đúng thứ tự
                            </p>
                          </div>
                          <Lock className={`w-4 h-4 ml-auto flex-shrink-0 ${conditions.require_sequential ? 'text-emerald-600' : 'text-slate-300'}`} />
                        </div>

                        {/* Nếu bật tuần tự thì hiện các điều kiện cụ thể */}
                        {conditions.require_sequential && (
                          <div className="space-y-3 pl-2">
                            {/* % Video phải xem */}
                            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Video className="w-3.5 h-3.5 text-blue-600" />
                                <label className="text-xs font-bold text-blue-800">
                                  Bài Video: Phải xem ít nhất bao nhiêu % mới qua bài tiếp?
                                </label>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={50}
                                  max={100}
                                  step={5}
                                  value={conditions.min_watch_pct_video}
                                  onChange={e => setConditions({ ...conditions, min_watch_pct_video: Number(e.target.value) })}
                                  className="flex-1 accent-blue-600"
                                />
                                <div className="w-14 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                                  {conditions.min_watch_pct_video}%
                                </div>
                              </div>
                            </div>

                            {/* Tài liệu đọc */}
                            <div
                              onClick={() => setConditions({ ...conditions, require_scroll_reading: !conditions.require_scroll_reading })}
                              className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all select-none ${
                                conditions.require_scroll_reading
                                  ? 'bg-amber-50 border-amber-400'
                                  : 'bg-white border-slate-200 hover:border-amber-300'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                conditions.require_scroll_reading
                                  ? 'bg-amber-500 border-amber-500'
                                  : 'border-slate-300'
                              }`}>
                                {conditions.require_scroll_reading && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <ScrollText className="w-3.5 h-3.5 text-amber-600" />
                                  Bài Tài Liệu Đọc: Phải kéo xuống cuối trang & nhấn "Hoàn Thành"
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Học viên cần đọc hết tài liệu (cuộn đến cuối) rồi nhấn nút hoàn thành mới qua bài tiếp
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info note về hoàn thành chương */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <h5 className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-2">
                          <GraduationCap className="w-4 h-4 text-slate-500" />
                          Điều Kiện Hoàn Thành Khóa Học
                        </h5>
                        <div className="space-y-1.5 text-[11px] text-slate-600">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>Hoàn thành đủ <strong>{conditions.min_completion_pct}%</strong> thời gian của từng chương</span>
                          </div>
                          {conditions.require_quiz_pass && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              <span>Đạt bài kiểm tra cuối mỗi chương</span>
                            </div>
                          )}
                          {conditions.require_sequential && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              <span>Học theo đúng thứ tự (bài trước → bài sau)</span>
                            </div>
                          )}
                          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2 text-emerald-700 font-bold">
                            <Award className="w-3.5 h-3.5" />
                            <span>Hoàn thành TẤT CẢ chương → Nhận chứng nhận hoàn thành khóa học ✅</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={savingConditions || !course.chapters?.length}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          {savingConditions ? 'Đang lưu...' : `Lưu Điều Kiện (${course.chapters?.length || 0} chương)`}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ── BƯỚC 4: ADD HỌC VIÊN (Admin only) ───────────── */}
              {isAdmin && (
                <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden bg-gradient-to-br from-blue-50/30 to-white">
                  <div className="p-4 border-b border-blue-100 bg-blue-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                        4
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Thêm Học Viên Vào Khóa Học</h3>
                        <p className="text-[11px] text-slate-500">
                          Lấy học viên chưa được xếp khóa để add vào khóa học này
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleEnrollStudents}
                      disabled={enrolling || selectedStudentIds.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow whitespace-nowrap transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      {enrolling ? 'Đang thêm...' : `Thêm (${selectedStudentIds.length}) HV`}
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
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
                              <div className="flex items-center gap-3">
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
                                Chưa có khóa
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed rounded-lg bg-white">
                          Tất cả học viên đã được phân bổ vào các khóa học. (Tạo thêm tài khoản tại mục "Học viên" để thêm mới.)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            Mã khóa: <span className="font-mono font-bold text-slate-600">{course.code}</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Modal tạo bài giảng */}
      <CreateLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        onCreateLesson={handleCreateLesson}
        chapterTitle={selectedChapterForLesson?.title || ''}
      />
    </div>
  );
}
