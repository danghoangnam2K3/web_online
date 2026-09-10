-- ==============================================================================
-- DRIVEEDU LMS - SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU CHUẨN HOÀN CHỈNH CHO SUPABASE
-- Cách dùng: Đăng nhập Supabase → Vào SQL Editor → Tạo New query → Dán toàn bộ file này & nhấn RUN
-- ==============================================================================

-- ─── 1. BẢNG COURSES (Khóa học) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  license_tier    TEXT NOT NULL CHECK (license_tier IN ('B1','B2','C','D','E','FC')),
  teacher_name    TEXT NOT NULL,
  thumbnail_url   TEXT,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','draft')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. BẢNG CHAPTERS (Chương học) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chapters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id           UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  order_index         INT NOT NULL DEFAULT 1,
  min_completion_pct  INT NOT NULL DEFAULT 80 CHECK (min_completion_pct BETWEEN 0 AND 100),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. BẢNG LESSONS (Bài giảng) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lessons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id        UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video','reading','quiz')),
  content_url       TEXT,
  content_text      TEXT,
  duration_minutes  INT DEFAULT 15,
  min_watch_pct     INT DEFAULT 80 CHECK (min_watch_pct BETWEEN 0 AND 100),
  order_index       INT NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. BẢNG STUDENTS (Tài khoản Học viên & Admin) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL,
  username      TEXT NOT NULL UNIQUE,
  password      TEXT,
  cccd          TEXT NOT NULL UNIQUE,
  dob           DATE,
  email         TEXT,
  phone         TEXT,
  gender        TEXT DEFAULT 'Nam',
  workplace     TEXT,
  address       TEXT,
  bio           TEXT,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  avatar_url    TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  course_name   TEXT DEFAULT 'Chưa xếp khóa',
  progress      INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. BẢNG ENROLLMENTS (Học viên đăng ký khóa học) ────────────────────────
CREATE TABLE IF NOT EXISTS public.enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT enrollments_unique UNIQUE (course_id, student_id)
);

-- ==============================================================================
-- BẬT QUYỀN TRUY CẬP TRỰC TIẾP CHO BACKEND (TẮT RLS CHO TẤT CẢ BẢNG)
-- ==============================================================================
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA)
-- ==============================================================================

-- 1. Thêm danh sách Khóa Học Mẫu
INSERT INTO public.courses (code, name, license_tier, teacher_name, thumbnail_url, description) VALUES
(
  'KH-B2-2026-01',
  'Khóa Lý Thuyết & Thực Hành Lái Xe Ô Tô Hạng B2 K68',
  'B2',
  'Thầy Nguyễn Văn Hùng',
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600',
  'Khóa học đào tạo kỹ năng lái xe ô tô hạng B2 quy chuẩn 2026 với 600 câu hỏi lý thuyết và mô phỏng.'
),
(
  'KH-C-2026-02',
  'Khóa Lái Xe Tải Hạng C Chuyên Nghiệp',
  'C',
  'Thầy Trần Đình Long',
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600',
  'Khóa học cấp tốc GPLX hạng C cho tài xế chuyên nghiệp lái xe tải trên 3.5 tấn.'
),
(
  'KH-B1-2026-03',
  'Khóa Lái Xe Số Tự Động Hạng B1',
  'B1',
  'Cô Lê Thị Mai',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
  'Đào tạo lái xe số tự động B1 cho cá nhân và gia đình, tập trung an toàn giao thông.'
)
ON CONFLICT (code) DO NOTHING;

-- 2. Thêm Tài khoản Admin & Học viên Mẫu vào Supabase
INSERT INTO public.students (full_name, username, password, cccd, dob, email, phone, gender, workplace, address, bio, role, course_name, progress) VALUES
('Quản Trị Viên',   'admin',          'Admin@123', '000000000000', '1990-01-01', 'admin@driveedu.vn',  '0900000000', 'Nam', 'Trung Tâm Đào Tạo Lái Xe', 'Hà Nội', 'Quản trị viên hệ thống', 'admin',   'Ban Quản Lý',    100),
('Hoàng Văn Nam',   'HoangNam',       '123456',    '038203009988', '2003-11-07', 'admin@co.nan',       '0909123456', 'Nam', 'Trường lái xe', 'TP. Hồ Chí Minh', 'Học viên khóa B2', 'admin',   'Khóa B2 K68',   100),
('Nguyễn Văn An',   'nguyenvana',     '123456',    '038098001122', '1998-10-20', 'vanan@gmail.com',     '0912345678', 'Nam', 'Công ty ABC', 'Hà Nội', 'Học viên khóa B2', 'student', 'Khóa B2 K68',    85),
('Trần Thị Bình',   'tranthib',       '123456',    '038201004455', '2001-03-12', 'thibinh@gmail.com',   '0987654321', 'Nữ', 'Đại học QG', 'Đà Nẵng', 'Học viên khóa B2', 'student', 'Khóa B2 K68',    45),
('Lê Minh Cường',   'leminic',        '123456',    '038195009988', '1995-12-01', 'minhcuong@gmail.com', '0933445566', 'Nam', 'Tự do', 'Cần Thơ', 'Học viên khóa B2', 'student', 'Khóa B2 K68',    90),
('Phạm Tiến Dũng',  'phamdungd',      '123456',    '038199003311', '1999-07-25', 'tiendung@gmail.com',  '0977889900', 'Nam', 'Công ty Vận tải', 'Bình Dương', 'Học viên hạng C', 'student', 'Khóa Hạng C',    100),
('Hoàng Anh Tuấn',  'hoanganhtuan',   '123456',    '038200007744', '2000-05-18', 'anhtuan@gmail.com',   '0966554433', 'Nam', 'Sinh viên', 'Hà Nội', '', 'student', 'Chưa xếp khóa', 0),
('Đặng Mai Phương', 'dangmaiphuong',  '123456',    '038202008899', '2002-09-09', 'maiphuong@gmail.com', '0922114455', 'Nữ', 'Ngân hàng', 'Hải Phòng', '', 'student', 'Chưa xếp khóa', 0)
ON CONFLICT (username) DO NOTHING;
