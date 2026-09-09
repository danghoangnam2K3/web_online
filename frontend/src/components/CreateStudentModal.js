'use client';

import React, { useState } from 'react';
import { X, UserPlus, Shield, User, CheckCircle } from 'lucide-react';

export default function CreateStudentModal({ isOpen, onClose, onCreateStudent }) {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    dob: '',
    cccd: '',
    email: '',
    phone: '',
    role: 'student',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.username || !formData.password || !formData.cccd) {
      alert('Vui lòng điền các thông tin bắt buộc: Họ tên, Tên đăng nhập, Mật khẩu, CCCD!');
      return;
    }
    setLoading(true);
    await onCreateStudent(formData);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-modal border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-blue-bg flex items-center justify-center text-white">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Tạo Tài Khoản Mới</h2>
            <p className="text-xs text-slate-500">Tạo tài khoản học viên hoặc quản trị viên trường lái</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và Tên Học Viên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn An"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số CCCD / CMND <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: 038098001122"
                value={formData.cccd}
                onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Tài Khoản Đăng Nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: nguyenvana"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật Khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Sinh</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email (nếu có)</label>
              <input
                type="email"
                placeholder="vanan@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phân Quyền Tài Khoản</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white font-bold text-blue-800"
              >
                <option value="student">Học Viên (Học & Thi sát hạch)</option>
                <option value="admin">Quản Trị Viên (Admin Trường)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại Liên Hệ</label>
              <input
                type="text"
                placeholder="0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh Đại Diện (Avatar URL)</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <img
                src={formData.avatar_url}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white gradient-blue-bg hover:opacity-95 shadow-md shadow-blue-500/20 flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
