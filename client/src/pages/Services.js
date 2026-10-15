import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Services.css';

// Helper function to get image URL
function getImageUrl(path) {
  if (path.startsWith('http')) return path;
  return `http://localhost:5050/${path}`;
}

// Loading Component
function LoadingSpinner() {
  return (
    <div className="services-loading-container">
      <div className="services-loading-spinner"></div>
      <p>Loading services...</p>
    </div>
  );
}

// Error Component
function ErrorMessage({ message, onRetry }) {
  return (
    <div className="services-error-container">
      <div className="services-error-icon">⚠️</div>
      <h3>Oops! Something went wrong</h3>
      <p>{message}</p>
      <button onClick={onRetry} className="services-error-retry">
        Try Again
      </button>
    </div>
  );
}

// Empty State Component
function EmptyState({ category }) {
  return (
    <div className="services-empty-container">
      <div className="services-empty-icon">🛠️</div>
      <h3>No services found</h3>
      <p>
        {category === 'all' 
          ? "We're working on adding more services. Check back soon!"
          : `No services found in the "${category}" category. Try another category or check back later.`
        }
      </p>
    </div>
  );
}

// Admin Management Bar Component
function AdminManagementBar({ onManageServices }) {
  return (
    <div className="services-admin-bar">
      <div className="services-admin-bar-content">
        <div className="services-admin-bar-info">
          <span className="services-admin-badge">👑 Admin Mode</span>
          <span className="services-admin-text">You're viewing the public services as an administrator</span>
        </div>
        <button 
          className="services-admin-manage-btn"
          onClick={onManageServices}
        >
          🛠️ Manage Services
        </button>
      </div>
    </div>
  );
}

// Service Description Modal Component
function ServiceDescriptionModal({ open, onClose, service, navigate }) {
  const [isUser, setIsUser] = useState(localStorage.getItem('isUser') === 'true');

  useEffect(() => {
    const checkAuth = () => {
      setIsUser(localStorage.getItem('isUser') === 'true');
    };
    
    checkAuth();
    window.addEventListener('login', checkAuth);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('login', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);
  if (!open || !service) return null;

  return (
    <div className="service-modal-overlay" onClick={onClose}>
      <div className="service-modal-content" onClick={e => e.stopPropagation()}>
        <button className="service-modal-close" onClick={onClose}>&times;</button>
        
        {/* Header Section */}
        <div className="service-modal-header">
          <div className="service-modal-image-container">
            <img 
              src={getImageUrl(service.photo)} 
              alt={service.title} 
              className="service-modal-image"
            />
            <div className="service-modal-image-overlay">
              <span className="service-modal-category-badge">{service.category}</span>
            </div>
          </div>
          <div className="service-modal-info">
            <h2 className="service-modal-title">{service.title}</h2>
            <div className="service-modal-price-container">
              <span className="service-modal-price-label">Starting from</span>
              <div className="service-modal-price">LKR {service.price?.toLocaleString() || '0'}</div>
            </div>
            <div className="service-modal-duration">
              <span className="service-modal-duration-icon">⏰</span>
              <span className="service-modal-duration-text">{service.hours} Hours</span>
            </div>
            <div className="service-modal-meta">
              <div className="service-modal-meta-item">
                <span className="service-modal-meta-icon">📸</span>
                <span className="service-modal-meta-text">Professional Photography</span>
              </div>
              <div className="service-modal-meta-item">
                <span className="service-modal-meta-icon">🎨</span>
                <span className="service-modal-meta-text">Photo Editing Included</span>
              </div>
              <div className="service-modal-meta-item">
                <span className="service-modal-meta-icon">💾</span>
                <span className="service-modal-meta-text">Digital Files</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="service-modal-description">
          <div className="service-modal-section">
            <h3 className="service-modal-section-title">
              <span className="service-modal-section-icon">📋</span>
              Service Description
            </h3>
            <p className="service-modal-description-text">{service.description}</p>
          </div>

          {/* What's Included Section */}
          <div className="service-modal-section">
            <h3 className="service-modal-section-title">
              <span className="service-modal-section-icon">✅</span>
              What's Included
            </h3>
            <div className="service-modal-features">
              <div className="service-modal-feature">
                <span className="service-modal-feature-icon">📷</span>
                <span className="service-modal-feature-text">Professional camera equipment</span>
              </div>
              <div className="service-modal-feature">
                <span className="service-modal-feature-icon">🎨</span>
                <span className="service-modal-feature-text">Professional photo editing</span>
              </div>
              <div className="service-modal-feature">
                <span className="service-modal-feature-icon">💾</span>
                <span className="service-modal-feature-text">High-resolution digital files</span>
              </div>
              <div className="service-modal-feature">
                <span className="service-modal-feature-icon">📱</span>
                <span className="service-modal-feature-text">Online gallery access</span>
              </div>
              <div className="service-modal-feature">
                <span className="service-modal-feature-icon">⏱️</span>
                <span className="service-modal-feature-text">Quick turnaround time</span>
              </div>
              <div className="service-modal-feature">
                <span className="service-modal-feature-icon">🎯</span>
                <span className="service-modal-feature-text">Customized to your needs</span>
              </div>
            </div>
          </div>

          {/* Service Highlights */}
          <div className="service-modal-section">
            <h3 className="service-modal-section-title">
              <span className="service-modal-section-icon">⭐</span>
              Service Highlights
            </h3>
            <div className="service-modal-highlights">
              <div className="service-modal-highlight">
                <div className="service-modal-highlight-number">01</div>
                <div className="service-modal-highlight-content">
                  <h4>Professional Setup</h4>
                  <p>State-of-the-art equipment and lighting setup</p>
                </div>
              </div>
              <div className="service-modal-highlight">
                <div className="service-modal-highlight-number">02</div>
                <div className="service-modal-highlight-content">
                  <h4>Expert Photography</h4>
                  <p>Experienced photographers with years of expertise</p>
                </div>
              </div>
              <div className="service-modal-highlight">
                <div className="service-modal-highlight-number">03</div>
                <div className="service-modal-highlight-content">
                  <h4>Quality Assurance</h4>
                  <p>Every photo carefully selected and edited</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="service-modal-actions">
          <div className="service-modal-action-info">
            <div className="service-modal-action-item">
              <span className="service-modal-action-icon">⏰</span>
              <span className="service-modal-action-text">Flexible scheduling available</span>
            </div>
          </div>
          <div className="service-modal-action-buttons">
            <button
              className={`service-modal-book-btn ${!isUser ? 'service-modal-book-btn-disabled' : ''}`}
              onClick={() => {
                onClose();
                if (isUser) {
                  navigate('/booking', { state: { selectedService: service } });
                } else {
                  navigate('/signin', { 
                    state: { 
                      redirectTo: '/booking',
                      selectedService: service
                    } 
                  });
                }
              }}
            >
              <span className="service-modal-btn-icon">📅</span>
              {isUser ? 'Book This Service' : 'Sign In to Book'}
            </button>
            <button
              className="service-modal-portfolio-btn"
              onClick={() => {
                onClose();
                navigate(`/portfolio?category=${encodeURIComponent(service.category)}`);
              }}
            >
              <span className="service-modal-btn-icon">📸</span>
              View Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const navigate = useNavigate();

  const categories = [
    { key: 'all', label: 'All Services' },
    { key: 'Batch Party', label: 'Batch Party' },
    { key: 'Social Gathering', label: 'Social Gathering' },
    { key: 'Birthday Party', label: 'Birthday Party' },
    { key: 'Cultural Event', label: 'Cultural Event' },
    { key: 'Other Event', label: 'Other Event' }
  ];

  useEffect(() => {
    const syncAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('storage', syncAdmin);
    window.addEventListener('login', syncAdmin);
    
    fetchServices();
    
    return () => {
      window.removeEventListener('storage', syncAdmin);
      window.removeEventListener('login', syncAdmin);
    };
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5050/api/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Services fetch error:', err);
      setError('Failed to load services. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (service) => {
    navigate('/booking', { state: { selectedService: service } });
  };

  const handleViewPortfolio = (service) => {
    navigate('/portfolio', { state: { selectedService: service } });
  };

  const handleCategoryChange = (categoryKey) => {
    setSelectedCategory(categoryKey);
  };

  const handleRetry = () => {
    fetchServices();
  };

  const handleManageServices = () => {
    navigate('/admin/services');
  };

  const handleReadMore = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedService(null);
  };

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  return (
    <div className="services-bg">
      {/* Admin Management Bar */}
      {isAdmin && (
        <AdminManagementBar onManageServices={handleManageServices} />
      )}

      <div className="services-container">
        <div className="services-header">
          <h1>Our Services</h1>
          <p>Discover our comprehensive photography and event services</p>
        </div>

        <div className="services-categories">
          {categories.map(category => (
            <button
              key={category.key}
              className={`services-category-tab ${selectedCategory === category.key ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.key)}
            >
              {category.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={handleRetry} />
        ) : filteredServices.length === 0 ? (
          <EmptyState category={selectedCategory} />
        ) : (
          <div className="services-grid">
            {filteredServices.map(service => (
              <div key={service._id} className="services-card">
                <div className="services-card-image-container">
                  <img 
                    src={getImageUrl(service.photo)} 
                    alt={service.title} 
                    className="services-card-img"
                    loading="lazy"
                  />
                </div>
                <div className="services-card-content">
                  <h3 className="services-card-title">{service.title}</h3>
                  <div className="services-card-price">LKR {service.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
                  <div className="services-card-hours">⏰ {service.hours} Hours</div>
                  <a
                    className="services-read-more-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleReadMore(service);
                    }}
                    href="#"
                  >
                    Read More
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ServiceDescriptionModal
        open={modalOpen}
        onClose={handleCloseModal}
        service={selectedService}
        navigate={navigate}
      />
    </div>
  );
};

export default Services; 