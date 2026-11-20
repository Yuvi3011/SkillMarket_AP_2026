import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, skillsAPI, ordersAPI, rewardsAPI } from '../../../api/config';
import './Pages.css';

function getCompletion(profileData, skillCount) {
  if (!profileData) return 50;
  const fields = [
    profileData.full_name,
    profileData.bio,
    profileData.portfolio_url,
    profileData.github_url,
    profileData.linkedin_url,
  ];
  const filled = fields.filter(Boolean).length;
  const skillBonus = skillCount > 0 ? 1 : 0;
  return Math.round(((filled + skillBonus) / (fields.length + 1)) * 100);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile]       = useState(null);
  const [skills,  setSkills]        = useState([]);
  const [orderCount, setOrderCount] = useState(0);
  const [points, setPoints]         = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profData, skillData, orderData, rewardData] = await Promise.allSettled([
          userAPI.getProfile(),
          skillsAPI.getSkills(),
          ordersAPI.getMyOrders(),
          rewardsAPI.getMyRewards(),
        ]);

        if (profData.status === 'fulfilled' && profData.value?.user) {
          setProfile(profData.value.user);
        }
        if (skillData.status === 'fulfilled') {
          setSkills(skillData.value.skills || []);
        }
        if (orderData.status === 'fulfilled') {
          const totalOrders = (orderData.value.orders || []).length;
          setOrderCount(totalOrders);
        }
        if (rewardData.status === 'fulfilled') {
          setPoints(rewardData.value.total_points || 0);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentProfile = profile || user;

  if (loading && !currentProfile) {
    return (
      <div className="container page-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="container page-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3>Session Expired</h3>
        <p style={{ color: 'var(--ink-soft)', margin: '12px 0 20px' }}>
          Please log in again to view your dashboard.
        </p>
        <Link to="/login" className="btn-primary">
          Go to Login →
        </Link>
      </div>
    );
  }

  const completion = getCompletion(currentProfile, skills.length);
  const firstName  = currentProfile.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="dashboard-page">
      <div className="container">
        
        <div className="dashboard-header">
          <div className="dashboard-greeting">Student Hub & Dashboard</div>
          <h1>Welcome back, <span>{firstName}</span> ✨</h1>
          <div className="dashboard-role-badge seller-badge">Active Member</div>
          <p className="role-tagline">Learn, teach, offer services, and collaborate with student peers.</p>
        </div>

        <div className="completion-wrap">
          <div className="completion-label">
            <span>Profile Completion</span>
            <span>{completion}%</span>
          </div>
          <div className="completion-bar">
            <div className="completion-fill" style={{ width: `${completion}%` }} />
          </div>
          {completion < 100 && (
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: 8 }}>
              Add your bio, skills, and links to stand out to peers and clients.
            </p>
          )}
        </div>

        <div className="dashboard-stats">
          <div className="stat-block">
            <div className="stat-label">Skills Listed</div>
            <div className="stat-value">{skills.length}</div>
            <div className="stat-sub">on your profile</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{orderCount}</div>
            <div className="stat-sub">bought & sold</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">Reward Points</div>
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{points}</div>
            <div className="stat-sub">earned on campus</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">Profile</div>
            <div className="stat-value">{completion}%</div>
            <div className="stat-sub">completed</div>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Tools & Navigation</h3>
          <div className="action-cards">
            <Link to="/marketplace/create" className="action-card action-card--highlight">
              <span className="action-icon">➕</span>
              <span className="action-title">Post a Service</span>
              <span className="action-desc">Offer your skills for hire</span>
            </Link>
            <Link to="/my-skills" className="action-card action-card--highlight">
              <span className="action-icon">🛠️</span>
              <span className="action-title">Manage Skills</span>
              <span className="action-desc">{skills.length} skill{skills.length !== 1 ? 's' : ''} listed</span>
            </Link>
            <Link to="/exchange" className="action-card">
              <span className="action-icon">🔄</span>
              <span className="action-title">Skill Exchange</span>
              <span className="action-desc">Barter skills with zero money</span>
            </Link>
            <Link to="/orders" className="action-card">
              <span className="action-icon">📦</span>
              <span className="action-title">Orders & Deliveries</span>
              <span className="action-desc">Track active orders and clients</span>
            </Link>
            <Link to="/rewards" className="action-card">
              <span className="action-icon">🎁</span>
              <span className="action-title">Rewards Hub</span>
              <span className="action-desc">{points} points earned</span>
            </Link>
            <Link to="/leaderboard" className="action-card">
              <span className="action-icon">🏆</span>
              <span className="action-title">Leaderboard</span>
              <span className="action-desc">See campus rankings</span>
            </Link>
            <Link to="/my-portfolio" className="action-card">
              <span className="action-icon">🗂️</span>
              <span className="action-title">My Portfolio</span>
              <span className="action-desc">Your public showcase</span>
            </Link>
            <Link to="/edit-profile" className="action-card">
              <span className="action-icon">✏️</span>
              <span className="action-title">Edit Profile</span>
              <span className="action-desc">Update bio & social links</span>
            </Link>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="dash-skills-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Your Skills</h3>
              <Link to="/my-skills" style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600 }}>
                Manage →
              </Link>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {skills.map(s => (
                <span key={s.skill_id || s.user_skill_id} className="skill-tag">{s.skill_name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
