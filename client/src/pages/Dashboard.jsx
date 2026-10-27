import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/api';
import DashboardHistory from '../components/DashboardHistory';
import DashboardLeaderboard from '../components/DashboardLeaderboard';
import DashboardProfile from '../components/DashboardProfile';
import DashboardRooms from '../components/DashboardRooms';
import DashboardCreateRoom from '../components/DashboardCreateRoom';
import DashboardJoinRoom from '../components/DashboardJoinRoom';
import LogoutButton from '../components/LogoutButton';

export default function Dashboard({ onJoinRoom, joinRoomLoading, joinRoomError, onCreateRoom, createRoomLoading, createRoomError }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard().then((response) => setDashboard(response.data)).catch((requestError) => setError(requestError.message));
  }, []);


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
        <div className="dashboard-loading">Loading your dashboard...</div>
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
          <DashboardLeaderboard players={dashboard.leaderboard} />
          <DashboardRooms
            rooms={dashboard.publicRooms}
            onJoin={onJoinRoom}
          />
          <DashboardHistory history={dashboard.history} />
        </div>
      )}
    </main>
  );
}
