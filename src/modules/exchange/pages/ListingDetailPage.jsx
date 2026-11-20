import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { exchangeAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import '../exchange.css';

export default function ListingDetailPage() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [listing, setListing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [reqMsg, setReqMsg]     = useState('');
  const [toast, setToast]       = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchListing(); }, [id]);

  async function fetchListing() {
    try {
      const data = await exchangeAPI.getSingleListing(id);
      setListing(data.listing);
    } catch { navigate('/exchange'); }
    finally { setLoading(false); }
  }

  async function sendRequest() {
    try {
      await exchangeAPI.sendRequest({ exchange_id: listing.exchange_id, message: reqMsg });
      setToast('Request sent!');
      setModal(false);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err.message);
      setModal(false);
      setTimeout(() => setToast(''), 4000);
    }
  }

  async function deleteListing() {
    if (!window.confirm('Delete this listing?')) return;
    setDeleting(true);
    try {
      await exchangeAPI.deleteListing(id);
      navigate('/exchange');
    } catch (err) { setToast(err.message); setDeleting(false); }
  }

  if (loading) return <div className="loading-state" style={{ padding:80 }}>Loading…</div>;
  if (!listing) return null;

  const isOwn = user?.user_id === listing.user_id;

  return (
    <div style={{ padding:'48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 700 }}>
        
        <Link to="/exchange" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--ink-soft)', fontSize:'0.88rem', marginBottom:28 }}>
          ← Back to Exchange
        </Link>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div className="exchange-avatar" style={{ width:56, height:56, fontSize:'1.3rem' }}>
              {listing.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontFamily:'Space Grotesk', fontSize:'1.6rem', marginBottom:4 }}>{listing.full_name}</h1>
              <div style={{ fontSize:'0.85rem', color:'var(--ink-soft)' }}>
                {listing.learning_mode} · {listing.experience_level}
                {listing.availability && ` · ${listing.availability}`}
              </div>
            </div>
          </div>
          <span className={`exchange-badge ${listing.status}`}>{listing.status}</span>
        </div>

        <div style={{ background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:6, padding:24, marginBottom:20 }}>
          <div style={{ marginBottom:16 }}>
            <div className="section-label" style={{ marginBottom:10 }}>Skills I Can Teach</div>
            <div>{listing.offered?.map(s => <span key={s} className="skill-tag offered" style={{ fontSize:'0.9rem', padding:'5px 12px' }}>{s}</span>)}</div>
          </div>
          <div>
            <div className="section-label" style={{ marginBottom:10 }}>Skills I Want to Learn</div>
            <div>{listing.wanted?.map(s => <span key={s} className="skill-tag wanted" style={{ fontSize:'0.9rem', padding:'5px 12px' }}>{s}</span>)}</div>
          </div>
        </div>

        {listing.description && (
          <div style={{ background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:6, padding:24, marginBottom:20 }}>
            <div className="section-label" style={{ marginBottom:10 }}>About</div>
            <p style={{ fontSize:'0.95rem', lineHeight:1.65 }}>{listing.description}</p>
          </div>
        )}

        {(listing.github_url || listing.portfolio_url || listing.linkedin_url) && (
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:28 }}>
            {listing.github_url     && <a href={listing.github_url}     target="_blank" rel="noreferrer" className="btn-outline" style={{ padding:'8px 18px', fontSize:'0.85rem' }}>GitHub ↗</a>}
            {listing.portfolio_url  && <a href={listing.portfolio_url}  target="_blank" rel="noreferrer" className="btn-outline" style={{ padding:'8px 18px', fontSize:'0.85rem' }}>Portfolio ↗</a>}
            {listing.linkedin_url   && <a href={listing.linkedin_url}   target="_blank" rel="noreferrer" className="btn-outline" style={{ padding:'8px 18px', fontSize:'0.85rem' }}>LinkedIn ↗</a>}
          </div>
        )}

        {isOwn ? (
          <div style={{ display:'flex', gap:12 }}>
            <Link to={`/exchange/edit/${listing.exchange_id}`} className="btn-primary" style={{ padding:'12px 28px' }}>Edit Listing</Link>
            <button className="btn-outline" style={{ padding:'12px 24px' }} disabled={deleting} onClick={deleteListing}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ) : listing.status === 'active' && (
          <button className="btn-primary" style={{ padding:'13px 36px', fontSize:'1rem' }} onClick={() => setModal(true)}>
            Send Exchange Request
          </button>
        )}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'var(--paper)', borderRadius:8, padding:32, maxWidth:460, width:'100%' }}>
            <h3 style={{ fontFamily:'Space Grotesk', marginBottom:8 }}>Send Exchange Request</h3>
            <p style={{ fontSize:'0.88rem', color:'var(--ink-soft)', marginBottom:16 }}>To {listing.full_name}</p>
            <textarea
              value={reqMsg}
              onChange={e => setReqMsg(e.target.value)}
              placeholder="Introduce yourself and explain your exchange proposal…"
              rows={4}
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, fontSize:'0.9rem', resize:'vertical' }}
            />
            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
              <button className="btn-outline" style={{ padding:'9px 20px' }} onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ padding:'9px 20px' }} onClick={sendRequest}>Send</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:'var(--ink)', color:'var(--paper)', padding:'12px 24px', borderRadius:4, zIndex:2000 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
