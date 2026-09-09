const express = require('express');
const cors = require('cors');
require('dotenv').config();

const courseRoutes = require('./routes/courseRoutes');
const studentRoutes = require('./routes/studentRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Healthcheck
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Hệ Thống Quản Lý Đào Tạo Lái Xe - Admin Portal API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Đã có lỗi xảy ra từ máy chủ backend!',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Server đang chạy tại: http://localhost:${PORT}`);
});
