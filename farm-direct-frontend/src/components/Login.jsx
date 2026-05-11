import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { authAPI } from '../services/api';


export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const msg = err.response?.data?.message || 'Login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dhoni">
      <h3>fresh farm</h3>
      <h1>Welcome back</h1>
      <h6 className="p">sign in to your account</h6>

      {/* Hidden dummy fields — tricks Chrome into not autofilling the real inputs */}
      <input type="text"     style={{ display: 'none' }} aria-hidden="true" />
      <input type="password" style={{ display: 'none' }} aria-hidden="true" />

      <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
        {error && <div className="error-message">{error}</div>}

        <div className="virat">
          <label htmlFor="email">Email address</label><br />
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            placeholder="Enter your email"
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="sanga">
          <label htmlFor="password">Password</label><br />
          <div className="password-input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              className="A"
              value={formData.password}
              placeholder="••••••••"
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
          </div>
        </div>

        <div className="nolan">
          <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
        </div>

        <div className="dube">
          <button type="submit" className="hi" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        <p className="thala">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>

      </form>
    </div>
  );
}