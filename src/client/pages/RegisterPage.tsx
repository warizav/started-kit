import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <nav className="page-nav">
        <Link to="/" className="nav-logo">AgentOS</Link>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <h1>Start your free trial</h1>
          <p className="auth-subtitle">Deploy your first AI agent in 48 hours</p>

          <form onSubmit={submit} className="auth-form">
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account — free'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in →</Link>
          </p>

          <p className="auth-terms">
            By signing up you agree to our terms of service. No credit card required for the 7-day trial.
          </p>
        </div>
      </div>
    </div>
  );
}
