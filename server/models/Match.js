const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
      },
    ],
    scores: {
      player1Score: {
        type: Number,
        default: null,
      },
      player2Score: {
        type: Number,
        default: null,
      },
    },
    status: {
      type: String,
      enum: ['Pending', 'In-Progress', 'Completed'],
      default: 'Pending',
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    roomType: {
      type: String,
      enum: ['public', 'private'],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);