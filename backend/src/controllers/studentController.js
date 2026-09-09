const supabase = require('../config/supabase');

// Mock Data học viên
let initialStudents = [
  {
    id: 'hv1',
    full_name: 'Nguyễn Văn An',
    username: 'nguyenvana',
    dob: '1998-10-20',
    cccd: '038098001122',
    email: 'vanan@gmail.com',
    role: 'student',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    phone: '0912345678',
    status: 'active',
    created_at: '2026-01-10T08:00:00Z',
    course_name: 'Khóa B2 K68',
    progress: 85
  },
  {
    id: 'hv2',
    full_name: 'Trần Thị Bình',
    username: 'tranthib',
    dob: '2001-03-12',
    cccd: '038201004455',
    email: 'thibinh@gmail.com',
    role: 'student',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    phone: '0987654321',
    status: 'active',
    created_at: '2026-01-12T09:30:00Z',
    course_name: 'Khóa B2 K68',
    progress: 45
  },
  {
    id: 'hv3',
    full_name: 'Lê Minh Cường',
    username: 'leminic',
    dob: '1995-12-01',
    cccd: '038195009988',
    email: 'minhcuong@gmail.com',
    role: 'student',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    phone: '0933445566',
    status: 'active',
    created_at: '2026-01-14T10:15:00Z',
    course_name: 'Khóa B2 K68',
    progress: 90
  },
  {
    id: 'hv4',
    full_name: 'Phạm Tiến Dũng',
    username: 'phamdungd',
    dob: '1999-07-25',
    cccd: '038199003311',
    email: 'tiendung@gmail.com',
    role: 'student',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '0977889900',
    status: 'active',
    created_at: '2026-02-01T14:20:00Z',
    course_name: 'Khóa Hạng C',
    progress: 100
  },
  {
    id: 'hv5',
    full_name: 'Hoàng Anh Tuấn',
    username: 'hoanganhtuan',
    dob: '2000-05-18',
    cccd: '038200007744',
    email: 'anhtuan@gmail.com',
    role: 'student',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: '0966554433',
    status: 'active',
    created_at: '2026-02-05T11:10:00Z',
    course_name: 'Chưa xếp khóa',
    progress: 0
  },
  {
    id: 'hv6',
    full_name: 'Đặng Mai Phương',
    username: 'dangmaiphuong',
    dob: '2002-09-09',
    cccd: '038202008899',
    email: 'maiphuong@gmail.com',
    role: 'student',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    phone: '0922114455',
    status: 'active',
    created_at: '2026-02-08T16:00:00Z',
    course_name: 'Chưa xếp khóa',
    progress: 0
  }
];

// Lấy danh sách học viên
exports.getAllStudents = async (req, res) => {
  try {
    const { search, role, unassigned } = req.query;
    let list = initialStudents;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.cccd.includes(q)
      );
    }

    if (role && role !== 'ALL') {
      list = list.filter(s => s.role === role);
    }

    if (unassigned === 'true') {
      list = list.filter(s => s.course_name === 'Chưa xếp khóa');
    }

    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy chi tiết học viên
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = initialStudents.find(s => s.id === id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Học viên không tồn tại' });
    }
    return res.json({ success: true, data: student });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Tạo tài khoản (Học viên hoặc Admin)
exports.createStudent = async (req, res) => {
  try {
    const { full_name, username, password, dob, cccd, email, role, avatar_url, phone } = req.body;

    if (!full_name || !username || !password || !cccd) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập các thông tin bắt buộc: Họ tên, Tên đăng nhập, Mật khẩu, CCCD!'
      });
    }

    // Kiểm tra trùng username / cccd
    const isExist = initialStudents.some(s => s.username === username || s.cccd === cccd);
    if (isExist) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc số CCCD đã tồn tại trong hệ thống!' });
    }

    const newStudent = {
      id: 'hv_' + Date.now(),
      full_name,
      username,
      dob: dob || '',
      cccd,
      email: email || '',
      role: role || 'student',
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      phone: phone || '',
      status: 'active',
      created_at: new Date().toISOString(),
      course_name: 'Chưa xếp khóa',
      progress: 0
    };

    initialStudents.unshift(newStudent);

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản học viên thành công!',
      data: newStudent
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Giám sát & Cập nhật thông tin học viên
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, dob, cccd, email, role, phone, status, avatar_url } = req.body;

    const studentIndex = initialStudents.findIndex(s => s.id === id);
    if (studentIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
    }

    const student = initialStudents[studentIndex];

    initialStudents[studentIndex] = {
      ...student,
      full_name: full_name !== undefined ? full_name : student.full_name,
      dob: dob !== undefined ? dob : student.dob,
      cccd: cccd !== undefined ? cccd : student.cccd,
      email: email !== undefined ? email : student.email,
      role: role !== undefined ? role : student.role,
      phone: phone !== undefined ? phone : student.phone,
      status: status !== undefined ? status : student.status,
      avatar_url: avatar_url !== undefined ? avatar_url : student.avatar_url,
      updated_at: new Date().toISOString()
    };

    return res.json({
      success: true,
      message: 'Cập nhật thông tin học viên thành công!',
      data: initialStudents[studentIndex]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy danh sách học viên gốc (export internal)
exports._getStudentsListInternal = () => initialStudents;
