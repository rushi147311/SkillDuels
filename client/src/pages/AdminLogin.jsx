import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await adminLogin({ identifier, password });
      localStorage.setItem('skillDuelsToken', response.token);
      localStorage.setItem('skillDuelsUserRole', response.data?.role || 'user');
      if (response.data?._id) localStorage.setItem('skillDuelsPlayerId', response.data._id);
      navigate('/admin', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Admin login failed');
      setNeedsVerification(requestError.code === 'EMAIL_NOT_VERIFIED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Administrator Login" subtitle="Sign in with your provisioned administrator account.">
      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <label htmlFor="admin-identifier">Admin email or username</label>
        <input id="admin-identifier" type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required autoComplete="username" />
        <label htmlFor="admin-password">Password</label>
        <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? 'Signing in...' : 'Admin Login'} <span>→</span>
        </button>
      </form>
      {needsVerification && <Link to="/verify-email" className="auth-link">Resend verification email</Link>}
      <Link to="/login" className="auth-link">Return to user login</Link>
    </AuthLayout>
  );
}
