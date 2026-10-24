import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;

    verifyEmail({ token })
      .then((response) => setMessage(response.message))
      .catch((err) => setError(err.message || 'Unable to verify your email'))
      .finally(() => setLoading(false));
  }, [token]);

  const displayedError = error || (!token ? 'This verification link is missing its token.' : '');

  return (
    <AuthLayout title="Email Verification" subtitle="Confirm your email to activate your account.">
      {loading && <p role="status">Verifying your email...</p>}
      {displayedError && <p className="form-error" role="alert">{displayedError}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      {!loading && (
        <Link to="/login" className="auth-link">Continue to login</Link>
      )}
    </AuthLayout>
  );
}
