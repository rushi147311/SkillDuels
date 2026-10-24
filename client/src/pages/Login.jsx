import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, resendVerification } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import { connectSocket } from '../services/socket';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [canResendVerification, setCanResendVerification] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setCanResendVerification(false);
    setLoading(true);

    try {
      const response = await login({ identifier, password });
      if (response.success && response.token) {
        localStorage.setItem('skillDuelsToken', response.token);
        connectSocket(response.token);
        if (response.data && response.data._id) {
          localStorage.setItem('skillDuelsPlayerId', response.data._id);
        }
        setIdentifier('');
        setPassword('');
        navigate('/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
      setCanResendVerification(err.code === 'EMAIL_NOT_VERIFIED');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setMessage('');
    try {
      const response = await resendVerification({ identifier });
      setMessage(response.message);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Unable to send a verification email');
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Login to your account to continue.">
      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <label htmlFor="identifier">Email or Username</label>
        <input 
          id="identifier"
          type="text" 
          value={identifier} 
          onChange={(e) => setIdentifier(e.target.value)} 
          required 
          placeholder="Enter email or username"
        />

        <label htmlFor="password">Password</label>
        <input 
          id="password"
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          placeholder="Enter your password"
        />

        {error && <p className="form-error" style={{ marginTop: '10px' }}>{error}</p>}
        {message && <p className="form-success" role="status">{message}</p>}
        {canResendVerification && (
          <button className="text-button" type="button" onClick={handleResendVerification}>
            Resend verification email
          </button>
        )}

        <Link to="/forgot-password" className="auth-link">Forgot password?</Link>

        <button className="primary-button" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? 'Logging in...' : 'Login'} <span>→</span>
        </button>

        <div className="or-divider">OR</div>

        <Link to="/register" style={{ display: 'block', textDecoration: 'none' }}>
          <button type="button" className="secondary-button" style={{ marginTop: '0' }}>
            Create an Account
          </button>
        </Link>
      </form>
    </AuthLayout>
  );
}
