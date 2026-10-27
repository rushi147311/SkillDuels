import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, getLeaderboard } from "../services/api";
import { getAuthToken } from "../services/authSession";
import "./Leaderboard.css";

const podiumOrder = [1, 0, 2];
const medals = ["🥇", "🥈", "🥉"];

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  useEffect(() => {
    let active = true;

    const leaderboardRequest = getLeaderboard();
    const userRequest = getAuthToken() ? getCurrentUser() : Promise.resolve(null);

    Promise.all([leaderboardRequest, userRequest])
      .then(([response, userResponse]) => {
        if (!Array.isArray(response.data)) {
          throw new Error("The leaderboard response was not in the expected format.");
        }
        if (active) {
          setCurrentPlayerId(userResponse?.data?._id || null);
          setPlayers(response.data);
          setStatus("success");
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
          setStatus("error");
        }
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  const retry = () => {
    setError("");
    setStatus("loading");
    setRetryCount((count) => count + 1);
  };

  return (
    <main className="leaderboard-page">
      <header className="leaderboard-navbar">
        <Link className="leaderboard-logo" to="/" aria-label="SkillDuels dashboard">
          <span aria-hidden="true">⚔️</span> SKILL<span>DUELS</span>
        </Link>
        <Link className="leaderboard-dashboard-link" to="/">
          Dashboard
        </Link>
      </header>

      <section className="leaderboard-hero">
        <span className="leaderboard-trophy" aria-hidden="true">🏆</span>
        <p className="leaderboard-eyebrow">Compete. Climb. Conquer.</p>
        <h1>Leaderboard</h1>
        <p className="leaderboard-subtitle">Top players competing on SkillDuels</p>
      </section>

      {status === "loading" && (
        <div className="leaderboard-message" role="status">
          <span className="leaderboard-spinner" aria-hidden="true" />
          Loading player rankings...
        </div>
      )}

      {status === "error" && (
        <section className="leaderboard-message leaderboard-error" role="alert">
          <h2>Rankings are unavailable</h2>
          <p>{error || "We couldn't load the leaderboard. Please try again."}</p>
          <button className="leaderboard-retry" type="button" onClick={retry}>
            Try again
          </button>
        </section>
      )}

      {status === "success" && players.length === 0 && (
        <section className="leaderboard-message leaderboard-empty">
          <span aria-hidden="true">⚡</span>
          <h2>The leaderboard is waiting for its first duel</h2>
          <p>Complete a match to earn points and claim your place among the top players.</p>
          <Link className="leaderboard-retry" to="/">
            Start a duel
          </Link>
        </section>
      )}

      {status === "success" && players.length > 0 && (
        <>
          <section className="leaderboard-podium" aria-label="Top three players">
            {podiumOrder.map((playerIndex) => {
              const player = players[playerIndex];
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

              const initials = player.username.slice(0, 1).toUpperCase();

              return (
                <article
                  className={`podium-card podium-rank-${rank}`}
                  key={player.playerId}
                >
                  {rank === 1 && <span className="podium-crown" aria-hidden="true">👑</span>}
                  <span className="podium-medal" aria-hidden="true">{medals[playerIndex]}</span>
                  <div className="podium-avatar" aria-hidden="true">{initials}</div>
                  <h2>{player.username}</h2>
                  <p className="podium-points">{player.totalPoints.toLocaleString()} pts</p>
                  <p className="podium-record">
                    {player.wins} wins · {player.matchesPlayed} matches · {player.winRate}% win rate
                  </p>
                  <div className="podium-base" aria-label={`Rank ${rank}`}>
                    {rank}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="leaderboard-rankings">
            <div className="leaderboard-section-heading">
              <div>
                <p className="leaderboard-eyebrow">Global standings</p>
                <h2>Player rankings</h2>
              </div>
              <span>{players.length} {players.length === 1 ? "player" : "players"}</span>
            </div>

            <div className="ranking-table">
              <div className="ranking-table-header" aria-hidden="true">
                <span>Rank</span>
                <span>Player</span>
                <span>Points</span>
                <span>Matches</span>
                <span>Wins</span>
                <span>Win rate</span>
              </div>
              {players.slice(3).length > 0 ? players.slice(3).map((player) => (
                <div
                  className={`ranking-row ${
                    player.playerId === currentPlayerId ? "ranking-current-player" : ""
                  }`}
                  key={player.playerId}
                >
                  <span className="ranking-rank">#{player.rank}</span>
                  <span className="ranking-player">
                    <span className="ranking-avatar" aria-hidden="true">
                      {player.username.slice(0, 1).toUpperCase()}
                    </span>
                    <strong>{player.username}</strong>
                    {player.playerId === currentPlayerId && (
                      <span className="you-badge">You</span>
                    )}
                  </span>
                  <strong className="ranking-points">{player.totalPoints.toLocaleString()}</strong>
                  <span className="ranking-stat" data-label="Matches">{player.matchesPlayed}</span>
                  <span className="ranking-stat" data-label="Wins">{player.wins}</span>
                  <span className="ranking-stat" data-label="Win rate">{player.winRate}%</span>
                </div>
              )) : (
                <p className="ranking-list-empty">All ranked players are shown on the podium.</p>
              )}
            </div>
          </section>
          <p className="leaderboard-footer">Keep dueling to climb the leaderboard ⚡</p>
        </>
      )}
    </main>
  );
}

export default Leaderboard;
