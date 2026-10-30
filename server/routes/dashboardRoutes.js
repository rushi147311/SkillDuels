
const express = require('express');

const {
  getDashboard,
  getPublicLeaderboard,
} = require('../controllers/dashboardController');

const {
  protect,
  optionalProtect,
} = require('../middleware/authMiddleware');

const router = express.Router();

// Current logged-in user's dashboard
router.get('/me', protect, getDashboard);

// Public leaderboard, with optional authentication
router.get('/leaderboard/public', optionalProtect, getPublicLeaderboard);

// Dashboard by player ID
router.get('/:playerId', protect, getDashboard);

module.exports = router;
