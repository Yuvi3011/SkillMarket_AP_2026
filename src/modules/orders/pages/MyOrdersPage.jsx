import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import '../orders.css';

function StatusBadge({ status }) {
  let cls = 'pending';
  if (status === 'In Progress') cls = 'in-progress';
  else if (status === 'Completed') cls = 'completed';
  else if (status === 'Cancelled') cls = 'cancelled';
  return <span className={`order-status-badge ${cls}`}>{status}</span>;
}

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('purchased'); 
  const [statusFilter, setStatusFilter] = useState('all');
  const [ordersData, setOrdersData] = useState({ orders: [], purchased: [], sold: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const data = await ordersAPI.getMyOrders({ status: statusFilter });
      setOrdersData(data);
    } catch {
      setOrdersData({ orders: [], purchased: [], sold: [] });
    } finally {
      setLoading(false);
    }
  }

  const list = tab === 'purchased' ? ordersData.purchased : ordersData.sold;

  return (
    <div>
      
      <section className="order-hero">
        <div className="container">
          <div className="order-hero-badge">📦 Orders & Deliveries</div>
          <h1>Track your orders,<br /><span>manage deliveries.</span></h1>
          <p>View your active service purchases, manage client orders you are fulfilling, and review completed work.</p>
        </div>
      </section>

      <div className="order-tabs-bar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="order-tabs">
            <button
              className={`order-tab-btn ${tab === 'purchased' ? 'active' : ''}`}
              onClick={() => setTab('purchased')}
            >
              Purchased Orders ({ordersData.purchased.length})
            </button>
            <button
              className={`order-tab-btn ${tab === 'sold' ? 'active' : ''}`}
              onClick={() => setTab('sold')}
            >
              Services I Sell ({ordersData.sold.length})
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, padding: '10px 0' }}>
            <Link to="/transactions" style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600 }}>
              💳 Transactions
            </Link>
            <Link to="/reviews" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              ⭐ Reviews
            </Link>
            <Link to="/rewards" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              🎁 Rewards
            </Link>
            <Link to="/leaderboard" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '36px 24px 80px' }}>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', fontWeight: 600, marginRight: 6 }}>
            Filter:
          </span>
          {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: '0.8rem',
                border: '1.5px solid var(--border)',
                background: statusFilter === st ? 'var(--ink)' : 'var(--white)',
                color: statusFilter === st ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer',
                fontFamily: 'Space Grotesk',
                textTransform: 'capitalize',
              }}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>Loading orders…</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: 6, border: '1.5px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginBottom: 8 }}>
              No {tab === 'purchased' ? 'purchased' : 'received'} orders found
            </h3>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
              {tab === 'purchased'
                ? "You haven't bought any services yet. Explore the marketplace to find talented student peers!"
                : "You haven't received any orders for your services yet."}
            </p>
            {tab === 'purchased' && (
              <Link to="/marketplace" className="btn-primary">
                Browse Marketplace
              </Link>
            )}
          </div>
        ) : (
          list.map(ord => (
            <div key={ord.order_id} className="order-card">
              <div style={{ flex: 1 }}>
                <div className="order-card-meta">
                  <span>Order <strong>#{ord.order_id}</strong></span>
                  <span>·</span>
                  <span>{new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>·</span>
                  <StatusBadge status={ord.status} />
                </div>

                <div className="order-card-title">{ord.service_title}</div>

                <div className="order-card-people">
                  {tab === 'purchased' ? (
                    <span>Seller: <strong>{ord.seller_name}</strong> ({ord.seller_email})</span>
                  ) : (
                    <span>Client / Buyer: <strong>{ord.buyer_name}</strong> ({ord.buyer_email})</span>
                  )}
                  <span style={{ margin: '0 8px' }}>·</span>
                  <span>⏱️ {ord.delivery_time} Days Delivery</span>
                </div>
              </div>

              <div>
                <div className="order-card-price">₹{ord.amount}</div>
                <Link to={`/orders/${ord.order_id}`} className="btn-outline" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                  View Details →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
