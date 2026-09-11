'use client';

import React, { useState, useRef } from 'react';
import { X, UserPlus, Shield, User, CheckCircle, Camera, Upload } from 'lucide-react';

const BASE_URL = 'https://web-online-wbn5.onrender.com/api';

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

  // Avatar Modal State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAvatarFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh tối đa 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setAvatarPreview(base64);
      setFormData(prev => ({ ...prev, avatar_url: base64 }));
      setAvatarUploading(true);

      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
        const res = await fetch(`${BASE_URL}/auth/upload-avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ base64, fileName: file.name, mimeType: file.type })
        });
        const json = await res.json();
        if (json.success && json.data?.url) {
          setAvatarPreview(json.data.url);
          setFormData(prev => ({ ...prev, avatar_url: json.data.url }));
        }
      } catch (err) {
        console.error('Upload avatar error:', err);
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

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
    <>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh Đại Diện Học Viên</label>
              <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div
                  onClick={() => setShowAvatarModal(true)}
                  className="relative group cursor-pointer shrink-0"
                  title="Click để chọn ảnh"
                >
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-200 group-hover:ring-blue-500 transition-all"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={formData.avatar_url}
                    onChange={(e) => {
                      setFormData({ ...formData, avatar_url: e.target.value });
                      setAvatarPreview(e.target.value);
                    }}
                    placeholder="URL hình ảnh hoặc chọn từ máy..."
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 truncate bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Tải ảnh
                </button>
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
                disabled={loading || avatarUploading}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white gradient-blue-bg hover:opacity-95 shadow-md shadow-blue-500/20 flex items-center disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {loading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Thay Đổi Avatar */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Chọn ảnh đại diện học viên
              </h3>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-28 h-28 rounded-full ring-4 ring-blue-500/20 overflow-hidden shadow-lg mb-2 relative bg-slate-100 flex items-center justify-center">
                <img
                  src={avatarPreview || formData.avatar_url}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
                {avatarUploading && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold">
                    Đang tải...
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium">Xem trước ảnh đại diện</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleAvatarFile(e.target.files?.[0])}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer bg-blue-50/40 hover:bg-blue-50 transition-all group"
            >
              <Upload className="w-8 h-8 text-blue-500 group-hover:scale-110 mx-auto mb-2 transition-transform" />
              <p className="text-sm font-bold text-slate-800">Bấm vào đây để chọn ảnh từ thiết bị</p>
              <p className="text-xs text-slate-500 mt-1">Định dạng JPG, PNG, WebP (Dung lượng tối đa 5MB)</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Hoặc dán URL hình ảnh:</label>
              <input
                type="url"
                value={avatarPreview}
                onChange={e => {
                  setAvatarPreview(e.target.value);
                  setFormData(prev => ({ ...prev, avatar_url: e.target.value }));
                }}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy / Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  if (avatarPreview) {
                    setFormData(prev => ({ ...prev, avatar_url: avatarPreview }));
                  }
                  setShowAvatarModal(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

