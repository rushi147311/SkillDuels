
const Question = require('../models/Question');
const Match = require('../models/Match');
const Category = require('../models/Category');
const crypto = require('crypto');

const shuffleArray = (array) => {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
};

const getQuestionData = (question) => {
  const source =
    typeof question.toObject === 'function'
      ? question.toObject()
      : { ...question };

  if (!Array.isArray(source.options) || source.options.length === 0) {
    return source;
  }

  const correctAnswerText = source.options[source.correctAnswer];
  const shuffledOptions = shuffleArray(source.options);

  const remappedCorrectIndex = Number.isInteger(source.correctAnswer)
    ? shuffledOptions.indexOf(correctAnswerText)
    : source.correctAnswer;

  return {
    ...source,
    options: shuffledOptions,
    correctAnswer: remappedCorrectIndex,
  };
};

const prepareQuestions = (questions) =>
  shuffleArray(questions).map(getQuestionData);

const prepareMatch = (match) => {
  const matchData = match.toObject();
  matchData.questions = prepareQuestions(matchData.questions);
  return matchData;
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getQuestionsByCategory = async (req, res) => {
  try {
    const categoryName = (req.params.categoryName || '').trim();
    const questions = await Question.find({ categoryName });

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'No questions found for this category. Check the category value in your database.',
      });
    }

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: prepareQuestions(questions),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const createRoom = async (req, res) => {
  try {
    const currentUserId = req.user?._id;
    const { categoryName, roomType } = req.body;
    const normalizedCategoryName = (categoryName || '').trim();

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to create a room.',
      });
    }

    if (!normalizedCategoryName || !roomType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category name and room type',
      });
    }

    if (!['public', 'private'].includes(roomType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room type.',
      });
    }

    const category = await Category.findOne({
      name: normalizedCategoryName,
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid category',
      });
    }

    const questions = await Question.find({
      categoryName: category.name,
    });

    if (questions.length < 3) {
      return res.status(400).json({
        success: false,
        message:
          'Not enough questions in this category to start a match',
      });
    }

    const selectedQuestions = shuffleArray(questions)
      .slice(0, 5)
      .map((question) => question._id);

    if (roomType === 'public') {
      const existingPublicMatch = await Match.findOne({
        categoryName: category.name,
        roomType: 'public',
        status: 'Pending',
        'players.1': { $exists: false },
      });

      if (existingPublicMatch) {
        const alreadyWaiting = existingPublicMatch.players.some(
          (playerId) =>
            playerId.toString() === currentUserId.toString()
        );

        if (alreadyWaiting) {
          return res.status(400).json({
            success: false,
            message: 'You are already waiting in this public room',
          });
        }

        existingPublicMatch.players.push(currentUserId);
        existingPublicMatch.status = 'In-Progress';
        await existingPublicMatch.save();

        const populatedMatch = await Match.findById(
          existingPublicMatch._id
        )
          .populate('players', 'username')
          .populate('questions');

        req.app.get('io')?.emit('public_rooms_updated');

        return res.status(200).json({
          success: true,
          message: 'Joined public match successfully',
          data: prepareMatch(populatedMatch),
        });
      }
    }

    const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const match = await Match.create({
      roomCode,
      categoryName: category.name,
      roomType,
      players: [currentUserId],
      questions: selectedQuestions,
      status: 'Pending',
    });

    const populatedMatch = await Match.findById(match._id)
      .populate('players', 'username')
      .populate('questions');

    if (roomType === 'public') {
      req.app.get('io')?.emit('public_rooms_updated');
    }

    return res.status(201).json({
      success: true,
      roomCode: match.roomCode,
      data: prepareMatch(populatedMatch),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const joinRoom = async (req, res) => {
  try {
    const currentUserId = req.user?._id;
    const { roomCode } = req.body;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to join a room.',
      });
    }

    if (!roomCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a room code',
      });
    }

    const match = await Match.findOne({
      roomCode: roomCode.trim().toUpperCase(),
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Invalid room code or match not found',
      });
    }

    const alreadyJoined = match.players.some(
      (player) => player.toString() === currentUserId.toString()
    );

    // Allow a participant to reconnect to an active match.
    if (match.status === 'In-Progress' && alreadyJoined) {
      const populatedMatch = await Match.findById(match._id)
        .populate('players', 'username')
        .populate('questions');

      return res.status(200).json({
        success: true,
        data: prepareMatch(populatedMatch),
      });
    }

    if (match.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Match has already started or completed',
      });
    }

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'Player is already in this room',
      });
    }

    if (match.players.length >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Room is full',
      });
    }

    match.players.push(currentUserId);
    match.status = 'In-Progress';
    await match.save();

    match.players.forEach((userId) => {
      req.app.get('io')?.emit('friends_updated', {
        userId: userId.toString(),
      });
    });

    const populatedMatch = await Match.findById(match._id)
      .populate('players', 'username')
      .populate('questions');

    req.app.get('io')?.emit('public_rooms_updated');

    return res.status(200).json({
      success: true,
      data: prepareMatch(populatedMatch),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getRoomStatus = async (req, res) => {
  try {
    const currentUserId = req.user?._id;

    const match = await Match.findOne({
      roomCode: req.params.roomCode.toUpperCase(),
    })
      .populate('players', 'username')
      .populate('questions');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const isParticipant =
      currentUserId &&
      match.players.some(
        (player) =>
          player._id.toString() === currentUserId.toString()
      );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Player not part of this match',
      });
    }

    return res.status(200).json({
      success: true,
      data: prepareMatch(match),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const submitMatchScore = async (req, res) => {
  try {
    const currentUserId = req.user?._id;
    const { matchId, score } = req.body;
    const normalizedScore = Number(score);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to submit a score.',
      });
    }

    if (
      !matchId ||
      !Number.isFinite(normalizedScore) ||
      normalizedScore < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid match ID and score.',
      });
    }

    const match = await Match.findById(matchId).populate(
      'players',
      'username'
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    if (match.players.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'This match is missing an opponent.',
      });
    }

    const currentPlayerIsPlayerOne =
      match.players[0]._id.toString() === currentUserId.toString();

    const currentPlayerIsPlayerTwo =
      match.players[1]._id.toString() === currentUserId.toString();

    if (!currentPlayerIsPlayerOne && !currentPlayerIsPlayerTwo) {
      return res.status(403).json({
        success: false,
        message: 'Player not part of this match',
      });
    }

    const scoreField = currentPlayerIsPlayerOne
      ? 'player1Score'
      : 'player2Score';

    const existingScore = match.scores?.[scoreField];

    if (existingScore !== null && existingScore !== undefined) {
      if (Number(existingScore) === normalizedScore) {
        return res.status(200).json({
          success: true,
          message: 'Score already recorded',
          data: match,
        });
      }

      return res.status(409).json({
        success: false,
        message: 'A score has already been submitted for this match',
      });
    }

    if (match.status === 'Completed') {
      return res.status(200).json({
        success: true,
        message: 'Match is already completed',
        data: match,
      });
    }

    match.scores[scoreField] = normalizedScore;

    const bothPlayersSubmitted =
      match.scores.player1Score !== null &&
      match.scores.player1Score !== undefined &&
      match.scores.player2Score !== null &&
      match.scores.player2Score !== undefined;

    if (bothPlayersSubmitted) {
      match.status = 'Completed';

      if (match.scores.player1Score > match.scores.player2Score) {
        match.winner = match.players[0]._id;
      } else if (
        match.scores.player2Score > match.scores.player1Score
      ) {
        match.winner = match.players[1]._id;
      } else {
        match.winner = null;
      }
    }

    await match.save();

    if (bothPlayersSubmitted) {
      req.app.get('io')?.emit('leaderboard_updated');
      req.app.get('io')?.emit('public_rooms_updated');
    }

    return res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  getQuestionsByCategory,
  createRoom,
  joinRoom,
  getRoomStatus,
  submitMatchScore,
};
