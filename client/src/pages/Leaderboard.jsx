import "./Leaderboard.css";

function Leaderboard() {
  const players = [
    { id: 1, username: "Rushi", xp: 1250, level: 12, wins: 28 },
    { id: 2, username: "Aditya", xp: 1100, level: 11, wins: 24 },
    { id: 3, username: "Ganesh", xp: 950, level: 10, wins: 20 },
    { id: 4, username: "Kirjat", xp: 800, level: 8, wins: 17 },
    { id: 5, username: "Ajay", xp: 650, level: 7, wins: 14 },
  ];

  const maxXP = players[0].xp;

  const getMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="leaderboard-page">

      {/* Navbar */}
      <nav className="game-navbar">
        <div className="logo">
          ⚔️ <span>SKILL</span>DUELS
        </div>

        <div className="nav-player">
          <span>LVL 12</span>
          <div className="player-avatar">R</div>
        </div>
      </nav>

      {/* Heading */}
      <section className="hero-section">
        <div className="trophy">🏆</div>
        <h1>LEADERBOARD</h1>
        <p>Rise through the ranks. Duel. Win. Dominate.</p>
      </section>

      {/* Top 3 */}
      <section className="podium">

        <div className="podium-player second">
          <div className="medal">🥈</div>
          <div className="podium-avatar">A</div>
          <h3>{players[1].username}</h3>
          <p>{players[1].xp} XP</p>
          <div className="podium-block">2</div>
        </div>

        <div className="podium-player first">
          <div className="crown">👑</div>
          <div className="medal">🥇</div>
          <div className="podium-avatar">R</div>
          <h3>{players[0].username}</h3>
          <p>{players[0].xp} XP</p>
          <div className="podium-block">1</div>
        </div>

        <div className="podium-player third">
          <div className="medal">🥉</div>
          <div className="podium-avatar">G</div>
          <h3>{players[2].username}</h3>
          <p>{players[2].xp} XP</p>
          <div className="podium-block">3</div>
        </div>

      </section>

      {/* Current Player */}
      <section className="your-rank">
        <div>
          <span className="small-label">YOUR RANK</span>
          <h2>#1 Rushi</h2>
        </div>

        <div className="your-stats">
          <div>
            <span>LEVEL</span>
            <strong>12</strong>
          </div>

          <div>
            <span>WINS</span>
            <strong>28</strong>
          </div>

          <div>
            <span>XP</span>
            <strong>1250</strong>
          </div>
        </div>
      </section>

      {/* Rankings */}
      <section className="rankings-section">

        <div className="rankings-title">
          <h2>⚔️ GLOBAL RANKINGS</h2>
          <span>TOP PLAYERS</span>
        </div>

        <div className="ranking-list">

          {players.map((player, index) => {
            const rank = index + 1;
            const progress = (player.xp / maxXP) * 100;

            return (
              <div
                className={`ranking-row ${
                  player.username === "Rushi" ? "current-player" : ""
                }`}
                key={player.id}
              >
                <div className="rank-number">
                  {getMedal(rank)}
                </div>

                <div className="mini-avatar">
                  {player.username.charAt(0)}
                </div>

                <div className="player-info">
                  <div className="player-name-row">
                    <strong>{player.username}</strong>
                    <span>LVL {player.level}</span>
                  </div>

                  <div className="xp-bar">
                    <div
                      className="xp-progress"
                      style={{ width: `${progress}%` }}
                    ></div>
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

        </div>
      </section>

      <p className="footer-text">
        Keep dueling to climb the leaderboard ⚡
      </p>

    </div>
  );
}

export default Leaderboard;