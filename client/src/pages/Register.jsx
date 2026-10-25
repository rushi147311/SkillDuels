import { useState } from 'react';
import { Link } from 'react-router-dom';
import { register, resendVerification } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await register({ username, email, password });
      setNotice(response.message);
      setSubmitted(true);
    } catch (requestError) {
      if (requestError.code === 'EMAIL_DELIVERY_FAILED') {
        setNotice(requestError.message);
        setSubmitted(true);
      } else {
        setError(requestError.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const response = await resendVerification(email);
      setNotice(response.message);
    } catch (requestError) {
      setError(requestError.message || 'Could not resend the verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title={submitted ? 'Check Your Email' : 'Start a Duel'}
      subtitle={submitted ? 'Verify your email before logging in.' : 'Create a room and invite your opponent.'}
    >
      {submitted ? (
        <div>
          <p className="form-success" role="status">{notice}</p>
          <label htmlFor="resend-email">Email</label>
          <input id="resend-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="secondary-button" type="button" onClick={handleResend} disabled={resending}>
            {resending ? 'Sending...' : 'Resend verification email'}
          </button>
          <Link to="/login" className="auth-link">Continue to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <label htmlFor="username">Username</label>
          <input id="username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={40} autoComplete="username" placeholder="Choose a username" />
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="Enter your email" />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete="new-password" placeholder="Create a password (min 6 chars)" />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? 'Creating Account...' : 'Create Account'} <span>→</span>
          </button>
          <div className="or-divider">OR</div>
          <Link to="/login" style={{ display: 'block', textDecoration: 'none' }}>
            <button type="button" className="secondary-button" style={{ marginTop: '0' }}>Login to Existing</button>
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
