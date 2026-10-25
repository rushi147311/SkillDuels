const mongoose = require('mongoose');
const Match = require('../models/Match');
const User = require('../models/User');
const Friend = require('../models/Friend');
const Inbox = require('../models/Inbox');

const getScoreForPlayer = (match, playerId) => {
  const playerIndex = match.players.findIndex((player) => player.toString() === playerId);
  return playerIndex === 0 ? match.scores.player1Score : match.scores.player2Score;
};

const getLeaderboard = async (viewerId = null) => {
  const leaderboardUsers = await User.find().select('username createdAt').sort({ username: 1 }).limit(50);
  const leaderboard = await Promise.all(leaderboardUsers.map(async (leaderboardUser) => {
    const userMatches = await Match.find({ players: leaderboardUser._id, status: 'Completed' }).select('players scores winner');
    let wins = 0;
    let xp = 0;

    userMatches.forEach((match) => {
      const score = getScoreForPlayer(match, leaderboardUser._id.toString());
      xp += score;
      if (match.winner?.toString() === leaderboardUser._id.toString()) wins += 1;
    });

    return {
      id: leaderboardUser._id,
      username: leaderboardUser.username,
      wins,
      matches: userMatches.length,
      xp,
      level: Math.floor(xp / 100) + 1,
    };
  }));

  const sortedLeaderboard = leaderboard.sort((a, b) => b.xp - a.xp || b.wins - a.wins);
  if (!viewerId) return sortedLeaderboard;

  const playerIds = sortedLeaderboard.map((player) => player.id);
  const [friendships, requests] = await Promise.all([
    Friend.find({
      $or: [
        { user1: { $in: playerIds } },
        { user2: { $in: playerIds } },
        { user1: viewerId },
        { user2: viewerId },
      ],
    }).select('user1 user2'),
    Inbox.find({
      type: 'friend_request',
      status: 'pending',
      $or: [
        { sender: viewerId, recipient: { $in: playerIds } },
        { recipient: viewerId, sender: { $in: playerIds } },
      ],
    }).select('sender recipient'),
  ]);
  const viewerIdString = viewerId.toString();
  const viewerFriends = new Set();
  const friendsByPlayer = new Map(playerIds.map((id) => [id.toString(), new Set()]));

  friendships.forEach(({ user1, user2 }) => {
    const firstId = user1.toString();
    const secondId = user2.toString();
    if (firstId === viewerIdString) viewerFriends.add(secondId);
    if (secondId === viewerIdString) viewerFriends.add(firstId);
    friendsByPlayer.get(firstId)?.add(secondId);
    friendsByPlayer.get(secondId)?.add(firstId);
  });

  const requestsByPlayer = new Map();
  requests.forEach((request) => {
    const senderId = request.sender.toString();
    const recipientId = request.recipient.toString();
    const otherId = senderId === viewerIdString ? recipientId : senderId;
    requestsByPlayer.set(otherId, {
      status: recipientId === viewerIdString ? 'received' : 'sent',
      requestId: request._id,
    });
  });

  return sortedLeaderboard.map((player) => {
    const playerId = player.id.toString();
    const friendIds = friendsByPlayer.get(playerId) || new Set();
    let mutualFriends = 0;
    friendIds.forEach((friendId) => {
      if (viewerFriends.has(friendId)) mutualFriends += 1;
    });

    return {
      ...player,
      mutualFriends: playerId === viewerIdString ? 0 : mutualFriends,
      isFriend: viewerFriends.has(playerId),
      friendRequest: requestsByPlayer.get(playerId) || null,
    };
  });
};

const getPublicLeaderboard = async (req, res) => {
  try {
    const [leaderboard, totalPlayers] = await Promise.all([
      getLeaderboard(req.user?._id),
      User.countDocuments(),
    ]);
    return res.json({
      success: true,
      data: {
        players: leaderboard.slice(0, 10),
        totalPlayers,
      },
    });
  } catch (error) {
    console.error('Failed to load public leaderboard:', error);
    return res.status(500).json({ success: false, message: 'Unable to load leaderboard.' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const { playerId } = req.params;
    const validPlayerId = mongoose.Types.ObjectId.isValid(playerId);
    const user = validPlayerId ? await User.findById(playerId).select('-password') : null;
    const playerFilter = validPlayerId ? new mongoose.Types.ObjectId(playerId) : null;

    const [matches, leaderboard, publicRooms, totalPlayers] = await Promise.all([
      playerFilter
        ? Match.find({ players: playerFilter, status: 'Completed' })
          .sort({ updatedAt: -1 })
          .limit(10)
          .populate('players', 'username')
        : [],
      getLeaderboard(req.user._id),
      Match.find({ roomType: 'public', status: 'Pending', 'players.1': { $exists: false } })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('players', 'username'),
      User.countDocuments(),
    ]);

    const playerMatches = matches.map((match) => ({
      id: match._id,
      roomCode: match.roomCode,
      categoryName: match.categoryName,
      score: getScoreForPlayer(match, playerId),
      opponent: match.players.find((player) => player._id.toString() !== playerId)?.username || 'Opponent',
      won: match.winner?.toString() === playerId,
      completedAt: match.updatedAt,
    }));
    const totalXp = playerMatches.reduce((sum, match) => sum + match.score, 0);

    res.json({
      success: true,
      data: {
        profile: {
          id: user?._id || playerId,
          username: user?.username || 'Guest Player',
          email: user?.email || '',
          level: Math.floor(totalXp / 100) + 1,
          xp: totalXp,
          nextLevelXp: (Math.floor(totalXp / 100) + 1) * 100,
          wins: playerMatches.filter((match) => match.won).length,
          matches: playerMatches.length,
        },
        leaderboard: leaderboard.slice(0, 10),
        totalPlayers,
        publicRooms: publicRooms.map((room) => ({
          id: room._id,
          roomCode: room.roomCode,
          categoryName: room.categoryName,
          host: room.players[0]?.username || 'Player',
          createdAt: room.createdAt,
        })),
        history: playerMatches,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getPublicLeaderboard };