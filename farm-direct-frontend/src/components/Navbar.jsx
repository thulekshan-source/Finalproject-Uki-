import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaLeaf, FaShoppingCart, FaUser, FaBars, FaTimes, FaSignOutAlt, FaBox } from 'react-icons/fa';

const Navbar = ({ user, onLogout, cartItems }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (['/login', '/register', '/forgot-password', '/checkout', '/farmer-dashboard'].includes(location.pathname)) return null;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleCartClick = () => navigate('/checkout');

  const dashboardLink =
    user?.userType === 'admin' ? '/admin-dashboard' :
    user?.userType === 'farmer' ? '/farmer-dashboard' : '/dashboard';

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        :root {
          --nav-bg: rgba(10, 12, 10, 0.85);
          --nav-bg-scrolled: rgba(8, 10, 8, 0.96);
          --accent: #5CDB6A;
          --accent-dim: rgba(92, 219, 106, 0.15);
          --accent-glow: rgba(92, 219, 106, 0.4);
          --text-primary: #F0F4EE;
          --text-muted: rgba(240, 244, 238, 0.5);
          --border: rgba(255,255,255,0.07);
          --border-hover: rgba(92, 219, 106, 0.3);
          --radius: 14px;
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        /* ── NAVBAR ── */
        .ff-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          padding: 0 24px;
          font-family: var(--font-body);
          transition: background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease;
          background: var(--nav-bg);
          backdrop-filter: blur(18px) saturate(180%);
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          border-bottom: 1px solid var(--border);
        }

        .ff-nav.scrolled {
          background: var(--nav-bg-scrolled);
          box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 1px 0 var(--border);
        }

        .ff-nav-inner {
          max-width: 1280px;
          margin: 0 auto;
          height: 72px;
          display: flex;
          align-items: center;
          gap: 40px;
        }

        /* ── BRAND ── */
        .ff-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-decoration: none;
          flex-shrink: 0;
        }

        .ff-brand-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--accent), #3abf4b);
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-size: 16px;
          color: #fff;
          box-shadow: 0 0 16px var(--accent-glow);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .ff-brand:hover .ff-brand-icon {
          transform: rotate(-8deg) scale(1.08);
          box-shadow: 0 0 28px var(--accent-glow);
        }

        .ff-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .ff-brand-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 17px;
          color: var(--text-primary);
          letter-spacing: -0.3px;
        }

        .ff-brand-sub {
          font-size: 10px;
          font-weight: 300;
          color: var(--accent);
          letter-spacing: 1.4px;
          text-transform: uppercase;
          margin-top: 1px;
        }

        /* ── NAV LINKS ── */
        .ff-links {
          display: flex;
          align-items: center;
          gap: 4px;
          list-style: none;
          margin: 0; padding: 0;
          flex: 1;
        }

        .ff-link-btn {
          background: none;
          border: none;
          padding: 8px 16px;
          font-family: var(--font-body);
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
          letter-spacing: 0.2px;
          position: relative;
        }

        .ff-link-btn::after {
          content: '';
          position: absolute;
          bottom: 4px; left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 16px; height: 2px;
          background: var(--accent);
          border-radius: 2px;
          transition: transform 0.25s ease;
        }

        .ff-link-btn:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.05);
        }

        .ff-link-btn:hover::after {
          transform: translateX(-50%) scaleX(1);
        }

        /* ── ACTIONS ── */
        .ff-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }

        /* Cart */
        .ff-cart-btn {
          position: relative;
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border);
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: var(--text-primary);
          font-size: 15px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }

        .ff-cart-btn:hover {
          background: var(--accent-dim);
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }

        .ff-cart-badge {
          position: absolute;
          top: -5px; right: -5px;
          min-width: 18px; height: 18px;
          background: var(--accent);
          color: #0a0c0a;
          font-size: 10px;
          font-weight: 700;
          border-radius: 9px;
          display: grid;
          place-items: center;
          padding: 0 4px;
          font-family: var(--font-display);
          box-shadow: 0 0 10px var(--accent-glow);
          animation: badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes badgePop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }

        /* User Menu */
        .ff-user-wrap {
          position: relative;
        }

        .ff-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px 6px 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .ff-user-btn:hover {
          background: var(--accent-dim);
          border-color: var(--border-hover);
        }

        .ff-user-avatar {
          width: 26px; height: 26px;
          background: linear-gradient(135deg, var(--accent), #3abf4b);
          border-radius: 7px;
          display: grid;
          place-items: center;
          font-size: 12px;
          color: #fff;
        }

        .ff-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: rgba(14, 18, 14, 0.97);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 6px;
          min-width: 170px;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-6px);
          transition: opacity 0.2s ease, transform 0.2s ease;
          backdrop-filter: blur(20px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ff-user-wrap:hover .ff-dropdown {
          opacity: 1;
          pointer-events: all;
          transform: translateY(0);
        }

        .ff-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          font-family: var(--font-body);
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          transition: color 0.15s, background 0.15s;
        }

        .ff-dropdown-item:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.06);
        }

        .ff-dropdown-item.logout:hover {
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.08);
        }

        /* Auth Buttons */
        .ff-btn-login {
          padding: 8px 18px;
          background: none;
          border: 1px solid var(--border);
          border-radius: 9px;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }

        .ff-btn-login:hover {
          color: var(--text-primary);
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
        }

        .ff-btn-register {
          padding: 8px 18px;
          background: var(--accent);
          border: 1px solid var(--accent);
          border-radius: 9px;
          color: #0a0c0a;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.2s, background 0.2s;
        }

        .ff-btn-register:hover {
          background: #72e87d;
          box-shadow: 0 0 20px var(--accent-glow);
          transform: translateY(-1px);
        }

        /* ── MOBILE TOGGLE ── */
        .ff-mobile-toggle {
          display: none;
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 16px;
          cursor: pointer;
          place-items: center;
          margin-left: auto;
          flex-shrink: 0;
          transition: background 0.2s, border-color 0.2s;
        }

        .ff-mobile-toggle:hover {
          background: var(--accent-dim);
          border-color: var(--border-hover);
        }

        /* ── MOBILE DRAWER ── */
        .ff-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 1100;
          animation: fadeIn 0.25s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .ff-drawer {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: min(340px, 90vw);
          background: rgba(10, 13, 10, 0.98);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          backdrop-filter: blur(30px);
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }

        .ff-drawer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .ff-drawer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 18px;
          color: var(--text-primary);
        }

        .ff-drawer-brand svg {
          color: var(--accent);
          font-size: 20px;
        }

        .ff-drawer-close {
          width: 34px; height: 34px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: color 0.2s, background 0.2s;
        }

        .ff-drawer-close:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.1);
        }

        .ff-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ff-drawer-nav-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 13px 16px;
          background: none;
          border: 1px solid transparent;
          border-radius: 10px;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s, background 0.2s, border-color 0.2s;
          letter-spacing: 0.1px;
        }

        .ff-drawer-nav-btn:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.04);
          border-color: var(--border);
        }

        .ff-drawer-divider {
          height: 1px;
          background: var(--border);
          margin: 12px 0;
        }

        .ff-drawer-user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--accent-dim);
          border: 1px solid var(--border-hover);
          border-radius: 10px;
          margin-bottom: 8px;
        }

        .ff-drawer-user-avatar {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--accent), #3abf4b);
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-size: 14px;
          color: #fff;
          flex-shrink: 0;
        }

        .ff-drawer-user-email {
          font-size: 12px;
          color: var(--text-muted);
          font-family: var(--font-body);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ff-drawer-action {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 13px 16px;
          background: none;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s, background 0.2s, border-color 0.2s;
          margin-top: 4px;
        }

        .ff-drawer-action:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.15);
        }

        .ff-drawer-action.accent {
          background: var(--accent);
          border-color: var(--accent);
          color: #0a0c0a;
          font-weight: 600;
        }

        .ff-drawer-action.accent:hover {
          background: #72e87d;
          border-color: #72e87d;
          color: #0a0c0a;
          box-shadow: 0 0 20px var(--accent-glow);
        }

        .ff-drawer-action.logout:hover {
          color: #ff6b6b;
          background: rgba(255,107,107,0.08);
          border-color: rgba(255,107,107,0.2);
        }

        .ff-drawer-cart {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s, background 0.2s, border-color 0.2s;
          margin-top: 4px;
        }

        .ff-drawer-cart:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
        }

        .ff-drawer-cart-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ff-drawer-badge {
          background: var(--accent);
          color: #0a0c0a;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          font-family: var(--font-display);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .ff-links, .ff-actions { display: none; }
          .ff-mobile-toggle { display: grid; }
        }
      `}</style>

      <nav className={`ff-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="ff-nav-inner">
          {/* Brand */}
          <div className="ff-brand" onClick={() => scrollToSection('home')}>
            <div className="ff-brand-icon">
              <FaLeaf />
            </div>
            <div className="ff-brand-text">
              <span className="ff-brand-name">FreshFarm</span>
              <span className="ff-brand-sub">Direct from Farm</span>
            </div>
          </div>

          {/* Desktop Links */}
          <ul className="ff-links">
            {navItems.map((item) => (
              <li key={item.id}>
                <button className="ff-link-btn" onClick={() => scrollToSection(item.id)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop Actions */}
          <div className="ff-actions">
            <button className="ff-cart-btn" onClick={handleCartClick} title="Cart">
              <FaShoppingCart />
              {cartItems?.length > 0 && (
                <span className="ff-cart-badge">{cartItems.length}</span>
              )}
            </button>

            {user ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Link to={dashboardLink} className="ff-user-btn" style={{ textDecoration: 'none' }}>
                  <div className="ff-user-avatar"><FaUser /></div>
                  <span>{user.name || user.email?.split('@')[0] || 'Dashboard'}</span>
                </Link>
                <Link to="/my-orders" className="ff-user-btn" title="My Orders" style={{ textDecoration: 'none', padding: '10px' }}>
                  <FaBox />
                </Link>
                <button onClick={handleLogout} className="ff-btn-login" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="ff-btn-login">Sign In</Link>
                <Link to="/register" className="ff-btn-register">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="ff-mobile-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="ff-drawer-overlay" onClick={toggleMenu}>
          <div className="ff-drawer" onClick={e => e.stopPropagation()}>
            <div className="ff-drawer-head">
              <div className="ff-drawer-brand">
                <FaLeaf />
                FreshFarm
              </div>
              <button className="ff-drawer-close" onClick={toggleMenu}>
                <FaTimes />
              </button>
            </div>

            <div className="ff-drawer-body">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className="ff-drawer-nav-btn"
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}

              <div className="ff-drawer-divider" />

              <button
                className="ff-drawer-cart"
                onClick={() => { handleCartClick(); setIsMenuOpen(false); }}
              >
                <div className="ff-drawer-cart-left">
                  <FaShoppingCart /> Cart
                </div>
                {cartItems?.length > 0 && (
                  <span className="ff-drawer-badge">{cartItems.length}</span>
                )}
              </button>

              {user ? (
                <>
                  <div className="ff-drawer-user-info">
                    <div className="ff-drawer-user-avatar"><FaUser /></div>
                    <span className="ff-drawer-user-email">{user.email}</span>
                  </div>
                  <Link
                    to={dashboardLink}
                    className="ff-drawer-action"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/my-orders"
                    className="ff-drawer-action"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <button onClick={handleLogout} className="ff-drawer-action logout">
                    <FaSignOutAlt /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="ff-drawer-action"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="ff-drawer-action accent"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;