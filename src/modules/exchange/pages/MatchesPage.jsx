import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exchangeAPI } from '../../../api/config';
import '../exchange.css';

function Avatar({ name }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return <div className="exchange-avatar" style={{ width:48, height:48, fontSize:'1.1rem' }}>{initials}</div>;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tip, setTip]         = useState('');
  const [sending, setSending] = useState(null);  
  const [reqMsg, setReqMsg]   = useState('');
  const [modal, setModal]     = useState(null);  
  const [toast, setToast]     = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchMatches(); }, []);

  async function fetchMatches() {
    setLoading(true);
    try {
      const data = await exchangeAPI.getMatches();
      setMatches(data.matches || []);
      setTip(data.tip || '');
    } catch  finally { setLoading(false); }
  }

  function openModal(match) {
    setModal(match);
    setReqMsg('');
  }

  async function submitRequest() {
    setSending(modal.exchange_id);
    try {
      await exchangeAPI.sendRequest({ exchange_id: modal.exchange_id, message: reqMsg });
      setToast('Request sent!');
      setModal(null);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 4000);
    } finally { setSending(null); }
  }

  return (
    <div>
      
      <section className="exchange-hero">
        <div className="container">
          <div className="exchange-hero-badge">✨ Smart Matching</div>
          <h1>Your best<br /><span>skill matches.</span></h1>
          <p>Students who can teach what you want to learn — and want to learn what you can teach.</p>
          <div className="exchange-hero-actions">
            <Link to="/exchange/offer" className="btn-primary">+ Add a Listing</Link>
            <Link to="/exchange" className="btn-outline" style={{ color:'var(--paper)', borderColor:'rgba(243,240,232,0.4)' }}>Browse All →</Link>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding:'40px 24px 80px' }}>
        {loading ? (
          <div className="loading-state">Finding your matches…</div>
        ) : tip ? (
          <div className="empty-state">
            <h3>No matches yet</h3>
            <p>{tip}</p>
            <Link to="/exchange/offer" className="btn-primary">Post Your First Listing</Link>
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <h3>No matches found</h3>
            <p>No other students currently offer skills that match your wanted skills. Check back soon!</p>
          </div>
        ) : (
          <>
            <p style={{ color:'var(--ink-soft)', marginBottom:28, fontSize:'0.9rem' }}>
              {matches.length} compatible student{matches.length !== 1 ? 's' : ''} found
            </p>
            <div className="exchange-grid">
              {matches.map(m => (
                <div key={m.exchange_id} className="match-card">
                  
                  <div className="match-score-badge">{m.match_score}%</div>

                  <div className={`match-type-label ${m.match_type}`}>
                    {m.match_type === 'reciprocal' ? '🔄 Reciprocal Match' : '🔸 Partial Match'}
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <Avatar name={m.full_name} />
                    <div>
                      <div className="match-name">{m.full_name}</div>
                      <div style={{ fontSize:'0.8rem', color:'var(--ink-soft)' }}>
                        {m.learning_mode} · {m.experience_level}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div className="exchange-skill-row">
                      <span className="exchange-skill-label">Teaches</span>
                      <div>{m.offered?.map(s => <span key={s} className="skill-tag offered">{s}</span>)}</div>
                    </div>
                    <div className="exchange-skill-row" style={{ marginTop:6 }}>
                      <span className="exchange-skill-label">Wants</span>
                      <div>{m.wanted?.map(s => <span key={s} className="skill-tag wanted">{s}</span>)}</div>
                    </div>
                  </div>

                  <div className="match-explain">
                    {m.i_can_teach.length > 0 && (
                      <div>✅ You teach them: <strong>{m.i_can_teach.join(', ')}</strong></div>
                    )}
                    {m.they_can_teach.length > 0 && (
                      <div>✅ They teach you: <strong>{m.they_can_teach.join(', ')}</strong></div>
                    )}
                  </div>

                  <div style={{ display:'flex', gap:8, marginTop:12 }}>
                    <Link to={`/exchange/${m.exchange_id}`} className="btn-outline" style={{ flex:1, padding:'9px 0', textAlign:'center', fontSize:'0.85rem' }}>
                      View Profile
                    </Link>
                    <button className="btn-primary" style={{ flex:1, padding:'9px 0', fontSize:'0.85rem' }}
                      onClick={() => openModal(m)}>
                      Send Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'var(--paper)', borderRadius:8, padding:32, maxWidth:480, width:'100%' }}>
            <h3 style={{ fontFamily:'Space Grotesk', marginBottom:8 }}>Send Exchange Request</h3>
            <p style={{ fontSize:'0.88rem', color:'var(--ink-soft)', marginBottom:16 }}>
              To <strong>{modal.full_name}</strong> — {modal.match_score}% match
            </p>
            <div className="match-explain" style={{ marginBottom:16 }}>
              {modal.i_can_teach.length > 0 && <div>✅ You'll teach: <strong>{modal.i_can_teach.join(', ')}</strong></div>}
              {modal.they_can_teach.length > 0 && <div>✅ They'll teach: <strong>{modal.they_can_teach.join(', ')}</strong></div>}
            </div>
            <textarea
              value={reqMsg}
              onChange={e => setReqMsg(e.target.value)}
              placeholder="Introduce yourself and explain your exchange proposal…"
              rows={4}
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:4, fontSize:'0.9rem', resize:'vertical' }}
            />
            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
              <button className="btn-outline" style={{ padding:'9px 20px' }} onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" style={{ padding:'9px 20px' }} disabled={sending === modal.exchange_id} onClick={submitRequest}>
                {sending === modal.exchange_id ? 'Sending…' : 'Send Request'}
              </button>
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
