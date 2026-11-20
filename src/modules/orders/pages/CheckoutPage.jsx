import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marketplaceAPI, ordersAPI, paymentsAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import '../orders.css';

export default function CheckoutPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [processing, setProcessing] = useState(false);

  const [simPayment, setSimPayment] = useState(null);
  const [simStep, setSimStep]       = useState('idle');

  const demoCard = { number: '4111 1111 1111 1111', expiry: '12/26', cvv: '123' };

  useEffect(() => {
    async function loadService() {
      try {
        const data = await marketplaceAPI.getSingleService(serviceId);
        setService(data.service);
      } catch (err) {
        setError(err.message || 'Service not found.');
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [serviceId]);

  async function handlePayment() {
    setProcessing(true);
    setError('');

    try {
      
      const orderRes = await ordersAPI.createOrder({ service_id: service.service_id });
      const order = orderRes.order;

      const paymentOrder = await paymentsAPI.createRazorpayOrder({ order_id: order.order_id });

      const isRealKey =
        paymentOrder.key_id &&
        paymentOrder.key_id.startsWith('rzp_test_') &&
        !paymentOrder.key_id.toLowerCase().includes('mock') &&
        !paymentOrder.key_id.toLowerCase().includes('fake') &&
        !paymentOrder.key_id.toLowerCase().includes('demo');

      if (isRealKey && typeof window.Razorpay !== 'undefined') {
        const options = {
          key: paymentOrder.key_id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: 'SkillMarket',
          description: `Payment for ${service.title}`,
          order_id: paymentOrder.razorpay_order_id,
          handler: async function (response) {
            try {
              await paymentsAPI.verifyPayment({
                order_id: order.order_id,
                razorpay_order_id: response.razorpay_order_id || paymentOrder.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              navigate('/payment/status', {
                state: {
                  status: 'success',
                  order_id: order.order_id,
                  payment_id: response.razorpay_payment_id,
                  amount: service.price,
                  service_title: service.title,
                },
              });
            } catch (vErr) {
              navigate('/payment/status', {
                state: {
                  status: 'failed',
                  order_id: order.order_id,
                  error: vErr.message || 'Payment verification failed',
                },
              });
            }
          },
          prefill: { name: user?.full_name || '', email: user?.email || '' },
          theme: { color: '#171918' },
          modal: { ondismiss: () => setProcessing(false) },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          navigate('/payment/status', {
            state: {
              status: 'failed',
              order_id: order.order_id,
              error: response.error?.description || 'Payment failed or cancelled.',
            },
          });
        });
        rzp.open();
      } else {
        
        setSimPayment({ order, paymentOrder });
        setSimStep('form');
        setProcessing(false);
      }
    } catch (err) {
      setError(err.message || 'Could not initiate checkout.');
      setProcessing(false);
    }
  }

  async function handleSimulatedPay() {
    if (!simPayment) return;
    setSimStep('verifying');

    try {
      const mockPaymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const mockSignature = 'sig_demo_' + Math.random().toString(36).substring(2, 14);

      await paymentsAPI.verifyPayment({
        order_id: simPayment.order.order_id,
        razorpay_order_id: simPayment.paymentOrder.razorpay_order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });

      setSimStep('done');

      setTimeout(() => {
        navigate('/payment/status', {
          state: {
            status: 'success',
            order_id: simPayment.order.order_id,
            payment_id: mockPaymentId,
            amount: service.price,
            service_title: service.title,
          },
        });
      }, 1200);
    } catch (err) {
      setSimStep('form');
      setError(err.message || 'Simulated payment verification failed.');
    }
  }

  if (loading)
    return (
      <div className="container" style={{ padding: 80, textAlign: 'center' }}>
        Loading service checkout…
      </div>
    );

  if (simStep === 'form' || simStep === 'verifying' || simStep === 'done') {
    return (
      <div style={{ padding: '48px 0 80px' }}>
        <div className="container" style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--blue)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: '1rem',
            }}>
              💳
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem' }}>
                SkillMarket · Secure Checkout
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                Demo Test Mode — No real payment processed
              </div>
            </div>
          </div>

          <div className="checkout-box">
            <div style={{
              background: 'var(--blue)', color: '#fff', borderRadius: 6,
              padding: '16px 20px', marginBottom: 24,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Payable</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 700 }}>
                  ₹{service?.price}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.78rem', opacity: 0.8 }}>
                <div>Order #{simPayment?.order?.order_id}</div>
                <div>{service?.title}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Card Number
              </label>
              <input
                readOnly
                value={demoCard.number}
                style={{
                  width: '100%', padding: '12px 14px', marginTop: 6,
                  border: '1.5px solid var(--border)', borderRadius: 4,
                  fontFamily: 'Space Grotesk', fontSize: '1rem', letterSpacing: '0.08em',
                  background: 'var(--paper)', color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Expiry Date
                </label>
                <input
                  readOnly
                  value={demoCard.expiry}
                  style={{
                    width: '100%', padding: '12px 14px', marginTop: 6,
                    border: '1.5px solid var(--border)', borderRadius: 4,
                    fontFamily: 'DM Sans', fontSize: '1rem',
                    background: 'var(--paper)', color: 'var(--ink)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  CVV
                </label>
                <input
                  readOnly
                  value={demoCard.cvv}
                  style={{
                    width: '100%', padding: '12px 14px', marginTop: 6,
                    border: '1.5px solid var(--border)', borderRadius: 4,
                    fontFamily: 'DM Sans', fontSize: '1rem',
                    background: 'var(--paper)', color: 'var(--ink)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(255,112,79,0.1)', border: '1px solid var(--coral)',
                color: 'var(--coral)', padding: '12px 16px', borderRadius: 4, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <div style={{
              background: 'rgba(213,243,106,0.15)', border: '1px solid rgba(213,243,106,0.4)',
              borderRadius: 4, padding: '10px 14px', marginBottom: 20, fontSize: '0.8rem',
            }}>
              🧪 <strong>Test Mode:</strong> Pre-filled demo card details. Click below to complete test payment.
            </div>

            {simStep === 'done' ? (
              <div style={{
                textAlign: 'center', padding: '20px 0',
                color: 'var(--blue)', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem',
              }}>
                ✅ Payment Successful! Redirecting…
              </div>
            ) : (
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '15px', fontSize: '1.05rem', textAlign: 'center' }}
                onClick={handleSimulatedPay}
                disabled={simStep === 'verifying'}
              >
                {simStep === 'verifying' ? '⏳ Verifying Payment…' : `✅ Complete Test Payment · ₹${service?.price}`}
              </button>
            )}

            <button
              onClick={() => { setSimStep('idle'); setSimPayment(null); }}
              style={{
                width: '100%', marginTop: 12, padding: '10px',
                background: 'transparent', border: '1.5px solid var(--border)',
                borderRadius: 4, cursor: 'pointer', color: 'var(--ink-soft)',
                fontSize: '0.9rem',
              }}
              disabled={simStep === 'verifying' || simStep === 'done'}
            >
              ← Back to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 680 }}>
        <Link
          to={`/marketplace/services/${serviceId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-soft)', fontSize: '0.88rem', marginBottom: 28 }}
        >
          ← Back to Service Details
        </Link>

        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.4rem', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Checkout
        </h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
          Review your order details and complete payment.
        </p>

        {error && (
          <div style={{
            background: 'rgba(255, 112, 79, 0.1)', border: '1px solid var(--coral)',
            color: 'var(--coral)', padding: '14px 18px', borderRadius: 4, marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        {service && (
          <div className="checkout-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span className="order-status-badge in-progress" style={{ marginBottom: 8 }}>
                  Service Package
                </span>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', marginTop: 6 }}>{service.title}</h2>
                <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginTop: 4 }}>
                  Provided by <strong>{service.full_name}</strong>
                </div>
              </div>
            </div>

            <div className="checkout-row">
              <span style={{ color: 'var(--ink-soft)' }}>Delivery Time</span>
              <span><strong>{service.delivery_time} Days</strong></span>
            </div>

            <div className="checkout-row">
              <span style={{ color: 'var(--ink-soft)' }}>Service Price</span>
              <span>₹{service.price}</span>
            </div>

            <div className="checkout-row">
              <span style={{ color: 'var(--ink-soft)' }}>Platform Fee</span>
              <span style={{ color: 'var(--blue)' }}>₹0 (Free)</span>
            </div>

            <div className="checkout-row total">
              <span>Final Payable Amount</span>
              <span style={{ color: 'var(--ink)' }}>₹{service.price}</span>
            </div>

            <div style={{
              background: 'rgba(213, 243, 106, 0.15)', border: '1px solid rgba(213, 243, 106, 0.4)',
              borderRadius: 4, padding: '14px', margin: '24px 0', fontSize: '0.85rem',
            }}>
              🔒 <strong>Demo Test Mode:</strong> No real money charged. Fast checkout simulation enabled.
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '15px', fontSize: '1.05rem', textAlign: 'center' }}
              onClick={handlePayment}
              disabled={processing || Boolean(error)}
            >
              {processing ? '⏳ Setting up checkout…' : `Proceed to Pay ₹${service.price}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
