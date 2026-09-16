'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, User, CreditCard, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Mail, RefreshCw, Loader2 } from 'lucide-react';
import { forgotPasswordApi, sendResetOtpApi, verifyResetOtpApi } from '../../lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('gmail'); // 'gmail' | 'cccd'

  // Common states
  const [identity, setIdentity] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetDone, setIsResetDone] = useState(false);

  // Gmail OTP states
  const [otpStep, setOtpStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  // CCCD state
  const [cccd, setCccd] = useState('');

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // ─── Gửi mã OTP qua Gmail ───
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!identity.trim()) {
      setError('Vui lòng nhập Tên đăng nhập hoặc Email.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendResetOtpApi({ identity: identity.trim() });
      setMaskedEmail(res.email_masked || identity);
      setOtpStep(2);
      setOtpCode('');
      setCountdown(60);
      setSuccess(res.message || 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hòm thư trên thiết bị và nhập mã vào!');
    } catch (err) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại tài khoản hoặc chuyển sang phương thức CCCD!');
    } finally {
      setLoading(false);
    }
  };

  // ─── Xác thực OTP & Đổi mật khẩu ───
  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanOtp = otpCode.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setError('Mã xác nhận OTP phải gồm đúng 6 chữ số.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtpApi({
        identity: identity.trim(),
        otp: cleanOtp,
        new_password: newPassword
      });
      setIsResetDone(true);
      setSuccess(res.message || 'Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...');
      setTimeout(() => {
        router.push('/login');
      }, 2200);
    } catch (err) {
      setError(err.message || 'Xác thực mã OTP thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  // ─── Đặt mật khẩu qua CCCD ───
  const handleCccdReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identity.trim()) {
      setError('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }
    const cleanCccd = cccd.trim().replace(/\D/g, '');
    if (!cleanCccd || cleanCccd.length < 9) {
      setError('Số CCCD / CMND phải có ít nhất 9 chữ số.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPasswordApi({
        identity: identity.trim(),
        cccd: cleanCccd,
        new_password: newPassword,
      });

      if (res && res.success) {
        setIsResetDone(true);
        setSuccess(res.message || 'Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...');
        setTimeout(() => {
          router.push('/login');
        }, 2200);
      } else {
        setError(res?.message || 'Không thể khôi phục mật khẩu. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      {/* Glowing orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 mb-1">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">Khôi Phục Mật Khẩu</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Lấy lại mật khẩu qua mã xác nhận Gmail hoặc xác minh số CCCD
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('gmail');
              setError('');
              setSuccess('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'gmail'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Mã OTP Gmail</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('cccd');
              setError('');
              setSuccess('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'cccd'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Xác minh CCCD</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* ─── TAB 1: GMAIL OTP ─── */}
        {activeTab === 'gmail' && (
          <>
            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                    Tên đăng nhập hoặc Email Gmail <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      placeholder="VD: hv_nguyenvana hoặc email@..."
                      className="w-full bg-slate-900/50 border border-white/15 text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/80 transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Hệ thống sẽ gửi mã xác nhận OTP 6 số tới hòm thư Gmail liên kết với tài khoản này.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition duration-200 disabled:opacity-60 cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi mã OTP...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Gửi Mã Xác Nhận Qua Gmail</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                <div className="flex items-center justify-between text-xs text-blue-200 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">Gửi tới: <strong>{maskedEmail}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(1);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-xs text-blue-400 hover:underline shrink-0 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Đổi email
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                      Mã OTP (6 chữ số) <span className="text-amber-400">*</span>
                    </label>
                    <button
                      type="button"
                      disabled={countdown > 0 || loading}
                      onClick={handleSendOtp}
                      className="text-xs text-amber-400 hover:text-amber-300 disabled:text-white/40 flex items-center gap-1 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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
                    className="w-full bg-slate-900/50 border border-white/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-center text-lg tracking-[8px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-400/80 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                    Mật khẩu mới <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-slate-900/50 border border-white/15 text-white placeholder-slate-400 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/80 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                    Xác nhận mật khẩu mới <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full bg-slate-900/50 border text-white placeholder-slate-400 rounded-xl pl-4 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/80 transition ${
                      confirmPassword && confirmPassword !== newPassword ? 'border-rose-500/70' : 'border-white/15'
                    }`}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[11px] text-rose-400">Mật khẩu xác nhận chưa khớp</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || isResetDone}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition duration-200 disabled:opacity-60 cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm tra OTP...</span>
                    </>
                  ) : isResetDone ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã cập nhật mật khẩu!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác Nhận & Đổi Mật Khẩu</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* ─── TAB 2: CCCD ─── */}
        {activeTab === 'cccd' && (
          <form onSubmit={handleCccdReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                Tên đăng nhập hoặc Email <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="VD: hv_nguyenvana hoặc email@..."
                  className="w-full bg-slate-900/50 border border-white/15 text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/80 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                Số CCCD / CMND (12 chữ số) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={cccd}
                  onChange={(e) => setCccd(e.target.value)}
                  placeholder="001203004567"
                  className="w-full bg-slate-900/50 border border-white/15 text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/80 transition font-mono tracking-wider"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                Mật khẩu mới <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-slate-900/50 border border-white/15 text-white placeholder-slate-400 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/80 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                Xác nhận mật khẩu mới <span className="text-amber-400">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className={`w-full bg-slate-900/50 border text-white placeholder-slate-400 rounded-xl pl-4 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/80 transition ${
                  confirmPassword && confirmPassword !== newPassword ? 'border-rose-500/70' : 'border-white/15'
                }`}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-rose-400">Mật khẩu xác nhận chưa khớp</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || isResetDone}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-600/30 transition duration-200 disabled:opacity-60 cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý khôi phục...</span>
                </>
              ) : isResetDone ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã cập nhật mật khẩu!</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Đặt Lại Mật Khẩu</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer links */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs sm:text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại đăng nhập</span>
          </Link>
          <Link
            href="/register"
            className="text-slate-400 hover:text-white transition"
          >
            Đăng ký tài khoản
          </Link>
        </div>
      </div>
    </div>
  );
}
