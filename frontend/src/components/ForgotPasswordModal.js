'use client';

import React, { useState, useEffect } from 'react';
import { X, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, PhoneCall, Mail, CreditCard, ArrowLeft, RefreshCw } from 'lucide-react';
import { forgotPasswordApi, sendResetOtpApi, verifyResetOtpApi } from '../lib/api';

export default function ForgotPasswordModal({ isOpen, onClose, defaultIdentity = '' }) {
  const [activeTab, setActiveTab] = useState('gmail'); // 'gmail' | 'cccd'

  // Common states
  const [identity, setIdentity] = useState(defaultIdentity);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Gmail OTP specific states
  const [otpStep, setOtpStep] = useState(1); // 1: enter identity & send OTP, 2: enter OTP & reset password
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  // CCCD specific state
  const [cccd, setCccd] = useState('');

  useEffect(() => {
    if (defaultIdentity) {
      setIdentity(defaultIdentity);
    }
  }, [defaultIdentity]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleClose = () => {
    setError('');
    setSuccess('');
    setOtpStep(1);
    setOtpCode('');
    onClose();
  };

  // ─── Gửi mã OTP qua Gmail ─────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!identity.trim()) {
      setError('Vui lòng nhập Tên đăng nhập hoặc Email!');
      return;
    }

    setLoading(true);
    try {
      const res = await sendResetOtpApi({ identity: identity.trim() });
      setMaskedEmail(res.email_masked || identity);
      setOtpStep(2);
      setCountdown(60); // 60s cooldown before resend
      if (res.isDevFallback && res.dev_otp) {
        setOtpCode(res.dev_otp);
        setSuccess(`Mã xác nhận OTP của bạn là: ${res.dev_otp} (Đã tự động điền sẵn)`);
      } else {
        setSuccess(res.message || 'Mã OTP đã được gửi đến email của bạn!');
      }
    } catch (err) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại tài khoản hoặc đổi sang xác minh CCCD!');
    } finally {
      setLoading(false);
    }
  };

  // ─── Xác thực OTP & Đặt mật khẩu mới qua Gmail ────────────────────────────
  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanOtp = otpCode.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setError('Mã xác nhận OTP phải gồm chính xác 6 chữ số!');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtpApi({
        identity: identity.trim(),
        otp: cleanOtp,
        new_password: newPassword
      });
      setSuccess(res.message || 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Xác thực mã OTP thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  // ─── Đặt mật khẩu mới qua CCCD ────────────────────────────────────────────
  const handleCccdReset = async (e) => {
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
        handleClose();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Không thể khôi phục mật khẩu. Vui lòng kiểm tra lại thông tin!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-modal">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 border border-white/20 rounded-3xl max-w-md w-full shadow-2xl shadow-black/60 p-6 sm:p-7 relative overflow-hidden text-white">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-blue-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Khôi Phục Mật Khẩu
          </h2>
          <p className="text-xs text-blue-200/70">
            Chọn phương thức khôi phục phù hợp để lấy lại mật khẩu
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('gmail');
              setError('');
              setSuccess('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'gmail'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Mã OTP Gmail</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('cccd');
              setError('');
              setSuccess('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'cccd'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Xác minh CCCD</span>
          </button>
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

        {/* ─── TAB 1: GMAIL OTP ─── */}
        {activeTab === 'gmail' && (
          <>
            {otpStep === 1 ? (
              /* Bước 1: Nhập email/username để nhận mã OTP */
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
                    Tên đăng nhập hoặc Email Gmail <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      required
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      placeholder="Ví dụ: hocvien01 hoặc nguyenvana@gmail.com"
                      className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-white/50 pt-0.5">
                    Hệ thống sẽ gửi một mã OTP gồm 6 chữ số tới hộp thư Gmail đã đăng ký.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi mã xác nhận...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" /> Gửi Mã OTP Qua Gmail
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Bước 2: Nhập mã OTP và mật khẩu mới */
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3">
                <div className="flex items-center justify-between text-xs text-blue-200/90 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">Gửi tới: <strong>{maskedEmail}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(1);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[11px] text-blue-400 hover:underline shrink-0 flex items-center gap-0.5"
                  >
                    <ArrowLeft className="w-3 h-3" /> Đổi email
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
                      Mã OTP (6 chữ số) <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      disabled={countdown > 0 || loading}
                      onClick={handleSendOtp}
                      className="text-[11px] text-amber-400 hover:text-amber-300 disabled:text-white/40 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                      {countdown > 0 ? `Gửi lại (${countdown}s)` : 'Gửi lại mã'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-3.5 py-2.5 text-center text-base tracking-[6px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
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
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
                    Xác nhận mật khẩu <span className="text-red-400">*</span>
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full bg-white/10 border text-white placeholder-white/30 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                      confirmPassword && confirmPassword !== newPassword ? 'border-red-400/80' : 'border-white/15'
                    }`}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[10px] text-red-400">Mật khẩu xác nhận chưa khớp</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !!success}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra OTP...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Đã cập nhật mật khẩu!
                    </>
                  ) : (
                    'Xác Nhận & Đổi Mật Khẩu'
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* ─── TAB 2: CCCD VERIFICATION ─── */}
        {activeTab === 'cccd' && (
          <form onSubmit={handleCccdReset} className="space-y-3">
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
                className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
                Số CCCD đã đăng ký (12 số) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={cccd}
                onChange={(e) => setCccd(e.target.value)}
                placeholder="038203001234"
                className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono transition-all"
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
                  className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-3.5 py-2 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                className={`w-full bg-white/10 border text-white placeholder-white/30 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                  confirmPassword && confirmPassword !== newPassword ? 'border-red-400/80' : 'border-white/15'
                }`}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[10px] text-red-400">Mật khẩu xác nhận chưa khớp</p>
              )}
            </div>

            <div className="pt-1">
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
        )}

        {/* Footer Support */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center text-[11px] text-white/50 flex items-center justify-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
          <span>Gặp sự cố? Liên hệ bộ phận Giáo vụ / Hotline để được hỗ trợ</span>
        </div>

      </div>
    </div>
  );
}
