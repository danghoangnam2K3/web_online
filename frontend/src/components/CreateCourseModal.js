'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, PlusCircle, CheckCircle } from 'lucide-react';

export default function CreateCourseModal({ isOpen, onClose, onCreateCourse }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    license_tier: 'B2',
    teacher_name: '',
    thumbnail_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.teacher_name) {
      alert('Vui lòng nhập đầy đủ các trường thông tin bắt buộc!');
      return;
    }
    setLoading(true);
    await onCreateCourse(formData);
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
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Tạo Khóa Học Mới</h2>
            <p className="text-xs text-slate-500">Điền thông tin khóa học chuẩn bị đào tạo bài giảng lý thuyết và thực hành</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Khóa Học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Khóa Lái Xe B2 K68"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã Khóa Học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: KH-B2-2026-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hạng Đào Tạo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.license_tier}
                onChange={(e) => setFormData({ ...formData, license_tier: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white font-medium"
              >
                <option value="A1">Hạng A1 (Xe máy)</option>
                <option value="B1">Hạng B1 (Số tự động)</option>
                <option value="B2">Hạng B2 (Ô tô 4-9 chỗ)</option>
                <option value="C">Hạng C (Xe tải trên 3.5t)</option>
                <option value="D">Hạng D (Xe khách 10-30 chỗ)</option>
                <option value="E">Hạng E (Xe khách trên 30 chỗ)</option>
                <option value="FC">Hạng FC (Xe đầu kéo container)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giáo Viên Phụ Trách <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Thầy Nguyễn Văn Hùng"
                value={formData.teacher_name}
                onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ảnh Đại Diện Khóa Học (URL Image)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
              {formData.thumbnail_url && (
                <img
                  src={formData.thumbnail_url}
                  alt="Preview"
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô Tả Khóa Học</label>
            <textarea
              rows={3}
              placeholder="Nhập mô tả tóm tắt mục tiêu khóa học, lộ trình học lý thuyết & thực hành..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white gradient-blue-bg hover:opacity-95 shadow-md shadow-blue-500/20 flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading ? 'Đang khởi tạo...' : 'Tạo Khóa Học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
