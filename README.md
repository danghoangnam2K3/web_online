# 🚗 TRANG QUẢN TRỊ HỌC TRỰC TUYẾN TRƯỜNG LÁI (DRIVEEDU ADMIN PORTAL)

Hệ thống quản lý đào tạo giấy phép lái xe (GPLX) chuyên nghiệp, đáp ứng đầy đủ yêu cầu nghiệp vụ quản lý khóa học, bài giảng lý thuyết, mô phỏng sa hình, tài khoản học viên và xuất báo cáo kết quả.

---

## 🎨 1. Thiết Kế Giao Diện (UI/UX)
- **Tông màu chủ đạo**: Xanh Dương (`#1d4ed8`, `#2563eb`) & Trắng (`#ffffff`, Slate clean accents).
- **Thanh Head Navigation**: Bao gồm 4 mục chính:
  1. **"Tổng quan"**: Thống kê số lượng khóa học, học viên, tỷ lệ đạt sát hạch, biểu đồ tăng trưởng, danh sách Top Khóa Học và Top Học Viên xuất sắc.
  2. **"Khóa học"**: Danh sách khóa học, tìm kiếm & lọc hạng đào tạo, nút **"Thêm khóa học"** (nhập ảnh đại diện, tên, mã khóa, hạng đào tạo, giáo viên, mô tả). Khi ấn **"Xem chi tiết khóa học"** sẽ mở trang gồm 2 mục (**Giới thiệu** & **Bài học**):
     - **Bước 1**: Tạo Chương.
     - **Bước 2**: Tạo Bài giảng (Video, Tài liệu đọc, Bài kiểm tra).
     - **Bước 3**: Cấu hình điều kiện hoàn thành (% thời gian học chương, % bài 1 mở bài 2).
     - **Bước 4**: Thêm học viên tự do chưa xếp khóa từ trang "Học viên" vào khóa học.
  3. **"Học viên"**: Tạo tài khoản (Avatar, Họ tên, Ngày sinh, CCCD, Email, Username, Password, Phân quyền Admin/Học viên). Giám sát tiến độ học tập và chỉnh sửa thông tin học viên.
  4. **"Báo cáo"**: Trích xuất báo cáo từng khóa học (PDF, Excel) và báo cáo từng học viên (PDF, Word).

---

## 📁 2. Cấu Trúc Dự Án (Modular Structure)

```text
BCTN1/
├── database/
│   └── supabase_schema.sql         # File SQL khởi tạo toàn bộ bảng & data mẫu cho Supabase
├── backend/
│   ├── src/
│   │   ├── config/supabase.js      # Cấu hình kết nối Supabase client Node.js
│   │   ├── controllers/
│   │   │   ├── courseController.js # Controller xử lý Khóa học & quy trình 4 bước tạo bài giảng
│   │   │   ├── studentController.js# Controller quản lý tài khoản & giám sát học viên
│   │   │   └── reportController.js # Controller thống kê & xuất báo cáo PDF/Excel/Word
│   │   ├── routes/
│   │   │   ├── courseRoutes.js
│   │   │   ├── studentRoutes.js
│   │   │   └── reportRoutes.js
│   │   └── server.js               # Express Server chính
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js           # Root Layout Next.js App Router
│   │   │   ├── page.js             # Entry Point chính chuyển đổi các Tab
│   │   │   └── globals.css         # Styling CSS toàn cục (Blue & White Theme)
│   │   ├── components/
│   │   │   ├── Header.js           # Thanh Head với 4 mục điều hướng
│   │   │   ├── OverviewTab.js      # Trang Tổng quan (Stats, Charts, Top courses, Top students)
│   │   │   ├── CoursesTab.js       # Trang Khóa học (Grid, Tìm kiếm, Lọc hạng, Nút Add khóa)
│   │   │   ├── CreateCourseModal.js# Modal Tạo khóa học mới đầy đủ thông tin
│   │   │   ├── CourseDetailModal.js# Modal Chi tiết khóa học (Tab Giới thiệu & Tab Bài học 4 bước)
│   │   │   ├── CreateLessonModal.js# Modal Bước 2: Tạo Bài giảng (Video, Reading, Quiz)
│   │   │   ├── StudentsTab.js      # Trang Học viên (Bảng dữ liệu, lọc, tạo tài khoản)
│   │   │   ├── CreateStudentModal.js# Modal Tạo tài khoản học viên/admin
│   │   │   ├── StudentDetailModal.js# Modal Giám sát & Chỉnh sửa thông tin học viên
│   │   │   └── ReportsTab.js       # Trang Báo cáo (Xuất PDF, Excel, Word)
│   │   └── lib/
│   │       ├── api.js              # Gọi HTTP API Backend + Fallback offline mock data
│   │       └── mockData.js         # Bộ nhớ dữ liệu mẫu ban đầu
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## 🗄️ 3. Hướng Dẫn Upload Database Lên Supabase (https://supabase.com)

1. Đăng nhập vào [Supabase](https://supabase.com) và tạo một Project mới.
2. Mở menu **SQL Editor** trong bảng điều khiển của Supabase.
3. Mở file `database/supabase_schema.sql` trong thư mục dự án này, copy toàn bộ nội dung SQL.
4. Dán câu lệnh vào SQL Editor trên Supabase và nhấn **Run**.
5. Vào **Project Settings -> API** để lấy `Project URL` và `anon / public API key`.
6. Mở file `backend/.env.example`, đổi tên thành `backend/.env` và điền:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-supabase-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

---

## ⚡ 4. Hướng Dẫn Khởi Chạy Local (Chạy Thử Nghiệm)

### Bước 1: Khởi chạy Backend Server (Node.js)
```bash
cd backend
npm install
npm run dev
```
👉 Backend server sẽ lắng nghe tại: `http://localhost:5000`

### Bước 2: Khởi chạy Frontend Portal (Next.js)
Mở một cửa sổ Terminal mới:
```bash
cd frontend
npm install
npm run dev
```
👉 Mở trình duyệt truy cập: `http://localhost:3000`

---

## 🚀 5. Hướng Dẫn Đưa Trang Web Lên Mạng (Deployment)

1. **Frontend Next.js**:
   - Đưa source code lên **GitHub**.
   - Truy cập [Vercel](https://vercel.com), bấm **New Project** và import repository `frontend`.
   - Vercel sẽ tự động build và cấp tên miền công khai miễn phí (`https://your-app.vercel.app`).

2. **Backend Node.js**:
   - Tải lên [Render.com](https://render.com) hoặc [Railway.app](https://railway.app) dưới dạng **Web Service**.
   - Cấu hình Environment Variables: `SUPABASE_URL` và `SUPABASE_ANON_KEY`.
