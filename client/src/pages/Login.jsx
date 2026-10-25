import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, resendVerification } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setNeedsVerification(false);
    setLoading(true);
    try {
      const response = await login({ identifier, password });
      if (response.success && response.token) {
        localStorage.setItem('skillDuelsToken', response.token);
        localStorage.setItem('skillDuelsUserRole', response.data?.role || 'user');
        if (response.data?._id) localStorage.setItem('skillDuelsPlayerId', response.data._id);
        navigate('/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (requestError) {
      setError(requestError.message || 'An error occurred during login');
      setNeedsVerification(requestError.code === 'EMAIL_NOT_VERIFIED');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const response = await resendVerification(identifier);
      setNotice(response.message);
    } catch (requestError) {
      setError(requestError.message || 'Could not resend the verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Login to your account to continue.">
      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <label htmlFor="identifier">Email or Username</label>
        <input id="identifier" type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required autoComplete="username" placeholder="Enter email or username" />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="Enter your password" />
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="form-success" role="status">{notice}</p>}
        {needsVerification && identifier.includes('@') && (
          <button className="secondary-button" type="button" onClick={handleResend} disabled={resending}>
            {resending ? 'Sending...' : 'Resend verification email'}
          </button>
        )}
        {needsVerification && <Link to="/verify-email" className="auth-link">Need another verification email?</Link>}
        <button className="primary-button" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? 'Logging in...' : 'Login'} <span>→</span>
        </button>
        <div className="or-divider">OR</div>
        <Link to="/register" style={{ display: 'block', textDecoration: 'none' }}>
          <button type="button" className="secondary-button" style={{ marginTop: '0' }}>Create an Account</button>
        </Link>
      </form>
    </AuthLayout>
  );
}
