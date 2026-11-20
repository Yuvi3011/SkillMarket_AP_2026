import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { exchangeAPI } from '../../../api/config';
import '../exchange.css';

export default function MyExchangesPage() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState('');

  useEffect(() => { fetchExchanges(); }, []);

  async function fetchExchanges() {
    setLoading(true);
    try {
      const data = await exchangeAPI.getMyExchanges();
      setExchanges(data.exchanges || []);
    } catch  finally { setLoading(false); }
  }

  async function markComplete(aeId) {
    try {
      await exchangeAPI.completeExchange(aeId);
      setToast('Exchange marked as completed!');
      await fetchExchanges();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 3000);
    }
  }

  const ongoing   = exchanges.filter(e => e.status === 'ongoing');
  const completed = exchanges.filter(e => e.status === 'completed');

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container">
        <h1 style={{ fontFamily:'Space Grotesk', fontSize:'2.2rem', letterSpacing:'-0.02em', marginBottom:8 }}>
          My Exchanges
        </h1>
        <p style={{ color:'var(--ink-soft)', marginBottom:40 }}>
          Track your active and completed skill exchanges.
        </p>

        {loading ? (
          <div className="loading-state">Loading exchanges…</div>
        ) : exchanges.length === 0 ? (
          <div className="empty-state">
            <h3>No exchanges yet</h3>
            <p>Once someone accepts your request (or you accept theirs), it shows up here.</p>
            <Link to="/exchange/matches" className="btn-primary">Find Matches</Link>
          </div>
        ) : (
          <>
            
            {ongoing.length > 0 && (
              <>
                <div className="section-label">Ongoing ({ongoing.length})</div>
                {ongoing.map(ex => (
                  <div key={ex.ae_id} className="my-exchange-card ongoing">
                    <div style={{ flex: 1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <div className="exchange-avatar" style={{ width:38, height:38, fontSize:'0.85rem' }}>
                          {ex.partner_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:700 }}>{ex.partner_name}</div>
                          <div style={{ fontSize:'0.8rem', color:'var(--ink-soft)' }}>
                            Started {new Date(ex.started_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="exchange-skill-label">Teaches </span>
                        {ex.skills?.offered?.map(s => <span key={s} className="skill-tag offered">{s}</span>)}
                        <span style={{ margin:'0 8px', color:'var(--ink-soft)' }}>↔</span>
                        <span className="exchange-skill-label">Wants </span>
                        {ex.skills?.wanted?.map(s => <span key={s} className="skill-tag wanted">{s}</span>)}
                      </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span className="request-status-badge accepted">Ongoing</span>
                      <button className="btn-outline" style={{ padding:'8px 16px', fontSize:'0.82rem' }}
                        onClick={() => markComplete(ex.ae_id)}>
                        Mark Complete
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {completed.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: 40 }}>Completed ({completed.length})</div>
                {completed.map(ex => (
                  <div key={ex.ae_id} className="my-exchange-card completed">
                    <div style={{ flex: 1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <div className="exchange-avatar" style={{ width:36, height:36, fontSize:'0.82rem', background:'var(--ink-soft)' }}>
                          {ex.partner_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:700 }}>{ex.partner_name}</div>
                          <div style={{ fontSize:'0.8rem', color:'var(--ink-soft)' }}>
                            Completed {new Date(ex.completed_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div>
                        {ex.skills?.offered?.map(s => <span key={s} className="skill-tag">{s}</span>)}
                        <span style={{ margin:'0 6px', color:'var(--ink-soft)' }}>↔</span>
                        {ex.skills?.wanted?.map(s => <span key={s} className="skill-tag">{s}</span>)}
                      </div>
                    </div>
                    <span className="request-status-badge accepted" style={{ background:'var(--border)', color:'var(--ink-soft)', borderColor:'var(--border)' }}>
                      ✅ Completed
                    </span>
                  </div>
                ))}
              </>
            )}
          </>
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
