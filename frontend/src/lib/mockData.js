export const initialCoursesData = [
  {
    id: 'c1',
    code: 'KH-B2-2026-01',
    name: 'Khóa Lý Thuyết & Thực Hành Lái Xe Ô Tô Hạng B2 K68',
    license_tier: 'B2',
    teacher_name: 'Thầy Nguyễn Văn Hùng',
    thumbnail_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600',
    description: 'Khóa học đào tạo kỹ năng lái xe ô tô hạng B2 quy chuẩn 2026 với 600 câu hỏi lý thuyết và mô phỏng.',
    status: 'active',
    created_at: '2026-01-15T08:00:00Z',
    chapters: [
      {
        id: 'ch1',
        title: 'Chương 1: Quy định chung và Hệ thống Biển báo Giao thông',
        order_index: 1,
        min_completion_pct: 80,
        lessons: [
          {
            id: 'l1',
            title: 'Bài 1: Luật Giao thông Đường bộ cơ bản',
            type: 'video',
            content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration_minutes: 30,
            min_watch_pct: 80
          },
          {
            id: 'l2',
            title: 'Bài 2: Tài liệu nhận diện 60 biển báo nguy hiểm & cấm',
            type: 'reading',
            content_text: 'Biển báo nguy hiểm có hình tam giác đều, nền vàng, viền đỏ. Biển cấm có hình tròn, nền trắng, viền đỏ...',
            duration_minutes: 20,
            min_watch_pct: 90
          },
          {
            id: 'l3',
            title: 'Bài 3: Trắc nghiệm kiểm tra Luật Giao thông (20 câu)',
            type: 'quiz',
            duration_minutes: 15,
            min_watch_pct: 80
          }
        ]
      },
      {
        id: 'ch2',
        title: 'Chương 2: Kỹ thuật Lái xe Sa hình & Mô phỏng 120 Tình huống',
        order_index: 2,
        min_completion_pct: 85,
        lessons: [
          {
            id: 'l4',
            title: 'Bài 1: Kỹ thuật ghép xe ngang và ghép xe dọc vào nơi đỗ',
            type: 'video',
            content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration_minutes: 45,
            min_watch_pct: 85
          }
        ]
      }
    ],
    enrolled_student_ids: ['hv1', 'hv2', 'hv3']
  },
  {
    id: 'c2',
    code: 'KH-C-2026-02',
    name: 'Khóa Lái Xe Tải Hạng C Chuyên Nghiệp',
    license_tier: 'C',
    teacher_name: 'Thầy Trần Đình Long',
    thumbnail_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600',
    description: 'Khóa học cấp tốc GPLX hạng C cho tài xế chuyên nghiệp lái xe tải trên 3.5 tấn.',
    status: 'active',
    created_at: '2026-02-01T09:00:00Z',
    chapters: [],
    enrolled_student_ids: ['hv4']
  },
  {
    id: 'c3',
    code: 'KH-B1-2026-03',
    name: 'Khóa Lái Xe Số Tự Động Hạng B11',
    license_tier: 'B1',
    teacher_name: 'Cô Lê Thị Mai',
    thumbnail_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    description: 'Đào tạo lái xe số tự động B1 cho cá nhân và gia đình, tập trung an toàn giao thông.',
    status: 'active',
    created_at: '2026-02-10T10:00:00Z',
    chapters: [],
    enrolled_student_ids: []
  }
];

export const initialStudentsData = [
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
