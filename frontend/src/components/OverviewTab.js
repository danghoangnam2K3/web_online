'use client';

import React, { useEffect, useState } from 'react';
import { fetchOverviewStats } from '../lib/api';
import { BookOpen, Users, Award, TrendingUp, Star, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

export default function OverviewTab({ setActiveTab, onSelectCourse }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchOverviewStats();
      setStats(res);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Chào mừng */}
      <div className="relative overflow-hidden rounded-2xl gradient-blue-bg text-white p-6 sm:p-8 shadow-xl shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white mb-3">
            Hệ Thống Đào Tạo GPLX Quy Chuẩn 2026
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Chào mừng trở lại, Bảng Quản Trị Trường Lái
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base">
            Giám sát toàn bộ hoạt động đào tạo, bài giảng lý thuyết, mô phỏng sa hình và kết quả học viên theo thời gian thực.
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-40px] opacity-15 pointer-events-none hidden md:block">
          <BookOpen className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Số Khóa Học</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalCourses || 0}</h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> +2 khóa mới tháng này
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Số Học Viên</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalStudents || 0}</h3>
              <p className="text-xs font-medium text-blue-600 flex items-center mt-1">
                <Users className="w-3.5 h-3.5 mr-1" /> {stats?.activeStudents || 0} đang hoạt động
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tỷ Lệ Đạt Sát Hạch</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.passRatePct || 94.5}%</h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Cao hơn 5% so với năm trước
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Giờ Học Lý Thuyết</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalHoursLearned || 1420}h</h3>
              <p className="text-xs font-medium text-slate-500 flex items-center mt-1">
                <Clock className="w-3.5 h-3.5 mr-1" /> Trung bình 35h/học viên
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Biểu Đồ Thống Kê Tăng Trưởng */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Biểu Đồ Thống Kê Đăng Ký Học Viên theo Tháng</h2>
            <p className="text-xs text-slate-500">Số lượng học viên ghi danh mới từ các khóa B1, B2, C, D</p>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full w-fit">
            Năm học 2025 - 2026
          </span>
        </div>

        {/* Visual Bar Chart bằng SVG Responsive */}
        <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100">
          {stats?.monthlyStats?.map((item, index) => {
            const heightPct = Math.min(100, Math.max(20, (item.count / 120) * 100));
            return (
              <div key={index} className="flex-1 flex flex-col items-center group relative">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded transition-opacity pointer-events-none z-10">
                  {item.count} học viên
                </div>
                <div
                  className="w-full max-w-[48px] bg-gradient-to-t from-blue-700 via-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                  style={{ height: `${heightPct}%` }}
                ></div>
                <span className="text-[11px] font-medium text-slate-500 mt-2 rotate-[-20px] sm:rotate-0 text-center">
                  {item.month.split('/')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Top Khóa Học & Top Học Viên */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Danh sách Top Khóa Học */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Danh Sách Top Khóa Học</h2>
            </div>
            <button
              onClick={() => setActiveTab('courses')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
            >
              Xem tất cả <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats?.topCourses?.map((course, idx) => (
              <div
                key={course.id || idx}
                onClick={() => {
                  setActiveTab('courses');
                  if (onSelectCourse) onSelectCourse(course.id);
                }}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                      {course.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                        Hạng {course.tier}
                      </span>
                      <span>• {course.studentsCount} học viên</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full inline-flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-emerald-500 text-emerald-500" />
                    {course.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danh sách Top Học Viên */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Danh Sách Top Học Viên Xuất Sắc</h2>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
            >
              Quản lý học viên <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats?.topStudents?.map((student, idx) => (
              <div
                key={student.id || idx}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={student.avatar_url}
                    alt={student.full_name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{student.full_name}</h3>
                    <p className="text-xs text-slate-500">{student.course_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-blue-700">{student.progress}% Hoàn thành</p>
                  <p className="text-[11px] text-slate-400">Trắc nghiệm: {student.quizScore}/35 điểm</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
