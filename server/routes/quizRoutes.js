const express = require('express');
const router = express.Router();
const {getQuestionsByCategory, createRoom, joinRoom, submitMatchScore} = require('../controllers/quizController');
//const { protect } = require('../middleware/authMiddleware'); 

router.get('/questions/:categoryId', getQuestionsByCategory);
router.post('/create-room', createRoom);
router.post('/join-room',  joinRoom);
router.post('/submit', submitMatchScore);

module.exports = router;