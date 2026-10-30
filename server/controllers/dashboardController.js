
const Match = require('../models/Match');
const User = require('../models/User');
const Friend = require('../models/Friend');
const Inbox = require('../models/Inbox');
const {
  getPlayerLevel,
  getPlayerStats,
} = require('../services/playerStatsService');

const getScoreForPlayer = (match, playerId) => {
  const playerIndex = match.players.findIndex((player) => {
    const id = player?._id || player;
    return id?.toString() === playerId?.toString();
  });

  if (playerIndex === 0) return match.scores?.player1Score ?? null;
  if (playerIndex === 1) return match.scores?.player2Score ?? null;

  return null;
};

const getLeaderboard = async (viewerId = null) => {
  const leaderboardUsers = await User.find()
    .select('username createdAt')
    .sort({ username: 1 })
    .limit(50);

  const leaderboard = await Promise.all(
    leaderboardUsers.map(async (leaderboardUser) => {
      const userMatches = await Match.find({
        players: leaderboardUser._id,
        status: 'Completed',
      }).select('players scores winner');

      let wins = 0;
      let xp = 0;

      userMatches.forEach((match) => {
        const score = getScoreForPlayer(
          match,
          leaderboardUser._id.toString()
        );

        xp += score ?? 0;

        if (
          match.winner?.toString() ===
          leaderboardUser._id.toString()
        ) {
          wins += 1;
        }
      });

      return {
        id: leaderboardUser._id.toString(),
        username: leaderboardUser.username,
        wins,
        matches: userMatches.length,
        winRate: userMatches.length
          ? Number(((wins / userMatches.length) * 100).toFixed(1))
          : 0,
        xp,
        level: Math.floor(xp / 100) + 1,
      };
    })
  );

  const sortedLeaderboard = leaderboard.sort(
    (a, b) => b.xp - a.xp || b.wins - a.wins
  );

  if (!viewerId) return sortedLeaderboard;

  const playerIds = sortedLeaderboard.map((player) => player.id);
  const viewerIdString = viewerId.toString();

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

  const viewerFriends = new Set();
  const friendsByPlayer = new Map(
    playerIds.map((id) => [id.toString(), new Set()])
  );

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

    const otherId =
      senderId === viewerIdString ? recipientId : senderId;

    requestsByPlayer.set(otherId, {
      status:
        recipientId === viewerIdString ? 'received' : 'sent',
      requestId: request._id,
    });
  });

  return sortedLeaderboard.map((player) => {
    const playerId = player.id;
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

    return res.status(500).json({
      success: false,
      message: 'Unable to load leaderboard.',
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const currentUserId = req.user?._id?.toString();

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to view the dashboard.',
      });
    }

    const user = await User.findById(currentUserId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const [
      matches,
      leaderboardStats,
      publicRooms,
      totalPlayers,
    ] = await Promise.all([
      Match.find({
        players: currentUserId,
        status: 'Completed',
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('players', 'username'),

      getPlayerStats(),

      Match.find({
        roomType: 'public',
        status: 'Pending',
        'players.1': { $exists: false },
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('players', 'username'),

      User.countDocuments(),
    ]);

    const currentPlayerStats =
      leaderboardStats.find(
        (player) =>
          player.id?.toString() === currentUserId
      ) || {
        id: currentUserId,
        username: user.username,
        xp: 0,
        wins: 0,
        matches: 0,
        level: 1,
        levelStartXp: 0,
        nextLevelXp: 100,
        winRate: 0,
      };

    const totalXp = currentPlayerStats.xp || 0;
    const levelStats = getPlayerLevel(totalXp);

    const playerMatches = matches.map((match) => {
      const opponent =
        match.players.find(
          (player) =>
            player._id.toString() !== currentUserId
        )?.username || 'Opponent';

      const score = getScoreForPlayer(match, currentUserId);
      const won = match.winner
        ? match.winner.toString() === currentUserId
        : false;

      return {
        id: match._id,
        roomCode: match.roomCode,
        categoryName: match.categoryName,
        score,
        opponent,
        won,
        completedAt: match.updatedAt,
      };
    });

    return res.json({
      success: true,
      data: {
        profile: {
          id: user._id,
          username: user.username,
          email: user.email,
          ...levelStats,
          xp: totalXp,
          wins: currentPlayerStats.wins || 0,
          matches: currentPlayerStats.matches || 0,
          winRate: currentPlayerStats.winRate || 0,
        },

        leaderboard: (await getLeaderboard(currentUserId)).slice(0, 10),
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
    console.error('Failed to load dashboard:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load dashboard.',
    });
  }
};

module.exports = {
  getDashboard,
  getPublicLeaderboard,
};
