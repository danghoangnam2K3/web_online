'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { warmUpServer, prefetchAllTabsData } from '../lib/api';
import Header from '../components/Header';
import OverviewTab from '../components/OverviewTab';
import CoursesTab from '../components/CoursesTab';
import StudentsTab from '../components/StudentsTab';
import ReportsTab from '../components/ReportsTab';
import StudentPortal from '../components/StudentPortal';

const VALID_TABS = ['overview', 'courses', 'students', 'reports'];

function getTabFromHash() {
  if (typeof window === 'undefined') return 'overview';
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash) ? hash : 'overview';
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Chế độ xem: nếu user.role === 'student' thì mặc định 'student', ngược lại 'admin'
  const isStudent = user?.role === 'student';
  const [viewMode, setViewMode] = useState(isStudent ? 'student' : 'admin');

  // Khởi tạo tab từ URL hash (giữ nguyên tab sau F5)
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourseIdFromOverview, setSelectedCourseIdFromOverview] = useState(null);

  // Kích hoạt đánh thức server và tải trước dữ liệu ngầm ngay khi vào trang
  useEffect(() => {
    warmUpServer();
    prefetchAllTabsData();
  }, []);

  useEffect(() => {
    if (user?.role === 'student') {
      setViewMode('student');
    }
  }, [user]);

  // Đọc hash khi component mount (sau khi window available)
  useEffect(() => {
    setActiveTab(getTabFromHash());
  }, []);

  // Cập nhật URL hash mỗi khi đổi tab
  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  // Lắng nghe sự kiện back/forward của trình duyệt (popstate)
  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Guard: chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-500 text-sm font-medium">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // NẾU LÀ HỌC VIÊN HOẶC ĐANG Ở CHẾ ĐỘ XEM HỌC VIÊN
  if (viewMode === 'student') {
    return (
      <StudentPortal
        onSwitchToAdmin={user?.role === 'admin' ? () => setViewMode('admin') : undefined}
      />
    );
  }

  const handleSelectCourseFromOverview = (courseId) => {
    setSelectedCourseIdFromOverview(courseId);
    handleSetActiveTab('courses');
  };

  // NẾU LÀ QUẢN TRỊ VIÊN
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        onSwitchToStudentView={() => setViewMode('student')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
          <OverviewTab
            setActiveTab={handleSetActiveTab}
            onSelectCourse={handleSelectCourseFromOverview}
          />
        </div>
        <div className={activeTab === 'courses' ? 'block' : 'hidden'}>
          <CoursesTab initialSelectedCourseId={selectedCourseIdFromOverview} />
        </div>
        <div className={activeTab === 'students' ? 'block' : 'hidden'}>
          <StudentsTab />
        </div>
        <div className={activeTab === 'reports' ? 'block' : 'hidden'}>
          <ReportsTab />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 DriveEdu LMS. Hệ Thống Quản Lý Đào Tạo GPLX Quy Chuẩn Bộ GTVT.</p>
          <div className="flex space-x-4">
            <span className="font-semibold text-blue-700">Frontend: Next.js</span>
            <span className="font-semibold text-emerald-700">Backend: Node.js</span>
            <span className="font-semibold text-purple-700">Database: Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

