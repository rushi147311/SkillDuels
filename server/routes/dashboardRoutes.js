const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/:playerId', getDashboard);

module.exports = router;