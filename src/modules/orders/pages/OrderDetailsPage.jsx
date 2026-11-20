import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ordersAPI, reviewsAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import '../orders.css';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [updating, setUpdating] = useState(false);

  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  async function fetchOrder() {
    setLoading(true);
    try {
      const data = await ordersAPI.getOrderDetails(id);
      setOrder(data.order);
    } catch (err) {
      setError(err.message || 'Order not found.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(newStatus) {
    if (!window.confirm(`Update order status to '${newStatus}'?`)) return;
    setUpdating(true);
    try {
      await ordersAPI.updateOrderStatus(id, newStatus);
      setToast(`Order updated to '${newStatus}'!`);
      await fetchOrder();
      setTimeout(() => setToast(''), 3500);
    } catch (err) {
      setToast(err.message || 'Failed to update order status.');
      setTimeout(() => setToast(''), 3500);
    } finally {
      setUpdating(false);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Please write a feedback comment.');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewsAPI.createReview({
        order_id: order.order_id,
        rating,
        comment: comment.trim(),
      });
      setToast('Review submitted successfully! Reward points earned.');
      setReviewModal(false);
      await fetchOrder();
      setTimeout(() => setToast(''), 3500);
    } catch (err) {
      alert(err.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) return <div className="container" style={{ padding: 80, textAlign: 'center' }}>Loading order details…</div>;
  if (error || !order) {
    return (
      <div className="container" style={{ padding: 80, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Space Grotesk' }}>Error</h2>
        <p style={{ color: 'var(--coral)', margin: '12px 0 24px' }}>{error}</p>
        <Link to="/orders" className="btn-primary">Back to My Orders</Link>
      </div>
    );
  }

  const isBuyer = order.buyer_id === user?.user_id;
  const isSeller = order.seller_id === user?.user_id;

  let step = 1; 
  if (order.status === 'In Progress') step = 2;
  if (order.status === 'Completed') step = 3;

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        
        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-soft)', fontSize: '0.88rem', marginBottom: 24 }}>
          ← Back to My Orders
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Space Grotesk' }}>
              Order #{order.order_id}
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', marginTop: 4 }}>
              {order.service_title}
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 700 }}>₹{order.amount}</div>
            <span className={`order-status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
              {order.status}
            </span>
          </div>
        </div>

        <div className="timeline-track">
          <div className={`timeline-step ${step >= 1 ? (step === 1 ? 'active' : 'done') : ''}`}>
            <div className="timeline-dot">{step > 1 ? '✓' : '1'}</div>
            <div className="timeline-label">Order Created</div>
          </div>
          <div className={`timeline-step ${step >= 2 ? (step === 2 ? 'active' : 'done') : ''}`}>
            <div className="timeline-dot">{step > 2 ? '✓' : '2'}</div>
            <div className="timeline-label">Payment & In Progress</div>
          </div>
          <div className={`timeline-step ${step >= 3 ? 'done' : ''}`}>
            <div className="timeline-dot">{step === 3 ? '✓' : '3'}</div>
            <div className="timeline-label">Work Completed</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 6, padding: 20 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Space Grotesk' }}>
              Client (Buyer)
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{order.buyer_name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{order.buyer_email}</div>
          </div>

          <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 6, padding: 20 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Space Grotesk' }}>
              Service Provider (Seller)
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{order.seller_name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{order.seller_email}</div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 6, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Space Grotesk' }}>
            Payment & Transaction Details
          </div>
          <div className="checkout-row">
            <span style={{ color: 'var(--ink-soft)' }}>Payment Status</span>
            <span style={{ fontWeight: 600 }}>{order.payment_status || 'Pending'}</span>
          </div>
          <div className="checkout-row">
            <span style={{ color: 'var(--ink-soft)' }}>Razorpay Payment ID</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{order.razorpay_payment_id || 'Not verified yet'}</span>
          </div>
          <div className="checkout-row">
            <span style={{ color: 'var(--ink-soft)' }}>Payment Method</span>
            <span>{order.payment_method || 'Razorpay Test Mode'}</span>
          </div>
          <div className="checkout-row" style={{ borderBottom: 'none' }}>
            <span style={{ color: 'var(--ink-soft)' }}>Order Date</span>
            <span>{new Date(order.created_at).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {order.review_id ? (
          <div style={{ background: 'rgba(213, 243, 106, 0.15)', border: '1.5px solid var(--lime)', borderRadius: 6, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk' }}>Client Review Submitted</div>
              <div style={{ color: '#FFB800', fontSize: '1.2rem' }}>
                {'★'.repeat(order.rating)}{'☆'.repeat(5 - order.rating)}
              </div>
            </div>
            <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--ink)' }}>
              "{order.review_comment}"
            </p>
          </div>
        ) : (
          isBuyer && order.status === 'Completed' && (
            <div style={{ background: 'rgba(52, 87, 255, 0.08)', border: '1.5px solid var(--blue)', borderRadius: 6, padding: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontFamily: 'Space Grotesk', fontSize: '1.05rem' }}>This order is complete!</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>Submit a review to rate the seller and earn +10 reward points.</div>
              </div>
              <button className="btn-primary" onClick={() => setReviewModal(true)}>
                Leave Review ⭐
              </button>
            </div>
          )
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {isSeller && order.status === 'In Progress' && (
            <button
              className="btn-primary"
              style={{ background: 'var(--lime)', borderColor: 'var(--lime)', color: 'var(--ink)', padding: '12px 28px' }}
              disabled={updating}
              onClick={() => handleStatusUpdate('Completed')}
            >
              ✓ Mark Order as Completed
            </button>
          )}

          {isSeller && order.status === 'Pending Payment' && (
            <button
              className="btn-primary"
              disabled={updating}
              onClick={() => handleStatusUpdate('In Progress')}
            >
              Start Order (Mark In Progress)
            </button>
          )}

          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
            <button
              className="btn-outline"
              style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}
              disabled={updating}
              onClick={() => handleStatusUpdate('Cancelled')}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--paper)', borderRadius: 8, padding: 32, maxWidth: 480, width: '100%' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', marginBottom: 8 }}>Review Service</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginBottom: 20 }}>
              Rate your experience working with <strong>{order.seller_name}</strong>.
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
                  Feedback Comment
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share details of your experience (quality of work, communication, delivery speed)..."
                  rows={4}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 4, fontSize: '0.9rem', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setReviewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submittingReview}>
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
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
