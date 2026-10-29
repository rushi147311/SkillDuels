
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/api';
import DashboardHistory from '../components/DashboardHistory';
import DashboardLeaderboard from '../components/DashboardLeaderboard';
import DashboardProfile from '../components/DashboardProfile';
import DashboardRooms from '../components/DashboardRooms';
import DashboardCreateRoom from '../components/DashboardCreateRoom';
import DashboardJoinRoom from '../components/DashboardJoinRoom';
import DashboardFriends from '../components/DashboardFriends';
import LogoutButton from '../components/LogoutButton';
import { socket } from '../services/socket';

export default function Dashboard({
  playerId,
  onJoinRoom,
  onOpenRoom,
  joinRoomLoading,
  joinRoomError,
  onCreateRoom,
  createRoomLoading,
  createRoomError,
}) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const refreshDashboard = () => {
      getDashboard(playerId)
        .then((response) => {
          if (active) {
            setDashboard(response.data);
            setError('');
          }
        })
        .catch((requestError) => {
          if (active) {
            setError(requestError.message);
          }
        });
    };

    refreshDashboard();

    socket.on('leaderboard_updated', refreshDashboard);
    socket.on('public_rooms_updated', refreshDashboard);

    return () => {
      active = false;
      socket.off('leaderboard_updated', refreshDashboard);
      socket.off('public_rooms_updated', refreshDashboard);
    };
  }, [playerId]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <div className="brand">
            <span className="brand-mark">⚡</span> Skill<span>Duels</span>
          </div>

          <Link className="dashboard-leaderboard-link" to="/leaderboard">
            Leaderboard
          </Link>
        </div>

        <div className="dashboard-header-title">
          <span className="dashboard-eyebrow">Player hub</span>
          <h1>Dashboard</h1>
        </div>

        <div className="dashboard-header-actions">
          <div className="live-pill">
            <span /> Live competition
          </div>
          <LogoutButton className="logout-button" />
        </div>
      </header>

      {error && <p className="dashboard-error">{error}</p>}

      {!dashboard ? (
        <div className="dashboard-loading">
          Loading your dashboard...
        </div>
      ) : (
        <div className="dashboard-grid">
          <DashboardProfile profile={dashboard.profile} />

          <DashboardCreateRoom
            onCreateRoom={onCreateRoom}
            loading={createRoomLoading}
            error={createRoomError}
          />

          <DashboardJoinRoom
            onJoinRoom={onJoinRoom}
            loading={joinRoomLoading}
            error={joinRoomError}
          />

          <DashboardLeaderboard
            players={dashboard.leaderboard}
            totalPlayers={dashboard.totalPlayers}
            currentPlayerId={playerId}
          />

          <DashboardRooms
            rooms={dashboard.publicRooms}
            onJoin={onJoinRoom}
          />

          <DashboardHistory history={dashboard.history} />

          <DashboardFriends
            playerId={playerId}
            onJoinRoom={onJoinRoom}
            onOpenRoom={onOpenRoom}
          />
        </div>
      )}
    </main>
  );
}
