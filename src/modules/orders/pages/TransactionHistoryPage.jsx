import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentsAPI } from '../../../api/config';
import '../orders.css';

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const data = await paymentsAPI.getTransactionHistory({ status: statusFilter });
      setTransactions(data.transactions || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.2rem', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Transaction History
            </h1>
            <p style={{ color: 'var(--ink-soft)' }}>
              Complete record of all your Razorpay test payments and service earnings.
            </p>
          </div>
          <Link to="/orders" className="btn-outline" style={{ padding: '9px 20px', fontSize: '0.85rem' }}>
            ← Back to Orders
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['all', 'successful', 'pending', 'failed'].map(st => (
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
              {st}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>Loading transactions…</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--white)', borderRadius: 6, border: '1.5px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginBottom: 8 }}>No transactions found</h3>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>Payments you make or receive will be tracked here.</p>
            <Link to="/marketplace" className="btn-primary">Browse Marketplace</Link>
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order</th>
                <th>Service</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.payment_id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {tx.razorpay_payment_id || 'Pending'}
                  </td>
                  <td>
                    <Link to={`/orders/${tx.order_id}`} style={{ color: 'var(--blue)', fontWeight: 600 }}>
                      #{tx.order_id}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 600 }}>{tx.service_title}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 3,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: tx.transaction_type === 'credit' ? 'rgba(213,243,106,0.3)' : 'rgba(52,87,255,0.1)',
                      color: tx.transaction_type === 'credit' ? 'var(--ink)' : 'var(--blue)',
                    }}>
                      {tx.transaction_type === 'credit' ? '+ Receive' : '- Paid'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{tx.amount}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{tx.payment_method}</td>
                  <td>
                    <span className={`order-status-badge ${tx.status.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                    {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
