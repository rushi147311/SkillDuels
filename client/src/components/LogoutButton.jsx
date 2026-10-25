import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api';

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
      localStorage.removeItem('skillDuelsToken');
      localStorage.removeItem('skillDuelsPlayerId');
      localStorage.removeItem('skillDuelsUserRole');
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
