import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [stats, setStats] = useState({
    totalGalleries: 0,
    totalServices: 0,
    totalUsers: 0,
    recentGalleries: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const syncAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('storage', syncAdmin);
    window.addEventListener('login', syncAdmin);
    
    if (!isAdmin) {
      navigate('/signin');
      return;
    }

    fetchDashboardStats();
    
    return () => {
      window.removeEventListener('storage', syncAdmin);
      window.removeEventListener('login', syncAdmin);
    };
  }, [isAdmin, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch('http://localhost:5050/api/admin/stats', {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      
      const data = await res.json();
      setStats({
        totalGalleries: data.totalGalleries || 0,
        totalServices: data.totalServices || 0,
        totalUsers: data.totalUsers || 0,
        recentGalleries: data.recentGalleries || 0
      });
    } catch (err) {
      console.error('Dashboard stats error:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };





  const adminActions = [
    {
      title: 'Manage Portfolio',
      description: 'Add, edit, and delete galleries',
      icon: '📸',
      action: () => navigate('/admin/portfolio'),
      color: '#4fc3f7',
      category: 'admin'
    },
    {
      title: 'Manage Services',
      description: 'Add, edit, and delete services',
      icon: '🛠️',
      action: () => navigate('/admin/services'),
      color: '#28a745',
      category: 'admin'
    },
    {
      title: 'Manage Bookings',
      description: 'View and manage customer bookings',
      icon: '📅',
      action: () => navigate('/admin/bookings'),
      color: '#ff9800',
      category: 'admin'
    },
    {
      title: 'Manage Staff',
      description: 'Add, edit, and manage team members',
      icon: '👥',
      action: () => navigate('/admin/staff'),
      color: '#9c27b0',
      category: 'admin'
    },
    {
      title: 'Manage Clients',
      description: 'View and manage registered clients',
      icon: '👤',
      action: () => navigate('/admin/clients'),
      color: '#607d8b',
      category: 'admin'
    },
    {
      title: 'Manage Feedback',
      description: 'Review and respond to customer feedback',
      icon: '💬',
      action: () => navigate('/admin/feedback'),
      color: '#e91e63',
      category: 'admin'
    }
  ];



  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Welcome back, Administrator</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading dashboard...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">📸</div>
              <div className="admin-stat-content">
                <div className="admin-stat-number">{stats.totalGalleries}</div>
                <div className="admin-stat-label">Total Galleries</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">🛠️</div>
              <div className="admin-stat-content">
                <div className="admin-stat-number">{stats.totalServices}</div>
                <div className="admin-stat-label">Total Services</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">📈</div>
              <div className="admin-stat-content">
                <div className="admin-stat-number">{stats.recentGalleries}</div>
                <div className="admin-stat-label">Recent Galleries (30 days)</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">👥</div>
              <div className="admin-stat-content">
                <div className="admin-stat-number">{stats.totalUsers}</div>
                <div className="admin-stat-label">Registered Users</div>
              </div>
            </div>
          </div>

          {/* Admin Management Actions */}
          <div className="admin-section">
            <h2 className="admin-section-title">Admin Management</h2>
            <p className="admin-section-subtitle">Manage your website content and data</p>
            <div className="admin-actions-grid">
              {adminActions.map((action, index) => (
                <div 
                  key={index} 
                  className="admin-action-card"
                  onClick={action.action}
                  style={{ borderLeft: `4px solid ${action.color}` }}
                >
                  <div className="admin-action-icon" style={{ color: action.color }}>
                    {action.icon}
                  </div>
                  <div className="admin-action-content">
                    <h3 className="admin-action-title">{action.title}</h3>
                    <p className="admin-action-description">{action.description}</p>
                  </div>
                  <div className="admin-action-arrow">→</div>
                </div>
              ))}
            </div>
          </div>





          {/* System Information */}
          <div className="admin-section">
            <h2 className="admin-section-title">System Information</h2>
            <div className="admin-system-info">
              <div className="admin-system-item">
                <span className="admin-system-label">Admin Email:</span>
                <span className="admin-system-value">admin@global.com</span>
              </div>
              <div className="admin-system-item">
                <span className="admin-system-label">Last Login:</span>
                <span className="admin-system-value">
                  {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard; 