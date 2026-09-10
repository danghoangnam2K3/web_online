'use client';

import React, { useState, useEffect } from 'react';
import { fetchStudents, createStudentApi, deleteStudentApi } from '../lib/api';
import { Users, UserPlus, Search, Shield, Eye, CreditCard, Calendar, Filter, CheckCircle2, Lock, Edit3, Trash2 } from 'lucide-react';
import CreateStudentModal from './CreateStudentModal';
import StudentDetailModal from './StudentDetailModal';

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [search, roleFilter, onlyUnassigned]);

  async function loadStudents() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStudents(search, roleFilter, onlyUnassigned);
      setStudents(data || []);
    } catch (err) {
      setError(err.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateStudent = async (studentData) => {
    try {
      await createStudentApi(studentData);
      loadStudents();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleViewDetail = (student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const handleQuickDelete = async (student) => {
    if (confirm(`⚠️ Bạn có chắc chắn muốn xóa học viên "${student.full_name}" (CCCD: ${student.cccd})?`)) {
      try {
        await deleteStudentApi(student.id);
        alert('Đã xóa thành công!');
        loadStudents();
      } catch (err) {
        alert('Lỗi khi xóa: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar Trang Học Viên */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" /> Quản Lý & Giám Sát Học Viên
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tạo tài khoản học viên/admin, tra cứu CCCD, chỉnh sửa thông tin, đổi avatar/mật khẩu & xóa tài khoản
          </p>
        </div>

        {/* Nút Tạo Tài Khoản */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl font-bold text-sm text-white gradient-blue-bg hover:opacity-95 shadow-md shadow-blue-500/20 flex items-center justify-center transition-all scale-[1.01] hover:scale-[1.03]"
        >
          <UserPlus className="w-5 h-5 mr-2" /> Tạo Tài Khoản Mới
        </button>
      </div>

      {/* Thanh Lọc & Tìm Kiếm */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tìm kiếm */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên, username, số CCCD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filter Role & Chưa xếp khóa */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setOnlyUnassigned(!onlyUnassigned)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              onlyUnassigned
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
            }`}
          >
            Chưa xếp khóa học
          </button>

          {['ALL', 'student', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === role
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {role === 'ALL' ? 'Tất cả phân quyền' : role === 'admin' ? 'Quản Trị Viên' : 'Học Viên'}
            </button>
          ))}
        </div>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm font-medium flex items-start gap-3">
          <span className="text-red-500 text-lg leading-none">⚠️</span>
          <div>
            <p className="font-bold">Không thể tải dữ liệu học viên</p>
            <p className="text-red-500 text-xs mt-1">{error}</p>
            <p className="text-slate-500 text-xs mt-2">👉 Hãy chắc chắn đã chạy file SQL schema trên Supabase để tạo bảng <code>students</code>.</p>
          </div>
        </div>
      )}

      {/* Bảng Danh Sách Học Viên */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Họ và Tên Học Viên</th>
                  <th className="py-3.5 px-4">Số CCCD / CMND</th>
                  <th className="py-3.5 px-4">Tên Đăng Nhập</th>
                  <th className="py-3.5 px-4">Phân Quyền</th>
                  <th className="py-3.5 px-4">Khóa Học Tham Gia</th>
                  <th className="py-3.5 px-4 text-center">Tiến Độ</th>
                  <th className="py-3.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Avt & Họ Tên */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-3">
                        <img
                          src={st.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={st.full_name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100"
                        />
                        <div>
                          <span className="block font-bold text-slate-900">{st.full_name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">NS: {st.dob || 'Chưa rõ'}</span>
                        </div>
                      </div>
                    </td>

                    {/* CCCD */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {st.cccd}
                    </td>

                    {/* Username */}
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      @{st.username}
                    </td>

                    {/* Phân quyền */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        st.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {st.role === 'admin' ? 'Quản Trị' : 'Học Viên'}
                      </span>
                    </td>

                    {/* Khóa học */}
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${
                        st.course_name === 'Chưa xếp khóa' ? 'text-amber-600 italic' : 'text-blue-700 font-bold'
                      }`}>
                        {st.course_name}
                      </span>
                    </td>

                    {/* Tiến độ */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="w-24 mx-auto">
                        <div className="flex justify-between text-[10px] font-bold mb-0.5">
                          <span>{st.progress || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${st.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Thao tác Chỉnh sửa & Xóa */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewDetail(st)}
                          className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-xs transition-colors inline-flex items-center"
                          title="Chỉnh sửa thông tin học viên"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Sửa
                        </button>
                        <button
                          onClick={() => handleQuickDelete(st)}
                          className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-lg font-bold text-xs transition-colors inline-flex items-center"
                          title="Xóa tài khoản học viên"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-sm">Không tìm thấy tài khoản học viên nào</p>
          </div>
        )}
      </div>

      {/* Modal Tạo Tài Khoản */}
      <CreateStudentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateStudent={handleCreateStudent}
      />

      {/* Modal Cửa Sổ Nhỏ Chỉnh Sửa Thông Tin Học Viên (Tương tự trang Account) */}
      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        student={selectedStudent}
        onUpdateStudent={loadStudents}
        onDeleteStudent={loadStudents}
      />
    </div>
  );
}
