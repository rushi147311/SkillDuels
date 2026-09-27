const mongoose = require('mongoose');
const Match = require('../models/Match');
const User = require('../models/User');

const getScoreForPlayer = (match, playerId) => {
  const playerIndex = match.players.findIndex((player) => player.toString() === playerId);
  return playerIndex === 0 ? match.scores.player1Score : match.scores.player2Score;
};

const getDashboard = async (req, res) => {
  try {
    const { playerId } = req.params;
    const validPlayerId = mongoose.Types.ObjectId.isValid(playerId);
    const user = validPlayerId ? await User.findById(playerId).select('-password') : null;
    const playerFilter = validPlayerId ? new mongoose.Types.ObjectId(playerId) : null;

    const [matches, leaderboardUsers, publicRooms] = await Promise.all([
      playerFilter
        ? Match.find({ players: playerFilter, status: 'Completed' })
          .sort({ updatedAt: -1 })
          .limit(10)
          .populate('players', 'username')
        : [],
      User.find().select('username createdAt').sort({ username: 1 }).limit(50),
      Match.find({ roomType: 'public', status: 'Pending', 'players.1': { $exists: false } })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('players', 'username'),
    ]);

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

    leaderboard.sort((a, b) => b.xp - a.xp || b.wins - a.wins);

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

module.exports = { getDashboard };