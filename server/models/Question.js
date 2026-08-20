const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    questionText: {
      type: String,
      required: [true, 'Please add a question text'],
    },
    options: {
      type: [String],
      required: [true, 'Please provide options for the question'],
      validate: [arrayLimit,'A question must have between 2 and 4 options'],
    },
    correctAnswer: {
      type: String,
      required: [true, 'Please specify the correct answer'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
  },
  { timestamps: true }
);

function arrayLimit(val) {
  return val.length >= 2 && val.length <= 4;
}

module.exports = mongoose.model('Question', questionSchema);