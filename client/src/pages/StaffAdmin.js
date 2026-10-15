import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaffAdmin.css';
import './PortfolioAdmin.css'; // Import portfolio notification styles
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { createPDFHeader } from '../utils/pdfUtils';

const StaffAdmin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [form, setForm] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    bio: '',
    image: null
  });
  const [emailError, setEmailError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const adminSignedIn = localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(adminSignedIn);
      
      if (!adminSignedIn) {
        navigate('/signin');
        return;
      }
    };

    checkAuth();
    fetchStaff();
    fetchNotifications();
    
    const handleLogin = () => {
      setIsAdmin(true);
    };
    
    window.addEventListener('login', handleLogin);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('login', handleLogin);
      window.removeEventListener('storage', checkAuth);
    };
  }, [navigate]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5050/api/staff');
      
      if (!response.ok) {
        throw new Error('Failed to fetch staff data');
      }
      
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (err) {
      console.error('Fetch staff error:', err);
      setError('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch('http://localhost:5050/api/staff/notifications/assignments', {
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
          const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedStaffNotifications') || '[]');
          const hasNewNotifications = data.notifications.some(notification => 
            !dismissedNotifications.includes(notification.timestamp)
          );
          
          setShowNotification(hasNewNotifications);
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff assignment notifications:', err);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      await fetch(`http://localhost:5050/api/staff/notifications/assignments/${notification._id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      // Store dismissed notification in localStorage
      const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedStaffNotifications') || '[]');
      dismissedNotifications.push(notification.timestamp);
      localStorage.setItem('dismissedStaffNotifications', JSON.stringify(dismissedNotifications));
      
      setShowNotification(false);
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation
    if (name === 'phone') {
      // Remove all non-numeric characters
      const numericValue = value.replace(/\D/g, '');
      
      // Limit to 10 digits
      const limitedValue = numericValue.slice(0, 10);
      
      setForm(prev => ({
        ...prev,
        [name]: limitedValue
      }));
      return;
    }
    
    // Email validation
    if (name === 'email') {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Real-time email validation
      if (value.trim() === '') {
        setEmailError('');
      } else if (!validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
      return;
    }
    
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null) {
          formData.append(key, form[key]);
        }
      });

      const url = selectedStaff 
        ? `http://localhost:5050/api/staff/${selectedStaff._id}`
        : 'http://localhost:5050/api/staff';
      
      const method = selectedStaff ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to save staff member');
      }

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        setSelectedStaff(null);
        setForm({
          name: '',
          position: '',
          email: '',
          phone: '',
          specialization: '',
          experience: '',
          bio: '',
          image: null
        });
        setEmailError('');
        fetchStaff();
        alert(selectedStaff ? 'Staff member updated successfully!' : 'Staff member added successfully!');
      }
    } catch (err) {
      console.error('Save staff error:', err);
      alert('Failed to save staff member');
    }
  };

  const handleEdit = (staffMember) => {
    setSelectedStaff(staffMember);
    setForm({
      name: staffMember.name || '',
      position: staffMember.position || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      specialization: staffMember.specialization || '',
      experience: staffMember.experience || '',
      bio: staffMember.bio || '',
      image: null
    });
    setShowModal(true);
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5050/api/staff/${staffId}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
          throw new Error('Failed to delete staff member');
        }

        fetchStaff();
        alert('Staff member deleted successfully!');
      } catch (err) {
        console.error('Delete staff error:', err);
        alert('Failed to delete staff member');
      }
    }
  };

  const openAddModal = () => {
    setSelectedStaff(null);
    setForm({
      name: '',
      position: '',
      email: '',
      phone: '',
      specialization: '',
      experience: '',
      bio: '',
      image: null
    });
    setEmailError('');
    setShowModal(true);
  };

  const generateStaffReport = async () => {
    try {
      setReportLoading(true);
      console.log('Generating staff report...');
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5050/api/staff/report', {
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
      alert(`Failed to generate staff report: ${error.message}`);
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
      const response = await fetch(`http://localhost:5050/api/staff/report/download`, {
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
      a.download = `staff-report-${new Date().toISOString().split('T')[0]}.${format}`;
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
      if (!staff || staff.length === 0) {
        alert('No staff data available for Excel report');
        return;
      }

      const wb = XLSX.utils.book_new();
      
      // Detailed staff sheet
      const staffData = staff.map(member => ({
        'Name': member.name || 'N/A',
        'Position': member.position || 'N/A',
        'Email': member.email || 'N/A',
        'Phone': member.phone || 'N/A',
        'Specialization': member.specialization || 'N/A',
        'Experience (Years)': member.experience || 0,
        'Bio': member.bio || 'N/A',
        'Joined Date': member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'
      }));
      
      const staffWs = XLSX.utils.json_to_sheet(staffData);
      XLSX.utils.book_append_sheet(wb, staffWs, 'Staff');
      
      // Auto-size columns for staff sheet
      const colWidths = [
        { wch: 20 }, // Name
        { wch: 20 }, // Position
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 25 }, // Specialization
        { wch: 15 }, // Experience
        { wch: 40 }, // Bio
        { wch: 15 }  // Joined Date
      ];
      staffWs['!cols'] = colWidths;
      
      // Summary statistics sheet
      const totalStaff = staff.length;
      const seniorPhotographers = staff.filter(s => s.position === 'Senior Photographer').length;
      const photographers = staff.filter(s => s.position === 'Photographer').length;
      const assistantPhotographers = staff.filter(s => s.position === 'Assistant Photographer').length;
      const videoEditors = staff.filter(s => s.position === 'Video Editor').length;
      const studioManagers = staff.filter(s => s.position === 'Studio Manager').length;
      const customerService = staff.filter(s => s.position === 'Customer Service').length;
      const supportStaff = studioManagers + customerService;
      
      const totalExperience = staff.reduce((sum, member) => sum + (member.experience || 0), 0);
      const averageExperience = totalStaff > 0 ? Math.round(totalExperience / totalStaff) : 0;
      
      const summaryData = [
        { 'Metric': 'Total Staff', 'Count': totalStaff },
        { 'Metric': 'Senior Photographers', 'Count': seniorPhotographers },
        { 'Metric': 'Photographers', 'Count': photographers },
        { 'Metric': 'Assistant Photographers', 'Count': assistantPhotographers },
        { 'Metric': 'Video Editors', 'Count': videoEditors },
        { 'Metric': 'Support Staff', 'Count': supportStaff },
        { 'Metric': 'Average Experience (Years)', 'Count': averageExperience }
      ];
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Auto-size columns for summary sheet
      const summaryColWidths = [
        { wch: 25 }, // Metric
        { wch: 20 }  // Count
      ];
      summaryWs['!cols'] = summaryColWidths;
      
      XLSX.writeFile(wb, `staff-comprehensive-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      alert('Comprehensive Excel report generated successfully!');
    } catch (err) {
      console.error('Excel generation error:', err);
      alert('Failed to generate Excel report');
    }
  };

  const generateSeniorStaffReport = async () => {
    try {
      // Filter senior staff (Senior Photographers and Studio Managers)
      const seniorStaff = staff.filter(member => 
        member.position === 'Senior Photographer' || 
        member.position === 'Studio Manager'
      );

      if (seniorStaff.length === 0) {
        alert('No senior staff found for report');
        return;
      }

      // Calculate senior staff statistics
      const seniorStats = {
        totalSeniorStaff: seniorStaff.length,
        seniorPhotographers: seniorStaff.filter(s => s.position === 'Senior Photographer').length,
        studioManagers: seniorStaff.filter(s => s.position === 'Studio Manager').length,
        totalExperience: seniorStaff.reduce((sum, member) => sum + (member.experience || 0), 0),
        averageExperience: seniorStaff.length > 0 ? 
          Math.round(seniorStaff.reduce((sum, member) => sum + (member.experience || 0), 0) / seniorStaff.length) : 0
      };

      // Prepare report data for senior staff
      const reportData = {
        staff: seniorStaff,
        totalStaff: seniorStats.totalSeniorStaff,
        seniorPhotographers: seniorStats.seniorPhotographers,
        studioManagers: seniorStats.studioManagers,
        averageExperience: seniorStats.averageExperience,
        totalExperience: seniorStats.totalExperience
      };

      // Generate and download PDF
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5050/api/staff/report/download`, {
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
      a.download = `senior-staff-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Senior staff PDF report downloaded successfully');
      alert(`Senior staff report generated successfully! Found ${seniorStats.totalSeniorStaff} senior staff members.`);
    } catch (error) {
      console.error('Generate senior staff report error:', error);
      alert(`Failed to generate senior staff report: ${error.message}`);
    }
  };

  const filteredStaff = staff.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="staff-admin-bg">
      <div className="staff-admin-container">
        {/* Staff Assignment Notifications */}
        {showNotification && notifications.length > 0 && (
          <div className="notification-banner">
            <div className="notification-content">
              <div className="notification-header">
                <div className="notification-icon">👥</div>
                <div className="notification-title">
                  <h4>Staff Assignment Updates</h4>
                  <p>{notifications.length} new {notifications.length === 1 ? 'assignment' : 'assignments'}</p>
                </div>
                <button 
                  className="notification-close-all"
                  onClick={() => {
                    // Store all current notifications as dismissed
                    const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedStaffNotifications') || '[]');
                    notifications.forEach(notification => {
                      if (!dismissedNotifications.includes(notification.timestamp)) {
                        dismissedNotifications.push(notification.timestamp);
                      }
                    });
                    localStorage.setItem('dismissedStaffNotifications', JSON.stringify(dismissedNotifications));
                    
                    // Mark all as read on server
                    notifications.forEach(notification => {
                      fetch(`http://localhost:5050/api/staff/notifications/assignments/${notification._id}/read`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
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
                  <div className="notification-item-icon">📋</div>
                  <div className="notification-item-content">
                    <span>{notification.staffName} assigned to {notification.assignedClientName}</span>
                    <div className="notification-item-meta">
                      Staff Assignment • {new Date(notification.timestamp).toLocaleDateString()}
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

        <div className="staff-admin-header">
          <div className="header-content">
            <div>
              <h1>Manage Staff</h1>
              <p>Add, edit, and manage your photography team members</p>
            </div>
            <div className="header-actions">
              <button 
                className="pdf-report-btn"
                onClick={generateSeniorStaffReport}
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

        {loading ? (
          <div className="staff-admin-loading">
            <div className="loading-spinner"></div>
            <p>Loading staff data...</p>
          </div>
        ) : error ? (
          <div className="staff-admin-error">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={fetchStaff}>Try Again</button>
          </div>
        ) : (
          <>
            <div className="staff-admin-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search staff by name, position, email, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="stats-container">
                <div className="stat-item">
                  <span className="stat-number">{staff.length}</span>
                  <span className="stat-label">Total Staff</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{filteredStaff.length}</span>
                  <span className="stat-label">Filtered</span>
                </div>
              </div>
            </div>

            <div className="staff-admin-actions">
              <button className="add-staff-btn" onClick={openAddModal}>
                ➕ Add New Staff Member
              </button>
            </div>

            <div className="staff-grid">
              {filteredStaff.length === 0 ? (
                <div className="no-staff">
                  <div className="no-staff-icon">👥</div>
                  <h3>No Staff Members Found</h3>
                  <p>{searchTerm ? 'No staff members match your search criteria.' : 'Start by adding your first team member'}</p>
                  {!searchTerm && <button onClick={openAddModal}>Add First Staff Member</button>}
                </div>
              ) : (
                filteredStaff.map((member) => (
                  <div key={member._id} className="staff-card">
                    <div className="staff-image">
                      {member.imageUrl ? (
                        (() => {
                          // Handle Cloudinary URLs (external)
                          if (member.imageUrl.startsWith('http://') || member.imageUrl.startsWith('https://')) {
                            return <img src={member.imageUrl} alt={member.name} />;
                          }
                          // Handle local uploads
                          const filename = member.imageUrl.startsWith('/uploads/') 
                            ? member.imageUrl.split('/').pop() 
                            : member.imageUrl;
                          return <img src={`http://localhost:5050/api/files/staff/${encodeURIComponent(filename)}`} alt={member.name} />;
                        })()
                      ) : (
                        <div className="staff-placeholder">👤</div>
                      )}
                    </div>
                    <div className="staff-info">
                      <h3>{member.name}</h3>
                    </div>
                    <div className="staff-actions">
                      <button 
                        className="staff-action-btn edit"
                        onClick={() => handleEdit(member)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="staff-action-btn delete"
                        onClick={() => handleDelete(member._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Staff Modal */}
        {showModal && (
          <div className="staff-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
              <div className="staff-modal-header">
                <h3>{selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="staff-modal-content">
                <div className="modal-section">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="modal-section">
                  <label>Position *</label>
                  <select
                    name="position"
                    value={form.position}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Position</option>
                    <option value="Senior Photographer">Senior Photographer</option>
                    <option value="Photographer">Photographer</option>
                    <option value="Assistant Photographer">Assistant Photographer</option>
                    <option value="Video Editor">Video Editor</option>
                    <option value="Studio Manager">Studio Manager</option>
                    <option value="Customer Service">Customer Service</option>
                  </select>
                </div>

                <div className="modal-section">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="Enter valid email address"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    title="Please enter a valid email address"
                    required
                  />
                  <div className="input-hint">
                    {emailError && (
                      <span style={{ color: '#ff6b6b', fontSize: '12px' }}>
                        {emailError}
                      </span>
                    )}
                    {form.email && !emailError && form.email.trim() !== '' && (
                      <span style={{ color: '#51cf66', fontSize: '12px' }}>
                        ✓ Valid email address
                      </span>
                    )}
                  </div>
                </div>

                <div className="modal-section">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits (numbers only)"
                    required
                  />
                  <div className="input-hint">
                    {form.phone && form.phone.length < 10 && (
                      <span style={{ color: '#ff6b6b', fontSize: '12px' }}>
                        Phone number must be exactly 10 digits ({form.phone.length}/10)
                      </span>
                    )}
                    {form.phone && form.phone.length === 10 && (
                      <span style={{ color: '#51cf66', fontSize: '12px' }}>
                        ✓ Valid phone number
                      </span>
                    )}
                  </div>
                </div>

                <div className="modal-section">
                  <label>Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={form.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g., Wedding Photography, Portrait, Events"
                  />
                </div>

                <div className="modal-section">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    name="experience"
                    value={form.experience}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                  />
                </div>

                <div className="modal-section">
                  <label>Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="modal-section">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Tell us about this staff member..."
                  />
                </div>

                <div className="staff-modal-actions">
                  <button type="button" className="modal-btn cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn save">
                    {selectedStaff ? 'Update Staff Member' : 'Add Staff Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && reportData && (
          <div className="report-modal-overlay">
            <div className="report-modal">
              <div className="report-modal-header">
                <h2>📊 Staff Report</h2>
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
                      <span className="summary-label">Total Staff:</span>
                      <span className="summary-value">{reportData.totalStaff}</span>
                    </div>
                    <div className="report-summary-item">
                      <span className="summary-label">Senior Photographers:</span>
                      <span className="summary-value">{reportData.seniorPhotographers}</span>
                    </div>
                    <div className="report-summary-item">
                      <span className="summary-label">Photographers:</span>
                      <span className="summary-value">{reportData.photographers}</span>
                    </div>
                    <div className="report-summary-item">
                      <span className="summary-label">Assistant Photographers:</span>
                      <span className="summary-value">{reportData.assistantPhotographers}</span>
                    </div>
                    <div className="report-summary-item">
                      <span className="summary-label">Video Editors:</span>
                      <span className="summary-value">{reportData.videoEditors}</span>
                    </div>
                    <div className="report-summary-item">
                      <span className="summary-label">Support Staff:</span>
                      <span className="summary-value">{reportData.supportStaff}</span>
                    </div>
                  </div>
                </div>

                <div className="report-details">
                  <h3>Detailed Staff Information</h3>
                  <div className="report-staff-list">
                    {reportData.staff?.map((member, index) => (
                      <div key={member._id || index} className="report-staff-item">
                        <div className="report-staff-header">
                          <span className="staff-id">#{index + 1}</span>
                          <span className={`staff-position ${member.position?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {member.position}
                          </span>
                        </div>
                        <div className="report-staff-details">
                          <div className="staff-info">
                            <span><strong>Name:</strong> {member.name}</span>
                            <span><strong>Email:</strong> {member.email}</span>
                            <span><strong>Phone:</strong> {member.phone}</span>
                            <span><strong>Specialization:</strong> {member.specialization || 'N/A'}</span>
                            <span><strong>Experience:</strong> {member.experience ? `${member.experience} years` : 'N/A'}</span>
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
    </div>
  );
};

export default StaffAdmin; 