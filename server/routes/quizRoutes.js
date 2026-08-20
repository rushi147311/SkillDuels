const express = require('express');
const router = express.Router();
const {getQuestionsByCategory, createRoom, joinRoom, getRoomStatus, submitMatchScore} = require('../controllers/quizController');
//const { protect } = require('../middleware/authMiddleware'); 

router.get('/questions/:categoryName', getQuestionsByCategory);
router.post('/create-room', createRoom);
router.post('/join-room',  joinRoom);
router.get('/room/:roomCode', getRoomStatus);
router.post('/submit', submitMatchScore);

module.exports = router;