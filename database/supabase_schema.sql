-- ============================================================
-- SCHEMAS & TABLES DÀNH CHO TRANG QUẢN TRỊ HỌC TRỰC TUYẾN TRƯỜNG LÁI
-- Nền tảng: Supabase (PostgreSQL)
-- ============================================================

-- 1. BẢNG NGƯỜI DÙNG / HỌC VIÊN (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    dob DATE,
    cccd VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role VARCHAR(20) CHECK (role IN ('admin', 'student')) DEFAULT 'student',
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'locked', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BẢNG KHÓA HỌC (courses)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã khóa học (vd: KH-B2-2026-01)
    name VARCHAR(255) NOT NULL,       -- Tên khóa học
    license_tier VARCHAR(20) NOT NULL CHECK (license_tier IN ('A1', 'A2', 'B1', 'B2', 'C', 'D', 'E', 'FC')), -- Hạng đào tạo
    teacher_name VARCHAR(255) NOT NULL,-- Giáo viên phụ trách
    thumbnail_url TEXT DEFAULT 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500', -- Ảnh đại diện
    description TEXT,                  -- Mô tả khóa học
    total_hours INT DEFAULT 120,       -- Tổng số giờ đào tạo
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BẢNG CHƯƠNG BÀI HỌC (chapters)
CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    order_index INT DEFAULT 1,
    min_completion_pct INT DEFAULT 80, -- Quy định % thời gian học tối thiểu hoàn thành chương
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BẢNG BÀI GIẢNG / BÀI KHIỂM TRA (lessons)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'reading', 'quiz')), -- loại bài: video, tài liệu, bài kiểm tra
    content_url TEXT,                        -- đường dẫn video hoặc tài liệu PDF/doc
    content_text TEXT,                       -- nội dung tài liệu đọc
    duration_minutes INT DEFAULT 15,          -- thời lượng bài giảng (phút)
    min_watch_pct INT DEFAULT 80,            -- Điều kiện % thời gian học để qua bài tiếp theo (bước 3)
    order_index INT DEFAULT 1,
    quiz_questions JSONB DEFAULT '[]'::jsonb, -- Câu hỏi trắc nghiệm nếu type là quiz
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BẢNG ĐIỀU KIỆN HOÀN THÀNH CHƯƠNG & BÀI HỌC (completion_rules)
CREATE TABLE IF NOT EXISTS completion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    prev_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    next_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    required_pct INT DEFAULT 80, -- Phải hoàn thành bao nhiêu % bài trước mới mở bài tiếp theo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BẢNG GHI DANH HỌC VIÊN VÀO KHÓA HỌC (course_enrollments)
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_pct INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'studying' CHECK (status IN ('studying', 'completed', 'dropped')),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(course_id, student_id)
);

-- 7. BẢNG TIẾN ĐỘ HỌC TẬP HỌC VIÊN (study_progress)
CREATE TABLE IF NOT EXISTS study_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    watched_seconds INT DEFAULT 0,
    total_seconds INT DEFAULT 0,
    completion_pct INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    last_studied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- 8. BẢNG KẾT QUẢ KIỂM TRA (quiz_attempts)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    score INT NOT NULL,
    passed BOOLEAN NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SAMPLE SEED DATA DÀNH CHO SUPABASE
-- ============================================================

INSERT INTO users (id, username, password_hash, full_name, dob, cccd, email, role, phone) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', 'admin123', 'Quản Trị Viên Trường Lái', '1985-05-15', '001085000123', 'admin@laixe.edu.vn', 'admin', '0909123456'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'nguyenvana', 'hocvien123', 'Nguyễn Văn An', '1998-10-20', '038098001122', 'vanan@gmail.com', 'student', '0912345678'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'tranthib', 'hocvien123', 'Trần Thị Bình', '2001-03-12', '038201004455', 'thibinh@gmail.com', 'student', '0987654321'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'leminic', 'hocvien123', 'Lê Minh Cường', '1995-12-01', '038195009988', 'minhcuong@gmail.com', 'student', '0933445566'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'phamdungd', 'hocvien123', 'Phạm Tiến Dũng', '1999-07-25', '038199003311', 'tiendung@gmail.com', 'student', '0977889900');

INSERT INTO courses (id, code, name, license_tier, teacher_name, description, thumbnail_url, status) VALUES
('c1000000-0000-0000-0000-000000000001', 'KH-B2-2026-01', 'Khóa Lý Thuyết & Thực Hành Lái Xe Ô Tô Hạng B2 K68', 'B2', 'Thầy Nguyễn Văn Hùng', 'Khóa học đào tạo kỹ năng lái xe ô tô hạng B2 quy chuẩn 2026 với 600 câu hỏi lý thuyết và mô phỏng.', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600', 'active'),
('c2000000-0000-0000-0000-000000000002', 'KH-C-2026-02', 'Khóa Lái Xe Tải Hạng C Chuyên Nghiệp', 'C', 'Thầy Trần Đình Long', 'Khóa học cấp tốc GPLX hạng C cho tài xế chuyên nghiệp lái xe tải trên 3.5 tấn.', 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600', 'active'),
('c3000000-0000-0000-0000-000000000003', 'KH-B1-2026-03', 'Khóa Lái Xe Số Tự Động Hạng B11', 'B1', 'Cô Lê Thị Mai', 'Đào tạo lái xe số tự động B1 cho cá nhân và gia đình, tập trung an toàn giao thông.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600', 'active');

INSERT INTO chapters (id, course_id, title, order_index, min_completion_pct) VALUES
('ch100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Chương 1: Quy định chung và Hệ thống Biển báo Giao thông', 1, 80),
('ch200000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Chương 2: Kỹ thuật Lái xe Sa hình & Mô phỏng 120 Tình huống', 2, 85);

INSERT INTO lessons (id, chapter_id, title, type, content_url, duration_minutes, min_watch_pct, order_index) VALUES
('l1000000-0000-0000-0000-000000000001', 'ch100000-0000-0000-0000-000000000001', 'Bài 1: Luật Giao thông Đường bộ cơ bản', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 30, 80, 1),
('l2000000-0000-0000-0000-000000000002', 'ch100000-0000-0000-0000-000000000001', 'Bài 2: Tài liệu nhận diện 60 biển báo nguy hiểm & cấm', 'reading', '', 20, 90, 2),
('l3000000-0000-0000-0000-000000000003', 'ch100000-0000-0000-0000-000000000001', 'Bài 3: Trắc nghiệm kiểm tra Luật Giao thông (20 câu)', 'quiz', '', 15, 80, 3);

INSERT INTO course_enrollments (course_id, student_id, progress_pct, status) VALUES
('c1000000-0000-0000-0000-000000000001', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 85, 'studying'),
('c1000000-0000-0000-0000-000000000001', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 45, 'studying'),
('c2000000-0000-0000-0000-000000000002', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 100, 'completed');
