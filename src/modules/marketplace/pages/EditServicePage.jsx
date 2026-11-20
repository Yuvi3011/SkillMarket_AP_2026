import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marketplaceAPI } from '../../../api/config';
import { useAuth } from '../../auth/context/AuthContext';
import '../marketplace.css';

export default function EditServicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    category_id: '',
    price: '',
    delivery_time: '',
    description: ''
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [catData, servData] = await Promise.all([
          marketplaceAPI.getCategories(),
          marketplaceAPI.getSingleService(id)
        ]);

        setCategories(catData.categories || []);

        const s = servData.service;
        
        if (user && s.user_id !== user.user_id) {
          setError('Unauthorized: You can only edit your own services.');
          setInitialLoading(false);
          return;
        }

        setForm({
          title: s.title || '',
          category_id: String(s.category_id || ''),
          price: String(s.price || ''),
          delivery_time: String(s.delivery_time || ''),
          description: s.description || ''
        });
      } catch (err) {
        setError(err.message || 'Failed to load service details.');
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, [id, user]);

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

    setSaving(true);
    try {
      await marketplaceAPI.updateService(id, {
        title: form.title.trim(),
        category_id: Number(form.category_id),
        price: parseFloat(form.price),
        delivery_time: parseInt(form.delivery_time, 10),
        description: form.description.trim()
      });

      setSuccess('Service updated successfully!');
      setTimeout(() => {
        navigate(`/marketplace/services/${id}`);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to update service.');
    } finally {
      setSaving(false);
    }
  }

  if (initialLoading) return <div className="container page-wrap"><div className="spinner" /></div>;

  return (
    <div className="service-form-page">
      <div className="container">
        
        <div className="service-form-header">
          <Link to={`/marketplace/services/${id}`} style={{ color: 'var(--blue)', fontSize: '0.88rem', fontWeight: 600 }}>
            ← Back to Service Details
          </Link>
          <h1 style={{ marginTop: '12px' }}>Edit Service Listing</h1>
          <p>Update your pricing, delivery timeline, or project specifications.</p>
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
                placeholder="e.g. I will design a modern logo for your startup"
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select name="category_id" value={form.category_id} onChange={handleChange}>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_icon} {cat.category_name}
                  </option>
                ))}
              </select>
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
              />
            </div>

            <div className="form-actions">
              <button className="btn-primary" disabled={saving}>
                {saving ? 'Saving Changes…' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate(`/marketplace/services/${id}`)}
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
