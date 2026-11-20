import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, skillsAPI, marketplaceAPI } from '../../../api/config';
import './Pages.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [skills,   setSkills]   = useState([]);
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [profData, skillsData, servData] = await Promise.allSettled([
          userAPI.getProfile(),
          skillsAPI.getSkills(),
          marketplaceAPI.getMyServices(),
        ]);

        if (profData.status === 'fulfilled') setProfile(profData.value.user);
        if (skillsData.status === 'fulfilled') setSkills(skillsData.value.skills || []);
        if (servData.status === 'fulfilled') setServices(servData.value.services || []);
      } catch (err) {
        setError('Could not load profile.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="container page-wrap"><div className="spinner" /></div>;
  if (error)   return <div className="container page-wrap"><div className="msg-error">{error}</div></div>;
  if (!profile) return null;

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-layout">

          <aside className="profile-sidebar">
            <div className="avatar-block">{initials}</div>
            <div className="profile-name">{profile.full_name}</div>
            <div className="profile-email">{profile.email}</div>

            <div className="profile-role-badge seller-badge">
              🎓 Student Member
            </div>

            <div className="profile-links">
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noreferrer" className="profile-link">
                  🔗 GitHub
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="profile-link">
                  🔗 LinkedIn
                </a>
              )}
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="profile-link">
                  🔗 Portfolio / Website
                </a>
              )}
            </div>

            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/edit-profile" className="btn-outline btn-sm" style={{ textAlign: 'center' }}>
                Edit Profile
              </Link>
              <Link to="/my-portfolio" className="btn-primary btn-sm" style={{ textAlign: 'center' }}>
                Public Portfolio →
              </Link>
            </div>
          </aside>

          <main>
            <div className="profile-section">
              <div className="section-heading">About & Bio</div>
              <p className={`bio-text ${!profile.bio ? 'empty' : ''}`}>
                {profile.bio || 'No bio added yet. Click Edit Profile to tell others about your skills and interests.'}
              </p>
            </div>

            <div className="profile-section">
              <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Skills & Specializations</span>
                <Link to="/my-skills" style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600 }}>
                  + Manage Skills
                </Link>
              </div>

              {skills.length === 0 ? (
                <p className="bio-text empty">
                  No skills listed yet. <Link to="/my-skills" style={{ color: 'var(--blue)', fontWeight: 600 }}>Add your skills</Link> to start offering services or exchanging skills.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {skills.map(s => (
                    <span key={s.skill_id || s.user_skill_id} className="skill-tag">
                      {s.skill_name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="profile-section">
              <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Services Offered</span>
                <Link to="/marketplace/create" style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600 }}>
                  + Post New Service
                </Link>
              </div>

              {services.length === 0 ? (
                <p className="bio-text empty">
                  No services listed yet. <Link to="/marketplace/create" style={{ color: 'var(--blue)', fontWeight: 600 }}>Post your first service</Link> for student peers to hire you.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {services.map(s => (
                    <div key={s.service_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)', border: '1.5px solid var(--border)', padding: '12px 16px', borderRadius: 4 }}>
                      <div>
                        <strong>{s.title}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                          ₹{s.price} · {s.delivery_time} Days Delivery · {s.category_name}
                        </div>
                      </div>
                      <Link to={`/marketplace/services/${s.service_id}`} className="btn-outline btn-sm">
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="profile-section">
              <div className="section-heading">Member Since</div>
              <p className="bio-text">
                {new Date(profile.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
