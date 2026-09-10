'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import {
  User, Mail, Phone, Lock, KeyRound, LogOut, ArrowLeft,
  Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck,
  Save, ChevronRight, BookOpen, GraduationCap, CreditCard,
  Calendar, Clock, Award, Layers, ChevronDown, Camera, X, Upload
} from 'lucide-react';

const BASE_URL = 'https://web-online-wbn5.onrender.com/api';

const TABS = [
  { id: 'profile',  label: 'Thông tin tài khoản', icon: User },
  { id: 'learning', label: 'Thông tin học tập',  icon: GraduationCap },
];

function Alert({ type, text }) {
  if (!text) return null;
  const ok = type === 'success';
  return (
    <div className={`flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl transition-all ${ok ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border border-red-500/30 text-red-300'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span>{text}</span>
    </div>
  );
}

function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, token, loading, logout, updateProfile, changePassword } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  const [activeTab, setActiveTab] = useState('profile');

  // Fetch student profile
  const [studentData, setStudentData]   = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    setStudentLoading(true);
    fetch(`${BASE_URL}/auth/me?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(json => setStudentData(json.success ? json.data : null))
      .catch(() => setStudentData(null))
      .finally(() => setStudentLoading(false));
  }, [user]);

  // Profile form state
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    dob: '',
    cccd: '',
    gender: 'Nam',
    workplace: '',
    country: 'Vietnam',
    province: '',
    district: '',
    address: '',
    bio: '',
    avatar_url: '',
    notify_email: true,
    change_password_inline: false,
    new_password: '',
    confirm_password: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg]   = useState({ type: '', text: '' });

  // Avatar Modal
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview]     = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      const initialAvatar = studentData?.avatar_url || user.avatar_url || '';
      setProfile(p => ({
        ...p,
        full_name:  user.full_name  || studentData?.full_name  || '',
        phone:      user.phone      || studentData?.phone      || '',
        dob:        studentData?.dob ? studentData.dob.split('T')[0] : '',
        cccd:       studentData?.cccd || '',
        gender:     studentData?.gender || user.gender || 'Nam',
        workplace:  studentData?.workplace || user.workplace || '',
        address:    studentData?.address || user.address || '',
        bio:        studentData?.bio || user.bio || '',
        avatar_url: initialAvatar,
      }));
      setAvatarPreview(initialAvatar);
    }
  }, [user, studentData]);

  // Avatar upload
  const handleAvatarFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Vui lòng chọn file hình ảnh!'); return; }
    if (file.size > 5 * 1024 * 1024)    { alert('Dung lượng ảnh tối đa 5MB!'); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setAvatarPreview(base64);
      setAvatarUploading(true);
      try {
        const res = await fetch(`${BASE_URL}/auth/upload-avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ base64, fileName: file.name, mimeType: file.type })
        });
        const json = await res.json();
        if (json.success && json.data?.url) {
          setProfile(p => ({ ...p, avatar_url: json.data.url }));
          setAvatarPreview(json.data.url);
          setProfileMsg({ type: 'success', text: 'Tải ảnh đại diện thành công! Nhấn "Lưu Thay Đổi" để cập nhật.' });
        }
      } catch (err) {
        console.error('Upload avatar fail:', err);
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save profile
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (profile.change_password_inline) {
      if (!profile.new_password) {
        setProfileMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu mới' });
        return;
      }
      if (profile.new_password.length < 6) {
        setProfileMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        return;
      }
      if (profile.new_password !== profile.confirm_password) {
        setProfileMsg({ type: 'error', text: 'Xác nhận mật khẩu mới không khớp' });
        return;
      }
    }

    setProfileLoading(true);
    try {
      await updateProfile({
        full_name:  profile.full_name,
        phone:      profile.phone,
        dob:        profile.dob,
        cccd:       profile.cccd,
        gender:     profile.gender,
        workplace:  profile.workplace,
        address:    profile.address,
        bio:        profile.bio,
        avatar_url: avatarPreview || profile.avatar_url,
      });

      if (profile.change_password_inline && profile.new_password) {
        await changePassword(user.id, profile.new_password);
      }

      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin tài khoản thành công!' });
      setProfile(p => ({ ...p, change_password_inline: false, new_password: '', confirm_password: '' }));
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Cập nhật thất bại' });
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner className="w-8 h-8 text-sky-400" />
      </div>
    );
  }

  const labelCls = "block text-xs font-semibold text-slate-300 mb-1.5";
  const inputCls = "w-full bg-slate-800/60 border border-slate-700/80 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm transition-all outline-none placeholder:text-slate-500";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Header Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Về trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                Hồ sơ cá nhân
              </h1>
              <p className="text-xs text-slate-400">Quản lý thông tin tài khoản và tiến độ học tập</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 px-3.5 py-2 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 border-t border-slate-800/60 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'bg-sky-500/10 text-sky-400 border-sky-400 font-semibold'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ══ TAB 1: THÔNG TIN TÀI KHOẢN ═════════════════ */}
        {activeTab === 'profile' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <Alert type={profileMsg.type} text={profileMsg.text} />

            <form onSubmit={handleProfileSave} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start">

                {/* Cột Trái: Avatar tròn */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    onClick={() => setShowAvatarModal(true)}
                    className="relative group cursor-pointer"
                    title="Bấm vào hình đại diện để thay đổi ảnh"
                  >
                    <div className="w-44 h-44 rounded-full overflow-hidden ring-4 ring-sky-500/30 group-hover:ring-sky-400 transition-all bg-slate-800 shadow-2xl flex items-center justify-center">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold">
                          {((user?.full_name || studentData?.full_name || 'A')[0]).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200 text-white">
                      <Camera className="w-8 h-8 mb-1" />
                      <span className="text-xs font-semibold">Thay đổi ảnh</span>
                    </div>

                    <div className="absolute bottom-2 right-2 bg-sky-500 p-2.5 rounded-full text-white shadow-lg border-2 border-slate-900 group-hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs text-sky-400 font-medium cursor-pointer hover:underline" onClick={() => setShowAvatarModal(true)}>
                    📷 Click để thay đổi ảnh
                  </p>
                  <span className="text-[11px] text-slate-500">Định dạng: JPG, PNG, WebP</span>
                </div>

                {/* Cột Phải: Các trường thông tin */}
                <div className="space-y-4">

                  {/* Hàng 1: Email + Họ tên */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Email <span className="text-red-400">*</span></label>
                      <input
                        type="email"
                        readOnly
                        value={user?.email || studentData?.email || ''}
                        className="w-full bg-slate-800/40 border border-slate-800 text-slate-400 rounded-lg px-3.5 py-2.5 text-sm cursor-not-allowed font-medium"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Họ và tên <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        value={profile.full_name}
                        onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                        placeholder="Nguyễn Văn A"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Hàng 2: Tên đăng nhập + SĐT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Tên đăng nhập / Mã tài khoản</label>
                      <input
                        type="text"
                        readOnly
                        value={studentData?.username || user?.username || 'admin'}
                        className="w-full bg-slate-800/40 border border-slate-800 text-slate-400 rounded-lg px-3.5 py-2.5 text-sm cursor-not-allowed font-medium"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Số điện thoại</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                        placeholder="0909 123 456"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Hàng 3: Nơi công tác + Giới tính */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Nơi công tác / Đơn vị</label>
                      <input
                        type="text"
                        value={profile.workplace}
                        onChange={e => setProfile(p => ({ ...p, workplace: e.target.value }))}
                        placeholder="Công ty / Trường học / Tự do"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Giới tính</label>
                      <div className="flex items-center gap-6 py-2.5">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                          <input
                            type="radio"
                            name="gender"
                            value="Nam"
                            checked={profile.gender === 'Nam'}
                            onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                            className="w-4 h-4 text-sky-500 focus:ring-sky-400 accent-sky-500"
                          />
                          Nam
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                          <input
                            type="radio"
                            name="gender"
                            value="Nữ"
                            checked={profile.gender === 'Nữ'}
                            onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                            className="w-4 h-4 text-sky-500 focus:ring-sky-400 accent-sky-500"
                          />
                          Nữ
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Hàng 4: Ngày sinh + CCCD */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Ngày sinh <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        value={profile.dob}
                        onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))}
                        className={inputCls + ' [color-scheme:dark]'}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>CCCD / CMND <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={profile.cccd}
                        onChange={e => setProfile(p => ({ ...p, cccd: e.target.value }))}
                        placeholder="012345678901"
                        maxLength={12}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Hàng 5: Địa chỉ hành chính */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Quốc gia</label>
                      <select
                        value={profile.country}
                        onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="Vietnam">Vietnam</option>
                        <option value="Khac">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Tỉnh / Thành phố</label>
                      <input
                        type="text"
                        placeholder="Tỉnh/Thành phố..."
                        value={profile.province}
                        onChange={e => setProfile(p => ({ ...p, province: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Phường / Xã</label>
                      <input
                        type="text"
                        placeholder="Phường/Xã..."
                        value={profile.district}
                        onChange={e => setProfile(p => ({ ...p, district: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Hàng 6: Địa chỉ */}
                  <div>
                    <label className={labelCls}>Địa chỉ thường trú</label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                      placeholder="Số nhà, tên đường, thôn/xóm..."
                      className={inputCls}
                    />
                  </div>

                  {/* Hàng 7: Bio */}
                  <div>
                    <label className={labelCls}>Giới thiệu bản thân</label>
                    <textarea
                      rows={3}
                      value={profile.bio}
                      onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Giới thiệu bản thân, mục tiêu học tập..."
                      className={inputCls + ' resize-none'}
                    />
                  </div>

                  {/* Checkbox Đổi mật khẩu */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={profile.change_password_inline}
                        onChange={e => setProfile(p => ({ ...p, change_password_inline: e.target.checked }))}
                        className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                      />
                      Đổi mật khẩu tài khoản
                    </label>

                    {profile.change_password_inline && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 p-4 bg-slate-800/40 border border-slate-800 rounded-xl">
                        <div>
                          <label className={labelCls}>Mật khẩu mới</label>
                          <input
                            type="password"
                            value={profile.new_password}
                            onChange={e => setProfile(p => ({ ...p, new_password: e.target.value }))}
                            placeholder="Tối thiểu 6 ký tự"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Xác nhận mật khẩu</label>
                          <input
                            type="password"
                            value={profile.confirm_password}
                            onChange={e => setProfile(p => ({ ...p, confirm_password: e.target.value }))}
                            placeholder="Nhập lại mật khẩu"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nút lưu */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
                    >
                      {profileLoading ? <Spinner /> : <Save className="w-4 h-4" />}
                      {profileLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                  </div>

                </div>
              </div>
            </form>
          </div>
        )}

        {/* ══ TAB 2: THÔNG TIN HỌC TẬP ═════════════════ */}
        {activeTab === 'learning' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-sky-400" />
              Khóa học đã đăng ký
            </h2>

            {studentLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-6 h-6 text-sky-400" />
              </div>
            ) : !studentData?.enrollments || studentData.enrollments.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Bạn chưa đăng ký khóa học nào</p>
                <p className="text-slate-500 text-xs mt-1">Liên hệ Quản trị viên để được tư vấn xếp lớp</p>
              </div>
            ) : (
              <div className="space-y-4">
                {studentData.enrollments.map(({ course, enrolled_at }, idx) => (
                  <div key={course?.id || idx} className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
                          <BookOpen className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 text-[10px] font-bold rounded">
                              Hạng {course?.license_tier || 'B2'}
                            </span>
                            <span className="text-xs font-mono text-slate-400">{course?.code}</span>
                          </div>
                          <h3 className="text-base font-bold text-white mt-1">{course?.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Giảng viên: {course?.teacher_name || 'Chưa cập nhật'}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-slate-400 block">Ngày đăng ký:</span>
                        <span className="text-xs font-semibold text-slate-200">
                          {enrolled_at ? new Date(enrolled_at).toLocaleDateString('vi-VN') : 'Mới đăng ký'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal Thay đổi Avatar */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-sky-400" />
                Thay đổi ảnh đại diện
              </h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
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
              className="border-2 border-dashed border-slate-700 hover:border-sky-400 rounded-xl p-6 text-center cursor-pointer bg-slate-800/40 transition-colors group"
            >
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-sky-400 mx-auto mb-2 transition-colors" />
              <p className="text-sm font-semibold text-slate-200">Bấm vào đây để chọn ảnh từ thiết bị</p>
              <p className="text-xs text-slate-500 mt-1">Định dạng JPG, PNG, WebP (Tối đa 5MB)</p>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Hoặc dán URL hình ảnh:</label>
              <input
                type="url"
                value={avatarPreview}
                onChange={e => setAvatarPreview(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className={inputCls}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white rounded-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
