const mongoose = require('mongoose');
const Friend = require('../models/Friend');
const Inbox = require('../models/Inbox');
const Match = require('../models/Match');
const Message = require('../models/Message');
const Category = require('../models/Category');
const Question = require('../models/Question');
const User = require('../models/User');
const crypto = require('crypto');

const getFriendIds = async (userId) => {
  const friendships = await Friend.find({
    $or: [{ user1: userId }, { user2: userId }],
  }).select('user1 user2');

  return friendships.map((friendship) =>
    friendship.user1.toString() === userId.toString()
      ? friendship.user2
      : friendship.user1
  );
};

const notifyUsers = (req, userIds) => {
  const io = req.app.get('io');
  userIds.forEach((userId) => io.emit('friends_updated', { userId: userId.toString() }));
};

const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getFriendsAndRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const [friendIds, requests, acceptedChallengeInvitations] = await Promise.all([
      getFriendIds(userId),
      Inbox.find({
        recipient: userId,
        type: { $in: ['friend_request', 'challenge'] },
        status: 'pending',
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'username'),
      Inbox.find({
        $or: [{ sender: userId }, { recipient: userId }],
        type: 'challenge',
        status: 'accepted',
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('recipient', 'username')
        .populate('sender', 'username'),
    ]);
    const activeChallengeRooms = await Match.find({
      roomCode: { $in: acceptedChallengeInvitations.map((challenge) => challenge.roomCode) },
      status: { $in: ['Pending', 'In-Progress'] },
    }).select('roomCode');
    const activeRoomCodes = new Set(activeChallengeRooms.map((match) => match.roomCode));
    const acceptedChallenges = acceptedChallengeInvitations.filter((challenge) => activeRoomCodes.has(challenge.roomCode));
    const friends = await User.find({ _id: { $in: friendIds } }).select('username').sort({ username: 1 });

    res.json({
      success: true,
      data: {
        friends: friends.map((friend) => ({ id: friend._id, username: friend.username })),
        requests: requests.map((request) => ({
          id: request._id,
          type: request.type,
          sender: { id: request.sender._id, username: request.sender.username },
          roomCode: request.roomCode,
          categoryName: request.categoryName,
          createdAt: request.createdAt,
        })),
        acceptedChallenges: acceptedChallenges.map((challenge) => ({
          id: challenge._id,
          roomCode: challenge.roomCode,
          categoryName: challenge.categoryName,
          opponent: challenge.sender._id.equals(userId)
            ? challenge.recipient.username
            : challenge.sender.username,
          isChallenger: challenge.sender._id.equals(userId),
          updatedAt: challenge.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to load friends and requests:', error);
    res.status(500).json({ success: false, message: 'Unable to load friends.' });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    if (!username) {
      return res.status(400).json({ success: false, message: 'A username is required.' });
    }

    const recipient = await User.findOne({
      username: { $regex: `^${escapeRegExp(username)}$`, $options: 'i' },
    }).select('_id username');
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'No player found with that username.' });
    }

    const senderId = req.user._id;
    if (recipient._id.equals(senderId)) {
      return res.status(400).json({ success: false, message: 'You cannot add yourself as a friend.' });
    }

    const [existingFriendship, existingRequest] = await Promise.all([
      Friend.findOne({
        $or: [
          { user1: senderId, user2: recipient._id },
          { user1: recipient._id, user2: senderId },
        ],
      }),
      Inbox.findOne({
        type: 'friend_request',
        status: 'pending',
        $or: [
          { sender: senderId, recipient: recipient._id },
          { sender: recipient._id, recipient: senderId },
        ],
      }),
    ]);

    if (existingFriendship) {
      return res.status(409).json({ success: false, message: 'You are already friends.' });
    }
    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: existingRequest.sender.equals(senderId)
          ? 'A friend request is already pending.'
          : 'This player has already sent you a request.',
      });
    }

    const request = await Inbox.create({
      recipient: recipient._id,
      sender: senderId,
      type: 'friend_request',
    });
    notifyUsers(req, [recipient._id]);

    res.status(201).json({
      success: true,
      data: { requestId: request._id, username: recipient.username },
    });
  } catch (error) {
    console.error('Failed to send friend request:', error);
    res.status(500).json({ success: false, message: 'Unable to send friend request.' });
  }
};

const getFriendStatus = async (req, res) => {
  try {
    const username = req.params.username.trim();
    const target = await User.findOne({
      username: { $regex: `^${escapeRegExp(username)}$`, $options: 'i' },
    }).select('_id');
    if (!target) {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    const currentUserId = req.user._id;
    if (target._id.equals(currentUserId)) {
      return res.json({ success: true, data: { status: 'self' } });
    }

    const [friendship, request] = await Promise.all([
      Friend.findOne({
        $or: [
          { user1: currentUserId, user2: target._id },
          { user1: target._id, user2: currentUserId },
        ],
      }).select('_id'),
      Inbox.findOne({
        type: 'friend_request',
        status: 'pending',
        $or: [
          { sender: currentUserId, recipient: target._id },
          { sender: target._id, recipient: currentUserId },
        ],
      }).select('_id sender recipient'),
    ]);

    const status = friendship
      ? 'friends'
      : request
        ? request.sender.equals(currentUserId) ? 'sent' : 'received'
        : 'none';
    res.json({
      success: true,
      data: { status, requestId: request?._id || null },
    });
  } catch (error) {
    console.error('Failed to load friend status:', error);
    res.status(500).json({ success: false, message: 'Unable to load friend status.' });
  }
};

const respondToFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid friend request.' });
    }
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Choose accept or decline.' });
    }

    const requestFilter = {
      _id: requestId,
      recipient: req.user._id,
      type: { $in: ['friend_request', 'challenge'] },
      status: 'pending',
    };
    const pendingRequest = await Inbox.findOne(requestFilter);
    if (!pendingRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' });
    }
    if (pendingRequest.type === 'challenge' && !(await findFriendship(pendingRequest.sender, pendingRequest.recipient))) {
      return res.status(403).json({ success: false, message: 'This challenge is no longer available.' });
    }

    const request = await Inbox.findOneAndUpdate(
      requestFilter,
      { $set: { status } },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' });
    }

    if (status === 'accepted' && request.type === 'friend_request') {
      const [user1, user2] = [request.recipient, request.sender]
        .sort((first, second) => first.toString().localeCompare(second.toString()));
      await Friend.updateOne(
        { user1, user2 },
        { $setOnInsert: { user1, user2 } },
        { upsert: true }
      );
    }
    if (status === 'declined' && request.type === 'challenge') {
      await Match.deleteOne({ roomCode: request.roomCode, status: 'Pending' });
    }

    notifyUsers(req, [request.sender, request.recipient]);
    res.json({
      success: true,
      data: { status, type: request.type, roomCode: request.roomCode },
    });
  } catch (error) {
    console.error('Failed to respond to friend request:', error);
    res.status(500).json({ success: false, message: 'Unable to update friend request.' });
  }
};

const findFriendship = (firstUserId, secondUserId) => Friend.findOne({
  $or: [
    { user1: firstUserId, user2: secondUserId },
    { user1: secondUserId, user2: firstUserId },
  ],
});

const removeFriend = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.friendId)) {
      return res.status(400).json({ success: false, message: 'Invalid friend.' });
    }
    const friendId = new mongoose.Types.ObjectId(req.params.friendId);
    const friendship = await findFriendship(req.user._id, friendId);
    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friend connection not found.' });
    }

    await Friend.deleteOne({ _id: friendship._id });
    notifyUsers(req, [req.user._id, friendId]);
    res.json({ success: true, message: 'Friend removed.' });
  } catch (error) {
    console.error('Failed to remove friend:', error);
    res.status(500).json({ success: false, message: 'Unable to remove friend.' });
  }
};

const getFriendProfile = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.friendId)) {
      return res.status(400).json({ success: false, message: 'Invalid friend.' });
    }
    const friendId = new mongoose.Types.ObjectId(req.params.friendId);
    if (!(await findFriendship(req.user._id, friendId))) {
      return res.status(403).json({ success: false, message: 'Friend profile is only available to friends.' });
    }

    const [user, matches] = await Promise.all([
      User.findById(friendId).select('username'),
      Match.find({ players: friendId, status: 'Completed' }).select('players scores winner'),
    ]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    const stats = matches.reduce((result, match) => {
      const playerIndex = match.players.findIndex((player) => player.equals(friendId));
      const score = playerIndex === 0 ? match.scores.player1Score : match.scores.player2Score;
      result.xp += score || 0;
      if (match.winner?.equals(friendId)) result.wins += 1;
      return result;
    }, { xp: 0, wins: 0 });

    res.json({
      success: true,
      data: {
        username: user.username,
        level: Math.floor(stats.xp / 100) + 1,
        xp: stats.xp,
        wins: stats.wins,
        matches: matches.length,
      },
    });
  } catch (error) {
    console.error('Failed to load friend profile:', error);
    res.status(500).json({ success: false, message: 'Unable to load friend profile.' });
  }
};

const createChallenge = async (req, res) => {
  try {
    const { friendId } = req.params;
    const categoryName = typeof req.body.categoryName === 'string' ? req.body.categoryName.trim() : '';
    if (!mongoose.isValidObjectId(friendId) || !categoryName) {
      return res.status(400).json({ success: false, message: 'A valid friend and category are required.' });
    }
    const opponentId = new mongoose.Types.ObjectId(friendId);
    if (!(await findFriendship(req.user._id, opponentId))) {
      return res.status(403).json({ success: false, message: 'You can only challenge a friend.' });
    }

    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      return res.status(400).json({ success: false, message: 'Select a valid category.' });
    }
    const questions = await Question.find({ categoryName: category.name }).select('_id');
    if (questions.length < 3) {
      return res.status(400).json({ success: false, message: 'Not enough questions in this category to start a match.' });
    }

    const selectedQuestions = shuffle(questions).slice(0, 5).map((question) => question._id);
    const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    await Match.create({
      roomCode,
      categoryName: category.name,
      roomType: 'private',
      players: [req.user._id],
      questions: selectedQuestions,
      status: 'Pending',
    });
    const invitation = await Inbox.create({
      recipient: opponentId,
      sender: req.user._id,
      type: 'challenge',
      roomCode,
      categoryName: category.name,
    });

    notifyUsers(req, [opponentId]);
    res.status(201).json({
      success: true,
      data: { invitationId: invitation._id, roomCode, categoryName: category.name },
    });
  } catch (error) {
    console.error('Failed to create friend challenge:', error);
    res.status(500).json({ success: false, message: 'Unable to create challenge.' });
  }
};

const getMessages = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.friendId)) {
      return res.status(400).json({ success: false, message: 'Invalid friend.' });
    }
    const friendId = new mongoose.Types.ObjectId(req.params.friendId);
    if (!(await findFriendship(req.user._id, friendId))) {
      return res.status(403).json({ success: false, message: 'Chat is only available between friends.' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: friendId },
        { sender: friendId, recipient: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'username');
    res.json({
      success: true,
      data: messages.reverse().map((message) => ({
        id: message._id,
        senderId: message.sender._id,
        senderUsername: message.sender.username,
        text: message.text,
        createdAt: message.createdAt,
      })),
    });
  } catch (error) {
    console.error('Failed to load friend messages:', error);
    res.status(500).json({ success: false, message: 'Unable to load chat.' });
  }
};

const sendMessage = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.friendId)) {
      return res.status(400).json({ success: false, message: 'Invalid friend.' });
    }
    const friendId = new mongoose.Types.ObjectId(req.params.friendId);
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text || text.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message must be between 1 and 2000 characters.' });
    }
    if (!(await findFriendship(req.user._id, friendId))) {
      return res.status(403).json({ success: false, message: 'Chat is only available between friends.' });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: friendId,
      text,
    });
    const responseData = {
      id: message._id,
      senderId: req.user._id,
      senderUsername: req.user.username,
      text: message.text,
      createdAt: message.createdAt,
    };
    const io = req.app.get('io');
    [req.user._id, friendId].forEach((userId) => {
      io.to(`user:${userId}`).emit('friend_message', {
        ...responseData,
        recipientId: friendId,
        conversationUserIds: [req.user._id.toString(), friendId.toString()],
      });
    });

    res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    console.error('Failed to send friend message:', error);
    res.status(500).json({ success: false, message: 'Unable to send message.' });
  }
};

module.exports = {
  getFriendsAndRequests,
  getFriendStatus,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  getFriendProfile,
  createChallenge,
  getMessages,
  sendMessage,
};
