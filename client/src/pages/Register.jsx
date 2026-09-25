import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await register({ username, email, password });
      if (response.success) {
        navigate('/login');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Start a Duel" subtitle="Create a room and invite your opponent.">
      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <label htmlFor="username">Username</label>
        <input 
          id="username"
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
          minLength={3}
          placeholder="Choose a username"
        />

        <label htmlFor="email">Email</label>
        <input 
          id="email"
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          placeholder="Enter your email"
        />

        <label htmlFor="password">Password</label>
        <input 
          id="password"
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          minLength={6}
          placeholder="Create a password (min 6 chars)"
        />

        {error && <p className="form-error" style={{ marginTop: '10px' }}>{error}</p>}

        <button className="primary-button" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? 'Creating Account...' : 'Create Account'} <span>→</span>
        </button>

        <div className="or-divider">OR</div>

        <Link to="/login" style={{ display: 'block', textDecoration: 'none' }}>
          <button type="button" className="secondary-button" style={{ marginTop: '0' }}>
            Login to Existing
          </button>
        </Link>
      </form>
    </AuthLayout>
  );
}
