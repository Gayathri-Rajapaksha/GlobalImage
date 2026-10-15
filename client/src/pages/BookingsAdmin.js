import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookingsAdmin.css';
import '../pages/PortfolioAdmin.css';
import * as XLSX from 'xlsx';

const BookingsAdmin = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    advanceRevenue: 0
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [searchTerm, setSearchTerm] = useState('');
  const [clickedEmailButtons, setClickedEmailButtons] = useState(new Set());
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const syncAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('storage', syncAdmin);
    window.addEventListener('login', syncAdmin);
    
    if (!isAdmin) {
      navigate('/signin');
      return;
    }

    fetchBookings();
    fetchStats();
    fetchNotifications();
    
    // Clear clicked buttons when page loads
    setClickedEmailButtons(new Set());
    
    return () => {
      window.removeEventListener('storage', syncAdmin);
      window.removeEventListener('login', syncAdmin);
    };
  }, [isAdmin, navigate]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5050/api/bookings/notifications', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notifications.length > 0) {
          // Filter out notifications that have been dismissed locally
          const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedBookingNotifications') || '[]');
          const newNotifications = data.notifications.filter(notification => 
            !dismissedNotifications.includes(notification.timestamp)
          );
          
          if (newNotifications.length > 0) {
            setNotifications(newNotifications);
            setShowNotifications(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch booking notifications:', err);
    }
  };

  const dismissNotification = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5050/api/bookings/notifications/${notification.timestamp}/read`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      // Store dismissed notification in localStorage
      const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedBookingNotifications') || '[]');
      dismissedNotifications.push(notification.timestamp);
      localStorage.setItem('dismissedBookingNotifications', JSON.stringify(dismissedNotifications));
      
      setNotifications(prev => prev.filter(n => n.timestamp !== notification.timestamp));
      if (notifications.length <= 1) {
        setShowNotifications(false);
      }
    } catch (err) {
      console.error('Failed to dismiss booking notification:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5050/api/bookings', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data.bookings);
    } catch (error) {
      console.error('Fetch bookings error:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5050/api/bookings/stats/overview', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const updateBookingStatus = async (bookingId, status, adminNotes = '', assignedPhotographer = '') => {
    try {
      console.log('Updating booking status:', bookingId, 'to status:', status);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5050/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          bookingStatus: status,
          adminNotes,
          assignedPhotographer
        })
      });

      console.log('Status update response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(`Failed to update booking status: ${errorData.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Status update successful:', result);
      
      // Show success message with additional info for cancellations
      if (status === 'cancelled') {
        alert(`Booking status updated to cancelled successfully!\n\nRemember to send a cancellation email to the customer using the Gmail button.`);
      } else {
        alert('Booking status updated successfully!');
      }
      
      // Refresh bookings and stats
      fetchBookings();
      fetchStats();
      setShowModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Update booking error:', error);
      alert(`Failed to update booking status: ${error.message}`);
    }
  };

  const approveBooking = async (bookingId, approvalStatus, adminNotes = '', assignedPhotographer = '') => {
    try {
      console.log('Approving booking:', bookingId, 'with status:', approvalStatus);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5050/api/bookings/${bookingId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          adminApprovalStatus: approvalStatus,
          adminApprovedBy: 'Admin',
          adminNotes
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(`Failed to approve booking: ${errorData.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Approval successful:', result);
      
      // Refresh bookings and stats
      fetchBookings();
      fetchStats();
      setShowModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Approve booking error:', error);
      alert(`Failed to approve booking: ${error.message}`);
    }
  };

  const uploadTransactionFile = async (bookingId, file) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('transactionFile', file);

      const response = await fetch(`http://localhost:5050/api/bookings/${bookingId}/transaction-file`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload transaction file');
      
      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Upload transaction file error:', error);
      alert('Failed to upload transaction file');
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5050/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) throw new Error('Failed to delete booking');
      
      fetchBookings();
      fetchStats();
    } catch (error) {
      console.error('Delete booking error:', error);
      alert('Failed to delete booking');
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'completed': return '#17a2b8';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: getStatusColor(status) }}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.bookingStatus === filterStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const generateBookingReport = async () => {
    try {
      setReportLoading(true);
      console.log('Generating booking report...');
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5050/api/bookings/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          includeAllData: true,
          format: 'detailed'
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
      alert(`Failed to generate booking report: ${error.message}`);
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
      
      const response = await fetch(`http://localhost:5050/api/bookings/report/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
      a.download = `booking-report-${new Date().toISOString().split('T')[0]}.${format}`;
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
      if (!bookings || bookings.length === 0) {
        alert('No booking data available for Excel report');
        return;
      }

      const wb = XLSX.utils.book_new();
      
      // Detailed bookings sheet
      const bookingData = bookings.map(booking => ({
        'Booking ID': booking.bookingId || booking._id?.slice(-6) || 'N/A',
        'Client Name': booking.clientName || 'N/A',
        'Service': booking.serviceName || 'N/A',
        'Event Date': booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : 'N/A',
        'Total Amount (LKR)': booking.totalAmount || 0,
        'Advance Amount (LKR)': booking.advanceAmount || 0,
        'Status': booking.bookingStatus || 'N/A',
        'Payment Status': booking.paymentStatus || 'N/A',
        'Contact Number': booking.contactNumber || 'N/A',
        'Email': booking.email || 'N/A',
        'Venue': booking.venue || 'N/A',
        'Location': booking.location || 'N/A',
        'Created Date': booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'
      }));
      
      const bookingWs = XLSX.utils.json_to_sheet(bookingData);
      XLSX.utils.book_append_sheet(wb, bookingWs, 'Bookings');
      
      // Auto-size columns for bookings sheet
      const colWidths = [
        { wch: 15 }, // Booking ID
        { wch: 20 }, // Client Name
        { wch: 20 }, // Service
        { wch: 15 }, // Event Date
        { wch: 18 }, // Total Amount
        { wch: 18 }, // Advance Amount
        { wch: 12 }, // Status
        { wch: 15 }, // Payment Status
        { wch: 15 }, // Contact Number
        { wch: 30 }, // Email
        { wch: 15 }, // Venue
        { wch: 15 }, // Location
        { wch: 15 }  // Created Date
      ];
      bookingWs['!cols'] = colWidths;
      
      // Summary statistics sheet
      const summaryData = [
        { 'Metric': 'Total Bookings', 'Count': stats.totalBookings },
        { 'Metric': 'Confirmed Bookings', 'Count': stats.confirmedBookings },
        { 'Metric': 'Pending Bookings', 'Count': stats.pendingBookings },
        { 'Metric': 'Completed Bookings', 'Count': stats.completedBookings },
        { 'Metric': 'Cancelled Bookings', 'Count': stats.cancelledBookings },
        { 'Metric': 'Total Revenue (LKR)', 'Count': stats.totalRevenue?.toLocaleString() },
        { 'Metric': 'Advance Revenue (LKR)', 'Count': stats.advanceRevenue?.toLocaleString() }
      ];
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Auto-size columns for summary sheet
      const summaryColWidths = [
        { wch: 25 }, // Metric
        { wch: 20 }  // Count
      ];
      summaryWs['!cols'] = summaryColWidths;
      
      XLSX.writeFile(wb, `bookings-comprehensive-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      alert('Comprehensive Excel report generated successfully!');
    } catch (err) {
      console.error('Excel generation error:', err);
      alert('Failed to generate Excel report');
    }
  };

  const generateConfirmedBookingReport = async () => {
    try {
      // Filter confirmed bookings
      const confirmedBookings = bookings.filter(booking => 
        booking.bookingStatus === 'confirmed' || 
        booking.adminApprovalStatus === 'approved'
      );

      if (confirmedBookings.length === 0) {
        alert('No confirmed bookings found for report');
        return;
      }

      // Calculate confirmed bookings statistics
      const confirmedStats = {
        totalConfirmedBookings: confirmedBookings.length,
        totalConfirmedRevenue: confirmedBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
        advanceRevenue: confirmedBookings.reduce((sum, booking) => sum + (booking.advanceAmount || 0), 0),
        averageBookingValue: confirmedBookings.length > 0 ? 
          (confirmedBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0) / confirmedBookings.length).toFixed(2) : 0
      };

      // Prepare report data for confirmed bookings
      const reportData = {
        bookings: confirmedBookings,
        totalBookings: confirmedStats.totalConfirmedBookings,
        totalRevenue: confirmedStats.totalConfirmedRevenue,
        advanceRevenue: confirmedStats.advanceRevenue,
        averageBookingValue: confirmedStats.averageBookingValue,
        confirmedBookings: confirmedStats.totalConfirmedBookings,
        pendingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0
      };

      // Generate and download PDF
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5050/api/bookings/report/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
      a.download = `confirmed-bookings-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Confirmed bookings PDF report downloaded successfully');
      alert(`Confirmed bookings report generated successfully! Found ${confirmedStats.totalConfirmedBookings} confirmed bookings.`);
    } catch (error) {
      console.error('Generate confirmed booking report error:', error);
      alert(`Failed to generate confirmed bookings report: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="bookings-admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookings-admin-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={fetchBookings}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="bookings-admin-bg">
      {/* Client Booking Notifications */}
      {showNotifications && notifications.length > 0 && (
        <div className="notification-banner">
          <div className="notification-content">
            <div className="notification-header">
              <div className="notification-icon">📅</div>
              <div className="notification-title">
                <h4>New Booking Requests</h4>
                <p>{notifications.length} new {notifications.length === 1 ? 'booking' : 'bookings'} received</p>
              </div>
              <button 
                className="notification-close-all"
                onClick={() => {
                  // Store all current notifications as dismissed
                  const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedBookingNotifications') || '[]');
                  notifications.forEach(notification => {
                    if (!dismissedNotifications.includes(notification.timestamp)) {
                      dismissedNotifications.push(notification.timestamp);
                    }
                  });
                  localStorage.setItem('dismissedBookingNotifications', JSON.stringify(dismissedNotifications));
                  
                  // Mark all as read on server
                  const token = localStorage.getItem('token');
                  notifications.forEach(notification => {
                    fetch(`http://localhost:5050/api/bookings/notifications/${notification.timestamp}/read`, {
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
              <div key={index} className="notification-item">
                <div className="notification-item-icon">📋</div>
                <div className="notification-item-content">
                  <span>{notification.clientName}</span>
                  <div className="notification-item-meta">
                    {notification.service} • {new Date(notification.eventDate).toLocaleDateString()}
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

      <div className="bookings-admin-container">
        {/* Header */}
        <div className="bookings-admin-header">
          <div className="header-content">
            <div>
              <h1>Booking Management</h1>
              <p>Manage all customer bookings and payments</p>
            </div>
            <div className="header-actions">
              <button 
                className="pdf-report-btn"
                onClick={generateConfirmedBookingReport}
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

        {/* Statistics Cards */}
        <div className="bookings-stats-grid">
          <div className="booking-stat-card">
            <div className="booking-stat-icon">📊</div>
            <div className="booking-stat-content">
              <div className="booking-stat-number">{stats.totalBookings}</div>
              <div className="booking-stat-label">Total Bookings</div>
            </div>
          </div>
          <div className="booking-stat-card">
            <div className="booking-stat-icon">✅</div>
            <div className="booking-stat-content">
              <div className="booking-stat-number">{stats.confirmedBookings}</div>
              <div className="booking-stat-label">Confirmed</div>
            </div>
          </div>
          <div className="booking-stat-card">
            <div className="booking-stat-icon">⏳</div>
            <div className="booking-stat-content">
              <div className="booking-stat-number">{stats.pendingBookings}</div>
              <div className="booking-stat-label">Pending</div>
            </div>
          </div>
                     <div className="booking-stat-card">
             <div className="booking-stat-icon">💰</div>
             <div className="booking-stat-content">
               <div className="booking-stat-number">LKR {stats.totalRevenue?.toLocaleString()}</div>
               <div className="booking-stat-label">Total Revenue</div>
             </div>
           </div>
           <div className="booking-stat-card">
             <div className="booking-stat-icon">💳</div>
             <div className="booking-stat-content">
               <div className="booking-stat-number">LKR {stats.advanceRevenue?.toLocaleString()}</div>
               <div className="booking-stat-label">Advance Revenue</div>
             </div>
           </div>
        </div>

        {/* Filters */}
        <div className="bookings-filters">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="booking-filter-select"
          >
            <option value="all">All Bookings</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Bookings List */}
        <div className="bookings-list">
          {filteredBookings.length === 0 ? (
            <div className="no-bookings">
              <div className="no-bookings-icon">📋</div>
              <h3>No bookings found</h3>
              <p>There are no bookings matching your current filter.</p>
            </div>
          ) : (
            filteredBookings.map(booking => (
              <div key={booking._id} className={`booking-card ${booking.bookingStatus === 'cancelled' ? 'cancelled' : ''}`}>
                <div className="booking-card-header">
                  <div className="booking-id">#{booking.bookingId}</div>
                  {getStatusBadge(booking.bookingStatus)}
                  {booking.bookingStatus === 'cancelled' && booking.emailSent?.bookingCancellation && (
                    <span className="cancellation-email-sent" title="Cancellation email sent">
                      📧 Email Sent
                    </span>
                  )}
                </div>
                
                <div className="booking-card-content">
                  <div className="booking-info">
                    <div className="booking-customer">
                      <h4>{booking.fullName}</h4>
                      <div className="customer-contact">
                        <p className="customer-email">
                          <span className="contact-label">📧</span>
                          <span className="contact-value">{booking.email || 'Not provided'}</span>
                        </p>
                        <p className="customer-phone">
                          <span className="contact-label">📞</span>
                          <span className="contact-value">{booking.contactNumber}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="booking-event">
                      <h4>{booking.selectedService?.title || 'Service'}</h4>
                      <p>📅 {formatDate(booking.date)}</p>
                      <p>⏰ {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                      <p>📍 {booking.location} - {booking.venue}</p>
                    </div>
                    
                                         <div className="booking-details">
                       <p><strong>Event:</strong> {booking.eventType}</p>
                       <p><strong>Guests:</strong> {booking.estimatedGuests}</p>
                       <p><strong>Duration:</strong> {booking.duration} hours</p>
                       <p><strong>Photographers:</strong> {booking.photographers}</p>
                       <p><strong>Total Amount:</strong> LKR {booking.totalAmount?.toLocaleString()}</p>
                       <p><strong>Advance Paid:</strong> LKR {booking.advanceAmount?.toLocaleString()}</p>
                       <p><strong>Remaining:</strong> LKR {booking.remainingAmount?.toLocaleString()}</p>
                       <p><strong>Payment Slip:</strong> {booking.paymentSlipFile}</p>
                                               {booking.paymentSlipFile && (
                          <div className="file-actions">
                            <button 
                              className="view-file-btn"
                              onClick={() => {
                                // Handle both Cloudinary URLs and local files
                                let fileUrl;
                                let filename;
                                const token = localStorage.getItem('token');
                                
                                if (booking.paymentSlipFile.startsWith('http://') || booking.paymentSlipFile.startsWith('https://')) {
                                  // For Cloudinary URLs, add download parameter
                                  fileUrl = booking.paymentSlipFile.includes('?') 
                                    ? booking.paymentSlipFile + '&fl_attachment=true'
                                    : booking.paymentSlipFile + '?fl_attachment=true';
                                  filename = booking.paymentSlipFile.split('/').pop().split('?')[0];
                                } else {
                                  // For local files, use protected endpoint with token query
                                  filename = booking.paymentSlipFile.startsWith('/uploads/') 
                                    ? booking.paymentSlipFile.split('/').pop() 
                                    : booking.paymentSlipFile;
                                  const authParam = token ? `?token=${encodeURIComponent(token)}` : '';
                                  fileUrl = `http://localhost:5050/api/files/payment-slip/${encodeURIComponent(filename)}${authParam}`;
                                }
                                
                                console.log('Downloading payment slip:', filename);
                                console.log('File URL:', fileUrl);
                                
                                // Create hidden link for download
                                const link = document.createElement('a');
                                link.href = fileUrl;
                                link.download = filename;
                                link.target = '_blank';
                                link.style.display = 'none';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              📥 Download Payment Slip
                            </button>
                          </div>
                        )}
                       <p><strong>Payment Status:</strong> {booking.paymentStatus}</p>
                       <p><strong>Admin Approval:</strong> {booking.adminApprovalStatus}</p>
                     </div>
                  </div>
                  
                  {booking.specialRequirements && (
                    <div className="booking-requirements">
                      <h5>Special Requirements:</h5>
                      <p>{booking.specialRequirements}</p>
                    </div>
                  )}
                  
                  {booking.bookingStatus === 'cancelled' && booking.emailSent?.bookingCancellation && (
                    <div className="booking-cancellation-info">
                      <h5>📧 Cancellation Email Sent:</h5>
                      <p>Sent on: {new Date(booking.cancellationEmailSentAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {booking.adminNotes && (
                    <div className="booking-notes">
                      <h5>Admin Notes:</h5>
                      <p>{booking.adminNotes}</p>
                    </div>
                  )}
                  
                  {booking.assignedPhotographer && (
                    <div className="booking-photographer">
                      <h5>Assigned Photographer:</h5>
                      <p>{booking.assignedPhotographer}</p>
                    </div>
                  )}
                </div>
                
                <div className="booking-card-actions">
                  <button 
                    className="booking-action-btn edit"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowModal(true);
                    }}
                  >
                    Edit Status
                  </button>
                  <button 
                    className="booking-action-btn invoice"
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      const authParam = token ? `?token=${encodeURIComponent(token)}` : '';
                      const link = document.createElement('a');
                      link.href = `http://localhost:5050/api/invoice/${booking._id}${authParam}`;
                      link.download = `invoice-${booking.bookingId}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    📄 Invoice
                  </button>
                  <button 
                    className="booking-action-btn gmail"
                    onClick={(event) => {
                      // Mark this button as clicked
                      setClickedEmailButtons(prev => new Set([...prev, booking._id]));
                      
                      let subject, body;
                      
                      if (booking.bookingStatus === 'cancelled') {
                        // For cancelled bookings, show cancellation information
                        subject = `Booking Cancelled - ${booking.bookingId}`;
                        body = `Dear ${booking.fullName},

We regret to inform you that your photography booking has been cancelled.

Booking Details:
- Booking ID: ${booking.bookingId}
- Service: ${booking.selectedService?.title || 'Photography Service'}
- Event Date: ${new Date(booking.date).toLocaleDateString()}
- Event Time: ${booking.startTime} - ${booking.endTime}
- Location: ${booking.location}, ${booking.venue}
- Duration: ${booking.duration} hours
- Photographers: ${booking.photographers}
- Total Amount: LKR ${booking.totalAmount?.toLocaleString()}
- Advance Payment: LKR ${booking.advanceAmount?.toLocaleString()}

IMPORTANT: Your advance payment of LKR ${booking.advanceAmount?.toLocaleString()} will be refunded.
The refund process will be initiated within 3-5 business days.

If you have any questions about this cancellation or the refund process, please contact us:
Phone: 077-7155653
Email: globalimagelanka@gmail.com

We apologize for any inconvenience this may have caused.

Best regards,
Global Image Photography Team`;
                      } else {
                        // For other statuses, show confirmation or general information
                        subject = `Booking Update - ${booking.bookingId}`;
                        body = `Dear ${booking.fullName},

Your photography booking status has been updated.

Booking Details:
- Booking ID: ${booking.bookingId}
- Service: ${booking.selectedService?.title || 'Photography Service'}
- Event Date: ${new Date(booking.date).toLocaleDateString()}
- Event Time: ${booking.startTime} - ${booking.endTime}
- Location: ${booking.location}, ${booking.venue}
- Duration: ${booking.duration} hours
- Photographers: ${booking.photographers}
- Total Amount: LKR ${booking.totalAmount?.toLocaleString()}
- Current Status: ${booking.bookingStatus.toUpperCase()}
- Payment Status: ${booking.paymentStatus}

${booking.adminNotes ? `Admin Notes: ${booking.adminNotes}` : ''}

If you have any questions, please contact us:
Phone: 077-7155653
Email: globalimagelanka@gmail.com

Best regards,
Global Image Photography Team`;
                      }

                      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(booking.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      window.open(gmailUrl, '_blank');
                    }}
                    disabled={booking.bookingStatus === 'cancelled' && (booking.emailSent?.bookingCancellation || clickedEmailButtons.has(booking._id))}
                    title={booking.bookingStatus === 'cancelled' && (booking.emailSent?.bookingCancellation || clickedEmailButtons.has(booking._id)) ? 'Cancellation email already sent' : 'Send email to customer'}
                  >
                    {booking.bookingStatus === 'cancelled' 
                      ? ((booking.emailSent?.bookingCancellation || clickedEmailButtons.has(booking._id)) ? '📧 Email Sent ✓' : '📧 Cancellation Email')
                      : '📧 Gmail'
                    }
                  </button>
                  
                  <button 
                    className="booking-action-btn delete"
                    onClick={() => deleteBooking(booking._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Booking Modal */}
      {showModal && selectedBooking && (
        <div className="booking-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="booking-modal" onClick={e => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h3>Edit Booking Status</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
                         <div className="booking-modal-content">
               <div className="modal-section">
                 <label>Admin Approval Status:</label>
                 <select 
                   value={selectedBooking.adminApprovalStatus}
                   onChange={(e) => setSelectedBooking({
                     ...selectedBooking,
                     adminApprovalStatus: e.target.value
                   })}
                 >
                   <option value="pending">Pending</option>
                   <option value="approved">Approved</option>
                   <option value="rejected">Rejected</option>
                 </select>
               </div>
               
               <div className="modal-section">
                 <label>Booking Status:</label>
                 <select 
                   value={selectedBooking.bookingStatus}
                   onChange={(e) => setSelectedBooking({
                     ...selectedBooking,
                     bookingStatus: e.target.value
                   })}
                 >
                   <option value="pending">Pending</option>
                   <option value="confirmed">Confirmed</option>
                   <option value="completed">Completed</option>
                   <option value="cancelled">Cancelled</option>
                 </select>
               </div>
               
               <div className="modal-section">
                 <label>Assigned Photographer:</label>
                 <input 
                   type="text"
                   value={selectedBooking.assignedPhotographer || ''}
                   onChange={(e) => setSelectedBooking({
                     ...selectedBooking,
                     assignedPhotographer: e.target.value
                   })}
                   placeholder="Enter photographer name"
                 />
               </div>
               

               
               <div className="modal-section">
                 <label>Admin Notes:</label>
                 <textarea
                   value={selectedBooking.adminNotes || ''}
                   onChange={(e) => setSelectedBooking({
                     ...selectedBooking,
                     adminNotes: e.target.value
                   })}
                   placeholder="Add any notes or comments..."
                   rows="4"
                 />
               </div>
             </div>
            
            <div className="booking-modal-actions">
              <button 
                className="modal-btn cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
                             <button 
                 className="modal-btn save"
                 onClick={() => {
                   if (selectedBooking.adminApprovalStatus === 'approved') {
                     approveBooking(
                       selectedBooking._id,
                       selectedBooking.adminApprovalStatus,
                       selectedBooking.adminNotes,
                       selectedBooking.assignedPhotographer
                     );
                   } else {
                     updateBookingStatus(
                       selectedBooking._id,
                       selectedBooking.bookingStatus,
                       selectedBooking.adminNotes,
                       selectedBooking.assignedPhotographer
                     );
                   }
                 }}
               >
                 Save Changes
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <h2>📊 Booking Report</h2>
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
                    <span className="summary-label">Total Bookings:</span>
                    <span className="summary-value">{reportData.totalBookings}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Total Revenue:</span>
                    <span className="summary-value">LKR {reportData.totalRevenue?.toLocaleString()}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Confirmed Bookings:</span>
                    <span className="summary-value">{reportData.confirmedBookings}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Pending Bookings:</span>
                    <span className="summary-value">{reportData.pendingBookings}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Completed Bookings:</span>
                    <span className="summary-value">{reportData.completedBookings}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Cancelled Bookings:</span>
                    <span className="summary-value">{reportData.cancelledBookings}</span>
                  </div>
                </div>
              </div>

              <div className="report-details">
                <h3>Detailed Bookings</h3>
                <div className="report-bookings-list">
                  {reportData.bookings?.map((booking, index) => (
                    <div key={booking._id || index} className="report-booking-item">
                      <div className="report-booking-header">
                        <span className="booking-id">#{booking._id?.slice(-6) || index + 1}</span>
                        <span className={`booking-status ${booking.bookingStatus}`}>
                          {booking.bookingStatus}
                        </span>
                      </div>
                      <div className="report-booking-details">
                        <div className="booking-info">
                          <span><strong>Client:</strong> {booking.clientName}</span>
                          <span><strong>Service:</strong> {booking.serviceName}</span>
                          <span><strong>Date:</strong> {formatDate(booking.eventDate)}</span>
                          <span><strong>Amount:</strong> LKR {booking.totalAmount?.toLocaleString()}</span>
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

export default BookingsAdmin; 