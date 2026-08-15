const mongoose = require('mongoose');
const Question = require('../models/Question');
const Match = require('../models/Match');
const crypto = require('crypto');

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getQuestionsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const query = {
      $or: [
        { category: categoryId },
      ],
    };

    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      query.$or.push({ category: new mongoose.Types.ObjectId(categoryId) });
    }

    const questions = await Question.find(query);

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for this category. Check the category value in your database.',
      });
    }

    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createRoom = async (req, res) => {
  try {
    const { playerId, categoryId, roomType } = req.body; 

    if (!playerId || !categoryId || !roomType) {
      return res.status(400).json({ success: false, message: 'Please provide player ID, category ID, and room type' });
    }

    const questions = await Question.find({ category: categoryId });
    
    if (questions.length < 3) {
      return res.status(400).json({ success: false, message: 'Not enough questions in this category to start a match' });
    }

    const shuffledAllQuestions = shuffleArray(questions);

    const selectedQuestions = shuffledAllQuestions.slice(0, 5).map(q => q._id);

    if (roomType === 'public') {
      let existingPublicMatch = await Match.findOne({
        category: categoryId,
        roomType: 'public',
        status: 'Pending',
        'players.1': { $exists: false } 
      });

      if (existingPublicMatch) {
        if (existingPublicMatch.players[0].toString() === playerId) {
          return res.status(400).json({ success: false, message: 'You are already waiting in this public room' });
        }

        existingPublicMatch.players.push(playerId);
        existingPublicMatch.status = 'In-Progress';
        await existingPublicMatch.save();

        const populatedMatch = await Match.findById(existingPublicMatch._id)
          .populate('players', 'username')
          .populate('questions');

        return res.status(200).json({ success: true, message: 'Joined public match successfully', data: populatedMatch });
      }
    }

    const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const match = await Match.create({
      roomCode,
      category: categoryId,
      roomType,
      players: [playerId],
      questions: selectedQuestions,
      status: 'Pending',
    });

    res.status(201).json({ success: true, roomCode: match.roomCode, data: match });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { playerId, roomCode } = req.body;

    if (!playerId || !roomCode) {
      return res.status(400).json({ success: false, message: 'Please provide player ID and room code' });
    }

    const match = await Match.findOne({ roomCode: roomCode.toUpperCase() });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Invalid room code or match not found' });
    }

    if (match.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Match has already started or completed' });
    }

    if (match.players.includes(playerId)) {
      return res.status(400).json({ success: false, message: 'Player is already in this room' });
    }

    if (match.players.length >= 2) {
      return res.status(400).json({ success: false, message: 'Room is full' });
    }

    match.players.push(playerId);
    match.status = 'In-Progress';
    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('players', 'username')
      .populate('questions');

    res.status(200).json({ success: true, data: populatedMatch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const submitMatchScore = async (req, res) => {
  try {
    const { matchId, playerId, score } = req.body;

    if (!matchId || !playerId || score === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide matchId, playerId, and score' });
    }

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (match.players[0].toString() === playerId) {
      match.scores.player1Score = score;
    } else if (match.players[1] && match.players[1].toString() === playerId) {
      match.scores.player2Score = score;
    } else {
      return res.status(403).json({ success: false, message: 'Player not part of this match' });
    }

    match.status = 'Completed';
    
    if (match.scores.player1Score > match.scores.player2Score) {
      match.winner = match.players[0];
    } else if (match.scores.player2Score > match.scores.player1Score) {
      match.winner = match.players[1];
    } else {
      match.winner = null; 
    }

    await match.save();

    res.status(200).json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {getQuestionsByCategory, createRoom, joinRoom, submitMatchScore};