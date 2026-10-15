import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './EventGallery.css';

const EventGallery = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const event = location.state?.event;
  const [lightboxIdx, setLightboxIdx] = useState(null);

  React.useEffect(() => {
    if (!event) navigate('/portfolio');
  }, [event, navigate]);

  React.useEffect(() => {
    if (lightboxIdx === null) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx(idx => (idx + 1) % event.photos.length);
      if (e.key === 'ArrowLeft') setLightboxIdx(idx => (idx - 1 + event.photos.length) % event.photos.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIdx, event]);

  if (!event) return null;

  const handleDownload = (src) => {
    // For Cloudinary URLs, use the proxy download
    if (src.includes('res.cloudinary.com')) {
      const proxyUrl = `http://localhost:5050/api/gallery/download?url=${encodeURIComponent(src)}`;
      fetch(proxyUrl)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = event.name + '_photo_' + (lightboxIdx + 1) + '.jpg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch(err => {
          console.error('Download failed:', err);
          alert('Failed to download image');
        });
    } else {
      // For local URLs, direct download
      const link = document.createElement('a');
      link.href = src;
      link.download = event.name + '_photo_' + (lightboxIdx + 1) + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const goNext = (e) => {
    e.stopPropagation();
    setLightboxIdx(idx => (idx + 1) % event.photos.length);
  };
  const goPrev = (e) => {
    e.stopPropagation();
    setLightboxIdx(idx => (idx - 1 + event.photos.length) % event.photos.length);
  };

  return (
    <div className="event-gallery-bg">
      <div className="event-gallery-header">
        <h1>{event.name}</h1>
        {event.description && <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>}
        <button className="event-gallery-back" onClick={() => navigate(-1)}>← Back to Portfolio</button>
      </div>
      <div className="event-gallery-grid">
        {event.photos.map((photo, idx) => (
          <div className="event-gallery-photo-wrap" key={idx}>
            <img
              src={photo}
              alt={event.name + ' photo ' + (idx+1)}
              className="event-gallery-photo"
              onClick={() => setLightboxIdx(idx)}
              style={{ cursor: 'zoom-in' }}
            />
          </div>
        ))}
      </div>
      {lightboxIdx !== null && (
        <div className="event-gallery-lightbox" onClick={() => setLightboxIdx(null)}>
          <button
            className="event-gallery-lightbox-nav left"
            onClick={goPrev}
            aria-label="Previous"
          >&#8592;</button>
          <img
            src={event.photos[lightboxIdx]}
            alt={event.name + ' photo ' + (lightboxIdx+1)}
            className="event-gallery-lightbox-img"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="event-gallery-lightbox-nav right"
            onClick={goNext}
            aria-label="Next"
          >&#8594;</button>
          <button
            className="event-gallery-lightbox-close"
            onClick={() => setLightboxIdx(null)}
            aria-label="Close"
          >&times;</button>
          <button
            className="event-gallery-download-btn"
            onClick={e => { e.stopPropagation(); handleDownload(event.photos[lightboxIdx]); }}
          >Download</button>
        </div>
      )}
    </div>
  );
};

export default EventGallery; 