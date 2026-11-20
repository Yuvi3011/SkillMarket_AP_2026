import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, skillsAPI } from '../../../api/config';
import './Pages.css';

export default function MyPortfolioPage() {
  const [profile, setProfile] = useState(null);
  const [skills,  setSkills]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pd, sd] = await Promise.all([userAPI.getProfile(), skillsAPI.getSkills()]);
        setProfile(pd.user);
        setSkills(sd.skills);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="container page-wrap"><div className="spinner" /></div>;
  if (!profile) return <div className="container page-wrap"><p>Could not load portfolio.</p></div>;

  const initials = profile.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
  const isSeller = profile.role_name === 'Seller';

  return (
    <div className="portfolio-page">
      <div className="container">

        <div className="portfolio-hero">
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: isSeller ? 'var(--blue)' : '#475569', marginBottom: 14 }}>
              {isSeller ? 'Creator & Talent Portfolio' : 'Buyer Profile & Client Showcase'}
            </p>
            <h1>
              {profile.full_name.split(' ')[0]}<br />
              <span>{profile.full_name.split(' ').slice(1).join(' ') || profile.full_name}</span>
            </h1>
            <p style={{ marginTop: 16 }}>
              {profile.bio || (isSeller ? 'A student creator on SkillMarket ready to take on orders and build great projects.' : 'A client on SkillMarket looking to commission work from talented students.')}
            </p>

            <div className="portfolio-hero-links">
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noreferrer" className="portfolio-link-btn">
                  🔗 GitHub Profile
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="portfolio-link-btn">
                  🔗 LinkedIn Profile
                </a>
              )}
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="portfolio-link-btn">
                  🌐 {isSeller ? 'Portfolio Website' : 'Organization Website'}
                </a>
              )}
              {!profile.github_url && !profile.linkedin_url && !profile.portfolio_url && (
                <Link to="/edit-profile" className="portfolio-link-btn">
                  ✏️ Add your links
                </Link>
              )}
            </div>
          </div>

          <div className="portfolio-deco-block">
            <div className="deco-initials">{initials}</div>
            <p>{profile.role_name} on SkillMarket</p>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '6px', background: isSeller ? 'var(--lime)' : 'var(--blue)', color: 'var(--ink)', padding: '2px 8px', borderRadius: '2px', fontWeight: 600 }}>
              {isSeller ? 'Service Provider' : 'Direct Client'}
            </span>
          </div>
        </div>

        <div className="portfolio-skills-section">
          <h2>{isSeller ? 'Skills & Specializations' : 'Skills & Interests'}</h2>
          {skills.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)' }}>
              No skills added yet. {isSeller && <Link to="/my-skills" style={{ color: 'var(--blue)', fontWeight: 600 }}>Add your skills →</Link>}
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {skills.map(s => (
                <span key={s.skill_id} className="skill-tag">{s.skill_name}</span>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, display: 'flex', gap: 12 }}>
          <Link to="/edit-profile" className="btn-outline btn-sm">Edit Profile</Link>
          {isSeller ? (
            <Link to="/my-skills" className="btn-primary btn-sm">Manage Skills</Link>
          ) : (
            <Link to="/marketplace" className="btn-primary btn-sm">Browse Marketplace</Link>
          )}
        </div>

      </div>
    </div>
  );
}
