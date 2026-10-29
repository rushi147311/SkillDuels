const express = require('express');
const {
  getFriendsAndRequests,
  removeFriend,
  getFriendProfile,
  createChallenge,
  getMessages,
  sendMessage,
  getFriendStatus,
  sendFriendRequest,
  respondToFriendRequest,
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getFriendsAndRequests);
router.get('/status/:username', getFriendStatus);
router.post('/requests', sendFriendRequest);
router.patch('/requests/:requestId', respondToFriendRequest);
router.delete('/:friendId', removeFriend);
router.get('/:friendId/profile', getFriendProfile);
router.post('/:friendId/challenges', createChallenge);
router.get('/:friendId/messages', getMessages);
router.post('/:friendId/messages', sendMessage);

module.exports = router;
