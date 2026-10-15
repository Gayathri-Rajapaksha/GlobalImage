import React, { useState, useEffect } from 'react';
import './Contact.css';

const mainOffice = {
  label: 'Main Office',
  address: '171/1/1, EL Senanayake Street, Kandy, Sri Lanka, 20000',
  phone: '077-7155653',
  email: 'globalimagelanka@gmail.com',
  hours: [
    'Monday - Friday: 9am - 6pm',
    'Saturday: 10am - 4pm',
    'Sunday: Closed'
  ]
};



const Contact = () => {
  const [feedback, setFeedback] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    rating: 5
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [reviewedFeedback, setReviewedFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  const handleFeedbackChange = e => {
    setFeedback({ ...feedback, [e.target.name]: e.target.value });
  };

  const handleRatingChange = (rating) => {
    setFeedback({ ...feedback, rating });
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const storedUserData = localStorage.getItem('userData');
    
    if (token && storedUserData) {
      setIsAuthenticated(true);
      setUserData(JSON.parse(storedUserData));
      
      // Pre-fill feedback form with user data
      const user = JSON.parse(storedUserData);
      setFeedback(prev => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }));
    }
    
    // Fetch reviewed feedback
    fetchReviewedFeedback();
  }, []);

  const fetchReviewedFeedback = async () => {
    try {
      const res = await fetch('http://localhost:5050/api/feedback/public');
      if (res.ok) {
        const data = await res.json();
        setReviewedFeedback(data);
      }
    } catch (err) {
      console.error('Failed to fetch reviewed feedback');
    }
    setFeedbackLoading(false);
  };

  const handleFeedbackSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5050/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setFeedbackSubmitted(true);
        setFeedback({ name: '', email: '', subject: '', message: '', rating: 5 });
      } else {
        setError(data.message || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="contact-bg">
      <div className="contact-container">
        <h1 className="contact-title">Get In Touch</h1>
        <div className="contact-divider" />
        <p className="contact-desc">Have questions about our photography services? We're here to help!</p>
        <div className="contact-info-flex">
          <div className="contact-location-card">
            <div className="contact-location-icon">
              <span role="img" aria-label="Location">📍</span>
            </div>
            <div className="contact-location-label">Our Location</div>
            <div className="contact-location-address">{mainOffice.address}</div>
            <div className="contact-map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.1234567890123!2d80.6333!3d7.2955!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwMTcnNDMuNSJOIDgwwrAzOCcwMC4wIkU!5e0!3m2!1sen!2slk!4v1234567890123"
                width="100%"
                height="200"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Global Image Location"
              ></iframe>
            </div>
            <a href="https://maps.google.com/?q=171/1/1, EL Senanayake Street, Kandy, Sri Lanka, 20000" target="_blank" rel="noopener noreferrer" className="contact-info-btn">Get Directions</a>
          </div>
          <div className="contact-details-card">
            <div className="contact-details-row">
              <span className="contact-details-icon" role="img" aria-label="Phone">📞</span>
              <span className="contact-details-label">Phone:</span>
              <span className="contact-details-value">{mainOffice.phone}</span>
              <a href={`tel:${mainOffice.phone}`} className="contact-info-btn small">Call Us</a>
            </div>
            <div className="contact-details-row">
              <span className="contact-details-icon" role="img" aria-label="Email">✉️</span>
              <span className="contact-details-label">Email:</span>
              <span className="contact-details-value">{mainOffice.email}</span>
              <a href={`mailto:${mainOffice.email}`} className="contact-info-btn small">Send Email</a>
            </div>
            <div className="contact-details-row contact-details-hours">
              <span className="contact-details-icon" role="img" aria-label="Hours">⏰</span>
              <span className="contact-details-label">Business Hours:</span>
              <span className="contact-details-value contact-details-hours-list">
                {mainOffice.hours.map((line, i) => <div key={i}>{line}</div>)}
              </span>
            </div>
          </div>
        </div>


        {isAuthenticated ? (
          <div className="contact-form-section">
            <h2 className="contact-form-title">Share Your Feedback</h2>
            <p className="contact-form-desc">We value your opinion! Share your experience with our services and help us improve.</p>
            
            {error && (
              <div className="contact-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            
            {feedbackSubmitted ? (
              <div className="contact-success">
                <span className="success-icon">✅</span>
                Thank you for your feedback! We appreciate your input and will use it to improve our services.
              </div>
            ) : (
              <form className="contact-form feedback-form" onSubmit={handleFeedbackSubmit}>
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label htmlFor="feedback-name">Your Name *</label>
                    <input 
                      type="text" 
                      id="feedback-name" 
                      name="name" 
                      value={feedback.name} 
                      onChange={handleFeedbackChange} 
                      required 
                    />
                  </div>
                  <div className="contact-form-group">
                    <label htmlFor="feedback-email">Email Address *</label>
                    <input 
                      type="email" 
                      id="feedback-email" 
                      name="email" 
                      value={feedback.email} 
                      onChange={handleFeedbackChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="contact-form-group">
                  <label htmlFor="feedback-subject">Subject *</label>
                  <input 
                    type="text" 
                    id="feedback-subject" 
                    name="subject" 
                    value={feedback.subject} 
                    onChange={handleFeedbackChange} 
                    required 
                  />
                </div>
                <div className="contact-form-group">
                  <label>Rating *</label>
                  <div className="rating-container">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`rating-star ${feedback.rating >= star ? 'active' : ''}`}
                        onClick={() => handleRatingChange(star)}
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="rating-text">
                      {feedback.rating === 1 && 'Poor'}
                      {feedback.rating === 2 && 'Fair'}
                      {feedback.rating === 3 && 'Good'}
                      {feedback.rating === 4 && 'Very Good'}
                      {feedback.rating === 5 && 'Excellent'}
                    </span>
                  </div>
                </div>
                <div className="contact-form-group">
                  <label htmlFor="feedback-message">Your Feedback *</label>
                  <textarea 
                    id="feedback-message" 
                    name="message" 
                    value={feedback.message} 
                    onChange={handleFeedbackChange} 
                    rows={5} 
                    required 
                    placeholder="Please share your experience with our services..." 
                  />
                </div>
                <button 
                  className="contact-form-btn" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading-spinner">⏳</span>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="contact-form-section">
            <div className="signin-prompt">
              <div className="signin-icon">🔐</div>
              <h2 className="contact-form-title">Sign In to Share Feedback</h2>
              <p className="contact-form-desc">
                To share your feedback and help us improve our services, please sign in to your account.
              </p>
              <div className="signin-actions">
                <a href="/signin" className="contact-form-btn">
                  Sign In
                </a>
                <a href="/register" className="contact-form-btn secondary">
                  Create Account
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Reviewed Feedback Section */}
        <div className="contact-feedback-section">
          <h2 className="contact-feedback-title">What Our Customers Say</h2>
          <p className="contact-feedback-desc">Read what our valued customers have to say about our services</p>
          
          {feedbackLoading ? (
            <div className="feedback-loading">Loading customer feedback...</div>
          ) : reviewedFeedback.length > 0 ? (
            <div className="feedback-display-grid">
              {reviewedFeedback.map((item) => (
                <div key={item._id} className="feedback-display-card">
                  <div className="feedback-display-header">
                    <div className="feedback-display-info">
                      <h3 className="feedback-display-name">{item.name}</h3>
                      <p className="feedback-display-subject">{item.subject}</p>
                    </div>
                    <div className="feedback-display-rating">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`star ${i < item.rating ? 'filled' : ''}`}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="feedback-display-message">
                    "{item.message}"
                  </div>
                  {item.adminResponse && (
                    <div className="feedback-display-response">
                      <div className="response-label">Our Response:</div>
                      <div className="response-content">{item.adminResponse}</div>
                    </div>
                  )}
                  <div className="feedback-display-date">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-feedback-display">
              <p>No reviewed feedback available yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default Contact; 