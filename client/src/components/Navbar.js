import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../GI_logo.png';

const Navbar = () => {
  const [authState, setAuthState] = useState({
    isAdmin: localStorage.getItem('isAdmin') === 'true',
    isUser: localStorage.getItem('isUser') === 'true',
    isStaff: localStorage.getItem('isStaff') === 'true'
  });
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const syncAuth = () => {
      setAuthState({
        isAdmin: localStorage.getItem('isAdmin') === 'true',
        isUser: localStorage.getItem('isUser') === 'true',
        isStaff: localStorage.getItem('isStaff') === 'true'
      });
    };
    window.addEventListener('storage', syncAuth);
    window.addEventListener('login', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('login', syncAuth);
    };
  }, []);

  const fetchAllNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [clientRes, feedbackRes, portfolioRes] = await Promise.all([
        fetch('http://localhost:5050/api/admin/notifications', { headers }),
        fetch('http://localhost:5050/api/feedback/notifications', { headers }),
        fetch('http://localhost:5050/api/gallery/notifications', { headers })
      ]);

      let allNotifications = [];
      
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        if (clientData.success) allNotifications.push(...clientData.notifications);
      }
      
      if (authState.isAdmin) {
        try {
          const serviceResponse = await fetch('http://localhost:5050/api/services/notifications', {
            headers: {
              'Content-Type': 'application/json',
              ...headers
            }
          });
          
          if (serviceResponse.ok) {
            const serviceData = await serviceResponse.json();
            if (serviceData.success) {
              allNotifications = [...allNotifications, ...serviceData.notifications];
            }
          }
        } catch (err) {
          console.error('Failed to fetch service notifications:', err);
        }

        // Staff assignment notifications removed - only shown in StaffAdmin page
      }
      
      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        if (feedbackData.success) allNotifications.push(...feedbackData.notifications);
      }
      
      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        if (portfolioData.success) allNotifications.push(...portfolioData.notifications);
      }

      // Filter unread notifications
      const unreadNotifications = allNotifications.filter(n => !n.read);
      setNotifications(unreadNotifications);
      setNotificationCount(unreadNotifications.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [authState.isAdmin]);

  const fetchUserNotifications = useCallback(async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = userData.id;
      
      console.log('Fetching user notifications for userId:', userId);

      // Fetch user-specific notifications (bookings, services, gallery, etc.)
      const [bookingRes, galleryRes, serviceRes] = await Promise.all([
        fetch(`http://localhost:5050/api/bookings/user/${userId}/notifications`).catch(() => ({ ok: false })),
        fetch('http://localhost:5050/api/gallery/notifications').catch(() => ({ ok: false })),
        fetch('http://localhost:5050/api/services/notifications').catch(() => ({ ok: false }))
      ]);

      let allNotifications = [];
      
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        console.log('Booking notifications:', bookingData);
        if (bookingData.success) allNotifications.push(...bookingData.notifications);
      }
      
      if (galleryRes.ok) {
        const galleryData = await galleryRes.json();
        console.log('Gallery notifications:', galleryData);
        if (galleryData.success) allNotifications.push(...galleryData.notifications);
      }
      
      if (serviceRes.ok) {
        const serviceData = await serviceRes.json();
        console.log('Service notifications:', serviceData);
        if (serviceData.success) allNotifications.push(...serviceData.notifications);
      }

      console.log('All notifications combined:', allNotifications);

      // Filter unread notifications
      const unreadNotifications = allNotifications.filter(n => !n.read);
      console.log('Unread notifications:', unreadNotifications);
      
      setNotifications(unreadNotifications);
      setNotificationCount(unreadNotifications.length);
    } catch (error) {
      console.error('Failed to fetch user notifications:', error);
    }
  }, []);

  // Fetch all notifications for admin and users
  useEffect(() => {
    if (authState.isAdmin) {
      fetchAllNotifications();
    } else if (authState.isUser) {
      fetchUserNotifications();
    }
  }, [authState.isAdmin, authState.isUser, fetchAllNotifications, fetchUserNotifications]);

  const dismissUserNotification = async (notification) => {
    try {
      let endpoint = '';
      
      // Determine the correct endpoint based on notification type
      if (notification.type === 'service_added') {
        endpoint = `http://localhost:5050/api/services/notifications/${notification._id}/read`;
      } else if (notification.type === 'gallery_updated') {
        endpoint = `http://localhost:5050/api/gallery/notifications/${notification._id}/read`;
      // Staff assignment notifications handled in StaffAdmin page only
      } else if (notification.type === 'booking_confirmed' || notification.type === 'booking_updated') {
        endpoint = `http://localhost:5050/api/bookings/notifications/${notification._id}/read`;
      }

      if (endpoint) {
        await fetch(endpoint, { method: 'POST' });
      }

      // Remove notification from local state
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      setNotificationCount(prev => Math.max(0, prev - 1));
      
      // Close dropdown if no notifications left
      if (notifications.length <= 1) {
        setShowNotificationDropdown(false);
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isUser');
    localStorage.removeItem('isStaff');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setAuthState({ isAdmin: false, isUser: false, isStaff: false });
    setShowProfileDropdown(false);
    window.dispatchEvent(new Event('login'));
    navigate('/');
  };

  const handleGalleryManagement = () => {
    setShowProfileDropdown(false);
    navigate('/gallery-management');
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleProfilePage = () => {
    setShowProfileDropdown(false);
    navigate('/profile');
  };

  // Check if we're on admin pages (for future use)
  // const isAdminPage = location.pathname.startsWith('/admin');
  // const isPortfolioPage = location.pathname === '/portfolio';
  // const isServicesPage = location.pathname === '/services';

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src={logo} alt="Global Image Logo" className="navbar-logo-img" />
        <span className="navbar-logo-text">Global Image</span>
      </div>
      
      <ul className="navbar-links">
        {authState.isAdmin ? (
          // Admin Navigation
          <>
            <li><Link to="/admin">ADMIN DASHBOARD</Link></li>
            <li><Link to="/admin/portfolio">MANAGE PORTFOLIO</Link></li>
            <li><Link to="/admin/services">MANAGE SERVICES</Link></li>
            <li><Link to="/admin/bookings">MANAGE BOOKING</Link></li>
            <li><Link to="/admin/staff">MANAGE STAFF</Link></li>
            <li><Link to="/admin/clients">MANAGE CLIENTS</Link></li>
            <li><Link to="/admin/feedback">MANAGE FEEDBACK</Link></li>
          </>
        ) : (
          // Regular User Navigation
          <>
            <li><Link to="/">HOME</Link></li>
            <li><Link to="/services">SERVICES</Link></li>
            <li><Link to="/about">ABOUT US</Link></li>
            <li><Link to="/portfolio">PORTFOLIO</Link></li>
            <li><Link to="/contact">CONTACT US</Link></li>
            <li><Link to="/booking">BOOKING</Link></li>
            {!authState.isUser && <li><Link to="/signin">Sign in</Link></li>}
            {!authState.isUser && <li><Link to="/register">Register</Link></li>}
          </>
        )}
      </ul>
      
      {authState.isUser && !authState.isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Notification Bell for Users */}
          <div className="notification-bell-container">
            <button
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className="notification-bell-button"
            >
              <span className="bell-icon">🔔</span>
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
            
            {showNotificationDropdown && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <h4>Notifications</h4>
                  <span className="notification-count">{notificationCount} unread</span>
                </div>
                <div className="notification-dropdown-content">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">No new notifications</div>
                  ) : (
                    notifications.slice(0, 5).map((notification, index) => (
                      <div key={notification._id || index} className="notification-dropdown-item">
                        <div className="notification-type-icon">
                          {notification.type === 'booking_confirmed' && '📅'}
                          {notification.type === 'booking_updated' && '📝'}
                          {notification.type === 'gallery_updated' && '🖼️'}
                          {notification.type === 'service_added' && '📦'}
                          {notification.type === 'service_updated' && '⚙️'}
                          {/* Staff assignment notifications removed from navbar */}
                        </div>
                        <div className="notification-content">
                          <span className="notification-message">{notification.message}</span>
                          <span className="notification-time">
                            {new Date(notification.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <button 
                          className="dismiss-btn"
                          onClick={() => dismissUserNotification(notification)}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                  {notifications.length > 5 && (
                    <div className="view-all-notifications">
                      +{notifications.length - 5} more notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="profile-dropdown-container">
            <button
              onClick={handleProfileClick}
              className="profile-button"
            >
              <div className="profile-avatar">
                <span>👤</span>
              </div>
              <span className="profile-text">Profile</span>
              <span className={`dropdown-arrow ${showProfileDropdown ? 'rotated' : ''}`}>▼</span>
            </button>
          
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <button onClick={handleProfilePage} className="dropdown-item">
                <span>👤</span>
                Profile Page
              </button>
              {(authState.isStaff || (JSON.parse(localStorage.getItem('userData') || '{}').canAccessPortfolio)) && (
                <button onClick={handleGalleryManagement} className="dropdown-item">
                  <span>🖼️</span>
                  Gallery Management
                </button>
              )}
              <button onClick={handleLogout} className="dropdown-item logout">
                <span>🚪</span>
                Logout
              </button>
            </div>
          )}
          </div>
        </div>
      )}
      
      {authState.isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleLogout}
            style={{
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontWeight: 'bold',
              fontSize: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              alignSelf: 'center',
              height: 40
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 