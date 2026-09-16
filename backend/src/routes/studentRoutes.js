const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Danh sách & chi tiết học viên
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);

// Upload avatar học viên
router.post('/upload-avatar', studentController.uploadAvatar);

// Tạo tài khoản (Học viên / Admin)
router.post('/', studentController.createStudent);
router.post('/batch', studentController.createStudentsBatch);

// Giám sát & chỉnh sửa thông tin học viên
router.put('/:id', studentController.updateStudent);

// Lưu & lấy tiến độ học tập của học viên
router.post('/:id/study-progress', studentController.saveStudyProgress);
router.get('/:id/study-progress', studentController.getStudyProgress);

// Lưu & lấy kết quả bài kiểm tra trắc nghiệm
router.post('/:id/quiz-attempt', studentController.saveQuizAttempt);
router.get('/:id/quiz-attempts', studentController.getQuizAttempts);

// Xóa học viên
router.delete('/:id', studentController.deleteStudent);

module.exports = router;

