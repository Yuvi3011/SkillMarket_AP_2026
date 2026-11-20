import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rewardsAPI } from '../../../api/config';
import '../orders.css';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myPosition, setMyPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const data = await rewardsAPI.getLeaderboard();
      setLeaderboard(data.leaderboard || []);
      setMyPosition(data.myPosition || null);
    } catch {
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }

  const top3 = leaderboard.slice(0, 3);

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.5rem', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Campus Leaderboard 🏆
            </h1>
            <p style={{ color: 'var(--ink-soft)' }}>
              Top student creators & service providers ranked by completed orders, client ratings, and reward points.
            </p>
          </div>
          <Link to="/rewards" className="btn-outline" style={{ padding: '10px 22px', fontSize: '0.85rem' }}>
            🎁 My Rewards Dashboard
          </Link>
        </div>

        {myPosition && (
          <div style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 6,
            padding: '16px 24px',
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: 'var(--lime)',
                color: 'var(--ink)',
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontFamily: 'Space Grotesk',
              }}>
                #{myPosition.rank}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Your Campus Rank: #{myPosition.rank}</div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(243, 240, 232, 0.7)' }}>
                  {myPosition.completed_orders} orders completed · {myPosition.average_rating ? `★ ${myPosition.average_rating}` : 'No ratings yet'}
                </div>
              </div>
            </div>

            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.4rem', color: 'var(--lime)' }}>
              {myPosition.total_points} pts
            </div>
          </div>
        )}

        {top3.length >= 2 && (
          <div className="leaderboard-podium">
            
            {top3[1] && (
              <div className="podium-card rank-2">
                <div className="podium-crown">🥈</div>
                <div style={{ fontWeight: 800, fontFamily: 'Space Grotesk', fontSize: '1.1rem' }}>#{top3[1].rank} {top3[1].full_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '4px 0 10px' }}>{top3[1].role_name}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 800, color: 'var(--blue)' }}>
                  {top3[1].total_points} pts
                </div>
              </div>
            )}

            {top3[0] && (
              <div className="podium-card rank-1">
                <div className="podium-crown">👑</div>
                <div style={{ fontWeight: 800, fontFamily: 'Space Grotesk', fontSize: '1.25rem' }}>#1 {top3[0].full_name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', margin: '4px 0 10px' }}>{top3[0].role_name}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)' }}>
                  {top3[0].total_points} pts
                </div>
              </div>
            )}

            {top3[2] && (
              <div className="podium-card rank-3">
                <div className="podium-crown">🥉</div>
                <div style={{ fontWeight: 800, fontFamily: 'Space Grotesk', fontSize: '1.1rem' }}>#{top3[2].rank} {top3[2].full_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '4px 0 10px' }}>{top3[2].role_name}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 800, color: 'var(--coral)' }}>
                  {top3[2].total_points} pts
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>Loading leaderboard…</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: 6, border: '1.5px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginBottom: 8 }}>Leaderboard is empty</h3>
            <p style={{ color: 'var(--ink-soft)' }}>Complete orders and earn points to see rankings here.</p>
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Rank</th>
                <th>Student</th>
                <th>Role</th>
                <th>Orders Completed</th>
                <th>Rating</th>
                <th style={{ textAlign: 'right' }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(u => (
                <tr key={u.user_id} className={u.isCurrentUser ? 'my-row' : ''}>
                  <td style={{ fontWeight: 800, fontFamily: 'Space Grotesk' }}>
                    {u.rank === 1 ? '🥇 #1' : u.rank === 2 ? '🥈 #2' : u.rank === 3 ? '🥉 #3' : `#${u.rank}`}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{u.full_name}</span>
                    {u.isCurrentUser && <span style={{ marginLeft: 8, fontSize: '0.72rem', background: 'var(--ink)', color: 'var(--paper)', padding: '2px 6px', borderRadius: 3 }}>YOU</span>}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{u.role_name}</td>
                  <td>{u.completed_orders} orders</td>
                  <td style={{ color: '#FFB800', fontWeight: 600 }}>
                    {u.average_rating ? `★ ${u.average_rating}` : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'Space Grotesk', fontSize: '1.05rem' }}>
                    {u.total_points} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
