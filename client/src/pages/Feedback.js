import React, { useState, useEffect } from 'react';
import './Feedback.css';

const Feedback = () => {
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const syncAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('storage', syncAdmin);
    window.addEventListener('login', syncAdmin);
    
    if (!isAdmin) {
      window.location.href = '/signin';
      return;
    }

    fetchFeedbacks();
    
    return () => {
      window.removeEventListener('storage', syncAdmin);
      window.removeEventListener('login', syncAdmin);
    };
  }, [isAdmin]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockFeedbacks = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          rating: 5,
          message: 'Excellent service! The photos came out amazing.',
          date: '2024-01-15',
          status: 'approved'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          rating: 4,
          message: 'Great experience overall. Would recommend!',
          date: '2024-01-14',
          status: 'pending'
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          rating: 5,
          message: 'Professional team and high-quality work.',
          date: '2024-01-13',
          status: 'approved'
        }
      ];
      
      setFeedbacks(mockFeedbacks);
    } catch (err) {
      setError('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      // Mock API call - replace with actual implementation
      setFeedbacks(prev => 
        prev.map(feedback => 
          feedback.id === feedbackId 
            ? { ...feedback, status: newStatus }
            : feedback
        )
      );
    } catch (err) {
      console.error('Failed to update feedback status:', err);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }
    
    try {
      // Mock API call - replace with actual implementation
      setFeedbacks(prev => prev.filter(feedback => feedback.id !== feedbackId));
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getRatingStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="feedback-bg">
      <div className="feedback-header">
        <h1>Feedback Management</h1>
        <p>Manage customer feedback and reviews</p>
      </div>

      {loading ? (
        <div className="feedback-loading">Loading feedbacks...</div>
      ) : error ? (
        <div className="feedback-error">{error}</div>
      ) : (
        <div className="feedback-container">
          <div className="feedback-stats">
            <div className="feedback-stat-card">
              <div className="feedback-stat-number">{feedbacks.length}</div>
              <div className="feedback-stat-label">Total Feedbacks</div>
            </div>
            <div className="feedback-stat-card">
              <div className="feedback-stat-number">
                {feedbacks.filter(f => f.status === 'approved').length}
              </div>
              <div className="feedback-stat-label">Approved</div>
            </div>
            <div className="feedback-stat-card">
              <div className="feedback-stat-number">
                {feedbacks.filter(f => f.status === 'pending').length}
              </div>
              <div className="feedback-stat-label">Pending</div>
            </div>
            <div className="feedback-stat-card">
              <div className="feedback-stat-number">
                {feedbacks.reduce((avg, f) => avg + f.rating, 0) / feedbacks.length || 0}
              </div>
              <div className="feedback-stat-label">Average Rating</div>
            </div>
          </div>

          <div className="feedback-list">
            {feedbacks.map(feedback => (
              <div key={feedback.id} className="feedback-card">
                <div className="feedback-header-row">
                  <div className="feedback-info">
                    <h3 className="feedback-name">{feedback.name}</h3>
                    <p className="feedback-email">{feedback.email}</p>
                    <p className="feedback-date">{new Date(feedback.date).toLocaleDateString()}</p>
                  </div>
                  <div className="feedback-rating">
                    <span className="feedback-stars">{getRatingStars(feedback.rating)}</span>
                    <span className="feedback-rating-number">({feedback.rating}/5)</span>
                  </div>
                </div>
                
                <div className="feedback-message">
                  {feedback.message}
                </div>
                
                <div className="feedback-actions">
                  <div className="feedback-status">
                    <span 
                      className="feedback-status-badge"
                      style={{ backgroundColor: getStatusColor(feedback.status) }}
                    >
                      {feedback.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="feedback-buttons">
                    {feedback.status === 'pending' && (
                      <>
                        <button
                          className="feedback-btn approve"
                          onClick={() => handleStatusChange(feedback.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          className="feedback-btn reject"
                          onClick={() => handleStatusChange(feedback.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      className="feedback-btn delete"
                      onClick={() => handleDeleteFeedback(feedback.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback; 