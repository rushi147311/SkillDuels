import { useCallback, useEffect, useState } from "react";
import { getPublicLeaderboard } from "../services/api";
import { socket } from "../services/socket";
import "./Leaderboard.css";

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState(() => new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const currentPlayerId = localStorage.getItem("skillDuelsPlayerId");

  const refreshLeaderboard = useCallback(() => {
    getPublicLeaderboard()
      .then((response) => {
        setPlayers(response.data.players);
        setTotalPlayers(response.data.totalPlayers);
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleSnapshot = ({ userIds }) => setOnlinePlayers(new Set(userIds));
    const handlePresence = ({ userId, online }) => {
      setOnlinePlayers((current) => {
        const updated = new Set(current);
        if (online) updated.add(userId);
        else updated.delete(userId);
        return updated;
      });
    };

    refreshLeaderboard();
    socket.on("leaderboard_updated", refreshLeaderboard);
    socket.on("presence_snapshot", handleSnapshot);
    socket.on("presence_updated", handlePresence);
    socket.emit("request_presence_snapshot");
    return () => {
      socket.off("leaderboard_updated", refreshLeaderboard);
      socket.off("presence_snapshot", handleSnapshot);
      socket.off("presence_updated", handlePresence);
    };
  }, [refreshLeaderboard]);

  const maxXP = Math.max(...players.map((player) => player.xp), 1);
  const currentPlayerIndex = players.findIndex(
    (player) => String(player.id) === currentPlayerId,
  );
  const currentPlayer = currentPlayerIndex >= 0 ? players[currentPlayerIndex] : null;
  const topThree = players.slice(0, 3);

  const getMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const onlineBadge = (player) =>
    String(player.id) !== currentPlayerId &&
    onlinePlayers.has(String(player.id)) ? (
      <span className="online-status" aria-label="Online">Online</span>
    ) : null;
  const onlineOtherPlayers = [...onlinePlayers].filter(
    (playerId) => playerId !== currentPlayerId,
  ).length;

  return (
    <div className="leaderboard-page">
      <nav className="game-navbar">
        <div className="logo">
          ⚔️ <span>SKILL</span>DUELS
        </div>
        {currentPlayer && (
          <div className="nav-player">
            <span>LVL {currentPlayer.level}</span>
            <div className="player-avatar">
              {currentPlayer.username.slice(0, 1).toUpperCase()}
            </div>
          </div>
        )}
      </nav>

      <section className="hero-section">
        <div className="trophy">🏆</div>
        <h1>LEADERBOARD</h1>
        <p>Rise through the ranks. Duel. Win. Dominate.</p>
      </section>

      {error && <p className="leaderboard-error" role="alert">{error}</p>}

      {!loading && topThree.length === 3 && (
        <section className="podium">
          {[topThree[1], topThree[0], topThree[2]].map((player) => {
            const rank = players.indexOf(player) + 1;
            const place = rank === 1 ? "first" : rank === 2 ? "second" : "third";
            return (
              <div className={`podium-player ${place}`} key={player.id}>
                {rank === 1 && <div className="crown">👑</div>}
                <div className="medal">{getMedal(rank)}</div>
                <div className="podium-avatar">
                  {player.username.slice(0, 1).toUpperCase()}
                </div>
                <h3>{onlineBadge(player)}{player.username}</h3>
                <p>{player.xp} XP</p>
                <div className="podium-block">{rank}</div>
              </div>
            );
          })}
        </section>
      )}

      {currentPlayer && (
        <section className="your-rank">
          <div>
            <span className="small-label">YOUR RANK</span>
            <h2>#{currentPlayerIndex + 1} {currentPlayer.username}</h2>
          </div>
          <div className="your-stats">
            <div><span>LEVEL</span><strong>{currentPlayer.level}</strong></div>
            <div><span>WINS</span><strong>{currentPlayer.wins}</strong></div>
            <div><span>XP</span><strong>{currentPlayer.xp}</strong></div>
          </div>
        </section>
      )}

      <section className="rankings-section">
        <div className="rankings-title">
          <h2>⚔️ GLOBAL RANKINGS</h2>
          <div className="leaderboard-counts">
            <span>{totalPlayers} players</span>
            <span className="online-count">{onlineOtherPlayers} online</span>
          </div>
        </div>
        {loading ? (
          <p className="leaderboard-message">Loading leaderboard...</p>
        ) : (
          <div className="ranking-list">
            {players.map((player, index) => {
              const rank = index + 1;
              const progress = (player.xp / maxXP) * 100;

              return (
                <div
                  className={`ranking-row ${
                    String(player.id) === currentPlayerId ? "current-player" : ""
                  }`}
                  key={player.id}
                >
                  <div className="rank-number">{getMedal(rank)}</div>
                  <div className="mini-avatar">
                    {player.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="player-info">
                    <div className="player-name-row">
                      {onlineBadge(player)}
                      <strong>{player.username}</strong>
                      <span>LVL {player.level}</span>
                    </div>
                    <div className="xp-bar">
                      <div className="xp-progress" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="wins">
                    <span>WINS</span>
                    <strong>{player.wins}</strong>
                  </div>
                  <div className="xp">
                    <strong>{player.xp}</strong>
                    <span> XP</span>
                  </div>
                </div>
              );
            })}
            {players.length === 0 && !error && (
              <p className="leaderboard-message">No players on the leaderboard yet.</p>
            )}
          </div>
        )}
      </section>

      <p className="footer-text">Keep dueling to climb the leaderboard ⚡</p>
    </div>
  );
}

export default Leaderboard;
