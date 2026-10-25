const express = require("express");
const {
  addCategory,
  getCategories,
  deleteCategory,
  addQuestion,
  getQuestionsByCategory,
  deleteQuestion
} = require("../controllers/adminController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/", (req, res) => {
  res.json({ success: true, message: "Admin API is running" });
});

// Category Routes
router.post("/categories", addCategory);
router.get("/categories", getCategories);
router.delete("/categories/:id", deleteCategory);

// Question Routes
router.post("/questions", addQuestion);
router.get("/questions/category/:categoryId", getQuestionsByCategory);
router.delete("/questions/:id", deleteQuestion);

module.exports = router;
