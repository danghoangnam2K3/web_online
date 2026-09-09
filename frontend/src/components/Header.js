'use client';

import React from 'react';
import { LayoutDashboard, BookOpen, Users, BarChart3, ShieldCheck, Bell, User } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'courses', label: 'Khóa học', icon: BookOpen },
    { id: 'students', label: 'Học viên', icon: Users },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl gradient-blue-bg flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-blue-900 tracking-tight block leading-none">
                DRIVE<span className="text-blue-600">EDU</span>
              </span>
              <span className="text-[11px] font-semibold text-blue-500 tracking-wide uppercase">
                Trang Quản Trị Trường Lái
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                alt="Admin Avatar"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800">Quản Trị Viên</p>
                <p className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                  Admin System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
