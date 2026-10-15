import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ServiceDetail.css';

const ServiceDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const service = location.state?.service;

  React.useEffect(() => {
    if (!service) {
      navigate('/services');
    }
  }, [service, navigate]);

  if (!service) return null;

  const handleBookNow = () => {
    navigate('/booking', { state: { eventType: service.category } });
  };

  const handleViewPortfolio = (service) => {
    // Map service categories to portfolio categories
    const categoryMapping = {
      'Birthday Party': 'birthday',
      'Wedding': 'wedding',
      'Corporate Event': 'corporate',
      'Social Gathering': 'social',
      'Cultural Event': 'cultural',
      'Batch Party': 'batch',
      'Other': 'other'
    };
    
    const portfolioCategory = categoryMapping[service.category] || 'all';
    navigate('/portfolio', { state: { selectedCategory: portfolioCategory } });
  };

  const handleGoBack = () => {
    navigate('/services');
  };

  // Helper to get absolute image URL
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/uploads/')) return `http://localhost:5050${path}`;
    return path;
  };

  return (
    <div className="service-detail-modal-overlay">
      <div className="service-detail-modal">
        {/* Header Section */}
        <div className="service-detail-header">
          <button className="service-detail-back-btn" onClick={handleGoBack}>
            <span>←</span>
            <span>Back to Services</span>
          </button>
          <div className="service-detail-category">{service.category}</div>
        </div>

        {/* Scrollable Content */}
        <div className="service-detail-modal-content">
          {/* Hero Section */}
          <div className="service-detail-hero">
            <div className="service-detail-image-container">
              <img 
                src={getImageUrl(service.photo)} 
                alt={service.title} 
                className="service-detail-image" 
              />
              <div className="service-detail-image-overlay"></div>
            </div>
            <div className="service-detail-hero-content">
              <h1 className="service-detail-title">{service.title}</h1>
              <p className="service-detail-subtitle">
                Professional photography services for your special moments
              </p>
              <div className="service-detail-price">
                LKR {service.price?.toLocaleString() || '0'}
              </div>
              <div className="service-detail-actions">
                <button className="service-detail-book-btn" onClick={handleBookNow}>
                  Book This Service
                </button>
                <button className="service-detail-contact-btn" onClick={() => navigate('/contact')}>
                  Contact Us
                </button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="service-detail-content">
            <div className="service-detail-section">
              <h2 className="service-detail-section-title">Service Description</h2>
              <div className="service-detail-description">
                {service.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="service-detail-paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="service-detail-portfolio-link">
                <span 
                  onClick={() => handleViewPortfolio(service)}
                  className="service-detail-portfolio-text"
                >
                  View Portfolio →
                </span>
              </div>
            </div>

            <div className="service-detail-section">
              <h2 className="service-detail-section-title">What's Included</h2>
              <div className="service-detail-features">
                <div className="service-detail-feature">
                  <div className="service-detail-feature-icon">📸</div>
                  <div className="service-detail-feature-content">
                    <h3>Professional Photography</h3>
                    <p>High-quality photos captured by experienced photographers</p>
                  </div>
                </div>
                <div className="service-detail-feature">
                  <div className="service-detail-feature-icon">🎨</div>
                  <div className="service-detail-feature-content">
                    <h3>Photo Editing</h3>
                    <p>Professional post-processing and color correction</p>
                  </div>
                </div>
                <div className="service-detail-feature">
                  <div className="service-detail-feature-icon">💾</div>
                  <div className="service-detail-feature-content">
                    <h3>Digital Delivery</h3>
                    <p>High-resolution images delivered digitally</p>
                  </div>
                </div>
                <div className="service-detail-feature">
                  <div className="service-detail-feature-icon">⏱️</div>
                  <div className="service-detail-feature-content">
                    <h3>Quick Turnaround</h3>
                    <p>Fast delivery within 7-10 business days</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="service-detail-section">
              <h2 className="service-detail-section-title">Why Choose Us</h2>
              <div className="service-detail-benefits">
                <div className="service-detail-benefit">
                  <h3>Experience</h3>
                  <p>Over 10 years of professional photography experience</p>
                </div>
                <div className="service-detail-benefit">
                  <h3>Quality</h3>
                  <p>Premium equipment and editing software for best results</p>
                </div>
                <div className="service-detail-benefit">
                  <h3>Reliability</h3>
                  <p>Consistent delivery and professional service</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="service-detail-cta">
            <div className="service-detail-cta-content">
              <h2>Ready to Book Your Event?</h2>
              <p>Contact us today to discuss your requirements and get a custom quote</p>
              <div className="service-detail-cta-buttons">
                <button className="service-detail-cta-primary" onClick={handleBookNow}>
                  Book Now
                </button>
                <button className="service-detail-cta-secondary" onClick={() => navigate('/contact')}>
                  Get Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail; 