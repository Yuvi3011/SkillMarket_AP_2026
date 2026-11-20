import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { marketplaceAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import ServiceCard from '../components/ServiceCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import '../marketplace.css';

export default function ExploreServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const initialCategory = searchParams.get('category_id') || 'all';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'newest';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortOption, setSortOption] = useState(initialSort);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await marketplaceAPI.getCategories();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err.message);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, sortOption]);

  async function fetchServices(searchOverride) {
    setLoading(true);
    setError('');

    const searchToUse = searchOverride !== undefined ? searchOverride : searchTerm;

    try {
      const data = await marketplaceAPI.getAllServices({
        category_id: selectedCategory,
        search: searchToUse,
        sort: sortOption
      });
      setServices(data.services || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch services.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    
    const params = ;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (selectedCategory !== 'all') params.category_id = selectedCategory;
    if (sortOption !== 'newest') params.sort = sortOption;
    setSearchParams(params);

    fetchServices(searchTerm.trim());
  }

  function handleCategorySelect(catId) {
    setSelectedCategory(catId);
    const params = ;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (catId !== 'all') params.category_id = catId;
    if (sortOption !== 'newest') params.sort = sortOption;
    setSearchParams(params);
  }

  function handleSortChange(e) {
    const val = e.target.value;
    setSortOption(val);
    const params = ;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (selectedCategory !== 'all') params.category_id = selectedCategory;
    if (val !== 'newest') params.sort = val;
    setSearchParams(params);
  }

  function handleResetFilters() {
    setSelectedCategory('all');
    setSearchTerm('');
    setSortOption('newest');
    setSearchParams();
    fetchServices('');
  }

  return (
    <div className="explore-page">
      <div className="container">

        <div className="explore-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Explore Services</h1>
            <p>Browse skilled student offerings or search for your custom task</p>
          </div>
          <Link to="/marketplace/create" className="btn-primary btn-sm">
            + Post a Service
          </Link>
        </div>

        <div className="explore-toolbar">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              if (val === '') fetchServices('');
            }}
            onSubmit={handleSearchSubmit}
          />

          <div className="sort-wrap">
            <label className="sort-label">Sort by:</label>
            <select className="sort-select" value={sortOption} onChange={handleSortChange}>
              <option value="newest">✨ Newest First</option>
              <option value="price_asc">💰 Price: Low to High</option>
              <option value="price_desc">💎 Price: High to Low</option>
              <option value="delivery_fastest">⚡ Fastest Delivery</option>
            </select>
          </div>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {error && <div className="msg-error">{error}</div>}

        {loading ? (
          <div className="spinner" />
        ) : services.length === 0 ? (
          <div className="services-empty">
            <div className="icon">🔍</div>
            <h3>No services found</h3>
            <p>We couldn't find any services matching your current filters or search terms.</p>
            <button type="button" className="btn-outline btn-sm" onClick={handleResetFilters}>
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard key={service.service_id} service={service} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
