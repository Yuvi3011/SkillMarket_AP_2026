import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { marketplaceAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import '../marketplace.css';

export default function CreateServicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    category_id: '',
    price: '',
    delivery_time: '2',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await marketplaceAPI.getCategories();
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setForm(prev => ({ ...prev, category_id: String(data.categories[0].category_id) }));
        }
      } catch (err) {
        setError('Failed to load categories.');
      } finally {
        setCatLoading(false);
      }
    }
    loadCategories();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!form.title.trim()) return 'Service title is required.';
    if (form.title.trim().length < 8) return 'Service title should be at least 8 characters.';
    if (!form.category_id) return 'Please select a valid category.';
    if (!form.price || parseFloat(form.price) < 1) return 'Price must be greater than 0.';
    if (!form.delivery_time || parseInt(form.delivery_time, 10) < 1) return 'Delivery time must be at least 1 day.';
    if (!form.description.trim() || form.description.trim().length < 20) {
      return 'Please write a descriptive overview (at least 20 characters).';
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const data = await marketplaceAPI.createService({
        title: form.title.trim(),
        category_id: Number(form.category_id),
        price: parseFloat(form.price),
        delivery_time: parseInt(form.delivery_time, 10),
        description: form.description.trim()
      });

      setSuccess('Service created successfully!');
      setTimeout(() => {
        navigate(`/marketplace/services/${data.service.service_id}`);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to create service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="service-form-page">
      <div className="container">
        
        <div className="service-form-header">
          <Link to="/marketplace" style={{ color: 'var(--blue)', fontSize: '0.88rem', fontWeight: 600 }}>
            ← Back to Marketplace
          </Link>
          <h1 style={{ marginTop: '12px' }}>Post a New Service</h1>
          <p>List your technical, creative, or academic skills for other students to hire.</p>
        </div>

        <div className="form-card" style={{ maxWidth: '720px' }}>
          {error && <div className="msg-error">{error}</div>}
          {success && <div className="msg-success">{success}</div>}

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Service Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. I will design a modern logo & brand identity for your project"
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                Keep it concise and clear about what you deliver.
              </span>
            </div>

            <div className="form-group">
              <label>Category *</label>
              {catLoading ? (
                <div style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>Loading categories...</div>
              ) : (
                <select name="category_id" value={form.category_id} onChange={handleChange}>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_icon} {cat.category_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Starting Price (₹) *</label>
                <input
                  name="price"
                  type="number"
                  min="1"
                  step="1"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                />
              </div>

              <div className="form-group">
                <label>Delivery Time (Days) *</label>
                <input
                  name="delivery_time"
                  type="number"
                  min="1"
                  max="60"
                  value={form.delivery_time}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Description *</label>
              <textarea
                name="description"
                rows={6}
                value={form.description}
                onChange={handleChange}
                placeholder="Explain what is included in this service, your workflow, tools you use, and what deliverables the buyer will receive..."
              />
            </div>

            <div className="form-actions">
              <button className="btn-primary" disabled={loading}>
                {loading ? 'Publishing…' : 'Publish Service Listing'}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate('/marketplace')}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
