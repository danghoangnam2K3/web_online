'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { LayoutDashboard, BookOpen, Users, BarChart3, ShieldCheck, Bell, User, LogOut, Settings, ChevronDown, CheckCheck, Clock, CheckCircle2, FileText, Sparkles, Trash2, ArrowRight } from 'lucide-react';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'student',
    title: 'Học viên ghi danh khóa học',
    message: 'Học viên Lê Đình Công Vinh đã tham gia khóa Bk13.',
    time: '15 phút trước',
    isRead: false,
    tab: 'students'
  },
  {
    id: 'notif-2',
    type: 'quiz',
    title: 'Kết quả bài kiểm tra mới',
    message: 'Có học viên vừa hoàn thành bài trắc nghiệm chương lý thuyết.',
    time: '45 phút trước',
    isRead: false,
    tab: 'reports'
  },
  {
    id: 'notif-3',
    type: 'progress',
    title: 'Tiến độ học tập ghi nhận',
    message: 'Hệ thống đã tự động lưu thời lượng học thực tế vào CSDL Supabase.',
    time: '2 giờ trước',
    isRead: false,
    tab: 'overview'
  },
  {
    id: 'notif-4',
    type: 'system',
    title: 'Hệ thống đào tạo sẵn sàng',
    message: 'Dữ liệu khóa học và học viên đã đồng bộ theo chuẩn Tổng cục Đường bộ.',
    time: 'Hôm nay, 08:30',
    isRead: true,
    tab: 'overview'
  }
];

export default function Header({ activeTab, setActiveTab, onSwitchToStudentView }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Notifications State
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notifFilter, setNotifFilter] = useState('all');

  // Khôi phục thông báo từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('driveedu_notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    } catch (e) {
      setNotifications(DEFAULT_NOTIFICATIONS);
    }
  }, []);

  const saveNotifications = (newNotifs) => {
    setNotifications(newNotifs);
    try {
      localStorage.setItem('driveedu_notifications', JSON.stringify(newNotifs));
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const handleNotificationClick = (notif) => {
    const updated = notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n);
    saveNotifications(updated);
    setNotifOpen(false);
    if (notif.tab && setActiveTab) {
      setActiveTab(notif.tab);
    }
  };

  const handleClearAll = () => {
    saveNotifications([]);
  };

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'courses', label: 'Khóa học', icon: BookOpen },
    { id: 'students', label: 'Học viên', icon: Users },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
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

          {/* Navigation */}
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
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-3">
            {/* Nút Chuyển sang Giao diện Học viên dành cho Admin để kiểm thử */}
            {onSwitchToStudentView && (
              <button
                onClick={onSwitchToStudentView}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-sm"
                title="Chuyển sang giao diện người học để trải nghiệm"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Giao Diện Học Viên</span>
              </button>
            )}

            {/* Notification Center */}
            <div className="relative" ref={notifRef}>
              <button
                id="btn-notifications"
                onClick={() => setNotifOpen(!notifOpen)}
                className={`p-2 rounded-xl transition-all relative ${
                  notifOpen 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Trung tâm thông báo"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl shadow-slate-300/60 border border-slate-100 overflow-hidden z-50 animate-modal">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                          Thông Báo
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-700 rounded-full">
                              {unreadCount} mới
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 hover:bg-blue-100/50 rounded-md transition-colors"
                          title="Đánh dấu tất cả là đã đọc"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Đã đọc</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="text-[11px] text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa tất cả thông báo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-xs">
                    <button
                      onClick={() => setNotifFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        notifFilter === 'all'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Tất cả ({notifications.length})
                    </button>
                    <button
                      onClick={() => setNotifFilter('unread')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        notifFilter === 'unread'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Chưa đọc ({unreadCount})
                    </button>
                  </div>

                  {/* List of Notifications */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                    {(() => {
                      const list = notifFilter === 'unread' 
                        ? notifications.filter(n => !n.isRead) 
                        : notifications;

                      if (list.length === 0) {
                        return (
                          <div className="py-10 px-4 text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                              <Bell className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-600">Không có thông báo nào</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {notifFilter === 'unread' ? 'Bạn đã đọc hết tất cả thông báo.' : 'Hệ thống chưa có thông báo mới.'}
                            </p>
                          </div>
                        );
                      }

                      return list.map((item) => {
                        const iconBg = item.type === 'student'
                          ? 'bg-blue-100 text-blue-700'
                          : item.type === 'quiz'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.type === 'progress'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700';

                        const IconComp = item.type === 'student'
                          ? Users
                          : item.type === 'quiz'
                          ? FileText
                          : item.type === 'progress'
                          ? CheckCircle2
                          : Bell;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-3.5 hover:bg-blue-50/60 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                              !item.isRead ? 'bg-blue-50/25' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${iconBg}`}>
                              <IconComp className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className={`text-xs font-bold truncate ${!item.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                                  {item.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 shrink-0 font-medium flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {item.time}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {item.message}
                              </p>
                            </div>

                            {!item.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        if (setActiveTab) setActiveTab('overview');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Xem toàn bộ trung tâm giám sát</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar dropdown */}
            <div className="relative pl-3 border-l border-slate-200" ref={dropdownRef}>
              <button
                id="btn-user-menu"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow ring-2 ring-blue-500/20">
                  {((user?.full_name || 'Admin')[0] || 'A').toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800">{user?.full_name || 'Quản Trị Viên'}</p>

                  <p className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                    {user?.role === 'student' ? 'Học Viên' : 'Admin System'}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden z-50 animate-modal">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs text-slate-500">Đăng nhập với</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.email || user?.username}</p>
                  </div>
                  <div className="py-1">
                    {onSwitchToStudentView && (
                      <button
                        onClick={() => { setDropdownOpen(false); onSwitchToStudentView(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        Xem Giao diện Học viên
                      </button>
                    )}
                    <button
                      id="btn-go-account"
                      onClick={() => { setDropdownOpen(false); router.push('/account'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Tài khoản của tôi
                    </button>
                    <button
                      id="btn-header-logout"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
