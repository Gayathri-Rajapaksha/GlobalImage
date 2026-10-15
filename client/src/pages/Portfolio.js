import React, { useState, useEffect } from 'react';
import './Portfolio.css';
import { useNavigate, useLocation } from 'react-router-dom';

// Helper function to get image URL
function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `http://localhost:5050${path}`;
  return path;
}

// Lightbox Component
function Lightbox({ open, onClose, gallery, currentIndex, onNavigate }) {
  const handleDownloadPhoto = async () => {
    try {
      const photoUrl = getImageUrl(gallery.photos[currentIndex]);
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${gallery.name}-photo-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Photo download failed:', error);
    }
  };

  if (!open || !gallery) return null;

  return (
    <div className="portfolio-lightbox" onClick={onClose}>
      <div className="portfolio-lightbox-content" onClick={e => e.stopPropagation()}>
        <button className="portfolio-lightbox-close" onClick={onClose}>&times;</button>
        <button 
          className="portfolio-lightbox-nav prev" 
          onClick={() => onNavigate(currentIndex > 0 ? currentIndex - 1 : gallery.photos.length - 1)}
        >
          ‹
        </button>
        <div className="portfolio-lightbox-image-container">
          <img 
            src={getImageUrl(gallery.photos[currentIndex])} 
            alt={`${gallery.name} - Photo ${currentIndex + 1}`}
            className="portfolio-lightbox-image"
          />
          <div className="portfolio-lightbox-photo-number">
            {currentIndex + 1}/{gallery.photos.length}
          </div>
        </div>
        <button 
          className="portfolio-lightbox-nav next" 
          onClick={() => onNavigate(currentIndex < gallery.photos.length - 1 ? currentIndex + 1 : 0)}
        >
          ›
        </button>
        <div className="portfolio-lightbox-info">
          <h3>{gallery.name}</h3>
          <p>Photo {currentIndex + 1} of {gallery.photos.length}</p>
          <p className="portfolio-lightbox-description">{gallery.description}</p>
          <button 
            className="portfolio-lightbox-download"
            onClick={handleDownloadPhoto}
            title={`Download ${gallery.name} - Photo ${currentIndex + 1}`}
          >
            📥 Download Photo
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading Component
function LoadingSpinner() {
  return (
    <div className="portfolio-loading-container">
      <div className="portfolio-loading-spinner"></div>
      <p>Loading galleries...</p>
    </div>
  );
}

// Error Component
function ErrorMessage({ message, onRetry }) {
  return (
    <div className="portfolio-error-container">
      <div className="portfolio-error-icon">⚠️</div>
      <h3>Oops! Something went wrong</h3>
      <p>{message}</p>
      <button onClick={onRetry} className="portfolio-error-retry">
        Try Again
      </button>
    </div>
  );
}

// Empty State Component
function EmptyState({ category }) {
  return (
    <div className="portfolio-empty-container">
      <div className="portfolio-empty-icon">📸</div>
      <h3>No galleries found</h3>
      <p>
        {category === 'all' 
          ? "We're working on adding more galleries. Check back soon!"
          : `No galleries found in the "${category}" category. Try another category or check back later.`
        }
      </p>
    </div>
  );
}

// Admin Management Bar Component
function AdminManagementBar({ onManagePortfolio }) {
  return (
    <div className="portfolio-admin-bar">
      <div className="portfolio-admin-bar-content">
        <div className="portfolio-admin-bar-info">
          <span className="portfolio-admin-badge">👑 Admin Mode</span>
          <span className="portfolio-admin-text">You're viewing the public portfolio as an administrator</span>
        </div>
        <button 
          className="portfolio-admin-manage-btn"
          onClick={onManagePortfolio}
        >
          🛠️ Manage Portfolio
        </button>
      </div>
    </div>
  );
}

const Portfolio = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentGallery, setCurrentGallery] = useState(null);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    { key: 'all', label: 'All Events' },
    { key: 'batch', label: 'Batch Party' },
    { key: 'social', label: 'Social Gatherings' },
    { key: 'birthday', label: 'Birthday Parties' },
    { key: 'cultural', label: 'Cultural Events' },
    { key: 'other', label: 'Other Events' }
  ];

  // Mapping from service categories to portfolio categories
  const serviceToPortfolioCategory = {
    'Batch Party': 'batch',
    'Social Gathering': 'social',
    'Birthday Party': 'birthday',
    'Cultural Event': 'cultural',
    'Other Event': 'other'
  };

  useEffect(() => {
    const syncAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('storage', syncAdmin);
    window.addEventListener('login', syncAdmin);
    
    // Handle URL parameters for category filtering
    const urlParams = new URLSearchParams(location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
      // Map service category to portfolio category
      const mappedCategory = serviceToPortfolioCategory[categoryParam] || categoryParam.toLowerCase();
      setSelectedCategory(mappedCategory);
    }
    
    fetchGalleries();
    
    return () => {
      window.removeEventListener('storage', syncAdmin);
      window.removeEventListener('login', syncAdmin);
    };
  }, [location.search]);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5050/api/gallery');
      if (!res.ok) throw new Error('Failed to fetch galleries');
      const data = await res.json();
      // Ensure galleries is always an array
      const galleriesData = data.galleries || data;
      console.log('Fetched galleries:', galleriesData);
      setGalleries(Array.isArray(galleriesData) ? galleriesData : []);
    } catch (err) {
      console.error('Galleries fetch error:', err);
      setError('Failed to load galleries. Please check your connection and try again.');
      setGalleries([]); // Ensure galleries is empty array on error
    } finally {
      setLoading(false);
    }
  };

  const openGallery = (gallery) => {
    setCurrentGallery(gallery);
    setCurrentImageIndex(0);
    setLightboxOpen(true);
  };

  const closeGallery = () => {
    setLightboxOpen(false);
    setCurrentGallery(null);
    setCurrentImageIndex(0);
  };

  const navigateImage = (newIndex) => {
    setCurrentImageIndex(newIndex);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!lightboxOpen || !currentGallery) return;
      
      if (e.key === 'Escape') {
        closeGallery();
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex(prev => 
          prev < currentGallery.photos.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(prev => 
          prev > 0 ? prev - 1 : currentGallery.photos.length - 1
        );
      }
    };

    if (lightboxOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen, currentGallery, currentImageIndex]);

  const filteredGalleries = selectedCategory === 'all' 
    ? galleries 
    : galleries.filter(gallery => {
        console.log('Portfolio page - Gallery category:', gallery.category, 'Selected category:', selectedCategory);
        console.log('Category match:', gallery.category === selectedCategory);
        return gallery.category === selectedCategory;
      });

  const handleCategoryChange = (categoryKey) => {
    setSelectedCategory(categoryKey);
  };

  const handleRetry = () => {
    fetchGalleries();
  };

  const handleManagePortfolio = () => {
    navigate('/admin/portfolio');
  };

  const handleDownloadImage = async (e, imageUrl, galleryName) => {
    e.stopPropagation(); // Prevent opening the gallery
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${galleryName}-cover.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="portfolio-bg">
      {/* Admin Management Bar */}
      {isAdmin && (
        <AdminManagementBar onManagePortfolio={handleManagePortfolio} />
      )}

      <div className="portfolio-container">
        <div className="portfolio-header">
          <h1>Our Portfolio</h1>
          <p>Explore our collection of memorable events and celebrations</p>
        </div>

        <div className="portfolio-categories">
          {categories.map(category => (
            <button
              key={category.key}
              className={`portfolio-category-tab ${selectedCategory === category.key ? 'active' : ''}`}
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
        ) : filteredGalleries.length === 0 ? (
          <EmptyState category={selectedCategory} />
        ) : (
          <div className="portfolio-event-grid">
            {filteredGalleries.map(gallery => (
              <div key={gallery._id} className="portfolio-event-card-pro" onClick={() => openGallery(gallery)}>
                <div className="portfolio-event-card-imgwrap">
                  <img 
                    src={getImageUrl(gallery.cover)} 
                    alt={gallery.name} 
                    className="portfolio-event-card-img"
                    loading="lazy"
                  />
                  <div className="portfolio-event-card-category">
                    {gallery.category === 'batch' ? 'Batch Party' :
                     gallery.category === 'social' ? 'Social Gatherings' :
                     gallery.category === 'birthday' ? 'Birthday Parties' :
                     gallery.category === 'cultural' ? 'Cultural Events' :
                     gallery.category === 'other' ? 'Other Events' :
                     gallery.category}
                  </div>
                  <div className="portfolio-event-card-photo-count">
                    {gallery.photos.length} photo{gallery.photos.length !== 1 ? 's' : ''}
                  </div>
                  <div className="portfolio-event-card-overlay">
                    <span className="portfolio-event-card-view">View Gallery</span>
                  </div>
                </div>
                <div className="portfolio-event-card-info">
                  <h3 className="portfolio-event-card-title">{gallery.name}</h3>
                  <p className="portfolio-event-card-desc">{gallery.description}</p>
                  <div className="portfolio-event-card-date">
                    {new Date(gallery.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Lightbox 
        open={lightboxOpen}
        onClose={closeGallery}
        gallery={currentGallery}
        currentIndex={currentImageIndex}
        onNavigate={navigateImage}
      />
    </div>
  );
};

export default Portfolio; 