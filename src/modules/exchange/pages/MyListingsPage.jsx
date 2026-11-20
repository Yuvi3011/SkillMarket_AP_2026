import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exchangeAPI } from '../../../api/config';
import '../exchange.css';

export default function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchMine(); }, []);

  async function fetchMine() {
    setLoading(true);
    try {
      const data = await exchangeAPI.getMyListings();
      setListings(data.listings || []);
    } catch  finally { setLoading(false); }
  }

  async function deleteListing(id) {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await exchangeAPI.deleteListing(id);
      setToast('Listing deleted.');
      await fetchMine();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 3000);
    }
  }

  return (
    <div style={{ padding:'48px 0 80px' }}>
      <div className="container">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:36, flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontFamily:'Space Grotesk', fontSize:'2.2rem', letterSpacing:'-0.02em' }}>My Listings</h1>
            <p style={{ color:'var(--ink-soft)', marginTop:6 }}>Manage your skill-exchange listings.</p>
          </div>
          <Link to="/exchange/offer" className="btn-primary">+ New Listing</Link>
        </div>

        {loading ? (
          <div className="loading-state">Loading…</div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <h3>No listings yet</h3>
            <p>Post your first skill-exchange listing to find compatible partners.</p>
            <Link to="/exchange/offer" className="btn-primary">Post a Listing</Link>
          </div>
        ) : (
          listings.map(l => (
            <div key={l.exchange_id} style={{ background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:6, padding:'20px 24px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span className={`exchange-badge ${l.status}`}>{l.status}</span>
                  <span style={{ fontSize:'0.8rem', color:'var(--ink-soft)' }}>
                    {new Date(l.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                </div>
                <div style={{ marginBottom:6 }}>
                  <span className="exchange-skill-label">Teaches </span>
                  {l.offered?.map(s => <span key={s} className="skill-tag offered">{s}</span>)}
                </div>
                <div>
                  <span className="exchange-skill-label">Wants </span>
                  {l.wanted?.map(s => <span key={s} className="skill-tag wanted">{s}</span>)}
                </div>
                {l.description && (
                  <p style={{ fontSize:'0.85rem', color:'var(--ink-soft)', marginTop:8 }}>{l.description.slice(0, 120)}{l.description.length > 120 ? '…' : ''}</p>
                )}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Link to={`/exchange/edit/${l.exchange_id}`} className="btn-outline" style={{ padding:'8px 16px', fontSize:'0.82rem' }}>Edit</Link>
                <button className="btn-outline" style={{ padding:'8px 16px', fontSize:'0.82rem', color:'var(--coral)', borderColor:'var(--coral)' }}
                  onClick={() => deleteListing(l.exchange_id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:'var(--ink)', color:'var(--paper)', padding:'12px 24px', borderRadius:4, zIndex:2000 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
