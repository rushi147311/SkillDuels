import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await requestPasswordReset({ email });
      setMessage(response.message);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Unable to request a password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="We’ll email a reset link to your verified email address.">
      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="Enter your verified email"
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status">{message}</p>}
        <button className="primary-button" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        <Link to="/login" className="auth-link">Back to login</Link>
      </form>
    </AuthLayout>
  );
}
