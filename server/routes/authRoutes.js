const express = require("express");
const { register, login, logout, getCurrentUser } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logout);

module.exports = router;
