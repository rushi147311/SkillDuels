const express = require('express');
const router = express.Router();
const {getQuestionsByCategory, createRoom, joinRoom, getRoomStatus, submitMatchScore} = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware'); 

router.get('/questions/:categoryName', protect, getQuestionsByCategory);
router.post('/create-room', protect, createRoom);
router.post('/join-room', protect, joinRoom);
router.get('/room/:roomCode', protect, getRoomStatus);
router.post('/submit', protect, submitMatchScore);

module.exports = router;