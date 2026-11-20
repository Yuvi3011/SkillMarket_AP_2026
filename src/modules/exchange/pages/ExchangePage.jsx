import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exchangeAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import '../exchange.css';

function SkillTag({ name, type }) {
  return <span className={`skill-tag ${type}`}>{name}</span>;
}

function Avatar({ name }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return <div className="exchange-avatar">{initials}</div>;
}

function ListingCard({ listing, onRequest }) {
  const { user } = useAuth();
  const isOwn = user?.user_id === listing.user_id;

  return (
    <div className="exchange-card">
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
          <div>{listing.offered?.map(s => <SkillTag key={s} name={s} type="offered" />)}</div>
        </div>
        <div className="exchange-skill-row" style={{ marginTop: 8 }}>
          <span className="exchange-skill-label">Wants</span>
          <div>{listing.wanted?.map(s => <SkillTag key={s} name={s} type="wanted" />)}</div>
        </div>
      </div>

      {listing.description && (
        <p className="exchange-card-desc">{listing.description}</p>
      )}

      <div className="exchange-card-footer">
        <span className="exchange-card-meta">
          {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/exchange/${listing.exchange_id}`} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
            View
          </Link>
          {!isOwn && listing.status === 'active' && (
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              onClick={() => onRequest(listing)}>
              Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExchangePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [catFilter, setCatFilter]   = useState('ALL');
  const [requesting, setRequesting] = useState(null); 
  const [reqMsg, setReqMsg]     = useState('');
  const [toast, setToast]       = useState('');

  useEffect(() => { fetchListings(); }, []);

  async function fetchListings() {
    setLoading(true);
    try {
      const data = await exchangeAPI.getAllListings({ search });
      setListings(data.listings);
    } catch  finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchListings();
  }

  function openRequestModal(listing) {
    if (!user) { navigate('/login'); return; }
    setRequesting(listing);
    setReqMsg('');
  }

  async function submitRequest() {
    try {
      await exchangeAPI.sendRequest({ exchange_id: requesting.exchange_id, message: reqMsg });
      setToast('Request sent!');
      setRequesting(null);
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
          <div className="exchange-hero-badge">🔄 Skill Exchange</div>
          <h1>Exchange skills,<br /><span>no money needed.</span></h1>
          <p>Find students who can teach what you want to learn — and teach them what you know.</p>
          <div className="exchange-hero-actions">
            <Link to="/exchange/offer" className="btn-primary">+ Offer a Skill</Link>
            <Link to="/exchange/request" className="btn-outline" style={{ color: 'var(--paper)', borderColor: 'rgba(243,240,232,0.4)' }}>
              🎯 Request a Skill
            </Link>
            <Link to="/exchange/matches" className="btn-outline" style={{ color: 'var(--lime)', borderColor: 'var(--lime)' }}>
              ✨ Smart Matches →
            </Link>
          </div>
        </div>
      </section>

      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', gap: 12, padding: '12px 24px', overflowX: 'auto' }}>
          <Link to="/exchange" style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--ink)', color: 'var(--paper)', fontSize: '0.82rem', fontWeight: 600 }}>
            All Listings
          </Link>
          <Link to="/exchange/matches" style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--border)', fontSize: '0.82rem', fontWeight: 600 }}>
            ✨ Matches
          </Link>
          <Link to="/exchange/requests" style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--border)', fontSize: '0.82rem', fontWeight: 600 }}>
            📬 Requests
          </Link>
          <Link to="/exchange/my-exchanges" style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--border)', fontSize: '0.82rem', fontWeight: 600 }}>
            🤝 My Exchanges
          </Link>
          <Link to="/exchange/my-listings" style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--border)', fontSize: '0.82rem', fontWeight: 600 }}>
            📋 My Listings
          </Link>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flex: 1, minWidth: 280, maxWidth: 500 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by skill (e.g. Python, Figma, React…)"
              style={{ flex: 1, padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 4, fontSize: '0.95rem' }}
            />
            <button className="btn-primary" style={{ padding: '11px 22px' }}>Search</button>
          </form>

          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 4, background: 'var(--white)', fontSize: '0.9rem' }}
          >
            <option value="ALL">All Categories</option>
            <option value="Coding & Development">Coding & Development</option>
            <option value="Graphic & UI/UX Design">Graphic & UI/UX Design</option>
            <option value="Web Development">Web Development</option>
            <option value="Academic Tutoring">Academic Tutoring</option>
            <option value="Content & Writing">Content & Writing</option>
            <option value="Video & Animation">Video & Animation</option>
            <option value="Music & Audio">Music & Audio</option>
            <option value="Digital Marketing">Digital Marketing</option>
          </select>

          <select
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value)}
            style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 4, background: 'var(--white)', fontSize: '0.9rem' }}
          >
            <option value="ALL">All Modes</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Both">Both (Online/Offline)</option>
          </select>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: 20 }}>
          {listings.filter(l => 
            (modeFilter === 'ALL' || l.learning_mode === modeFilter) &&
            (catFilter === 'ALL' || l.category === catFilter)
          ).length} listing(s) available
        </p>

        {loading ? (
          <div className="loading-state">Loading listings…</div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <h3>No listings yet</h3>
            <p>Be the first to offer a skill exchange!</p>
            <Link to="/exchange/offer" className="btn-primary">Post a Listing</Link>
          </div>
        ) : (
          <div className="exchange-grid">
            {listings
              .filter(l => 
                (modeFilter === 'ALL' || l.learning_mode === modeFilter) &&
                (catFilter === 'ALL' || l.category === catFilter)
              )
              .map(l => (
                <ListingCard key={l.exchange_id} listing={l} onRequest={openRequestModal} />
              ))}
          </div>
        )}
      </div>

      {requesting && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'var(--paper)', borderRadius:8, padding:32, maxWidth:480, width:'100%' }}>
            <h3 style={{ fontFamily:'Space Grotesk', marginBottom:8 }}>Send Exchange Request</h3>
            <p style={{ color:'var(--ink-soft)', fontSize:'0.9rem', marginBottom:20 }}>
              To <strong>{requesting.full_name}</strong> — {requesting.offered?.join(', ')} ↔ {requesting.wanted?.join(', ')}
            </p>
            <textarea
              value={reqMsg}
              onChange={e => setReqMsg(e.target.value)}
              placeholder="Introduce yourself and explain why you're a good match…"
              rows={4}
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, fontSize:'0.9rem', resize:'vertical' }}
            />
            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
              <button className="btn-outline" style={{ padding:'9px 20px' }} onClick={() => setRequesting(null)}>Cancel</button>
              <button className="btn-primary" style={{ padding:'9px 20px' }} onClick={submitRequest}>Send Request</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:'var(--ink)', color:'var(--paper)', padding:'12px 24px', borderRadius:4, fontSize:'0.9rem', zIndex:2000 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
