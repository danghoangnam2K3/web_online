const express = require('express');
const router = express.Router();
const { login, register, changePassword, updateProfile, uploadAvatar, getMyStudentProfile } = require('../controllers/authController');

router.post('/login',          login);
router.post('/register',       register);
router.post('/change-password',changePassword);
router.put('/profile',         updateProfile);
router.post('/upload-avatar',  uploadAvatar);
router.get('/me',              getMyStudentProfile);

module.exports = router;

