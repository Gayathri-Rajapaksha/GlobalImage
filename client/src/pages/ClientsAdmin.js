import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientsAdmin.css';
import './PortfolioAdmin.css'; // Import shared notification styles
import * as XLSX from 'xlsx';

const ClientsAdmin = () => {
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentClient, setAssignmentClient] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [canAccessPortfolio, setCanAccessPortfolio] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/signin');
      return;
    }
    fetchClients();
    fetchStaff();
    fetchNotifications();
  }, [navigate]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch('http://localhost:5050/api/admin/clients', {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error('Clients fetch error:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch('http://localhost:5050/api/admin/staff', {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch staff');
      }
      
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err) {
      console.error('Staff fetch error:', err);
    }
  };

  // Fetch client registration notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch('http://localhost:5050/api/auth/notifications', {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notifications.length > 0) {
          setNotifications(data.notifications);
          
          // Check if notifications were previously dismissed
          const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedClientNotifications') || '[]');
          const hasNewNotifications = data.notifications.some(notification => 
            !dismissedNotifications.includes(notification.timestamp)
          );
          
          setShowNotification(hasNewNotifications);
        }
      }
    } catch (err) {
      console.error('Failed to fetch client registration notifications:', err);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      await fetch(`http://localhost:5050/api/auth/notifications/${notification._id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      // Store dismissed notification in localStorage
      const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedClientNotifications') || '[]');
      dismissedNotifications.push(notification.timestamp);
      localStorage.setItem('dismissedClientNotifications', JSON.stringify(dismissedNotifications));
      
      setShowNotification(false);
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`http://localhost:5050/api/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete client');
      }
      
      setClients(clients.filter(client => client._id !== clientId));
    } catch (err) {
      console.error('Delete client error:', err);
      alert('Failed to delete client');
    }
  };

  const handleAssignClient = (client) => {
    setAssignmentClient(client);
    // If client is already assigned, keep the current assignment for editing
    // Otherwise, reset to empty for new assignment
    setSelectedStaffId(client.assignedStaff || '');
    setCanAccessPortfolio(client.canAccessPortfolio || false);
    setShowAssignmentModal(true);
  };

  const handleAssignmentSubmit = async () => {
    try {
      console.log('Assignment data:', {
        staffId: selectedStaffId,
        clientId: assignmentClient._id,
        clientName: assignmentClient.name
      });

      if (!selectedStaffId) {
        alert('Please select a staff member');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`http://localhost:5050/api/staff/${selectedStaffId}/assign-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          clientId: assignmentClient._id,
          canAccessPortfolio: canAccessPortfolio
        })
      });
      
      const data = await res.json();
      console.log('Assignment response:', data);
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to assign client');
      }
      
      // Update the client in the list
      setClients(clients.map(client => 
        client._id === assignmentClient._id 
          ? { 
              ...client, 
              assignedStaff: selectedStaffId,
              isAssigned: true,
              canAccessPortfolio: canAccessPortfolio
            }
          : client
      ));
      
      setShowAssignmentModal(false);
      setAssignmentClient(null);
      alert('Client assigned successfully!');
    } catch (err) {
      console.error('Assignment error:', err);
      alert(err.message || 'Failed to assign client');
    }
  };

  const handleRemoveAssignment = async (clientId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`http://localhost:5050/api/admin/clients/${clientId}/assignment`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to remove assignment');
      }
      
      const data = await res.json();
      console.log('Remove assignment response:', data);
      
      // Update the client in the list - ensure assignment fields are properly cleared
      const updatedClients = clients.map(client => 
        client._id === clientId 
          ? { 
              ...client, 
              assignedStaff: null,
              isAssigned: false,
              canAccessPortfolio: false,
              ...data.client 
            }
          : client
      );
      
      console.log('Updated clients after removal:', updatedClients.find(c => c._id === clientId));
      setClients(updatedClients);
      
      alert('Assignment removed successfully!');
    } catch (err) {
      console.error('Remove assignment error:', err);
      alert('Failed to remove assignment');
    }
  };

  const filteredClients = clients.filter(client =>
    client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateClientReport = async () => {
    try {
      setReportLoading(true);
      console.log('Generating client report...');
      
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('http://localhost:5050/api/admin/clients/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          includeAllData: true,
          format: 'detailed',
          lastMonth: true
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
      alert(`Failed to generate client report: ${error.message}`);
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
      
      const response = await fetch(`http://localhost:5050/api/admin/clients/report/download`, {
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
      a.download = `client-report-${new Date().toISOString().split('T')[0]}.${format}`;
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
      if (!clients || clients.length === 0) {
        alert('No client data available for Excel report');
        return;
      }

      const wb = XLSX.utils.book_new();
      
      // Detailed clients sheet
      const clientData = clients.map(client => ({
        'Name': `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'N/A',
        'Email': client.email || 'N/A',
        'Phone': client.phone || 'N/A',
        'Registration Date': client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A',
        'Total Bookings': client.totalBookings || 0,
        'Total Spent (LKR)': client.totalSpent || 0
      }));
      
      const clientWs = XLSX.utils.json_to_sheet(clientData);
      XLSX.utils.book_append_sheet(wb, clientWs, 'Clients');
      
      // Auto-size columns for clients sheet
      const colWidths = [
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // Registration Date
        { wch: 15 }, // Total Bookings
        { wch: 20 }  // Total Spent
      ];
      clientWs['!cols'] = colWidths;
      
      // Summary statistics sheet
      const totalClients = clients.length;
      const activeClients = clients.filter(c => c.totalBookings > 0).length;
      const newClientsThisMonth = clients.filter(c => {
        const createdAt = new Date(c.createdAt);
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }).length;
      const totalRevenue = clients.reduce((sum, client) => sum + (client.totalSpent || 0), 0);
      const averageBookingsPerClient = totalClients > 0 ? (clients.reduce((sum, client) => sum + (client.totalBookings || 0), 0) / totalClients).toFixed(1) : 0;
      
      const summaryData = [
        { 'Metric': 'Total Clients', 'Count': totalClients },
        { 'Metric': 'Active Clients', 'Count': activeClients },
        { 'Metric': 'New Clients This Month', 'Count': newClientsThisMonth },
        { 'Metric': 'Total Revenue (LKR)', 'Count': totalRevenue.toLocaleString() },
        { 'Metric': 'Average Bookings per Client', 'Count': averageBookingsPerClient }
      ];
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Auto-size columns for summary sheet
      const summaryColWidths = [
        { wch: 25 }, // Metric
        { wch: 20 }  // Count
      ];
      summaryWs['!cols'] = summaryColWidths;
      
      XLSX.writeFile(wb, `clients-comprehensive-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      alert('Comprehensive Excel report generated successfully!');
    } catch (err) {
      console.error('Excel generation error:', err);
      alert('Failed to generate Excel report');
    }
  };

  const generateActiveClientReport = async () => {
    try {
      console.log('Generating active client report...');
      
      // First, generate the report data on the server
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      console.log('Generating report data on server...');
      
      const generateResponse = await fetch('http://localhost:5050/api/admin/clients/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          includeAllData: true,
          format: 'detailed',
          lastMonth: true
        })
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to generate report: ${generateResponse.status} ${generateResponse.statusText}`);
      }
      
      const generateData = await generateResponse.json();
      console.log('Report data generated:', generateData);
      
      if (!generateData.success || !generateData.reportData) {
        throw new Error('Invalid report data received from server');
      }

      // Now download the PDF using the generated data
      console.log('Downloading PDF report...');
      
      const downloadResponse = await fetch(`http://localhost:5050/api/admin/clients/report/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          reportData: generateData.reportData,
          format: 'pdf'
        })
      });

      console.log('Download response status:', downloadResponse.status);
      
      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        console.error('Download server response:', errorText);
        throw new Error(`Failed to download report: ${downloadResponse.status} ${downloadResponse.statusText}`);
      }
      
      const blob = await downloadResponse.blob();
      console.log('Blob received:', blob.size, 'bytes');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Clients PDF report downloaded successfully');
      alert(`Clients report generated successfully! Found ${generateData.reportData.totalClients} clients.`);
    } catch (error) {
      console.error('Generate active client report error:', error);
      alert(`Failed to generate active clients report: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="clients-admin-bg">
        <div className="clients-admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clients-admin-bg">
        <div className="clients-admin-error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchClients}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="clients-admin-bg">
      <div className="clients-admin-container">
        {/* Header */}
        <div className="clients-admin-header">
          <div className="header-content">
            <div>
              <h1>Manage Clients</h1>
              <p>View and manage registered client accounts</p>
            </div>
            <div className="header-actions">
              <button 
                className="pdf-report-btn"
                onClick={generateActiveClientReport}
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

        {/* Client Registration Notifications */}
        {showNotification && notifications.length > 0 && (
          <div className="notification-banner">
            <div className="notification-content">
              <div className="notification-header">
                <div className="notification-icon">👥</div>
                <div className="notification-title">
                  <h4>New Client Registrations</h4>
                  <p>{notifications.length} new client{notifications.length === 1 ? '' : 's'} registered</p>
                </div>
                <button 
                  className="notification-close-all"
                  onClick={() => {
                    // Store all current notifications as dismissed
                    const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedClientNotifications') || '[]');
                    notifications.forEach(notification => {
                      if (!dismissedNotifications.includes(notification.timestamp)) {
                        dismissedNotifications.push(notification.timestamp);
                      }
                    });
                    localStorage.setItem('dismissedClientNotifications', JSON.stringify(dismissedNotifications));
                    
                    // Mark all as read on server
                    notifications.forEach(notification => {
                      fetch(`http://localhost:5050/api/auth/notifications/${notification._id}/read`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                      }).catch(err => console.error('Failed to mark notification as read:', err));
                    });
                    
                    setNotifications([]);
                    setShowNotification(false);
                  }}
                >
                  ×
                </button>
              </div>
              {notifications.map((notification, index) => (
                <div key={notification._id || index} className="notification-item">
                  <div className="notification-item-icon">👤</div>
                  <div className="notification-item-content">
                    <span>{notification.message || `New client: ${notification.userEmail}`}</span>
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

        {/* Search and Stats */}
        <div className="clients-admin-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-number">{clients.length}</span>
              <span className="stat-label">Total Clients</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredClients.length}</span>
              <span className="stat-label">Filtered</span>
            </div>
            {notifications.length > 0 && (
              <div className="stat-item notification-stat">
                <span className="stat-number">{notifications.length}</span>
                <span className="stat-label">New Registrations</span>
              </div>
            )}
          </div>
        </div>

        {/* Clients List */}
        <div className="clients-grid">
          {filteredClients.length === 0 ? (
            <div className="no-clients">
              <div className="no-clients-icon">👥</div>
              <h3>No Clients Found</h3>
              <p>{searchTerm ? 'No clients match your search criteria.' : 'No clients have registered yet.'}</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div key={client._id} className={`client-card ${client.isAssigned ? 'assigned' : ''}`}>
                <div className="client-avatar">
                  <span>{client.firstName?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="client-info">
                  <h3 className="client-name">
                    {client.firstName} {client.lastName}
                  </h3>
                  <p className="client-email">{client.email}</p>
                  {client.phone && (
                    <p className="client-phone">{client.phone}</p>
                  )}
                  <p className="client-joined">
                    Joined: {formatDate(client.createdAt)}
                  </p>
                </div>
                <div className="client-actions">
                  <button
                    onClick={() => handleViewClient(client)}
                    className="client-action-btn view"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleAssignClient(client)}
                    className="client-action-btn assign"
                  >
                    {client.isAssigned ? 'Reassign' : 'Assign'}
                  </button>
                  {client.isAssigned && (
                    <button
                      onClick={() => handleRemoveAssignment(client._id)}
                      className="client-action-btn remove"
                    >
                      Remove Assignment
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClient(client._id)}
                    className="client-action-btn delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Client Details Modal */}
      {showModal && selectedClient && (
        <div className="client-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="client-modal" onClick={(e) => e.stopPropagation()}>
            <div className="client-modal-header">
              <h3>Client Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="client-modal-content">
              <div className="client-detail-item">
                <label>Full Name:</label>
                <span>{selectedClient.firstName} {selectedClient.lastName}</span>
              </div>
              <div className="client-detail-item">
                <label>Email:</label>
                <span>{selectedClient.email}</span>
              </div>
              {selectedClient.phone && (
                <div className="client-detail-item">
                  <label>Phone:</label>
                  <span>{selectedClient.phone}</span>
                </div>
              )}
              <div className="client-detail-item">
                <label>Registration Date:</label>
                <span>{formatDate(selectedClient.createdAt)}</span>
              </div>
              <div className="client-detail-item">
                <label>Account Status:</label>
                <span className="status-active">Active</span>
              </div>
            </div>
            <div className="client-modal-actions">
              <button
                onClick={() => handleDeleteClient(selectedClient._id)}
                className="modal-btn delete"
              >
                Delete Client
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="modal-btn cancel"
              >
                Close
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
              <h2>📊 Client Report</h2>
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
                    <span className="summary-label">Total Clients:</span>
                    <span className="summary-value">{reportData.totalClients}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">New Clients (Last Month):</span>
                    <span className="summary-value">{reportData.newClientsLastMonth}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Active Clients:</span>
                    <span className="summary-value">{reportData.activeClients}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Total Bookings:</span>
                    <span className="summary-value">{reportData.totalBookings}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Total Revenue:</span>
                    <span className="summary-value">LKR {reportData.totalRevenue?.toLocaleString()}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="summary-label">Average Bookings per Client:</span>
                    <span className="summary-value">{reportData.averageBookingsPerClient}</span>
                  </div>
                </div>
              </div>

              <div className="report-details">
                <h3>Client Details</h3>
                <div className="report-clients-list">
                  {reportData.clients?.map((client, index) => (
                    <div key={client._id || index} className="report-client-item">
                      <div className="report-client-header">
                        <span className="client-id">#{index + 1}</span>
                        <span className="client-status active">Active</span>
                      </div>
                      <div className="report-client-details">
                        <div className="client-info">
                          <span><strong>Name:</strong> {client.firstName} {client.lastName}</span>
                          <span><strong>Email:</strong> {client.email}</span>
                          <span><strong>Phone:</strong> {client.phone || 'N/A'}</span>
                          <span><strong>Joined:</strong> {formatDate(client.createdAt)}</span>
                          <span><strong>Total Bookings:</strong> {client.totalBookings || 0}</span>
                          <span><strong>Total Spent:</strong> LKR {(client.totalSpent || 0).toLocaleString()}</span>
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

      {/* Assignment Modal */}
      {showAssignmentModal && assignmentClient && (
        <div className="assignment-modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h3>Assign Client to Staff</h3>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="assignment-modal-content">
              <div className="assignment-client-info">
                <h4>Client: {assignmentClient.firstName} {assignmentClient.lastName}</h4>
                <p>Email: {assignmentClient.email}</p>
              </div>
              
              <div className="assignment-form">
                <div className="form-group">
                  <label>Select Staff Member:</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="staff-select"
                  >
                    <option value="">Select a staff member...</option>
                    {staff.map((staffMember) => {
                      // Check if this staff member is already assigned to another client
                      const isAssignedToOtherClient = clients.some(client => 
                        client._id !== assignmentClient._id && 
                        client.assignedStaff === staffMember._id
                      );
                      
                      // Debug logging
                      if (staffMember.name.includes('Debug')) {
                        console.log(`Staff ${staffMember.name}:`, {
                          staffId: staffMember._id,
                          isAssigned: isAssignedToOtherClient,
                          assignedClients: clients.filter(c => c.assignedStaff === staffMember._id).map(c => c.firstName + ' ' + c.lastName)
                        });
                      }
                      
                      return (
                        <option 
                          key={staffMember._id} 
                          value={staffMember._id}
                          disabled={isAssignedToOtherClient}
                        >
                          {staffMember.name} - {staffMember.position}
                          {isAssignedToOtherClient ? ' (Already Assigned)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={canAccessPortfolio}
                      onChange={(e) => setCanAccessPortfolio(e.target.checked)}
                    />
                    Allow access to portfolio management
                  </label>
                  <small>This will allow the client to add/edit their gallery items</small>
                </div>
              </div>
            </div>
            <div className="assignment-modal-actions">
              <button
                onClick={handleAssignmentSubmit}
                className="modal-btn primary"
                disabled={!selectedStaffId}
              >
                {assignmentClient.isAssigned ? 'Update Assignment' : 'Assign Client'}
              </button>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="modal-btn cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsAdmin; 