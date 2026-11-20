import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            Skill<span>Market</span>
          </Link>

          <div className="nav-main-links">
            <Link to="/marketplace">Explore</Link>
            <Link to="/exchange">Skill Exchange</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/rewards">Rewards</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </div>
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <Link to="/marketplace/create" className="nav-post-btn">
                + Post Service
              </Link>

              <Link to="/my-skills" className="nav-link-item">
                My Skills
              </Link>

              <Link to="/dashboard" className="nav-user-pill" title="Open Dashboard & Profile">
                {user.full_name?.split(' ')[0]?.toUpperCase() || 'USER'}
              </Link>

              <button className="nav-logout" onClick={handleLogout} title="Sign out of SkillMarket">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link-item">Login</Link>
              <Link to="/signup" className="nav-cta">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
