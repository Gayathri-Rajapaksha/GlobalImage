import React, { useState, useEffect } from 'react';
import './AllStaff.css';

const AllStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5050/api/staff');
      
      if (!response.ok) {
        throw new Error('Failed to fetch staff data');
      }
      
      const data = await response.json();
      console.log('Staff data received:', data.staff);
      setStaff(data.staff || []);
    } catch (err) {
      console.error('Fetch staff error:', err);
      setError('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="all-staff-bg">
        <div className="all-staff-container">
          <div className="all-staff-loading">
            <div className="loading-spinner"></div>
            <p>Loading our amazing team...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="all-staff-bg">
        <div className="all-staff-container">
          <div className="all-staff-error">
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button onClick={fetchStaff}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="all-staff-bg">
      <div className="all-staff-container">
        <div className="all-staff-header">
          <h1>Meet Our Team</h1>
          <p>Dedicated professionals committed to capturing your special moments</p>
        </div>

        {staff.length === 0 ? (
          <div className="no-staff-message">
            <div className="no-staff-icon">👥</div>
            <h3>Our Team</h3>
            <p>We're assembling our amazing team. Check back soon!</p>
          </div>
        ) : (
          <div className="staff-grid">
            {staff.map((member) => (
              <div key={member._id} className="staff-card">
                <div className="staff-image">
                  {member.imageUrl ? (
                    (() => {
                      // Use direct URL if it's an external resource
                      if (member.imageUrl.startsWith('http://') || member.imageUrl.startsWith('https://')) {
                        return (
                          <img 
                            src={member.imageUrl} 
                            alt={member.name} 
                          />
                        );
                      }
                      // For local uploads, route via backend files endpoint
                      const filename = member.imageUrl.startsWith('/uploads/') 
                        ? member.imageUrl.split('/').pop() 
                        : member.imageUrl;
                      const safeFilename = filename ? encodeURIComponent(filename) : '';
                      return (
                        <img 
                          src={`http://localhost:5050/api/files/staff/${safeFilename}`} 
                          alt={member.name} 
                        />
                      );
                    })()
                  ) : (
                    <div className="staff-placeholder">👤</div>
                  )}
                </div>
                <div className="staff-info">
                  <h3>{member.name}</h3>
                  <p className="staff-position">{member.position}</p>
                  {member.specialization && (
                    <p className="staff-specialization">{member.specialization}</p>
                  )}
                  {Number(member.experience) > 0 && (
                    <p className="staff-experience">
                      {Number(member.experience)} {Number(member.experience) === 1 ? 'year' : 'years'} of experience
                    </p>
                  )}
                  {member.bio && (
                    <p className="staff-bio">{member.bio}</p>
                  )}
                </div>
                <div className="staff-contact">
                  <p>📧 {member.email || 'Email not available'}</p>
                  <p>📞 {member.phone || 'Phone not available'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="team-section">
          <div className="team-info">
            <h2>Why Choose Our Team?</h2>
            <div className="team-features">
              <div className="team-feature">
                <div className="feature-icon">📸</div>
                <h4>Professional Expertise</h4>
                <p>Our photographers bring years of experience and specialized skills to every shoot.</p>
              </div>
              <div className="team-feature">
                <div className="feature-icon">🎨</div>
                <h4>Creative Vision</h4>
                <p>Each team member brings unique artistic perspective to create stunning visuals.</p>
              </div>
              <div className="team-feature">
                <div className="feature-icon">🤝</div>
                <h4>Dedicated Service</h4>
                <p>We're committed to providing exceptional customer service and memorable experiences.</p>
              </div>
              <div className="team-feature">
                <div className="feature-icon">⚡</div>
                <h4>Modern Equipment</h4>
                <p>Using the latest technology and equipment to deliver high-quality results.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllStaff; 