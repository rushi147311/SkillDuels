const express = require("express");
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  adminLogin,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.post("/logout", protect, logout);

module.exports = router;
