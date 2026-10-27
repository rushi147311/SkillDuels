const Match = require('../models/Match');
const User = require('../models/User');
const { getPlayerLevel, getPlayerStats } = require('../services/playerStatsService');

const getScoreForPlayer = (match, playerId) => {
  const playerIndex = match.players.findIndex((player) => player.toString() === playerId);
  if (playerIndex === 0) return match.scores?.player1Score ?? null;
  if (playerIndex === 1) return match.scores?.player2Score ?? null;
  return null;
};

const getDashboard = async (req, res) => {
  try {
    const currentUserId = req.user?._id?.toString();

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: 'You must be logged in to view the dashboard.' });
    }

    const user = await User.findById(currentUserId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [matches, leaderboardStats, publicRooms] = await Promise.all([
      Match.find({ players: currentUserId, status: 'Completed' })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('players', 'username'),
      getPlayerStats(),
      Match.find({ roomType: 'public', status: 'Pending', 'players.1': { $exists: false } })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('players', 'username'),
    ]);

    const currentPlayerStats = leaderboardStats.find((player) => player.id === currentUserId) || {
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
      const opponent = match.players.find((player) => player._id.toString() !== currentUserId)?.username || 'Opponent';
      const score = getScoreForPlayer(match, currentUserId);
      const won = match.winner ? match.winner.toString() === currentUserId : false;

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
        leaderboard: leaderboardStats.slice(0, 10),
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard };
