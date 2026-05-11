import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaLeaf, FaUser, FaEnvelope, FaLock, 
  FaEye, FaEyeSlash,
  FaStore, FaUserFriends
} from 'react-icons/fa';
import api, { authAPI } from '../services/api';

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'customer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setLoading(true);
    try {
      const { name, email, password, userType } = formData;
      const response = await authAPI.register({ name, email, password, userType });

      const { token, user } = response.data || {};
      if (!token || !user) throw new Error(response.data?.message || 'Registration failed');

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      if (onLogin) onLogin(user);

      if (user.userType === 'farmer') {
        navigate('/farmer-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/\d/)) strength += 25;
    
    return strength;
  };

  const getStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength < 50) return '#f44336';
    if (strength < 75) return '#ff9800';
    return '#4caf50';
  };

  const getStrengthText = () => {
    const strength = getPasswordStrength();
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="register-page">
      <div className="register-container">

        {/* Hidden dummy fields — prevents Chrome autofill on real inputs */}
        <input type="text"     style={{ display: 'none' }} aria-hidden="true" />
        <input type="password" style={{ display: 'none' }} aria-hidden="true" />

        {/* Left Side - Form */}
        <div className="register-form-container">
          <div className="register-header">
            <div className="logo">
              <FaLeaf className="logo-icon" />
              <span className="logo-text">FreshFarm</span>
            </div>
            <h1 className="welcome-text">Create Account 🌱</h1>
            <p className="subtitle">Join our community and start your fresh journey</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form className="register-form" onSubmit={handleSubmit} autoComplete="off">

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="userType">Account Type</label>
              <div className="user-type-selector">
                <label className={`type-option ${formData.userType === 'customer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="userType"
                    value="customer"
                    checked={formData.userType === 'customer'}
                    onChange={handleChange}
                  />
                  <FaUserFriends />
                  <span>Customer</span>
                </label>

                <label className={`type-option ${formData.userType === 'farmer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="userType"
                    value="farmer"
                    checked={formData.userType === 'farmer'}
                    onChange={handleChange}
                  />
                  <FaStore />
                  <span>Farmer</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${getPasswordStrength()}%`,
                        backgroundColor: getStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span className="strength-text" style={{ color: getStrengthColor() }}>
                    {getStrengthText()}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group terms-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>
                  I agree to the <Link to="/terms">Terms of Service</Link> and{' '}
                  <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>
            </div>

            <button type="submit" className="register-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="social-register">
            <div className="divider">
              <span className="line"></span>
              <span className="text">or sign up with</span>
              <span className="line"></span>
            </div>
            <div className="social-buttons"></div>
          </div>

          <p className="login-link">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>

        {/* Right Side - Benefits */}
        <div className="register-benefits">
          <h3>Why Join FreshFarm?</h3>
          
          <div className="benefits-list">
            <div className="benefit-item">
              <div className="benefit-icon">🌱</div>
              <div className="benefit-content">
                <h4>Fresh & Organic</h4>
                <p>Access to the freshest organic produce directly from local farms</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">💰</div>
              <div className="benefit-content">
                <h4>Better Prices</h4>
                <p>Save up to 30% by buying directly from farmers</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">🚚</div>
              <div className="benefit-content">
                <h4>Free Delivery</h4>
                <p>Free delivery on orders above Rs. 1000</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">🌍</div>
              <div className="benefit-content">
                <h4>Sustainable</h4>
                <p>Support eco-friendly farming practices</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">🤝</div>
              <div className="benefit-content">
                <h4>Community</h4>
                <p>Build direct relationships with local farmers</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">⭐</div>
              <div className="benefit-content">
                <h4>Quality Guarantee</h4>
                <p>100% satisfaction guaranteed on all products</p>
              </div>
            </div>
          </div>

          <div className="stats-box">
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Local Farmers</span>
            </div>
            <div className="stat">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Products</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;