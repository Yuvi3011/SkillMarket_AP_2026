import { useState, useEffect } from 'react';
import { exchangeAPI } from '../../../api/config';
import '../exchange.css';

function StatusBadge({ status }) {
  return <span className={`request-status-badge ${status}`}>{status}</span>;
}

function SkillTag({ name, type }) {
  return <span className={`skill-tag ${type}`}>{name}</span>;
}

export default function ExchangeRequestsPage() {
  const [tab, setTab]           = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        exchangeAPI.getReceivedRequests(),
        exchangeAPI.getSentRequests(),
      ]);
      setReceived(r.requests || []);
      setSent(s.requests     || []);
    } catch  finally { setLoading(false); }
  }

  async function respond(requestId, action) {
    try {
      await exchangeAPI.respondToRequest(requestId, action);
      setToast(action === 'accept' ? 'Request accepted! Exchange started.' : 'Request rejected.');
      await fetchAll();
      setTimeout(() => setToast(''), 3500);
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 4000);
    }
  }

  const list = tab === 'received' ? received : sent;

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container">
        <h1 style={{ fontFamily:'Space Grotesk', fontSize:'2.2rem', letterSpacing:'-0.02em', marginBottom:8 }}>
          Exchange Requests
        </h1>
        <p style={{ color:'var(--ink-soft)', marginBottom:32 }}>
          Manage incoming and outgoing skill-exchange requests.
        </p>

        <div className="requests-tabs">
          <button className={`req-tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
            Received ({received.length})
          </button>
          <button className={`req-tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
            Sent ({sent.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading requests…</div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <h3>No {tab} requests</h3>
            <p>{tab === 'received' ? 'No one has sent you a request yet.' : "You haven't sent any requests yet."}</p>
          </div>
        ) : (
          list.map(req => (
            <div key={req.request_id} className="request-card">
              <div style={{ flex: 1 }}>
                
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontWeight:700, fontSize:'1rem' }}>
                    {tab === 'received' ? req.sender_name : req.receiver_name}
                  </span>
                  <span style={{ color:'var(--ink-soft)', fontSize:'0.82rem', marginLeft:10 }}>
                    {new Date(req.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                </div>

                <div style={{ marginBottom:8 }}>
                  <span className="exchange-skill-label">Teaches </span>
                  {req.listing_skills?.offered?.map(s => <SkillTag key={s} name={s} type="offered" />)}
                  <span style={{ margin:'0 8px', color:'var(--ink-soft)' }}>↔</span>
                  <span className="exchange-skill-label">Wants </span>
                  {req.listing_skills?.wanted?.map(s => <SkillTag key={s} name={s} type="wanted" />)}
                </div>

                {req.message && (
                  <p style={{ fontSize:'0.88rem', color:'var(--ink-soft)', background:'var(--white)', border:'1px solid var(--border)', borderRadius:4, padding:'10px 14px', marginTop:10 }}>
                    "{req.message}"
                  </p>
                )}
              </div>

              <div className="request-actions">
                <StatusBadge status={req.status} />
                {tab === 'received' && req.status === 'pending' && (
                  <>
                    <button className="btn-primary" style={{ padding:'8px 18px', fontSize:'0.85rem', background:'var(--lime)', borderColor:'var(--lime)', color:'var(--ink)' }}
                      onClick={() => respond(req.request_id, 'accept')}>
                      Accept
                    </button>
                    <button className="btn-outline" style={{ padding:'8px 18px', fontSize:'0.85rem' }}
                      onClick={() => respond(req.request_id, 'reject')}>
                      Reject
                    </button>
                  </>
                )}
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
