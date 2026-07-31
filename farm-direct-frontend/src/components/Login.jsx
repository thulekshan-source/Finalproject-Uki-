import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLeaf, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight } from 'react-icons/fa';
import { authAPI } from '../services/api';
import '../styles/Login.css';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Floating produce items for the visual panel
  const floatingItems = ['🥕', '🍅', '🥦', '🌽', '🍋', '🫐', '🍓', '🥬'];

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData.email, formData.password);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (onLogin) onLogin(user);

      if (user.userType === 'admin') navigate('/admin-dashboard');
      else if (user.userType === 'farmer') navigate('/farmer-dashboard');
      else navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background pattern */}
      <div className="login-bg-pattern" />

      <div className="login-container">
        {/* ── Left: Form Panel ── */}
        <div className="login-form-panel">
          <div className="login-form-inner">
            {/* Logo */}
            <div className="login-logo">
              <div className="login-logo-icon">
                <FaLeaf />
              </div>
              <span className="login-logo-text">FreshFarm</span>
            </div>

            {/* Header */}
            <div className="login-header">
              <h1 id="login-heading">Welcome Back</h1>
              <p className="login-subtitle">Sign in to access your local harvest</p>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error" role="alert">
                <span className="login-error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Hidden dummy fields — tricks Chrome into not autofilling the real inputs */}
            <input type="text" style={{ display: 'none' }} aria-hidden="true" />
            <input type="password" style={{ display: 'none' }} aria-hidden="true" />

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
              {/* Email */}
              <div className={`login-field ${focusedField === 'email' ? 'focused' : ''} ${formData.email ? 'has-value' : ''}`}>
                <label htmlFor="login-email">
                  <FaEnvelope className="login-field-icon" />
                  Email Address
                </label>
                <div className="login-input-wrapper">
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    placeholder="you@example.com"
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`login-field ${focusedField === 'password' ? 'focused' : ''} ${formData.password ? 'has-value' : ''}`}>
                <label htmlFor="login-password">
                  <FaLock className="login-field-icon" />
                  Password
                </label>
                <div className="login-input-wrapper">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    placeholder="••••••••"
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="login-options">
                <label className="login-remember">
                  <input type="checkbox" />
                  <span className="login-checkbox-custom" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="login-forgot-link" id="forgot-password-link">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" className="login-submit-btn" id="login-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="login-loading">
                    <span className="login-spinner" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <FaArrowRight className="login-btn-arrow" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="login-divider">
              <span className="login-divider-line" />
              <span className="login-divider-text">or</span>
              <span className="login-divider-line" />
            </div>

            {/* Sign up link */}
            <p className="login-signup-text">
              Don't have an account?{' '}
              <Link to="/register" className="login-signup-link" id="signup-link">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* ── Right: Visual Panel ── */}
        <div className="login-visual-panel">
          {/* Floating produce */}
          {floatingItems.map((emoji, i) => (
            <span
              key={i}
              className="login-floating-item"
              style={{
                left: `${8 + (i % 4) * 24}%`,
                top: `${10 + Math.floor(i / 4) * 45}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${4 + (i % 3)}s`,
              }}
            >
              {emoji}
            </span>
          ))}

          <div className="login-visual-content">
            <div className="login-visual-badge">
              <span className="login-badge-dot" />
              Farm to Table
            </div>

            <h2 className="login-visual-heading">
              Fresh From<br />
              <em>Local Farms</em><br />
              To Your Table
            </h2>

            <p className="login-visual-desc">
              Connect directly with local farmers for the freshest organic produce.
              No middlemen — just pure, farm-fresh goodness.
            </p>

            {/* Stats */}
            <div className="login-visual-stats">
              <div className="login-stat">
                <span className="login-stat-num">240+</span>
                <span className="login-stat-label">Local Farms</span>
              </div>
              <div className="login-stat-divider" />
              <div className="login-stat">
                <span className="login-stat-num">1.2k</span>
                <span className="login-stat-label">Products</span>
              </div>
              <div className="login-stat-divider" />
              <div className="login-stat">
                <span className="login-stat-num">98%</span>
                <span className="login-stat-label">Satisfaction</span>
              </div>
            </div>

            {/* Testimonial card */}
            <div className="login-testimonial">
              <div className="login-testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p>"The freshest produce I've ever had. Direct from the farm to my kitchen!"</p>
              <div className="login-testimonial-author">
                <div className="login-testimonial-avatar">🧑‍🌾</div>
                <div>
                  <strong>Happy Customer</strong>
                  <span>Verified Buyer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}