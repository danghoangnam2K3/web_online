'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit2, CheckCircle, Shield, User, Award, Calendar, CreditCard, Mail, Phone } from 'lucide-react';
import { updateStudentApi } from '../lib/api';

export default function StudentDetailModal({ isOpen, onClose, student, onUpdateStudent }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        dob: student.dob || '',
        cccd: student.cccd || '',
        email: student.email || '',
        phone: student.phone || '',
        role: student.role || 'student',
        status: student.status || 'active',
        avatar_url: student.avatar_url || ''
      });
      setIsEditing(false);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateStudentApi(student.id, formData);
    if (res?.success) {
      alert(res.message);
      setIsEditing(false);
      onUpdateStudent();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-modal border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-slate-100">
          <img
            src={formData.avatar_url || student.avatar_url}
            alt={student.full_name}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-100 shadow"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase ${student.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                {student.role === 'admin' ? 'Quản Trị Viên' : 'Học Viên'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">ID: {student.id}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{student.full_name}</h2>
            <p className="text-xs text-slate-500">Khóa học: <strong className="text-blue-700">{student.course_name}</strong></p>
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

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center shadow"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Chỉnh Sửa Thông Tin
              </button>
            </div>
          </div>
        ) : (
          /* CHẾ ĐỘ CHỈNH SỬA THÔNG TIN */
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên học viên</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none"
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
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phân quyền</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
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
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white"
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
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none"
              />
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
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Lưu Thay Đổi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
