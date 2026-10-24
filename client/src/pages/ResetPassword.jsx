import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({ token, password });
      setMessage(response.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Unable to reset your password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Choose a new password for your SkillDuels account.">
      {token ? (
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Enter the password again"
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          {!message && (
            <button className="primary-button" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          )}
          {message && <Link to="/login" className="auth-link">Go to login</Link>}
        </form>
      ) : (
        <>
          <p className="form-error" role="alert">This password reset link is missing its token.</p>
          <Link to="/forgot-password" className="auth-link">Request another reset link</Link>
        </>
      )}
    </AuthLayout>
  );
}
