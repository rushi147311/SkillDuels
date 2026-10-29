const { getPlayerStats } = require('../services/playerStatsService');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await getPlayerStats();

    res.status(200).json({
      success: true,
      data: leaderboard.map((player) => ({
        playerId: player.id,
        username: player.username,
        totalPoints: player.xp,
        matchesPlayed: player.matches,
        wins: player.wins,
        rank: player.rank,
        winRate: player.winRate,
      })),
    });
  } catch (error) {
    console.error('Failed to aggregate leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load the leaderboard right now.',
    });
  }
};

module.exports = { getLeaderboard };
