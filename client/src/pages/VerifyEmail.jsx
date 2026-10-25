import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resendVerification, verifyEmail } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const token = searchParams.get('token') || '';

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await verifyEmail(token);
      setMessage(response.message);
      window.history.replaceState({}, '', '/verify-email');
    } catch (requestError) {
      setError(requestError.message || 'This verification link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (event) => {
    event.preventDefault();
    setResending(true);
    setError('');
    try {
      const response = await resendVerification(email);
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.message || 'Could not resend the verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title="Email Verification" subtitle="Verify your email address to activate your account.">
      {token && (
        <button className="primary-button" type="button" onClick={handleVerify} disabled={loading || Boolean(message)}>
          {loading ? 'Verifying...' : message ? 'Email verified' : 'Verify email'}
        </button>
      )}
      {!token && <p>Use the link from your verification email, or request a new one below.</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <form onSubmit={handleResend} style={{ textAlign: 'left', marginTop: '18px' }}>
        <label htmlFor="verification-email">Resend verification email</label>
        <input id="verification-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="Enter your email" />
        <button className="secondary-button" type="submit" disabled={resending}>
          {resending ? 'Sending...' : 'Resend verification email'}
        </button>
      </form>
      <Link to="/login" className="auth-link">Return to login</Link>
    </AuthLayout>
  );
}
