const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authLimiter } = require('../../middleware/rateLimiter');

const multer = require('multer');

// Configure multer for profile photo upload (5MB limit)
const upload = multer({ 
  dest: '/tmp',
  limits: { fileSize: 5 * 1024 * 1024 } 
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authLimiter, authController.updateMe);
router.post('/me/avatar', protect, upload.single('avatar'), authController.uploadAvatar);
router.delete('/me/avatar', protect, authController.removeAvatar);
router.put('/me/password/change', protect, authLimiter, authController.changePassword);
router.post('/me/password/request-otp', protect, authLimiter, authController.requestSetPasswordOtp);
router.put('/me/password/set', protect, authLimiter, authController.setPassword);

// Google Auth
router.get('/google/url', authController.getGoogleAuthUrl);
router.post('/google/login', authLimiter, authController.googleLogin);

module.exports = {
  authRoutes: router
};
