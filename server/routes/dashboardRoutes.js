const express = require('express');
const { getDashboard, getPublicLeaderboard } = require('../controllers/dashboardController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/leaderboard/public', optionalProtect, getPublicLeaderboard);
router.get('/:playerId', protect, getDashboard);

module.exports = router;