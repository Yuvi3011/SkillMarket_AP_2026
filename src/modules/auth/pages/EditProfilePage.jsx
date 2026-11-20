import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../../api/config';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

export default function EditProfilePage() {
  const navigate       = useNavigate();
  const { user, updateUser } = useAuth();
  const isSeller = user?.role_name === 'Seller';

  const [form, setForm] = useState({
    full_name:     '',
    bio:           '',
    portfolio_url: '',
    github_url:    '',
    linkedin_url:  '',
  });

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await userAPI.getProfile();
        const u    = data.user;
        setForm({
          full_name:     u.full_name     || '',
          bio:           u.bio           || '',
          portfolio_url: u.portfolio_url || '',
          github_url:    u.github_url    || '',
          linkedin_url:  u.linkedin_url  || '',
        });
      } catch (err) {
        setError('Could not load profile.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.full_name.trim()) {
      setError('Full name is required.');
      return;
    }

    setSaving(true);
    try {
      const data = await userAPI.updateProfile(form);
      updateUser(data.user); 
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container page-wrap"><div className="spinner" /></div>;

  return (
    <div className="edit-profile-page">
      <div className="container">
        <h1>{isSeller ? 'Edit Seller Profile' : 'Edit Buyer Profile'}</h1>
        <p className="sub-heading">
          {isSeller 
            ? 'Keep your talent credentials, links, and bio up to date for potential buyers.'
            : 'Update your client details and project background.'}
        </p>

        <div className="form-card">
          {error   && <div className="msg-error">{error}</div>}
          {success && <div className="msg-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            
            <div className="form-section-title">Basic Information</div>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label>{isSeller ? 'Seller Bio & Expertise' : 'About You / Company'}</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder={isSeller 
                  ? "Describe your skills, what services you offer, and why students should hire you…"
                  : "Describe the kinds of projects you manage and what skills you frequently need…"}
                rows={4}
              />
            </div>

            <div className="form-section-title">{isSeller ? 'Portfolio & Work Demos' : 'Website & Social Links'}</div>

            <div className="form-group">
              <label>{isSeller ? 'Portfolio URL' : 'Website URL'}</label>
              <input
                name="portfolio_url"
                value={form.portfolio_url}
                onChange={handleChange}
                placeholder={isSeller ? "https://yourportfolio.com" : "https://yourwebsite.com"}
              />
            </div>

            <div className="form-group">
              <label>GitHub URL</label>
              <input
                name="github_url"
                value={form.github_url}
                onChange={handleChange}
                placeholder="https://github.com/username"
              />
            </div>

            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className="form-actions">
              <button className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate('/profile')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
