import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [resetLink, setResetLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5050/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Password reset link generated successfully!');
        setResetLink(data.resetLink);
        setEmail('');
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">📸</span>
            <h1>Global Image</h1>
          </div>
          <h2>Forgot Password</h2>
          <p>Enter your email to reset your password</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success">
            <span className="success-icon">✅</span>
            <p>Password reset link generated successfully!</p>
            {resetLink && (
              <a 
                href={resetLink}
                className="reset-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Click here to reset your password
              </a>
            )}
          </div>
        )}

        {!message ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="auth-submit-btn"
            >
              {loading ? (
                <span className="loading-spinner">⏳</span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="reset-success">
            <div className="success-icon-large">✅</div>
            <h3>Reset Link Sent!</h3>
            <p>We've generated a password reset link for your account.</p>
            {resetLink && (
              <a 
                href={resetLink}
                className="reset-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Click here to reset your password
              </a>
            )}
            <button 
              onClick={() => {
                setMessage(null);
                setResetLink(null);
                setEmail('');
              }}
              className="auth-submit-btn secondary"
            >
              Send Another Reset Link
            </button>
          </div>
        )}

        <div className="auth-footer">
          <p className="auth-link-text">
            Remember your password?{' '}
            <Link to="/signin" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 