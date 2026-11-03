
const express = require('express');

const {
  register,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  login,
  logout,
  getCurrentUser,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Registration and email verification
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Password reset
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Authentication
router.post('/login', login);
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);

module.exports = router;
