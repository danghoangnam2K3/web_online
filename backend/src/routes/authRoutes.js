const express = require('express');
const router = express.Router();
const {
  login,
  register,
  changePassword,
  forgotPassword,
  updateProfile,
  uploadAvatar,
  getMyStudentProfile,
  migrateAllLegacyPasswords
} = require('../controllers/authController');

router.post('/login',           login);
router.post('/register',        register);
router.post('/change-password', changePassword);
router.post('/forgot-password', forgotPassword);
router.put('/profile',          updateProfile);
router.post('/upload-avatar',   uploadAvatar);
router.get('/me',               getMyStudentProfile);

// Endpoint quét và mã hóa toàn bộ mật khẩu cũ sang Bcrypt
router.get('/migrate-passwords',  migrateAllLegacyPasswords);
router.post('/migrate-passwords', migrateAllLegacyPasswords);

module.exports = router;

