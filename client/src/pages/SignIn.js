import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

const SignIn = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });
      const data = await res.json();
      console.log('Login response:', data);
      if (res.ok) {
        // Set admin status based on backend response
        if (data.isAdmin) {
          localStorage.setItem('isAdmin', 'true');
        } else {
          localStorage.removeItem('isAdmin');
        }
        // Set staff status based on backend response
        console.log('Setting isStaff to:', data.isStaff);
        if (data.isStaff) {
          localStorage.setItem('isStaff', 'true');
        } else {
          localStorage.removeItem('isStaff');
        }
        // Set isUser for any successful login
        localStorage.setItem('isUser', 'true');
        // Store token if provided
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        // Store user data
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
        // Dispatch login event for Navbar update
        window.dispatchEvent(new Event('login'));
        
        // Check if there's a redirect destination
        const redirectTo = location.state?.redirectTo;
        
        // Navigate based on user type and redirect destination
        if (data.isAdmin) {
          navigate(redirectTo || '/admin');
        } else {
          // For regular users, if they came from booking, go to packages page
          if (redirectTo === '/booking') {
            navigate('/services');
          } else {
            navigate(redirectTo || '/');
          }
        }
      } else {
        setError(data.message || 'Sign in failed');
      }
    } catch (err) {
      setError('Network error');
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
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                className="auth-input"
              />
            </div>
            <div className="forgot-password">
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
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
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-link-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 