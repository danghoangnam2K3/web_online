'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import OverviewTab from '../components/OverviewTab';
import CoursesTab from '../components/CoursesTab';
import StudentsTab from '../components/StudentsTab';
import ReportsTab from '../components/ReportsTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'courses' | 'students' | 'reports'
  const [selectedCourseIdFromOverview, setSelectedCourseIdFromOverview] = useState(null);

  const handleSelectCourseFromOverview = (courseId) => {
    setSelectedCourseIdFromOverview(courseId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Điều Hướng Top Bar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Dynamic Main Page Content */}
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

        {activeTab === 'students' && (
          <StudentsTab />
        )}

        {activeTab === 'reports' && (
          <ReportsTab />
        )}
      </main>

      {/* Footer */}
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
