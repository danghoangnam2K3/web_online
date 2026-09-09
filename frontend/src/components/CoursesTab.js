'use client';

import React, { useState, useEffect } from 'react';
import { fetchCourses, createCourseApi } from '../lib/api';
import { PlusCircle, Search, Filter, BookOpen, Users, Clock, Eye, Layers } from 'lucide-react';
import CreateCourseModal from './CreateCourseModal';
import CourseDetailModal from './CourseDetailModal';

export default function CoursesTab({ initialSelectedCourseId }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [search, selectedTier]);

  async function loadCourses() {
    setLoading(true);
    const data = await fetchCourses(search, selectedTier);
    setCourses(data || []);
    setLoading(false);

    // Nếu chọn từ dashboard
    if (initialSelectedCourseId && data) {
      const found = data.find(c => c.id === initialSelectedCourseId);
      if (found) {
        setSelectedCourse(found);
        setIsDetailModalOpen(true);
      }
    }
  }

  const handleCreateCourse = async (newCourseData) => {
    const res = await createCourseApi(newCourseData);
    if (res?.success) {
      alert(res.message);
      loadCourses();
    }
  };

  const handleViewDetail = (course) => {
    setSelectedCourse(course);
    setIsDetailModalOpen(true);
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
            Danh sách khóa học, tạo khóa học mới, thiết kế bài giảng lý thuyết & sa hình
          </p>
        </div>

        {/* Nút Add Khóa Học */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl font-bold text-sm text-white gradient-blue-bg hover:opacity-95 shadow-md shadow-blue-500/20 flex items-center justify-center transition-all scale-[1.01] hover:scale-[1.03]"
        >
          <PlusCircle className="w-5 h-5 mr-2" /> Thêm Khóa Học Mới
        </button>
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

                  {/* Nút Xem Chi Tiết Khóa Học */}
                  <button
                    onClick={() => handleViewDetail(course)}
                    className="w-full py-2.5 rounded-xl border border-blue-600 text-blue-700 font-bold text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Eye className="w-4 h-4 mr-1.5" /> Xem Chi Tiết Khóa Học
                  </button>
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

      {/* Modal Chi Tiết Khóa Học (Xem giới thiệu & tạo bài giảng 4 bước) */}
      <CourseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        course={selectedCourse}
        onUpdateCourse={loadCourses}
      />
    </div>
  );
}
