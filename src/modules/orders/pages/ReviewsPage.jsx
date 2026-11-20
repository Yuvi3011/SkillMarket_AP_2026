import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewsAPI } from '../../../api/config';
import '../orders.css';

export default function ReviewsPage() {
  const [data, setData] = useState({ written: [], received: [], pendingReviewOrders: [] });
  const [tab, setTab] = useState('received'); 
  const [loading, setLoading] = useState(true);

  const [modalOrder, setModalOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    setLoading(true);
    try {
      const res = await reviewsAPI.getMyReviews();
      setData(res);
    } catch {
      setData({ written: [], received: [], pendingReviewOrders: [] });
    } finally {
      setLoading(false);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!comment.trim()) return alert('Please enter feedback.');
    setSubmitting(true);
    try {
      await reviewsAPI.createReview({
        order_id: modalOrder.order_id,
        rating,
        comment: comment.trim(),
      });
      setToast('Review submitted! +10 points awarded.');
      setModalOrder(null);
      setComment('');
      await fetchReviews();
      setTimeout(() => setToast(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  const list = tab === 'received' ? data.received : data.written;

  const avgReceived = data.received.length > 0
    ? (data.received.reduce((a, b) => a + b.rating, 0) / data.received.length).toFixed(1)
    : '0.0';

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.4rem', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Reviews & Ratings
            </h1>
            <p style={{ color: 'var(--ink-soft)' }}>
              Feedback from students who collaborated with you on SkillMarket.
            </p>
          </div>
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 6, padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', fontFamily: 'Space Grotesk' }}>
              Your Seller Rating
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#FFB800' }}>
              ★ {avgReceived} <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', fontWeight: 500 }}>({data.received.length} reviews)</span>
            </div>
          </div>
        </div>

        {data.pendingReviewOrders.length > 0 && (
          <div style={{ background: 'rgba(52, 87, 255, 0.06)', border: '1.5px solid var(--blue)', borderRadius: 6, padding: 24, marginBottom: 32 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Space Grotesk', marginBottom: 8 }}>
              Eligible for Review ({data.pendingReviewOrders.length})
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: 16 }}>
              You recently completed these services! Leave a review to help the student community and earn <strong>+10 reward points</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.pendingReviewOrders.map(pOrd => (
                <div key={pOrd.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)', border: '1px solid var(--border)', padding: '12px 18px', borderRadius: 4, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{pOrd.service_title}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginLeft: 10 }}>Seller: {pOrd.seller_name}</span>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                    onClick={() => { setModalOrder(pOrd); setComment(''); setRating(5); }}
                  >
                    Write Review ⭐
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="order-tabs-bar" style={{ marginBottom: 24, borderRadius: 6 }}>
          <div className="order-tabs">
            <button
              className={`order-tab-btn ${tab === 'received' ? 'active' : ''}`}
              onClick={() => setTab('received')}
            >
              Reviews Received ({data.received.length})
            </button>
            <button
              className={`order-tab-btn ${tab === 'written' ? 'active' : ''}`}
              onClick={() => setTab('written')}
            >
              Reviews Written ({data.written.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>Loading reviews…</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: 6, border: '1.5px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginBottom: 8 }}>
              No {tab === 'received' ? 'received' : 'written'} reviews yet
            </h3>
            <p style={{ color: 'var(--ink-soft)' }}>
              {tab === 'received'
                ? 'When clients complete orders with you, their ratings will appear here.'
                : "You haven't written any reviews yet."}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {list.map(rev => (
              <div key={rev.review_id} style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 6, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {tab === 'received' ? rev.reviewer_name : rev.seller_name}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginLeft: 10 }}>
                      Service: <strong>{rev.service_title}</strong>
                    </span>
                  </div>
                  <div style={{ color: '#FFB800', fontSize: '1.2rem' }}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                </div>

                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink)' }}>
                  "{rev.comment}"
                </p>

                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 12 }}>
                  {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--paper)', borderRadius: 8, padding: 32, maxWidth: 480, width: '100%' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', marginBottom: 8 }}>Leave a Review</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginBottom: 20 }}>
              Order #{modalOrder.order_id} — {modalOrder.service_title} (by {modalOrder.seller_name})
            </p>

            <form onSubmit={submitReview}>
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(st => (
                    <button
                      key={st}
                      type="button"
                      className={`star-btn ${st <= rating ? 'active' : ''}`}
                      onClick={() => setRating(st)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: 4 }}>
                  {rating} Star{rating > 1 ? 's' : ''} {rating === 5 ? '(+10 Seller Bonus!)' : ''}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Space Grotesk' }}>
                  Your Feedback
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell others about the delivery quality, responsiveness, and accuracy..."
                  rows={4}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 4, fontSize: '0.9rem', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setModalOrder(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Review (+10 pts)'}
                </button>
              </div>
            </form>
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
