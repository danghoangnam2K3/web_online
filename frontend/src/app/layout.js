import './globals.css';

export const metadata = {
  title: 'Hệ Thống Quản Lý Đào Tạo Lái Xe - DriveEdu Admin Portal',
  description: 'Trang quản trị trường lái chuyên nghiệp với Next.js, Node.js và Supabase',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="bg-slate-50 min-h-screen font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
