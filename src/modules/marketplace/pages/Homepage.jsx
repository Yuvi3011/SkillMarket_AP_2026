import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import ServiceCard from '../components/ServiceCard';
import '../marketplace.css';

export default function Homepage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickSearch, setQuickSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [catData, servData] = await Promise.all([
          marketplaceAPI.getCategories(),
          marketplaceAPI.getAllServices({ sort: 'newest' })
        ]);
        setCategories(catData.categories || []);
        setFeaturedServices(servData.services?.slice(0, 6) || []);
      } catch (err) {
        console.error('Homepage load error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      navigate('/marketplace');
    }
  }

  return (
    <div className="market-home">
      
      <section className="market-hero">
        <div className="container">
          <div className="market-hero-inner">
            <div>
              <div className="market-hero-badge">🎓 Student Service Marketplace</div>
              <h1>
                Turn student skills into <span>real-world work.</span>
              </h1>
              <p>
                Discover talented university creators, commission student developers and designers, or offer your own services to earn on campus.
              </p>

              <form onSubmit={handleSearchSubmit} style={{ maxWidth: '480px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="search-input"
                    style={{ background: '#ffffff', color: '#171918' }}
                    placeholder="Try 'Web dev', 'Logo design', 'Python'..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" style={{ background: 'var(--lime)', color: 'var(--ink)', borderColor: 'var(--lime)', whiteSpace: 'nowrap' }}>
                    Search
                  </button>
                </div>
              </form>

              <div className="market-hero-actions">
                <Link to="/marketplace" className="btn-primary" style={{ background: 'var(--blue)', borderColor: 'var(--blue)' }}>
                  Browse All Services →
                </Link>
                {user ? (
                  <Link to="/marketplace/create" className="btn-outline" style={{ borderColor: 'var(--paper)', color: 'var(--paper)' }}>
                    + Post a Service
                  </Link>
                ) : (
                  <Link to="/signup" className="btn-outline" style={{ borderColor: 'var(--paper)', color: 'var(--paper)' }}>
                    Join as Seller
                  </Link>
                )}
              </div>
            </div>

            <div className="market-hero-stats">
              <div className="market-hero-stat-item">
                <div className="num">100%</div>
                <div className="lbl">Student Verified</div>
              </div>
              <div className="market-hero-stat-item">
                <div className="num">{categories.length || '8'}</div>
                <div className="lbl">Skill Categories</div>
              </div>
              <div className="market-hero-stat-item">
                <div className="num">₹0</div>
                <div className="lbl">Platform Commission</div>
              </div>
              <div className="market-hero-stat-item">
                <div className="num">24/7</div>
                <div className="lbl">Campus Collaboration</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-title-wrap">
          <div>
            <h2>Explore by Category</h2>
            <p>Find peer talent tailored to your project requirements</p>
          </div>
          <Link to="/marketplace" style={{ color: 'var(--blue)', fontWeight: 600, fontSize: '0.9rem' }}>
            View all categories →
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((cat) => (
            <Link
              key={cat.category_id}
              to={`/marketplace?category_id=${cat.category_id}`}
              className="category-card"
            >
              <div className="category-card-icon">{cat.category_icon || '💼'}</div>
              <div className="category-card-name">{cat.category_name}</div>
              <div className="category-card-desc">{cat.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container" style={{ marginTop: '20px' }}>
        <div className="section-title-wrap">
          <div>
            <h2>Trending Student Services</h2>
            <p>Recently published services from student freelancers</p>
          </div>
          <Link to="/marketplace" style={{ color: 'var(--blue)', fontWeight: 600, fontSize: '0.9rem' }}>
            See all services ({featuredServices.length}+) →
          </Link>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : featuredServices.length === 0 ? (
          <div className="services-empty">
            <div className="icon">🚀</div>
            <h3>No services posted yet</h3>
            <p>Be the very first student to list a service on SkillMarket!</p>
            <Link to="/marketplace/create" className="btn-primary btn-sm">
              + Post First Service
            </Link>
          </div>
        ) : (
          <div className="services-grid">
            {featuredServices.map((service) => (
              <ServiceCard key={service.service_id} service={service} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
