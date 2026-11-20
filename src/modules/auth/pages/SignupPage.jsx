import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../../api/config';
import './Auth.css';

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email:     '',
    password:  '',
    confirm:   '',
  });

  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!form.full_name.trim()) return 'Full name is required.';
    if (!form.email.trim())     return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 6)          return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm)    return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await authAPI.register({
        full_name: form.full_name.trim(),
        email:     form.email.trim(),
        password:  form.password,
        role:      'Seller', 
      });

      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1800);
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
          <h1>Turn your<br /><span>skills</span><br />into income.</h1>
          <p>Join thousands of students who buy, sell, and exchange skills on the premier student marketplace.</p>
        </div>
        <div className="auth-brand-tags">
          <span>Design</span>
          <span>Dev</span>
          <span>Writing</span>
          <span>Marketing</span>
          <span>Tutoring</span>
        </div>
        <div className="auth-deco" />
      </div>

      <div className="auth-form-panel">
        <h2>Create account</h2>
        <p className="auth-sub">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        {error   && <div className="msg-error">{error}</div>}
        {success && <div className="msg-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Alex Johnson"
              autoComplete="name"
            />
          </div>

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
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
              <button type="button" className="toggle-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          </div>

          <button className="btn-primary auth-submit" disabled={loading} style={{ marginTop: '16px' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
