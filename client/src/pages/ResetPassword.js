import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './Auth.css';

const ResetPassword = () => {
  const [form, setForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [validToken, setValidToken] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Token from URL params:', token);
    // Validate the reset token
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Invalid reset link - missing token');
      return;
    }

    try {
      console.log('Validating token:', token);
      const res = await fetch(`http://localhost:5050/api/auth/validate-reset-token/${token}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Token validation response:', data);
      
      if (data.valid) {
        setValidToken(true);
      } else {
        setError(data.message || 'Invalid or expired reset link');
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5050/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: form.password
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Password reset successfully! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  if (!validToken && !error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-loading">
            <span className="loading-spinner">⏳</span>
            <p>Validating reset link...</p>
            <p style={{fontSize: '12px', color: '#666'}}>Token: {token}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">📸</span>
            <h1>Global Image</h1>
          </div>
          <h2>Reset Password</h2>
          <p>Enter your new password</p>
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
            {message}
          </div>
        )}

        {validToken && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your new password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
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
                'Reset Password'
              )}
            </button>
          </form>
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

export default ResetPassword; 