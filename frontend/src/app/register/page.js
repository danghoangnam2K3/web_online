'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { ShieldCheck, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, User, Mail, Lock } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    setLoading(true);
    try {
      const res = await register(form.email, form.password, form.full_name);
      setSuccess(res.message + ' Đang chuyển sang trang đăng nhập...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { id: 'full_name', label: 'Họ và tên', type: 'text', placeholder: 'Nguyễn Văn A', icon: User, field: 'full_name', autoComplete: 'name' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'admin@driveedu.vn', icon: Mail, field: 'email', autoComplete: 'email' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="relative z-10 w-full max-w-md px-4 py-10">
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl shadow-2xl shadow-black/40 p-8 space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 shadow-lg shadow-indigo-500/30 mx-auto">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                DRIVE<span className="text-blue-400">EDU</span>
              </h1>
              <p className="text-sm text-blue-200/80 mt-1 font-medium">Tạo tài khoản quản trị mới</p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl animate-modal">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-xl animate-modal">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ id, label, type, placeholder, icon: Icon, field, autoComplete }) => (
              <div key={id} className="space-y-1.5">
                <label className="text-xs font-semibold text-blue-200/80 uppercase tracking-widest" htmlFor={id}>
                  {label}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    id={id}
                    type={type}
                    required
                    autoComplete={autoComplete}
                    value={form[field]}
                    onChange={update(field)}
                    placeholder={placeholder}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            ))}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-200/80 uppercase tracking-widest" htmlFor="register-password">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="register-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-200/80 uppercase tracking-widest" htmlFor="confirm-password">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="confirm-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={update('confirm')}
                  placeholder="Nhập lại mật khẩu"
                  className={`w-full bg-white/10 border text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all ${
                    form.confirm && form.confirm !== form.password ? 'border-red-500/60' : 'border-white/20'
                  }`}
                />
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-400 mt-1">Mật khẩu chưa khớp</p>
              )}
            </div>

            <button
              id="btn-register"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-white/50">
            Đã có tài khoản?{' '}
            <button
              id="link-to-login"
              onClick={() => router.push('/login')}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
