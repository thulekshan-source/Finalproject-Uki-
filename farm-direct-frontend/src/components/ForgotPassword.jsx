import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-password-page">
        <div className="success-container">
          <div className="success-icon">
            <FaCheckCircle />
          </div>
          <h2>Check Your Email</h2>
          <p className="success-message">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <p className="instructions">
            Please check your email and click the link to reset your password.
            The link will expire in 1 hour.
          </p>
          <div className="success-actions">
            <Link to="/login" className="back-to-login">
              <FaArrowLeft /> Back to Login
            </Link>
            <p className="resend">
              Didn't receive the email?{' '}
              <button onClick={() => setSuccess(false)} className="resend-link">
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <div className="logo">
            <span className="logo-text">FreshFarm</span>
          </div>
          <h1>Reset Password</h1>
          <p className="subtitle">
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>

        <form className="forgot-password-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span className="error-icon"></span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FaEnvelope className="input-icon" />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="reset-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="loading">
                <span className="spinner"></span>
                Sending...
              </span>
            ) : (
              'Send Reset Instructions'
            )}
          </button>

          <div className="forgot-password-footer">
            <Link to="/login" className="back-link">
              <FaArrowLeft /> Back to Login
            </Link>
            <p className="remembered">
              Remembered your password?{' '}
              <Link to="/login" className="login-link">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;