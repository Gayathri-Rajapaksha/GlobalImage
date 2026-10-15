import React, { useState, useEffect } from 'react';
import './FeedbackAdmin.css';
import * as XLSX from 'xlsx';

const FeedbackAdmin = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    resolved: 0,
    avgRating: 0
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchFeedback();
    fetchStats();
    fetchNotifications();
  }, []);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5050/api/feedback/all', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      } else {
        setError('Failed to fetch feedback');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5050/api/feedback/stats', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchNotifications = async () => {
    try {
      console.log('Fetching feedback notifications...');
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5050/api/feedback/notifications', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Feedback notifications response:', data);
        if (data.success && data.notifications.length > 0) {
          // Filter out notifications that have been dismissed locally
          const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedFeedbackNotifications') || '[]');
          console.log('Dismissed notifications:', dismissedNotifications);
          const newNotifications = data.notifications.filter(notification => 
            !dismissedNotifications.includes(notification.timestamp)
          );
          console.log('New notifications after filtering:', newNotifications);
          
          setNotifications(data.notifications); // Show all notifications for debugging
          setShowNotifications(data.notifications.length > 0);
        } else {
          console.log('No notifications found or API call failed');
          setNotifications([]);
          setShowNotifications(false);
        }
      } else {
        console.error('Failed to fetch notifications, status:', res.status);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const dismissNotification = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5050/api/feedback/notifications/${notification._id}/read`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      // Store dismissed notification in localStorage
      const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedFeedbackNotifications') || '[]');
      dismissedNotifications.push(notification.timestamp);
      localStorage.setItem('dismissedFeedbackNotifications', JSON.stringify(dismissedNotifications));
      
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      if (notifications.length <= 1) {
        setShowNotifications(false);
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
  };

  const handleUpdateStatus = async (feedbackId, status, adminResponse) => {
    setUpdateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5050/api/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, adminResponse })
      });
      
      if (res.ok) {
        await fetchFeedback();
        await fetchStats();
        setShowModal(false);
        setSelectedFeedback(null);
      } else {
        setError('Failed to update status');
      }
    } catch (err) {
      setError('Network error');
    }
    setUpdateLoading(false);
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5050/api/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        await fetchFeedback();
        await fetchStats();
      } else {
        setError('Failed to delete feedback');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'reviewed': return '#2196f3';
      case 'resolved': return '#4caf50';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'reviewed': return 'Reviewed';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  const generateFeedbackReport = async () => {
    try {
      setReportLoading(true);
      console.log('Generating feedback report...');
      
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('http://localhost:5050/api/admin/feedback/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          includeAllData: true,
          format: 'detailed',
          confirmedFeedbacks: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to generate report: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Report data received:', data);
      
      if (data.success && data.reportData) {
        setReportData(data.reportData);
        setShowReportModal(true);
      } else {
        throw new Error('Invalid report data received');
      }
    } catch (error) {
      console.error('Generate report error:', error);
      alert(`Failed to generate feedback report: ${error.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReport = async (format = 'pdf') => {
    if (!reportData) {
      alert('Please generate a report first');
      return;
    }
    
    try {
      console.log('Downloading report with format:', format);
      console.log('Report data:', reportData);
      
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`http://localhost:5050/api/admin/feedback/report/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          reportData: reportData,
          format: format
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to download report: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Download report error:', error);
      alert(`Failed to download report: ${error.message}`);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      if (!feedback || feedback.length === 0) {
        alert('No feedback data available for Excel report');
        return;
      }

      const wb = XLSX.utils.book_new();
      
      // Detailed feedback sheet
      const feedbackData = feedback.map(feedbackItem => ({
        'Name': feedbackItem.name || 'N/A',
        'Email': feedbackItem.email || 'N/A',
        'Subject': feedbackItem.subject || 'N/A',
        'Message': feedbackItem.message || 'N/A',
        'Rating': feedbackItem.rating || 0,
        'Status': feedbackItem.status || 'N/A',
        'Admin Response': feedbackItem.adminResponse || 'N/A',
        'Created Date': feedbackItem.createdAt ? new Date(feedbackItem.createdAt).toLocaleDateString() : 'N/A',
        'Updated Date': feedbackItem.updatedAt ? new Date(feedbackItem.updatedAt).toLocaleDateString() : 'N/A'
      }));
      
      const feedbackWs = XLSX.utils.json_to_sheet(feedbackData);
      XLSX.utils.book_append_sheet(wb, feedbackWs, 'Feedback');
      
      // Auto-size columns for feedback sheet
      const colWidths = [
        { wch: 20 }, // Name
        { wch: 30 }, // Email
        { wch: 25 }, // Subject
        { wch: 50 }, // Message
        { wch: 10 }, // Rating
        { wch: 15 }, // Status
        { wch: 40 }, // Admin Response
        { wch: 15 }, // Created Date
        { wch: 15 }  // Updated Date
      ];
      feedbackWs['!cols'] = colWidths;
      
      // Summary statistics sheet
      const totalFeedback = feedback.length;
      const confirmedFeedback = feedback.filter(f => f.status === 'resolved').length;
      const pendingFeedback = feedback.filter(f => f.status === 'pending').length;
      const reviewedFeedback = feedback.filter(f => f.status === 'reviewed').length;
      const averageRating = feedback.length > 0 ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1) : 0;
      const respondedFeedback = feedback.filter(f => f.adminResponse && f.adminResponse.trim() !== '').length;
      
      const summaryData = [
        { 'Metric': 'Total Feedback', 'Count': totalFeedback },
        { 'Metric': 'Confirmed/Resolved', 'Count': confirmedFeedback },
        { 'Metric': 'Pending', 'Count': pendingFeedback },
        { 'Metric': 'Reviewed', 'Count': reviewedFeedback },
        { 'Metric': 'Average Rating', 'Count': averageRating },
        { 'Metric': 'With Admin Response', 'Count': respondedFeedback }
      ];
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Auto-size columns for summary sheet
      const summaryColWidths = [
        { wch: 25 }, // Metric
        { wch: 20 }  // Count
      ];
      summaryWs['!cols'] = summaryColWidths;
      
      XLSX.writeFile(wb, `feedback-comprehensive-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      alert('Comprehensive Excel report generated successfully!');
    } catch (err) {
      console.error('Excel generation error:', err);
      alert('Failed to generate Excel report');
    }
  };

  const generateResolvedFeedbackReport = async () => {
    try {
      // Filter resolved feedback
      const resolvedFeedback = feedback.filter(feedbackItem => 
        feedbackItem.status === 'resolved'
      );

      if (resolvedFeedback.length === 0) {
        alert('No resolved feedback found for report');
        return;
      }

      // Calculate resolved feedback statistics
      const resolvedStats = {
        totalResolvedFeedback: resolvedFeedback.length,
        averageRating: resolvedFeedback.length > 0 ? 
          (resolvedFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / resolvedFeedback.length).toFixed(1) : 0,
        withAdminResponse: resolvedFeedback.filter(f => f.adminResponse && f.adminResponse.trim() !== '').length,
        totalRatings: resolvedFeedback.reduce((sum, f) => sum + (f.rating || 0), 0)
      };

      // Prepare report data for resolved feedback
      const reportData = {
        feedback: resolvedFeedback,
        totalFeedback: resolvedStats.totalResolvedFeedback,
        averageRating: resolvedStats.averageRating,
        withAdminResponse: resolvedStats.withAdminResponse,
        totalRatings: resolvedStats.totalRatings
      };

      // Generate and download PDF
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`http://localhost:5050/api/admin/feedback/report/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          reportData: reportData,
          format: 'pdf'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to download report: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resolved-feedback-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Resolved feedback PDF report downloaded successfully');
      alert(`Resolved feedback report generated successfully! Found ${resolvedStats.totalResolvedFeedback} resolved feedback items.`);
    } catch (error) {
      console.error('Generate resolved feedback report error:', error);
      alert(`Failed to generate resolved feedback report: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="feedback-admin">
        <div className="loading">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="feedback-admin">
      {/* Feedback Notifications */}
      {notifications.length > 0 && (
        <div className="notification-banner">
          <div className="notification-content">
            <div className="notification-header">
              <div className="notification-icon">💬</div>
              <div className="notification-title">
                <h4>New Feedback Received</h4>
                <p>{notifications.length} new feedback{notifications.length === 1 ? '' : 's'} submitted</p>
              </div>
              <button 
                className="notification-close-all"
                onClick={() => {
                  // Store all current notifications as dismissed
                  const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedFeedbackNotifications') || '[]');
                  notifications.forEach(notification => {
                    if (!dismissedNotifications.includes(notification.timestamp)) {
                      dismissedNotifications.push(notification.timestamp);
                    }
                  });
                  localStorage.setItem('dismissedFeedbackNotifications', JSON.stringify(dismissedNotifications));
                  
                  // Mark all as read on server
                  const token = localStorage.getItem('token');
                  notifications.forEach(notification => {
                    fetch(`http://localhost:5050/api/feedback/notifications/${notification._id}/read`, {
                      method: 'POST',
                      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    }).catch(err => console.error('Failed to mark notification as read:', err));
                  });
                  
                  setNotifications([]);
                  setShowNotifications(false);
                }}
              >
                ×
              </button>
            </div>
            {notifications.map((notification, index) => (
              <div key={notification._id || index} className="notification-item">
                <div className="notification-item-icon">📝</div>
                <div className="notification-item-content">
                  <span>{notification.message}</span>
                  <div className="notification-item-meta">
                    {notification.userEmail} • {new Date(notification.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  className="dismiss-btn"
                  onClick={() => dismissNotification(notification)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="feedback-admin-header">
        <div className="header-content">
          <div>
            <h1>Manage Feedback</h1>
            <p>Review and respond to customer feedback</p>
          </div>
                      <div className="header-actions">
              <button 
                className="pdf-report-btn"
                onClick={generateResolvedFeedbackReport}
              >
                📄 PDF Report
              </button>
              <button 
                className="excel-download-btn"
                onClick={handleDownloadExcel}
              >
                📊 Excel Report
              </button>
            </div>
        </div>
      </div>

      {error && (
        <div className="feedback-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="feedback-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Feedback</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.reviewed}</div>
          <div className="stat-label">Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.avgRating.toFixed(1)}</div>
          <div className="stat-label">Avg Rating</div>
        </div>
      </div>

      <div className="feedback-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-container">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="feedback-grid">
        {filteredFeedback.map((item) => (
          <div key={item._id} className="feedback-card">
            <div className="feedback-header">
              <div className="feedback-info">
                <h3>{item.name}</h3>
                <p className="feedback-email">{item.email}</p>
                <p className="feedback-subject">{item.subject}</p>
              </div>
              <div className="feedback-meta">
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(item.status) }}
                >
                  {getStatusLabel(item.status)}
                </div>
                <div className="rating-display">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`star ${i < item.rating ? 'filled' : ''}`}>
                      ⭐
                    </span>
                  ))}
                </div>
                <div className="feedback-date">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="feedback-message">
              {item.message.length > 150 
                ? `${item.message.substring(0, 150)}...` 
                : item.message
              }
            </div>
            <div className="feedback-actions">
              <button
                onClick={() => handleViewFeedback(item)}
                className="btn-view"
              >
                View Details
              </button>
              <button
                onClick={() => handleDeleteFeedback(item._id)}
                className="btn-delete"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredFeedback.length === 0 && (
        <div className="no-feedback">
          <p>No feedback found matching your criteria.</p>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {showModal && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="feedback-detail">
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedFeedback.name}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedFeedback.email}</span>
                </div>
                <div className="detail-row">
                  <label>Subject:</label>
                  <span>{selectedFeedback.subject}</span>
                </div>
                <div className="detail-row">
                  <label>Rating:</label>
                  <div className="rating-display">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`star ${i < selectedFeedback.rating ? 'filled' : ''}`}>
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedFeedback.status) }}
                  >
                    {getStatusLabel(selectedFeedback.status)}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Message:</label>
                  <div className="message-content">{selectedFeedback.message}</div>
                </div>
                {selectedFeedback.adminResponse && (
                  <div className="detail-row">
                    <label>Admin Response:</label>
                    <div className="admin-response">{selectedFeedback.adminResponse}</div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <select
                  value={selectedFeedback.status}
                  onChange={(e) => setSelectedFeedback({
                    ...selectedFeedback,
                    status: e.target.value
                  })}
                  className="status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
                <textarea
                  placeholder="Add admin response (optional)..."
                  value={selectedFeedback.adminResponse || ''}
                  onChange={(e) => setSelectedFeedback({
                    ...selectedFeedback,
                    adminResponse: e.target.value
                  })}
                  className="admin-response-input"
                  rows={3}
                />
                <div className="action-buttons">
                  <button
                    onClick={() => handleUpdateStatus(
                      selectedFeedback._id,
                      selectedFeedback.status,
                      selectedFeedback.adminResponse
                    )}
                    disabled={updateLoading}
                    className="btn-update"
                  >
                    {updateLoading ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <h2>📊 Feedback Report</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="report-content">
              <div className="report-summary">
                <h3>Report Summary</h3>
                <div className="report-summary-grid">
                  <div className="report-summary-item">
                    <span className="summary-label">Total Feedback:</span>
                    <span className="summary-value">{reportData.totalFeedback}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Confirmed Feedback:</span>
                    <span className="summary-value">{reportData.confirmedFeedbacks}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Pending Feedback:</span>
                    <span className="summary-value">{reportData.pendingFeedbacks}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Reviewed Feedback:</span>
                    <span className="summary-value">{reportData.reviewedFeedbacks}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Resolved Feedback:</span>
                    <span className="summary-value">{reportData.resolvedFeedbacks}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Average Rating:</span>
                    <span className="summary-value">{reportData.averageRating}</span>
                  </div>
                </div>
              </div>

              <div className="report-details">
                <h3>Detailed Feedback Information</h3>
                <div className="report-feedback-list">
                  {reportData.feedback?.map((item, index) => (
                    <div key={item._id || index} className="report-feedback-item">
                      <div className="report-feedback-header">
                        <span className="feedback-id">#{index + 1}</span>
                        <span className={`feedback-status ${item.status}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <div className="report-feedback-details">
                        <div className="feedback-info">
                          <span><strong>Name:</strong> {item.name}</span>
                          <span><strong>Email:</strong> {item.email}</span>
                          <span><strong>Subject:</strong> {item.subject}</span>
                          <span><strong>Rating:</strong> {item.rating}/5</span>
                          <span><strong>Date:</strong> {new Date(item.createdAt).toLocaleDateString()}</span>
                          <span><strong>Message:</strong> {item.message}</span>
                          {item.adminResponse && (
                            <span><strong>Admin Response:</strong> {item.adminResponse}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="report-actions">
                <button 
                  className="download-btn pdf"
                  onClick={() => downloadReport('pdf')}
                >
                  📄 Download PDF
                </button>
                <button 
                  className="download-btn excel"
                  onClick={() => downloadReport('excel')}
                >
                  📊 Download Excel
                </button>
                <button 
                  className="close-btn"
                  onClick={() => setShowReportModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackAdmin; 