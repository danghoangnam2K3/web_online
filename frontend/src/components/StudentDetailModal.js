'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Edit2, CheckCircle, Shield, User, Award, Calendar, CreditCard, Mail, Phone, Camera, Upload, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { updateStudentApi } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

const BASE_URL = 'https://web-online-wbn5.onrender.com/api';

export default function StudentDetailModal({ isOpen, onClose, student, onUpdateStudent }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // Mật khẩu State khi sửa học viên
  const [changePasswordChecked, setChangePasswordChecked] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar Modal State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (student) {
      const initialAvatar = student.avatar_url || '';
      setFormData({
        full_name: student.full_name || '',
        dob: student.dob || '',
        cccd: student.cccd || '',
        email: student.email || '',
        phone: student.phone || '',
        role: student.role || 'student',
        status: student.status || 'active',
        avatar_url: initialAvatar
      });
      setAvatarPreview(initialAvatar);
      setIsEditing(false);
      setChangePasswordChecked(false);
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // Xử lý upload / chọn file ảnh từ máy
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
        let res = await fetch(`${BASE_URL}/students/upload-avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ base64, fileName: file.name, mimeType: file.type })
        });
        if (!res.ok) {
          res = await fetch(`${BASE_URL}/auth/upload-avatar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ base64, fileName: file.name, mimeType: file.type })
          });
        }
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Tài khoản học viên chỉ có quyền xem, không được quyền chỉnh sửa!');
      return;
    }
    const updateData = { ...formData };
    if (changePasswordChecked) {
      if (!newPassword) {
        alert('Vui lòng nhập mật khẩu mới!');
        return;
      }
      if (newPassword.length < 6) {
        alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
        return;
      }
      if (newPassword !== confirmPassword) {
        alert('Xác nhận mật khẩu mới không khớp!');
        return;
      }
      updateData.password = newPassword;
    }

    setLoading(true);
    const res = await updateStudentApi(student.id, updateData);
    if (res?.success) {
      alert(res.message || 'Cập nhật thành công!');
      setIsEditing(false);
      onUpdateStudent();
    } else {
      alert(res?.message || 'Cập nhật thất bại!');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-modal border border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Info Header */}
          <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-slate-100">
            {/* Clickable Avatar với quyền Admin */}
            <div
              onClick={() => { if (isAdmin) setShowAvatarModal(true); }}
              className={`relative group flex-shrink-0 ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
              title={isAdmin ? 'Bấm vào đây để thay đổi ảnh đại diện' : 'Ảnh đại diện học viên'}
            >
              <img
                src={formData.avatar_url || student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={student.full_name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-100 shadow group-hover:ring-blue-400 transition-all"
              />
              {isAdmin && (
                <>
                  <div className="absolute inset-0 rounded-full bg-slate-900/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all text-white text-[10px] font-semibold">
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Đổi ảnh</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1.5 rounded-full text-white shadow border-2 border-white group-hover:scale-110 transition-transform">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                  student.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {student.role === 'admin' ? 'Quản Trị Viên' : 'Học Viên'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">ID: {student.id}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{student.full_name}</h2>
              <p className="text-xs text-slate-500">Khóa học: <strong className="text-blue-700">{student.course_name}</strong></p>

              {isEditing && isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" /> Thay đổi ảnh đại diện
                </button>
              )}
            </div>
          </div>

          {!isEditing ? (
            /* CHẾ ĐỘ XEM CHI TIẾT & GIÁM SÁT */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block mb-1 flex items-center font-semibold">
                    <CreditCard className="w-3.5 h-3.5 mr-1 text-blue-600" /> Số CCCD / CMND
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{student.cccd}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block mb-1 flex items-center font-semibold">
                    <User className="w-3.5 h-3.5 mr-1 text-blue-600" /> Tên Đăng Nhập
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{student.username}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block mb-1 flex items-center font-semibold">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" /> Ngày Sinh
                  </span>
                  <span className="font-bold text-slate-900">{student.dob || 'Chưa cập nhật'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block mb-1 flex items-center font-semibold">
                    <Phone className="w-3.5 h-3.5 mr-1 text-blue-600" /> Số Điện Thoại
                  </span>
                  <span className="font-bold text-slate-900">{student.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1">
                <span className="text-slate-500 font-semibold block flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-blue-600" /> Email Liên Hệ
                </span>
                <span className="font-bold text-slate-900">{student.email || 'Chưa có email'}</span>
              </div>

              {/* Giám sát Tiến Độ Học Tập */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-blue-900">Giám sát tiến độ học tập:</span>
                  <span className="font-extrabold text-blue-700 text-sm">{student.progress || 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${student.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                {!isAdmin ? (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-200">
                    <Eye className="w-3.5 h-3.5 text-blue-600" /> Tài khoản Học viên (chỉ xem, không được chỉnh sửa)
                  </span>
                ) : (
                  <div />
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center shadow transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Chỉnh Sửa Thông Tin
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* CHẾ ĐỘ CHỈNH SỬA THÔNG TIN (DÀNH CHO ADMIN) */
            <form onSubmit={handleSave} className="space-y-3">
              {/* Trường Đổi Avatar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh đại diện học viên</label>
                <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <img
                    src={formData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt="Avatar preview"
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-200"
                  />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={formData.avatar_url || ''}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên học viên</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD</label>
                  <input
                    type="text"
                    required
                    value={formData.cccd}
                    onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân quyền</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="student">Học Viên</option>
                    <option value="admin">Quản Trị Viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái tài khoản</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Kích hoạt (Active)</option>
                    <option value="locked">Tạm khóa (Locked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0909..."
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Mục Đổi Mật Khẩu Tương Tự Trang Account */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={changePasswordChecked}
                    onChange={(e) => setChangePasswordChecked(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  Đổi mật khẩu tài khoản học viên
                </label>

                {changePasswordChecked && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự..."
                          className="w-full pl-8 pr-9 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                        />
                        <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới..."
                          className="w-full pl-8 pr-9 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                        />
                        <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || avatarUploading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center shadow transition-all disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Modal Thay Đổi Avatar (Giao diện giống trang Account) */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Thay đổi ảnh đại diện học viên
              </h3>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Frame Xem Trước Avatar */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-28 h-28 rounded-full ring-4 ring-blue-500/20 overflow-hidden shadow-lg mb-2 relative bg-slate-100 flex items-center justify-center">
                <img
                  src={avatarPreview || formData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
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

