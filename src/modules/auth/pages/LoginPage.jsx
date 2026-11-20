import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../../api/config';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.login({ email: form.email, password: form.password });
      login(data.user, data.token); 
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      
      <div className="auth-brand">
        <div className="auth-brand-logo">Skill<span>Market</span></div>
        <div className="auth-brand-content">
          <h1>Welcome<br />back to<br /><span>your skills.</span></h1>
          <p>Log in to your account and continue building your student skill portfolio.</p>
        </div>
        <div className="auth-brand-tags">
          <span>Learn</span>
          <span>Build</span>
          <span>Earn</span>
          <span>Grow</span>
        </div>
        <div className="auth-deco" />
      </div>

      <div className="auth-form-panel">
        <h2>Sign in</h2>
        <p className="auth-sub">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>

        {error && <div className="msg-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="alex@university.edu"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-toggle">
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete="current-password"
              />
              <button type="button" className="toggle-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
