import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rewardsAPI } from '../../../api/config';
import '../orders.css';

export default function RewardsPage() {
  const [data, setData] = useState({ totalPoints: 0, badge: 'Bronze', nextBadge: 'Silver', nextPointsNeeded: 100, history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  async function fetchRewards() {
    setLoading(true);
    try {
      const res = await rewardsAPI.getUserRewards();
      setData(res);
    } catch {
      setData({ totalPoints: 0, badge: 'Bronze', nextBadge: 'Silver', nextPointsNeeded: 100, history: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.4rem', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Rewards Dashboard
            </h1>
            <p style={{ color: 'var(--ink-soft)' }}>
              Earn points for fulfilling orders, writing quality reviews, and maintaining 5-star student ratings.
            </p>
          </div>
          <Link to="/leaderboard" className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.85rem' }}>
            🏆 View Campus Leaderboard →
          </Link>
        </div>

        <div className="rewards-header-card">
          <div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(243, 240, 232, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'Space Grotesk' }}>
              Your Total Reward Balance
            </div>
            <div className="rewards-points-large">{data.totalPoints} <span style={{ fontSize: '1.2rem', color: 'var(--paper)', fontWeight: 500 }}>Points</span></div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className={`rewards-badge-pill ${data.badge}`}>
                🏅 {data.badge} Member
              </span>
              {data.nextPointsNeeded > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'rgba(243, 240, 232, 0.7)' }}>
                  {data.nextPointsNeeded} more pts to unlock <strong>{data.nextBadge}</strong> tier
                </span>
              )}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 6, padding: '20px 24px', maxWidth: 360 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--lime)', marginBottom: 8, fontFamily: 'Space Grotesk' }}>
              How to Earn Points:
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(243, 240, 232, 0.85)' }}>
              <div>• <strong>+50 pts</strong> — Complete a client order</div>
              <div>• <strong>+10 pts</strong> — Submit a verified service review</div>
              <div>• <strong>+10 pts</strong> — Receive a 5-star seller rating</div>
            </div>
          </div>
        </div>

        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', marginBottom: 16 }}>
          Recent Points Activity
        </h2>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>Loading rewards…</div>
        ) : data.history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: 6, border: '1.5px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginBottom: 8 }}>No points earned yet</h3>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
              Complete orders or review services to start climbing the leaderboard!
            </p>
            <Link to="/marketplace" className="btn-primary">Browse Marketplace</Link>
          </div>
        ) : (
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            {data.history.map((item, idx) => (
              <div
                key={item.reward_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 24px',
                  borderBottom: idx === data.history.length - 1 ? 'none' : '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.reason}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: 4 }}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{
                  fontFamily: 'Space Grotesk',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  color: 'var(--blue)',
                }}>
                  +{item.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
