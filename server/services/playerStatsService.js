const Match = require('../models/Match');
const User = require('../models/User');

const getPlayerLevel = (xp) => {
  const level = xp < 100 ? 1 : 2 + Math.floor((xp - 100) / 50);
  const levelStartXp = level === 1 ? 0 : 100 + (level - 2) * 50;
  const nextLevelXp = level === 1 ? 100 : levelStartXp + 50;

  return { level, levelStartXp, nextLevelXp };
};

const getPlayerStats = async () => {
  const [users, completedMatches] = await Promise.all([
    User.find({}, { _id: 1, username: 1 }).sort({ username: 1 }).lean(),
    Match.find({ status: 'Completed' }).lean(),
  ]);

  const statsByPlayerId = new Map();

  users.forEach((user) => {
    statsByPlayerId.set(user._id.toString(), {
      id: user._id.toString(),
      username: user.username,
      xp: 0,
      matches: 0,
      wins: 0,
      winRate: 0,
    });
  });

  completedMatches.forEach((match) => {
    const players = Array.isArray(match.players) ? match.players.map((player) => player.toString()) : [];
    if (players.length < 2) {
      return;
    }

    const player1Id = players[0];
    const player2Id = players[1];
    const player1Score = Number(match.scores?.player1Score);
    const player2Score = Number(match.scores?.player2Score);

    const scoresAreValid =
      match.scores?.player1Score != null &&
      match.scores?.player2Score != null &&
      Number.isFinite(player1Score) &&
      Number.isFinite(player2Score);
    const declaredWinnerId = match.winner?.toString();
    let winnerId = [player1Id, player2Id].includes(declaredWinnerId)
      ? declaredWinnerId
      : null;

    if (!winnerId && scoresAreValid && player1Score !== player2Score) {
      winnerId = player1Score > player2Score ? player1Id : player2Id;
    }

    const recordMatch = (playerId) => {
      const entry = statsByPlayerId.get(playerId) || {
        id: playerId,
        username: `Player ${playerId.slice(-4)}`,
        xp: 0,
        matches: 0,
        wins: 0,
        winRate: 0,
      };

      if (!statsByPlayerId.has(playerId)) {
        statsByPlayerId.set(playerId, entry);
      }

      entry.matches += 1;

      if (winnerId) {
        const playerWon = winnerId === playerId;
        if (playerWon) entry.wins += 1;
        entry.xp += playerWon ? 15 : 5;
      } else if (scoresAreValid && player1Score === player2Score) {
        entry.xp += 10;
      }
    };

    recordMatch(player1Id);
    if (player2Id !== player1Id) recordMatch(player2Id);
  });

  const players = [...statsByPlayerId.values()].map((player) => {
    const levelStats = getPlayerLevel(player.xp);
    const winRate = player.matches ? Number(((player.wins / player.matches) * 100).toFixed(1)) : 0;

    return {
      ...player,
      username: player.username || `Player ${player.id.slice(-4)}`,
      ...levelStats,
      winRate,
    };
  });

  players.sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return String(a.username).localeCompare(String(b.username));
  });

  return players.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};

module.exports = { getPlayerLevel, getPlayerStats };
