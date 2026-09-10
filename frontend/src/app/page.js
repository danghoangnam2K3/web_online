'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import Header from '../components/Header';
import OverviewTab from '../components/OverviewTab';
import CoursesTab from '../components/CoursesTab';
import StudentsTab from '../components/StudentsTab';
import ReportsTab from '../components/ReportsTab';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourseIdFromOverview, setSelectedCourseIdFromOverview] = useState(null);

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

  const handleSelectCourseFromOverview = (courseId) => {
    setSelectedCourseIdFromOverview(courseId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            setActiveTab={setActiveTab}
            onSelectCourse={handleSelectCourseFromOverview}
          />
        )}
        {activeTab === 'courses' && (
          <CoursesTab initialSelectedCourseId={selectedCourseIdFromOverview} />
        )}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'reports' && <ReportsTab />}
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
