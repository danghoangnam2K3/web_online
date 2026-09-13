'use client';

import React, { useState, useEffect } from 'react';
import { fetchCourses, createCourseApi, deleteCourseApi } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { PlusCircle, Search, Filter, BookOpen, Users, Edit3, Layers, Eye, Trash2 } from 'lucide-react';
import CreateCourseModal from './CreateCourseModal';
import CourseDetailModal from './CourseDetailModal';
import CourseDemoModal from './CourseDemoModal';

export default function CoursesTab({ initialSelectedCourseId }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoCourse, setDemoCourse] = useState(null);

  useEffect(() => {
    loadCourses();
  }, [search, selectedTier]);

  async function loadCourses() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCourses(search, selectedTier);
      setCourses(data || []);
      if (initialSelectedCourseId && data) {
        const found = data.find(c => c.id === initialSelectedCourseId);
        if (found) { setSelectedCourse(found); setIsDetailModalOpen(true); }
      }
    } catch (err) {
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCourse = async (newCourseData) => {
    if (!isAdmin) {
      alert('Tài khoản học viên không có quyền tạo khóa học!');
      return;
    }
    try {
      await createCourseApi(newCourseData);
      loadCourses();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleOpenEdit = (course) => {
    setSelectedCourse(course);
    setIsDetailModalOpen(true);
  };

  const handleOpenDemo = (course) => {
    setDemoCourse(course);
    setIsDemoModalOpen(true);
  };

  const handleDeleteCourse = async (course) => {
    const confirmed = window.confirm(
      `⚠️ Bạn có chắc chắn muốn XÓA khóa học "${course.name}"?\n\nHành động này sẽ xóa TOÀN BỘ:\n• ${course.chapters?.length || 0} chương\n• Tất cả bài giảng\n• Danh sách học viên ghi danh\n\nKhông thể khôi phục sau khi xóa!`
    );
    if (!confirmed) return;
    try {
      await deleteCourseApi(course.id);
      loadCourses();
    } catch (err) {
      alert('Lỗi xóa khóa học: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar trang Khóa Học */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-blue-600" /> Quản Lý Khóa Học GPLX
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin 
              ? 'Danh sách khóa học, tạo khóa học mới, thiết kế bài giảng lý thuyết & sa hình' 
              : 'Danh sách các khóa học đào tạo GPLX (Chế độ xem - Học viên)'}
          </p>
        </div>

        {/* Nút Add Khóa Học chỉ cho Admin */}
        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white gradient-blue-bg hover:opacity-95 shadow-md shadow-blue-500/20 flex items-center justify-center transition-all scale-[1.01] hover:scale-[1.03]"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Thêm Khóa Học Mới
          </button>
        )}
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tìm kiếm */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã khóa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filter Hạng Đào Tạo */}
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <span className="text-xs font-bold text-slate-600 hidden sm:block">Hạng:</span>
          {['ALL', 'B1', 'B2', 'C', 'D', 'E', 'FC'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedTier === tier
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tier === 'ALL' ? 'Tất cả hạng' : `Hạng ${tier}`}
            </button>
          ))}
        </div>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm font-medium flex items-start gap-3">
          <span className="text-red-500 text-lg leading-none">⚠️</span>
          <div>
            <p className="font-bold">Không thể tải dữ liệu khóa học</p>
            <p className="text-red-500 text-xs mt-1">{error}</p>
            <p className="text-slate-500 text-xs mt-2">👉 Hãy chắc chắn đã chạy file SQL schema trên Supabase để tạo các bảng cần thiết.</p>
          </div>
        </div>
      )}

      {/* Grid Danh Sách Khóa Học */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600"></div>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const chapterCount = course.chapters ? course.chapters.length : 0;
            const studentCount = course.enrolled_student_ids ? course.enrolled_student_ids.length : 0;

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Image Thumbnail & Tier Badge */}
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnail_url}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-lg shadow">
                    Hạng {course.license_tier}
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-md">
                    {course.code}
                  </div>
                  {/* Chapter count badge */}
                  {chapterCount > 0 && (
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-600" />
                      {chapterCount} chương
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-2 hover:text-blue-600 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {course.description || 'Chưa có mô tả khóa học'}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Giáo viên phụ trách:</span>
                      <span className="font-bold text-slate-800">{course.teacher_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-500">
                        <Layers className="w-3.5 h-3.5 mr-1 text-blue-600" /> Nội dung bài giảng:
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        chapterCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {chapterCount > 0 ? `${chapterCount} Chương đã tạo` : 'Chưa tạo bài giảng'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-500">
                        <Users className="w-3.5 h-3.5 mr-1 text-blue-600" /> Sĩ số học viên:
                      </span>
                      <span className="font-bold text-slate-800">{studentCount} học viên</span>
                    </div>
                  </div>

                  {/* Nút Đề Mô + Chỉnh Sửa + Xóa */}
                  <div className="flex gap-2 pt-1">
                    {/* Nút Đề Mô */}
                    <button
                      onClick={() => handleOpenDemo(course)}
                      className="flex-1 py-2.5 rounded-xl border border-violet-400 text-violet-700 font-bold text-xs hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all flex items-center justify-center gap-1.5 shadow-sm group/btn"
                      title="Xem trước nội dung khóa học"
                    >
                      <Eye className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                      Đề Mô
                    </button>

                    {/* Nút Chỉnh Sửa */}
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="flex-1 py-2.5 rounded-xl border border-blue-600 text-blue-700 font-bold text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm group/btn"
                      title="Chỉnh sửa khóa học & tạo bài giảng"
                    >
                      <Edit3 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                      Chỉnh Sửa
                    </button>

                    {/* Nút Xóa (chỉ Admin) */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteCourse(course)}
                        className="py-2.5 px-3 rounded-xl border border-red-300 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center shadow-sm group/btn"
                        title="Xóa khóa học"
                      >
                        <Trash2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy khóa học phù hợp</h3>
          <p className="text-xs text-slate-500 mt-1">Hãy thử đổi từ khóa tìm kiếm hoặc bấm nút Tạo Khóa Học Mới.</p>
        </div>
      )}

      {/* Modal Tạo Khóa Học */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCourse={handleCreateCourse}
      />

      {/* Modal Chỉnh Sửa / Chi Tiết Khóa Học */}
      <CourseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        course={selectedCourse}
        onUpdateCourse={loadCourses}
      />

      {/* Modal Đề Mô */}
      <CourseDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => { setIsDemoModalOpen(false); setDemoCourse(null); }}
        course={demoCourse}
      />
    </div>
  );
}
