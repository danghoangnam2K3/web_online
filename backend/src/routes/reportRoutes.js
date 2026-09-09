const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// API Thống kê tổng quan cho Overview
router.get('/overview', reportController.getOverviewStats);

// Export báo cáo từng khóa (pdf, excel)
router.get('/course/:id/export', reportController.exportCourseReport);

// Export báo cáo từng học viên (pdf, word)
router.get('/student/:id/export', reportController.exportStudentReport);

module.exports = router;
