import { useLocation, Link, useNavigate } from 'react-router-dom';
import '../orders.css';

export default function PaymentStatusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || ;

  const isSuccess = state.status === 'success';

  return (
    <div style={{ padding: '64px 0 96px' }}>
      <div className="container" style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: isSuccess ? 'rgba(213, 243, 106, 0.3)' : 'rgba(255, 112, 79, 0.15)',
          color: isSuccess ? 'var(--ink)' : 'var(--coral)',
          fontSize: '2.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          {isSuccess ? '✓' : '✕'}
        </div>

        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.2rem', marginBottom: 12 }}>
          {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </h1>

        <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', marginBottom: 32 }}>
          {isSuccess
            ? 'Your payment has been verified by the backend. The service provider has been notified and your order is now In Progress.'
            : (state.error || 'The payment could not be completed. Your card has not been charged.')}
        </p>

        {isSuccess && (
          <div className="checkout-box" style={{ textAlign: 'left', marginBottom: 32 }}>
            <div className="checkout-row">
              <span style={{ color: 'var(--ink-soft)' }}>Order ID</span>
              <span style={{ fontWeight: 600 }}>#{state.order_id}</span>
            </div>
            <div className="checkout-row">
              <span style={{ color: 'var(--ink-soft)' }}>Razorpay Payment ID</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{state.payment_id}</span>
            </div>
            <div className="checkout-row">
              <span style={{ color: 'var(--ink-soft)' }}>Amount Paid</span>
              <span style={{ fontWeight: 700 }}>₹{state.amount}</span>
            </div>
            <div className="checkout-row">
              <span style={{ color: 'var(--ink-soft)' }}>Payment Status</span>
              <span className="order-status-badge completed">Verified</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {isSuccess ? (
            <>
              <Link to={`/orders/${state.order_id}`} className="btn-primary" style={{ padding: '12px 28px' }}>
                View Order Details
              </Link>
              <Link to="/orders" className="btn-outline" style={{ padding: '12px 24px' }}>
                My Orders
              </Link>
            </>
          ) : (
            <>
              <button onClick={() => navigate(-1)} className="btn-primary" style={{ padding: '12px 28px' }}>
                Try Again
              </button>
              <Link to="/marketplace" className="btn-outline" style={{ padding: '12px 24px' }}>
                Explore Marketplace
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
