import React, { useEffect, useState } from 'react';
import './Home.css';

const workPhotos = [
  '/images/home/1.jpg',
  '/images/home/2.jpg',
  '/images/home/3.jpg',
  '/images/home/4.jpg',
  '/images/home/5.jpg',
  '/images/home/6.jpg'
];

const stats = [
  { number: '500+', label: 'Events Captured' },
  { number: '1000+', label: 'Happy Clients' },
  { number: '24/7', label: 'Support' }
];



const Home = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="home-bg">
      {/* Hero Section */}
      <div className="home-hero">
        <div className="hero-content">
          <h1 className="home-title">
            <span className="title-line">Capture Your</span>
            <span className="title-highlight">Perfect Moments</span>
          </h1>
          <p className="home-tagline">
            Professional photography services for events, portraits, and special occasions. 
            We turn your memories into timeless art.
          </p>
          <div className="hero-buttons">
            <a href="/portfolio" className="home-cta primary">View Portfolio</a>
            <a href="/contact" className="home-cta secondary">Get Quote</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-cards">
            {workPhotos.slice(0, 4).map((src, idx) => (
              <div className="floating-card" key={idx} style={{ animationDelay: `${idx * 0.3}s` }}>
                <img src={src} alt={`Featured work ${idx+1}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="home-stats">
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div className="stat-card" key={idx}>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Section */}
      <div className="home-services-section">
        <div className="services-container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Capturing life's most precious moments with professional excellence</p>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">🎓</div>
              <h3>Batch Party</h3>
              <p>Graduation ceremonies, academic celebrations, and milestone achievements captured with elegance and professionalism.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🎉</div>
              <h3>Social Gatherings</h3>
              <p>Corporate events, family reunions, and social celebrations documented with attention to every special moment.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🎂</div>
              <h3>Birthday Party</h3>
              <p>Birthday celebrations of all ages, from intimate family gatherings to grand party celebrations filled with joy.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🏛️</div>
              <h3>Cultural Events</h3>
              <p>Traditional ceremonies, religious festivals, and cultural celebrations honoring heritage and customs.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">✨</div>
              <h3>Other Events</h3>
              <p>Weddings, engagements, product launches, and any special occasion that deserves professional photography.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="home-features-section">
        <h2 className="section-title">Why Choose Global Image?</h2>
        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Professional Photography</h3>
            <p>Expert photographers with years of experience capturing your most precious moments with artistic vision.</p>
            <div className="feature-highlight"></div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Creative Design</h3>
            <p>From branding to digital art, our creative team brings your vision to life with innovative designs.</p>
            <div className="feature-highlight"></div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <h3>Digital Solutions</h3>
            <p>Comprehensive digital services including web design, social media, and multimedia content creation.</p>
            <div className="feature-highlight"></div>
          </div>
        </div>
      </div>



      {/* Work Section */}
      <div className="home-work-section">
        <h2 className="section-title">Our Recent Works</h2>
        <div className="home-work-grid">
          {workPhotos.map((src, idx) => (
            <div className="home-work-photo-wrap" key={idx}>
              <img src={src} alt={`Our work ${idx+1}`} className="home-work-photo" />
              <div className="photo-overlay">
                <div className="overlay-content">
                  <span className="view-project">View Project</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <a href="/portfolio" className="home-work-more-btn">
          Explore Full Portfolio <span className="home-work-arrow">→</span>
        </a>
      </div>

      {/* CTA Section */}
      <div className="home-cta-section">
        <div className="cta-content">
          <h2>Ready to Capture Your Story?</h2>
          <p>Let's create something amazing together. Contact us today for a free consultation.</p>
          <div className="cta-buttons">
            <a href="/contact" className="cta-btn primary">Get Started</a>
            <a href="/services" className="cta-btn secondary">Our Services</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 