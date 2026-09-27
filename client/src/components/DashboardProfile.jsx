export default function DashboardProfile({ profile }) {
  const progress = profile.nextLevelXp ? Math.round((profile.xp / profile.nextLevelXp) * 100) : 0;

  return (
    <section className="dashboard-profile dashboard-panel">
      <div className="profile-avatar">{profile.username.slice(0, 1).toUpperCase()}</div>
      <div className="profile-copy"><span className="dashboard-eyebrow">Your profile</span><h2>{profile.username}</h2><p>{profile.email || 'Local player account'}</p></div>
      <div className="level-chip">LVL {profile.level}</div>
      <div className="xp-block"><div><strong>{profile.xp} XP</strong><span>{profile.nextLevelXp} XP to next level</span></div><div className="xp-track"><i style={{ width: `${Math.min(progress, 100)}%` }} /></div></div>
      <div className="profile-stats"><span><strong>{profile.wins}</strong> Wins</span><span><strong>{profile.matches}</strong> Duels</span></div>
    </section>
  );
}