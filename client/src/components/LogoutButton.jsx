
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import { clearAuthToken } from '../services/authSession';
import { disconnectSocket } from '../services/socket';

export default function LogoutButton({ className = '' }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error('Server-side logout failed:', error);
      window.alert(`Could not confirm server-side logout: ${error.message}`);
    } finally {
      clearAuthToken();
      localStorage.removeItem('skillDuelsPlayerId');
      disconnectSocket();
      navigate('/login', { replace: true });
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogout}
      disabled={loggingOut}
    >
      {loggingOut ? 'Logging out...' : 'Logout'}
    </button>
  );
}
