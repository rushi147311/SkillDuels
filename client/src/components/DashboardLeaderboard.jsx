import { useEffect, useState } from 'react';
import { socket } from '../services/socket';

export default function DashboardLeaderboard({ players, totalPlayers, currentPlayerId }) {
  const [onlinePlayers, setOnlinePlayers] = useState(() => new Set());

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

    socket.on('presence_snapshot', handleSnapshot);
    socket.on('presence_updated', handlePresence);
    socket.emit('request_presence_snapshot');
    return () => {
      socket.off('presence_snapshot', handleSnapshot);
      socket.off('presence_updated', handlePresence);
    };
  }, []);

  const onlineOtherPlayers = [...onlinePlayers].filter(
    (playerId) => playerId !== String(currentPlayerId),
  ).length;

  return <section className="dashboard-panel dashboard-list-panel"><div className="dashboard-section-heading"><div><span className="dashboard-eyebrow">Compete</span><h2>Leaderboard</h2><span className="dashboard-player-count">{totalPlayers} players · {onlineOtherPlayers} online</span></div><span className="heading-badge">Top 10</span></div><div className="leaderboard-list">{players.length ? players.map((player, index) => <div className="leaderboard-row" key={player.id}><b className={`rank rank-${index + 1}`}>{index + 1}</b><div className="mini-avatar">{player.username.slice(0, 1).toUpperCase()}</div><div className="leader-player"><strong>{String(player.id) !== String(currentPlayerId) && onlinePlayers.has(String(player.id)) && <span className="online-status">Online</span>}{player.username}</strong><span>Level {player.level} · {player.wins} wins</span></div><strong className="leader-xp">{player.xp} XP</strong></div>) : <p className="empty-dashboard">No registered players yet.</p>}</div></section>;
}