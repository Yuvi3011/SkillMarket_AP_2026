import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marketplaceAPI, reviewsAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import '../marketplace.css';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    async function loadService() {
      try {
        const [data, revs] = await Promise.all([
          marketplaceAPI.getSingleService(id),
          reviewsAPI.getServiceReviews(id).catch(() => ({ reviews: [], averageRating: 0, totalReviews: 0 })),
        ]);
        setService(data.service);
        setReviewsData(revs);
      } catch (err) {
        setError(err.message || 'Service not found.');
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [id]);

  async function handleDelete() {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete this service listing?');
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await marketplaceAPI.deleteService(id);
      navigate('/marketplace');
    } catch (err) {
      alert(err.message || 'Failed to delete service.');
      setDeleting(false);
    }
  }

  function handleOrderClick() {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/checkout/${service.service_id}`);
  }

  if (loading) return <div className="container page-wrap"><div className="spinner" /></div>;
  if (error || !service) {
    return (
      <div className="container page-wrap" style={{ textAlign: 'center', paddingTop: '64px' }}>
        <h2 style={{ fontFamily: 'Space Grotesk' }}>Service Not Found</h2>
        <p style={{ color: 'var(--ink-soft)', margin: '12px 0 24px' }}>
          {error || 'The requested service may have been removed or does not exist.'}
        </p>
        <Link to="/marketplace" className="btn-primary btn-sm">
          ← Return to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = user && user.user_id === service.user_id;
  const sellerInitials = service.full_name
    ? service.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="details-page">
      <div className="container">

        <div className="details-breadcrumb">
          <Link to="/marketplace">Marketplace</Link>
          <span>/</span>
          <Link to={`/marketplace?category_id=${service.category_id}`}>{service.category_name}</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)' }}>{service.title.slice(0, 32)}...</span>
        </div>

        <div className="details-layout">

          <div className="details-main">
            <div className="details-cat-badge">
              <span>{service.category_icon || '💼'}</span>
              <span>{service.category_name}</span>
            </div>

            <h1 className="details-title">{service.title}</h1>

            <div className="details-highlights">
              <div className="highlight-box">
                <div className="hl-label">Starting Price</div>
                <div className="hl-value" style={{ color: 'var(--ink)' }}>₹{service.price}</div>
              </div>
              <div className="highlight-box">
                <div className="hl-label">Estimated Delivery</div>
                <div className="hl-value" style={{ color: 'var(--blue)' }}>⏱️ {service.delivery_time} day{service.delivery_time !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="details-section-title">About This Service</div>
            <div className="details-desc">{service.description}</div>

            <div className="details-section-title">What's Included</div>
            <ul style={{ paddingLeft: '20px', color: 'var(--ink)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <li>Direct 1-on-1 collaboration with student creator</li>
              <li>Source files and full project deliverables included</li>
              <li>Revision support to make sure you are satisfied</li>
              <li>Peer-to-peer affordable campus pricing</li>
            </ul>

            <div className="details-section-title">Published On</div>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
              Listed on {new Date(service.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>

            {/* Member 4: Verified Student Reviews Section */}
            <div className="details-section-title" style={{ marginTop: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Verified Student Reviews ({reviewsData.totalReviews})</span>
              {reviewsData.totalReviews > 0 && (
                <span style={{ color: '#FFB800', fontSize: '1rem', fontWeight: 700 }}>
                  ★ {reviewsData.averageRating} / 5.0
                </span>
              )}
            </div>

            {reviewsData.reviews.length === 0 ? (
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                No reviews yet for this service package. Be the first to order and review!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                {reviewsData.reviews.map(rev => (
                  <div key={rev.review_id} style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 6, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{rev.reviewer_name}</span>
                      <span style={{ color: '#FFB800' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                      "{rev.comment}"
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: 8 }}>
                      {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="details-sidebar">
            
            {/* Order / Pricing Box */}
            <div className="order-box">
              <div className="order-price-row">
                <span className="order-price-title">Service Package</span>
                <span className="order-price-amount">₹{service.price}</span>
              </div>

              <div className="order-features">
                <div className="order-feature-item">
                  <span>⏱️</span>
                  <span><strong>{service.delivery_time} Days</strong> Delivery</span>
                </div>
                <div className="order-feature-item">
                  <span>🔄</span>
                  <span><strong>1 Free Revision</strong> included</span>
                </div>
                <div className="order-feature-item">
                  <span>📁</span>
                  <span>Full source files delivered</span>
                </div>
              </div>

              {inquirySent ? (
                <div className="msg-success" style={{ textAlign: 'center', margin: '0 0 14px' }}>
                  🎉 Inquiry sent to seller! They will be notified via their email ({service.email}).
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-primary order-cta-btn"
                  onClick={handleOrderClick}
                >
                  {isOwner ? 'Your Service Listing' : 'Order Service Now'}
                </button>
              )}

              {/* Owner actions */}
              {isOwner && (
                <div className="owner-actions">
                  <Link
                    to={`/marketplace/edit/${service.service_id}`}
                    className="btn-outline btn-sm"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    ✏️ Edit Service
                  </Link>
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : '🗑️ Delete'}
                  </button>
                </div>
              )}
            </div>

            {/* Seller Summary Box */}
            <div className="seller-box">
              <div className="seller-box-header">
                <div className="seller-box-avatar">{sellerInitials}</div>
                <div>
                  <div className="seller-box-name">{service.full_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--blue)', fontWeight: 600 }}>
                    {service.role_name} on SkillMarket
                  </div>
                </div>
              </div>

              <p className="seller-box-bio">
                {service.bio || 'Student creator on SkillMarket dedicated to delivering high quality work.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                {service.portfolio_url && (
                  <a href={service.portfolio_url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>
                    🔗 Portfolio Website
                  </a>
                )}
                {service.github_url && (
                  <a href={service.github_url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>
                    🔗 GitHub Profile
                  </a>
                )}
                {service.linkedin_url && (
                  <a href={service.linkedin_url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>
                    🔗 LinkedIn Profile
                  </a>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
