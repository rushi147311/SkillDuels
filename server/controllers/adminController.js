const mongoose = require('mongoose');
const Category = require('../models/Category');
const Question = require('../models/Question');

const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ name, description });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }
    await Category.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addQuestion = async (req, res) => {
  try {
    const { categoryId, questionText, options, correctAnswer, difficulty } = req.body;
    if (!mongoose.isValidObjectId(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const correctAnswerIndex = Number(correctAnswer);
    if (!Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
      return res.status(400).json({ success: false, message: 'Correct answer must be an option index from 0 to 3' });
    }

    const question = await Question.create({
      categoryName: category.name,
      category: category._id,
      questionText,
      options,
      correctAnswer: correctAnswerIndex,
      difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
    });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getQuestionsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.isValidObjectId(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }
    const category = await Category.findById(categoryId).select('name');
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const questions = await Question.find({
      $or: [
        { category: new mongoose.Types.ObjectId(categoryId) },
        { categoryName: category.name },
      ],
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID' });
    }
    await Question.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addCategory,
  getCategories,
  deleteCategory,
  addQuestion,
  getQuestionsByCategory,
  deleteQuestion,
};
