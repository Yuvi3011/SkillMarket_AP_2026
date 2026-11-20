import { Link } from 'react-router-dom';

export default function ServiceCard({ service }) {
  const {
    service_id,
    title,
    description,
    price,
    delivery_time,
    category_name,
    category_icon,
    full_name
  } = service;

  const initials = full_name
    ? full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <Link to={`/marketplace/services/${service_id}`} className="service-card">
      <div className="service-card-header">
        <span className="service-card-cat">
          <span>{category_icon || '💼'}</span> {category_name}
        </span>
        <span className="service-card-delivery">
          ⏱️ {delivery_time} day{delivery_time !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="service-card-body">
        <h3 className="service-card-title">{title}</h3>
        <p className="service-card-desc">{description}</p>
      </div>

      <div className="service-card-footer">
        <div className="service-seller-info">
          <div className="service-seller-avatar">{initials}</div>
          <span className="service-seller-name">{full_name}</span>
        </div>
        <div className="service-price-tag">
          <div className="service-price-label">Starting at</div>
          <div className="service-price-val">₹{price}</div>
        </div>
      </div>
    </Link>
  );
}
