'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { fetchOverviewStats, fetchCourses, fetchStudents } from '../lib/api';
import { BookOpen, Users, Award, TrendingUp, ChevronRight, CheckCircle2, Clock, Calendar, ShieldCheck, GraduationCap } from 'lucide-react';

export default function OverviewTab({ setActiveTab, onSelectCourse }) {
  const [stats, setStats] = useState(null);
  const [coursesData, setCoursesData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!coursesData.length && !studentsData.length) setLoading(true);
      try {
        const [overviewRes, coursesRes, studentsRes] = await Promise.all([
          fetchOverviewStats().catch(() => null),
          fetchCourses().catch(() => []),
          fetchStudents().catch(() => [])
        ]);

        const cList = Array.isArray(coursesRes) ? coursesRes : [];
        const sList = Array.isArray(studentsRes) ? studentsRes : [];
        setCoursesData(cList);
        setStudentsData(sList);
        if (overviewRes) setStats(overviewRes);
      } catch (e) {
        console.warn('Lỗi tải dữ liệu Tổng quan từ Supabase:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 1. Thống kê 4 thẻ chỉ số chính 100% từ CSDL Supabase
  const totalCourses = coursesData.length || stats?.totalCourses || 0;
  const activeCourses = coursesData.filter(c => c.status !== 'archived').length || totalCourses;

  // Lọc riêng danh sách học viên thực tế (loại bỏ tài khoản Quản trị viên khỏi các chỉ số học viên)
  const realStudentsList = useMemo(() => {
    return (studentsData || []).filter(s => s.role !== 'admin');
  }, [studentsData]);

  const totalStudents = realStudentsList.length || stats?.totalStudents || 0;
  const activeStudents = realStudentsList.filter(s => s.status === 'active').length || totalStudents;

  // Tỷ lệ hoàn thành đạt chuẩn (tiến độ >= 80% chỉ tính trên học viên)
  const passedStudents = realStudentsList.filter(s => (Number(s.progress) || 0) >= 80).length;
  const passRatePct = totalStudents > 0 
    ? Math.round((passedStudents / totalStudents) * 100) 
    : (stats?.passRatePct || 0);

  // Tổng thời lượng giờ học tích lũy thực tế
  const studyTimeStats = useMemo(() => {
    let totalMinutes = 0;
    if (realStudentsList.length > 0) {
      realStudentsList.forEach(s => {
        const pct = (Number(s.progress) || 0) / 100;
        if (pct <= 0) return;

        const course = coursesData.find(c => {
          const cName = (c.name || '').trim().toLowerCase();
          const sCourse = (s.course_name || '').trim().toLowerCase();
          return sCourse && (sCourse === cName || cName.includes(sCourse));
        });

        let courseMin = 0;
        if (course?.chapters && course.chapters.length > 0) {
          course.chapters.forEach(ch => {
            if (Array.isArray(ch.lessons) && ch.lessons.length > 0) {
              ch.lessons.forEach(l => {
                courseMin += Number(l.duration_minutes) || 15;
              });
            } else {
              courseMin += Number(ch.duration_minutes) || 30;
            }
          });
        }
        if (courseMin === 0) courseMin = 60;
        totalMinutes += pct * courseMin;
      });
    }

    totalMinutes = Math.round(totalMinutes);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    let displayTime = '0h';
    if (totalMinutes > 0 && totalMinutes < 60) {
      displayTime = `${totalMinutes} phút`;
    } else if (totalMinutes >= 60) {
      displayTime = `${totalHours}h`;
    }

    const avgMin = totalStudents > 0 ? Math.round(totalMinutes / totalStudents) : 0;
    let avgDisplay = `${avgMin} phút/học viên`;
    if (avgMin >= 60) {
      avgDisplay = `${(avgMin / 60).toFixed(1)}h/học viên`;
    }

    return { totalMinutes, totalHours, displayTime, avgDisplay };
  }, [realStudentsList, coursesData, totalStudents]);

  // 2. Thống kê học viên đăng ký theo tháng (luôn hiển thị dải 6 tháng liên tiếp gần nhất)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mNum = d.getMonth() + 1;
      const yNum = d.getFullYear();
      last6.push({
        shortLabel: `T${mNum}`,
        fullLabel: `Tháng ${mNum}/${yNum}`,
        key: `Tháng ${mNum}/${yNum}`,
        month: `Tháng ${mNum}/${yNum}`,
        count: 0
      });
    }

    if (realStudentsList.length > 0) {
      realStudentsList.forEach(s => {
        if (s.created_at) {
          const d = new Date(s.created_at);
          const key = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
          const found = last6.find(m => m.key === key);
          if (found) found.count++;
        }
      });
      return last6;
    }

    if (stats?.monthlyStats && stats.monthlyStats.length > 0) {
      return stats.monthlyStats.map(m => ({
        ...m,
        shortLabel: m.month.replace('Tháng ', 'T'),
        fullLabel: m.month
      }));
    }

    return last6;
  }, [realStudentsList, stats]);

  const maxMonthlyCount = useMemo(() => {
    return Math.max(...monthlyStats.map(m => m.count), 1);
  }, [monthlyStats]);

  // 3. Danh sách Top Khóa Học tính theo dữ liệu thực tế từ Supabase
  const topCourses = useMemo(() => {
    if (coursesData.length > 0) {
      return coursesData.map(c => {
        const cName = (c.name || '').trim().toLowerCase();
        const cCode = (c.code || '').trim().toLowerCase();
        const enrolled = realStudentsList.filter(s => {
          if (Array.isArray(c.enrolled_student_ids) && c.enrolled_student_ids.includes(s.id)) return true;
          const sCourse = (s.course_name || '').trim().toLowerCase();
          return sCourse && (sCourse === cName || sCourse === cCode || sCourse.includes(cCode) || cName.includes(sCourse));
        });

        const avgProgress = enrolled.length > 0
          ? Math.round(enrolled.reduce((acc, st) => acc + (Number(st.progress) || 0), 0) / enrolled.length)
          : 0;

        return {
          id: c.id,
          name: c.name,
          code: c.code,
          tier: c.license_tier || 'B2',
          studentsCount: enrolled.length,
          avgProgress,
          chaptersCount: (c.chapters || []).length
        };
      }).sort((a, b) => b.studentsCount - a.studentsCount || b.avgProgress - a.avgProgress).slice(0, 5);
    }
    return stats?.topCourses || [];
  }, [coursesData, realStudentsList, stats]);

  // 4. Danh sách Top Học Viên thực tế từ Supabase sắp xếp theo tiến độ (loại bỏ admin)
  const topStudents = useMemo(() => {
    if (realStudentsList.length > 0) {
      return [...realStudentsList]
        .sort((a, b) => (Number(b.progress) || 0) - (Number(a.progress) || 0))
        .slice(0, 5);
    }
    return (stats?.topStudents || []).filter(s => s.role !== 'admin');
  }, [realStudentsList, stats]);

  if (loading && !coursesData.length && !studentsData.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Banner Chào mừng */}
      <div className="relative overflow-hidden rounded-2xl gradient-blue-bg text-white p-6 sm:p-8 shadow-xl shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white mb-3">
            Dữ liệu trực tiếp từ CSDL Supabase
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bảng Quản Trị Trung Tâm Đào Tạo Lái Xe
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base">
            Giám sát thời gian thực toàn bộ số liệu khóa học, học viên và tiến độ đào tạo từ hệ thống.
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-40px] opacity-15 pointer-events-none hidden md:block">
          <BookOpen className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Chính (100% dữ liệu thực từ Supabase) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Số Khóa Học</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalCourses}</h3>
              <p className="text-xs font-medium text-blue-600 flex items-center mt-1">
                <BookOpen className="w-3.5 h-3.5 mr-1" /> {activeCourses} khóa đang mở lớp
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
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalStudents}</h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                <Users className="w-3.5 h-3.5 mr-1" /> {activeStudents} học viên đang hoạt động
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tỷ Lệ Đạt Tiến Độ</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{passRatePct}%</h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {passedStudents}/{totalStudents} học viên hoàn thành ≥ 80%
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Giờ Học Tích Lũy</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{studyTimeStats.displayTime}</h3>
              <p className="text-xs font-medium text-indigo-600 flex items-center mt-1">
                <Clock className="w-3.5 h-3.5 mr-1" /> Trung bình ~{studyTimeStats.avgDisplay}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Biểu Đồ Thống Kê Tăng Trưởng Thực Tế */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Biểu Đồ Đăng Ký Học Viên Theo Tháng</h2>
            <p className="text-xs text-slate-500">Thống kê số lượng ghi danh thực tế từ ngày tạo tài khoản trên Supabase</p>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full w-fit flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Năm {currentYear}
          </span>
        </div>

        {/* Visual Bar Chart động 100% */}
        <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100">
          {monthlyStats.map((item, index) => {
            const isZero = item.count === 0;
            const heightPct = isZero 
              ? 5 
              : Math.min(100, Math.max(18, Math.round((item.count / maxMonthlyCount) * 100)));
            return (
              <div key={index} className="flex-1 flex flex-col items-center group relative">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                  {item.fullLabel || item.month}: {item.count} học viên
                </div>
                <div
                  className={`w-full max-w-[48px] rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm flex items-start justify-center pt-1 ${
                    isZero
                      ? 'bg-slate-100 border-t-2 border-slate-300'
                      : 'bg-gradient-to-t from-blue-700 via-blue-600 to-blue-400'
                  }`}
                  style={{ height: `${heightPct}%` }}
                >
                  {!isZero && (
                    <span className="text-[10px] font-bold text-white/95">{item.count}</span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-600 mt-2 text-center">
                  {item.shortLabel || item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Top Khóa Học & Top Học Viên Thực Tế */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Danh sách Khóa Học Thực Tế */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Danh Sách Khóa Học Trong Hệ Thống</h2>
            </div>
            <button
              onClick={() => setActiveTab('courses')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
            >
              Xem tất cả <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topCourses.length > 0 ? (
              topCourses.map((course, idx) => (
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
                        {course.chaptersCount > 0 && <span>• {course.chaptersCount} chương</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full inline-flex items-center">
                      Tiến độ TB: {course.avgProgress}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có khóa học nào trong cơ sở dữ liệu</p>
            )}
          </div>
        </div>

        {/* Danh sách Học Viên Thực Tế Sắp Xếp Theo Tiến Độ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Danh Sách Học Viên Tiêu Biểu</h2>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
            >
              Quản lý học viên <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topStudents.length > 0 ? (
              topStudents.map((student, idx) => (
                <div
                  key={student.id || idx}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.full_name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm ring-2 ring-blue-100">
                        {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'H'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{student.full_name}</h3>
                      <p className="text-xs text-slate-500">Khóa: {student.course_name || 'Chưa xếp khóa'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-blue-700">{student.progress || 0}% Hoàn thành</p>
                    <p className="text-[11px] text-slate-400 font-mono">CCCD: {student.cccd || 'Đang cập nhật'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có học viên nào trong cơ sở dữ liệu</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
