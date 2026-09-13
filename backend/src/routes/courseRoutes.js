const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Lấy danh sách & chi tiết khóa học
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Tạo khóa học
router.post('/', courseController.createCourse);

// Cập nhật thông tin khóa học
router.put('/:id', courseController.updateCourse);

// Xóa khóa học (cascade xóa chapters + lessons + enrollments)
router.delete('/:id', courseController.deleteCourse);

// Bước 1: Tạo Chương
router.post('/:id/chapters', courseController.createChapter);

// Xóa Chương (cascade xóa lessons bên trong)
router.delete('/:id/chapters/:chapterId', courseController.deleteChapter);

// Bước 2: Tạo Bài Giảng trong Chương
router.post('/:id/chapters/:chapterId/lessons', courseController.createLesson);

// Xóa Bài Giảng
router.delete('/:id/chapters/:chapterId/lessons/:lessonId', courseController.deleteLesson);

// Bước 3: Tạo điều kiện hoàn thành Chương
router.put('/:id/chapters/:chapterId/rules', courseController.updateChapterRules);

// Bước 4: Add học viên chưa add từ trang Học Viên vào khóa
router.post('/:id/enroll', courseController.enrollStudents);

module.exports = router;
