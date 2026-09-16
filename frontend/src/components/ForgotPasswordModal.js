'use client';

import React, { useState } from 'react';
import { X, KeyRound, ShieldAlert, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, PhoneCall } from 'lucide-react';
import { forgotPasswordApi } from '../lib/api';

export default function ForgotPasswordModal({ isOpen, onClose, defaultIdentity = '' }) {
  const [identity, setIdentity] = useState(defaultIdentity);
  const [cccd, setCccd] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identity.trim()) {
      setError('Vui lòng nhập Tên đăng nhập hoặc Email của bạn!');
      return;
    }
    if (!cccd.trim()) {
      setError('Vui lòng nhập Số CCCD đã đăng ký để xác minh danh tính!');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordApi({
        identity: identity.trim(),
        cccd: cccd.trim(),
        new_password: newPassword
      });
      setSuccess(res.message || 'Khôi phục mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Không thể khôi phục mật khẩu. Vui lòng kiểm tra lại thông tin!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-modal">
      <div className="bg-gradient-to-b from-slate-900 to-blue-950 border border-white/20 rounded-3xl max-w-md w-full shadow-2xl shadow-black/60 p-6 sm:p-7 relative overflow-hidden text-white">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-blue-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Khôi Phục Mật Khẩu
          </h2>
          <p className="text-xs text-blue-200/70">
            Xác minh danh tính học viên bằng CCCD để đặt lại mật khẩu mới
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-500/15 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
              Tên đăng nhập hoặc Email <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="Ví dụ: vanminh01 hoặc minh@gmail.com"
              className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
              Số CCCD đã đăng ký <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={cccd}
              onChange={(e) => setCccd(e.target.value)}
              placeholder="Nhập 12 số CCCD (ví dụ: 038203001234)"
              className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
              Mật khẩu mới <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-3.5 py-2.5 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
              Xác nhận mật khẩu mới <span className="text-red-400">*</span>
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className={`w-full bg-white/10 border text-white placeholder-white/30 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                confirmPassword && confirmPassword !== newPassword ? 'border-red-400/80' : 'border-white/15'
              }`}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[10px] text-red-400">Mật khẩu xác nhận chưa khớp</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra danh tính...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Đã cập nhật mật khẩu!
                </>
              ) : (
                'Đặt Lại Mật Khẩu Mới'
              )}
            </button>
          </div>
        </form>

        {/* Footer Support */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center text-[11px] text-white/50 flex items-center justify-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
          <span>Gặp sự cố? Liên hệ bộ phận Giáo vụ / Hotline để được hỗ trợ</span>
        </div>

      </div>
    </div>
  );
}
