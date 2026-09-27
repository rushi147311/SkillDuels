import React from 'react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="duel-app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">⚡</span>
          Skill<span>Duels</span>
        </div>
        <div className="live-pill">
          <span />
          Live competition
        </div>
      </header>

      <main className="lobby-shell">
        <div className="lobby-copy">
          <span className="eyebrow">Real-Time Quiz Battle</span>
          <h1>
            Challenge.<br />
            <strong>Compete.</strong> Win.
          </h1>
          <p>
            Create a private room or join your opponent and prove your skills in a live match.
          </p>
        </div>

        <div className="duel-panel">
          <div className="panel-icon">🎮</div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
