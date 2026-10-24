const express = require('express');
const { getDashboard, getPublicLeaderboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/leaderboard/public', getPublicLeaderboard);
router.get('/:playerId', protect, getDashboard);

module.exports = router;