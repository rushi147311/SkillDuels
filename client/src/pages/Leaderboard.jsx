
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCurrentUser,
  getPublicLeaderboard,
} from "../services/api";
import { getAuthToken } from "../services/authSession";
import { socket } from "../services/socket";
import FriendActionButton from "../components/FriendActionButton";
import "./Leaderboard.css";

const podiumOrder = [1, 0, 2];
const medals = ["🥇", "🥈", "🥉"];

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState(new Set());
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState(
    () => localStorage.getItem("skillDuelsPlayerId")
  );

  const isAuthenticated = Boolean(getAuthToken());

  const refreshLeaderboard = useCallback(() => {
    const publicRequest = getPublicLeaderboard();
    const userRequest = getAuthToken()
      ? getCurrentUser()
      : Promise.resolve(null);

    Promise.all([publicRequest, userRequest])
      .then(([response, userResponse]) => {
        const data = response.data;
        const leaderboardPlayers = Array.isArray(data)
          ? data
          : data?.players;

        if (!Array.isArray(leaderboardPlayers)) {
          throw new Error(
            "The leaderboard response was not in the expected format."
          );
        }

        setPlayers(leaderboardPlayers);
        setTotalPlayers(
          Array.isArray(data)
            ? leaderboardPlayers.length
            : data.totalPlayers ?? leaderboardPlayers.length
        );

        const userId =
          userResponse?.data?._id ||
          localStorage.getItem("skillDuelsPlayerId");

        setCurrentPlayerId(userId ? String(userId) : null);
        setError("");
        setStatus("success");
      })
      .catch((requestError) => {
        setError(
          requestError.message || "We couldn't load the leaderboard."
        );
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard, retryCount]);

  useEffect(() => {
    const handleSnapshot = ({ userIds } = {}) => {
      setOnlinePlayers(new Set((userIds || []).map(String)));
    };

    const handlePresence = ({ userId, online } = {}) => {
      if (userId == null) return;

      setOnlinePlayers((current) => {
        const updated = new Set(current);
        if (online) updated.add(String(userId));
        else updated.delete(String(userId));
        return updated;
      });
    };

    socket.on("leaderboard_updated", refreshLeaderboard);
    socket.on("friends_updated", refreshLeaderboard);
    socket.on("presence_snapshot", handleSnapshot);
    socket.on("presence_updated", handlePresence);
    socket.emit("request_presence_snapshot");

    return () => {
      socket.off("leaderboard_updated", refreshLeaderboard);
      socket.off("friends_updated", refreshLeaderboard);
      socket.off("presence_snapshot", handleSnapshot);
      socket.off("presence_updated", handlePresence);
    };
  }, [refreshLeaderboard]);

  const getPlayerId = (player) =>
    String(player.id || player.playerId || player._id || "");

  const getPoints = (player) =>
    Number(player.totalPoints ?? player.xp ?? 0);

  const getWins = (player) => Number(player.wins ?? 0);

  const getMatches = (player) =>
    Number(player.matches ?? player.matchesPlayed ?? player.totalMatches ?? 0);

  const getWinRate = (player) => {
    const matches = getMatches(player);
    return matches > 0
      ? Number(((getWins(player) / matches) * 100).toFixed(1))
      : 0;
  };

  const rankedPlayers = [...players].sort(
    (a, b) => getPoints(b) - getPoints(a)
  );

  const currentPlayerIndex = rankedPlayers.findIndex(
    (player) => getPlayerId(player) === String(currentPlayerId || "")
  );

  const currentPlayer =
    currentPlayerIndex >= 0 ? rankedPlayers[currentPlayerIndex] : null;

  const onlineBadge = (player) =>
    getPlayerId(player) !== String(currentPlayerId || "") &&
    onlinePlayers.has(getPlayerId(player)) ? (
      <span className="online-status" aria-label="Online">
        Online
      </span>
    ) : null;

  const onlineOtherPlayers = [...onlinePlayers].filter(
    (id) => id !== String(currentPlayerId || "")
  ).length;

  const retry = () => {
    setError("");
    setStatus("loading");
    setRetryCount((count) => count + 1);
  };

  return (
    <main className="leaderboard-page">
      <header className="leaderboard-navbar">
        <Link
          className="leaderboard-logo"
          to="/"
          aria-label="SkillDuels dashboard"
        >
          <span aria-hidden="true">⚔️</span> SKILL<span>DUELS</span>
        </Link>

        <Link className="leaderboard-dashboard-link" to="/">
          Dashboard
        </Link>
      </header>

      <section className="leaderboard-hero">
        <span className="leaderboard-trophy" aria-hidden="true">
          🏆
        </span>
        <p className="leaderboard-eyebrow">
          Compete. Climb. Conquer.
        </p>
        <h1>Leaderboard</h1>
        <p className="leaderboard-subtitle">
          Top players competing on SkillDuels
        </p>
      </section>

      {status === "loading" && (
        <div className="leaderboard-message" role="status">
          <span
            className="leaderboard-spinner"
            aria-hidden="true"
          />
          Loading player rankings...
        </div>
      )}

      {status === "error" && (
        <section
          className="leaderboard-message leaderboard-error"
          role="alert"
        >
          <h2>Rankings are unavailable</h2>
          <p>
            {error ||
              "We couldn't load the leaderboard. Please try again."}
          </p>
          <button
            className="leaderboard-retry"
            type="button"
            onClick={retry}
          >
            Try again
          </button>
        </section>
      )}

      {status === "success" && rankedPlayers.length === 0 && (
        <section className="leaderboard-message leaderboard-empty">
          <span aria-hidden="true">⚡</span>
          <h2>The leaderboard is waiting for its first duel</h2>
          <p>
            Complete a match to earn points and claim your place
            among the top players.
          </p>
          <Link className="leaderboard-retry" to="/">
            Start a duel
          </Link>
        </section>
      )}

      {status === "success" && rankedPlayers.length > 0 && (
        <>
          <section
            className="leaderboard-podium"
            aria-label="Top three players"
          >
            {podiumOrder.map((playerIndex) => {
              const player = rankedPlayers[playerIndex];
              const rank = playerIndex + 1;

              if (!player) {
                return (
                  <div
                    className={`podium-card podium-rank-${rank} podium-placeholder`}
                    key={`podium-placeholder-${rank}`}
                    aria-hidden="true"
                  />
                );
              }

              const username = player.username || "Player";

              return (
                <article
                  className={`podium-card podium-rank-${rank}`}
                  key={getPlayerId(player) || `podium-${rank}`}
                >
                  {rank === 1 && (
                    <span className="podium-crown" aria-hidden="true">
                      👑
                    </span>
                  )}
                  <span className="podium-medal" aria-hidden="true">
                    {medals[playerIndex]}
                  </span>
                  <div className="podium-avatar" aria-hidden="true">
                    {username.slice(0, 1).toUpperCase()}
                  </div>
                  <h2>{username}</h2>
                  <p className="podium-points">
                    {getPoints(player).toLocaleString()} pts
                  </p>
                  <p className="podium-record">
                    {getWins(player)} wins · {getMatches(player)} matches ·{" "}
                    {getWinRate(player)}% win rate
                  </p>
                  <div
                    className="podium-base"
                    aria-label={`Rank ${rank}`}
                  >
                    {rank}
                  </div>
                </article>
              );
            })}
          </section>

          {currentPlayer && (
            <section className="your-rank">
              <div>
                <span className="small-label">YOUR RANK</span>
                <h2>
                  #{currentPlayerIndex + 1} {currentPlayer.username}
                </h2>
              </div>
              <div className="your-stats">
                <div>
                  <span>LEVEL</span>
                  <strong>{currentPlayer.level ?? 1}</strong>
                </div>
                <div>
                  <span>WINS</span>
                  <strong>{getWins(currentPlayer)}</strong>
                </div>
                <div>
                  <span>XP</span>
                  <strong>{getPoints(currentPlayer)}</strong>
                </div>
              </div>
            </section>
          )}

          <section className="leaderboard-rankings">
            <div className="leaderboard-section-heading">
              <div>
                <p className="leaderboard-eyebrow">Global standings</p>
                <h2>Player rankings</h2>
              </div>
              <div className="leaderboard-counts">
                <span>
                  {totalPlayers}{" "}
                  {totalPlayers === 1 ? "player" : "players"}
                </span>
                <span className="online-count">
                  {onlineOtherPlayers} online
                </span>
              </div>
            </div>

            <div className="ranking-table">
              <div
                className="ranking-table-header"
                aria-hidden="true"
              >
                <span>Rank</span>
                <span>Player</span>
                <span>Points</span>
                <span>Matches</span>
                <span>Wins</span>
                <span>Win rate</span>
              </div>

              {rankedPlayers.map((player, index) => {
                const playerId = getPlayerId(player);
                const username = player.username || "Player";
                const isCurrentPlayer =
                  playerId === String(currentPlayerId || "");
                return (
                  <div
                    className={`ranking-row ${
                      isCurrentPlayer
                        ? "ranking-current-player current-player"
                        : ""
                    }`}
                    key={playerId || `player-${index}`}
                  >
                    <span className="ranking-rank">
                      #{index + 1}
                    </span>

                    <div className="ranking-player">
                      <span
                        className="ranking-avatar"
                        aria-hidden="true"
                      >
                        {username.slice(0, 1).toUpperCase()}
                      </span>

                      <div className="ranking-player-copy">
                        <div className="ranking-player-name">
                          <strong>{username}</strong>
                          {isCurrentPlayer && (
                            <span className="you-badge">You</span>
                          )}
                          {onlineBadge(player)}
                        </div>
                        <span className="ranking-player-meta">
                          Level {player.level ?? 1}
                          {isAuthenticated &&
                            !isCurrentPlayer &&
                            ` · ${player.mutualFriends || 0} mutual ${
                              player.mutualFriends === 1
                                ? "friend"
                                : "friends"
                            }`}
                        </span>
                      </div>

                      {isAuthenticated && !isCurrentPlayer && (
                        <FriendActionButton
                          username={username}
                          relationship={{
                            isFriend: player.isFriend,
                            friendRequest: player.friendRequest
                              ? {
                                  status: player.friendRequest.status,
                                  requestId:
                                    player.friendRequest.requestId,
                                }
                              : null,
                          }}
                          onUpdated={refreshLeaderboard}
                        />
                      )}
                    </div>

                    <strong className="ranking-points">
                      {getPoints(player).toLocaleString()}
                    </strong>

                    <span
                      className="ranking-stat"
                      data-label="Matches"
                    >
                      {getMatches(player)}
                    </span>

                    <span
                      className="ranking-stat"
                      data-label="Wins"
                    >
                      {getWins(player)}
                    </span>

                    <span
                      className="ranking-stat"
                      data-label="Win rate"
                    >
                      {getWinRate(player)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <p className="leaderboard-footer">
            Keep dueling to climb the leaderboard ⚡
          </p>
        </>
      )}
    </main>
  );
}

export default Leaderboard;
