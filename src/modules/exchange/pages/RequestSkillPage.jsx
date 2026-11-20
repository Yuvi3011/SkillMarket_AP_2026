import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exchangeAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import '../exchange.css';

function Avatar({ name }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return <div className="exchange-avatar">{initials}</div>;
}

export default function RequestSkillPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skillQuery, setSkillQuery] = useState('');
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [modal, setModal]           = useState(null);
  const [reqMsg, setReqMsg]         = useState('');
  const [toast, setToast]           = useState('');

  const popularSkills = ['Python', 'UI/UX Design', 'React', 'Figma', 'Machine Learning', 'Data Structures', 'Java', 'Web Development'];

  async function handleSearch(targetSkill) {
    const query = (targetSkill || skillQuery).trim();
    if (!query) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await exchangeAPI.getAllListings({ search: query });
      
      const q = query.toLowerCase();
      const filtered = (data.listings || []).filter(l => 
        l.offered?.some(s => s.toLowerCase().includes(q))
      );
      setListings(filtered);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  function openRequestModal(listing) {
    if (!user) {
      navigate('/login');
      return;
    }
    setModal(listing);
    setReqMsg('');
  }

  async function submitRequest() {
    try {
      await exchangeAPI.sendRequest({ exchange_id: modal.exchange_id, message: reqMsg });
      setToast('Exchange request sent successfully!');
      setModal(null);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 4000);
    }
  }

  return (
    <div>
      <section className="exchange-hero">
        <div className="container">
          <div className="exchange-hero-badge">🎯 Request a Skill</div>
          <h1>What do you want<br /><span>to learn today?</span></h1>
          <p>Search for any skill you want to learn, discover peer students ready to mentor you, and see what you can offer them in return.</p>
          
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            style={{ display: 'flex', gap: 10, maxWidth: 540 }}
          >
            <input
              value={skillQuery}
              onChange={(e) => setSkillQuery(e.target.value)}
              placeholder="e.g. Python, UI/UX, React, Figma, C++..."
              style={{
                flex: 1,
                padding: '13px 18px',
                border: '1.5px solid var(--border)',
                borderRadius: 4,
                fontSize: '1rem',
                background: 'var(--paper)',
                color: 'var(--ink)'
              }}
            />
            <button className="btn-primary" style={{ padding: '13px 26px', background: 'var(--lime)', borderColor: 'var(--lime)', color: 'var(--ink)' }}>
              Find Teachers
            </button>
          </form>

          <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(243,240,232,0.6)' }}>Popular:</span>
            {popularSkills.map(ps => (
              <button
                key={ps}
                type="button"
                onClick={() => { setSkillQuery(ps); handleSearch(ps); }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'var(--paper)',
                  padding: '4px 12px',
                  borderRadius: 99,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {ps}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '48px 24px 80px' }}>
        {loading ? (
          <div className="loading-state">Searching peer mentors...</div>
        ) : !searched ? (
          <div className="empty-state">
            <h3>Type a skill above or click a popular tag</h3>
            <p>We'll show all students who are actively teaching that subject.</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <h3>No student mentors found for "{skillQuery}"</h3>
            <p>Try searching another keyword or post an exchange listing to attract teachers!</p>
            <Link to="/exchange/offer" className="btn-primary">+ Offer an Exchange Listing</Link>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 28, fontSize: '0.9rem' }}>
              Found {listings.length} student{listings.length !== 1 ? 's' : ''} who can teach "{skillQuery}"
            </p>

            <div className="exchange-grid">
              {listings.map(listing => {
                const isOwn = user?.user_id === listing.user_id;
                return (
                  <div key={listing.exchange_id} className="exchange-card">
                    <div className="exchange-card-header">
                      <div className="exchange-card-user">
                        <Avatar name={listing.full_name} />
                        <div>
                          <div className="exchange-card-name">{listing.full_name}</div>
                          <div className="exchange-card-mode">📍 {listing.learning_mode} · {listing.experience_level}</div>
                        </div>
                      </div>
                      <span className={`exchange-badge ${listing.status}`}>{listing.status}</span>
                    </div>

                    <div>
                      <div className="exchange-skill-row">
                        <span className="exchange-skill-label">Teaches</span>
                        <div>
                          {listing.offered?.map(s => (
                            <span 
                              key={s} 
                              className={`skill-tag offered ${s.toLowerCase().includes(skillQuery.toLowerCase()) ? 'match' : ''}`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="exchange-skill-row" style={{ marginTop: 8 }}>
                        <span className="exchange-skill-label">Wants</span>
                        <div>
                          {listing.wanted?.map(s => (
                            <span key={s} className="skill-tag wanted">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {listing.description && (
                      <p className="exchange-card-desc">{listing.description}</p>
                    )}

                    <div className="exchange-card-footer">
                      <Link to={`/exchange/${listing.exchange_id}`} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                        View Profile
                      </Link>
                      {!isOwn && listing.status === 'active' && (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                          onClick={() => openRequestModal(listing)}
                        >
                          Request Skill
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--paper)', borderRadius: 8, padding: 32, maxWidth: 480, width: '100%' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', marginBottom: 8 }}>Request Skill from {modal.full_name}</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: 16 }}>
              They teach: <strong>{modal.offered?.join(', ')}</strong><br />
              They want in return: <strong>{modal.wanted?.join(', ')}</strong>
            </p>
            <textarea
              value={reqMsg}
              onChange={e => setReqMsg(e.target.value)}
              placeholder="Hi! I saw you teach this skill and would love to exchange with you..."
              rows={4}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 4, fontSize: '0.9rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn-outline" style={{ padding: '9px 20px' }} onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" style={{ padding: '9px 20px' }} onClick={submitRequest}>Send Request</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--ink)', color: 'var(--paper)', padding: '12px 24px', borderRadius: 4, zIndex: 2000 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
