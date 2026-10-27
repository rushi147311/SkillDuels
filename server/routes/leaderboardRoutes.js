const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

router.get('/', getLeaderboard);

module.exports = router;
