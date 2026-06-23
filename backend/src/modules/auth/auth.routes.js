const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middleware/authMiddleware');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authLimiter, authController.updateMe);

// Google Auth
router.get('/google/url', authController.getGoogleAuthUrl);
router.post('/google/login', authLimiter, authController.googleLogin);

module.exports = {
  authRoutes: router
};
