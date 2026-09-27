import { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import DashboardHistory from '../components/DashboardHistory';
import DashboardLeaderboard from '../components/DashboardLeaderboard';
import DashboardProfile from '../components/DashboardProfile';
import DashboardRooms from '../components/DashboardRooms';
import DashboardCreateRoom from '../components/DashboardCreateRoom';
import DashboardJoinRoom from '../components/DashboardJoinRoom';

export default function Dashboard({ playerId, onJoinRoom, joinRoomLoading, joinRoomError, onCreateRoom, createRoomLoading, createRoomError }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard(playerId).then((response) => setDashboard(response.data)).catch((requestError) => setError(requestError.message));
  }, [playerId]);

  return <main className="dashboard-page"><header className="dashboard-header"><div><div className="brand"><span className="brand-mark">⚡</span> Skill<span>Duels</span></div></div><div className="dashboard-header-title"><span className="dashboard-eyebrow">Player hub</span><h1>Dashboard</h1></div><div className="live-pill"><span /> Live competition</div></header>{error && <p className="dashboard-error">{error}</p>}{!dashboard ? <div className="dashboard-loading">Loading your dashboard...</div> : <div className="dashboard-grid"><DashboardProfile profile={dashboard.profile} /><DashboardCreateRoom onCreateRoom={onCreateRoom} loading={createRoomLoading} error={createRoomError} /><DashboardJoinRoom onJoinRoom={onJoinRoom} loading={joinRoomLoading} error={joinRoomError} /><DashboardLeaderboard players={dashboard.leaderboard} /><DashboardRooms rooms={dashboard.publicRooms} onJoin={onJoinRoom} /><DashboardHistory history={dashboard.history} /></div>}</main>;
}