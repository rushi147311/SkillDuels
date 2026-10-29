const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Admin API is running",
  });
});

const {
  addCategory,
  getCategories,
  deleteCategory,
  addQuestion,
  getQuestionsByCategory,
  deleteQuestion
} = require("../controllers/adminController");

// Category Routes
router.post("/categories", addCategory);
router.get("/categories", getCategories);
router.delete("/categories/:id", deleteCategory);

// Question Routes
router.post("/questions", addQuestion);
router.get("/questions/category/:categoryId", getQuestionsByCategory);
router.delete("/questions/:id", deleteQuestion);

module.exports = router;