import React, { useState, useEffect } from 'react';
import './Staff.css';

const Staff = () => {
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  useEffect(() => {
    const syncAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('storage', syncAdmin);
    window.addEventListener('login', syncAdmin);
    
    if (!isAdmin) {
      window.location.href = '/signin';
      return;
    }

    fetchStaff();
    
    return () => {
      window.removeEventListener('storage', syncAdmin);
      window.removeEventListener('login', syncAdmin);
    };
  }, [isAdmin]);

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
      setError('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = (staffData) => {
    const newStaff = {
      id: Date.now(),
      ...staffData,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    };
    setStaff(prev => [newStaff, ...prev]);
    setShowAddModal(false);
  };

  const handleEditStaff = (staffData) => {
    setStaff(prev => 
      prev.map(s => s.id === editingStaff.id ? { ...s, ...staffData } : s)
    );
    setEditingStaff(null);
  };

  const handleDeleteStaff = (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }
    setStaff(prev => prev.filter(s => s.id !== staffId));
  };

  const handleStatusChange = (staffId, newStatus) => {
    setStaff(prev => 
      prev.map(s => s.id === staffId ? { ...s, status: newStatus } : s)
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'inactive': return '#dc3545';
      case 'on_leave': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="staff-bg">
      <div className="staff-header">
        <h1>Staff Management</h1>
        <p>Manage staff members and their information</p>
        <button 
          className="staff-add-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Staff Member
        </button>
      </div>

      {loading ? (
        <div className="staff-loading">Loading staff...</div>
      ) : error ? (
        <div className="staff-error">{error}</div>
      ) : (
        <div className="staff-container">
          <div className="staff-stats">
            <div className="staff-stat-card">
              <div className="staff-stat-number">{staff.length}</div>
              <div className="staff-stat-label">Total Staff</div>
            </div>
            <div className="staff-stat-card">
              <div className="staff-stat-number">
                {staff.filter(s => s.status === 'active').length}
              </div>
              <div className="staff-stat-label">Active Staff</div>
            </div>
            <div className="staff-stat-card">
              <div className="staff-stat-number">
                {staff.filter(s => s.department === 'Photography').length}
              </div>
              <div className="staff-stat-label">Photographers</div>
            </div>
            <div className="staff-stat-card">
              <div className="staff-stat-number">
                {staff.filter(s => s.department === 'Editing').length}
              </div>
              <div className="staff-stat-label">Editors</div>
            </div>
          </div>

          <div className="staff-grid">
            {staff.map(staffMember => (
              <div key={staffMember._id || staffMember.id} className="staff-card">
                <div className="staff-photo">
                  {staffMember.imageUrl ? (
                    (() => {
                      // Handle Cloudinary URLs (external)
                      if (staffMember.imageUrl.startsWith('http://') || staffMember.imageUrl.startsWith('https://')) {
                        return <img src={staffMember.imageUrl} alt={staffMember.name} />;
                      }
                      // Handle local uploads
                      const filename = staffMember.imageUrl.startsWith('/uploads/') 
                        ? staffMember.imageUrl.split('/').pop() 
                        : staffMember.imageUrl;
                      return <img src={`http://localhost:5050/api/files/staff/${encodeURIComponent(filename)}`} alt={staffMember.name} />;
                    })()
                  ) : (
                    <div className="staff-placeholder">👤</div>
                  )}
                  <div className="staff-status-badge" style={{ backgroundColor: getStatusColor(staffMember.status || 'active') }}>
                    {(staffMember.status || 'active').replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                
                <div className="staff-info">
                  <h3 className="staff-name">{staffMember.name}</h3>
                  <p className="staff-position">{staffMember.position}</p>
                  {staffMember.specialization && <p className="staff-specialization">{staffMember.specialization}</p>}
                  <p className="staff-email">{staffMember.email}</p>
                  <p className="staff-phone">{staffMember.phone}</p>
                  {staffMember.experience && <p className="staff-experience">{staffMember.experience} years experience</p>}
                  <p className="staff-join-date">Joined: {new Date(staffMember.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
                
                <div className="staff-actions">
                  <button
                    className="staff-btn edit"
                    onClick={() => setEditingStaff(staffMember)}
                  >
                    Edit
                  </button>
                  <button
                    className="staff-btn delete"
                    onClick={() => handleDeleteStaff(staffMember.id)}
                  >
                    Delete
                  </button>
                  <select
                    className="staff-status-select"
                    value={staffMember.status}
                    onChange={(e) => handleStatusChange(staffMember.id, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddStaff}
        />
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <EditStaffModal 
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSubmit={handleEditStaff}
        />
      )}
    </div>
  );
};

// Add Staff Modal Component
const AddStaffModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    department: 'Photography'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add Staff Member</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Position"
            value={form.position}
            onChange={(e) => setForm({...form, position: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            required
          />
          <select
            value={form.department}
            onChange={(e) => setForm({...form, department: e.target.value})}
          >
            <option value="Photography">Photography</option>
            <option value="Editing">Editing</option>
            <option value="Management">Management</option>
          </select>
          <div className="modal-buttons">
            <button type="submit">Add Staff</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Staff Modal Component
const EditStaffModal = ({ staff, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: staff.name,
    position: staff.position,
    email: staff.email,
    phone: staff.phone,
    department: staff.department
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Staff Member</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Position"
            value={form.position}
            onChange={(e) => setForm({...form, position: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            required
          />
          <select
            value={form.department}
            onChange={(e) => setForm({...form, department: e.target.value})}
          >
            <option value="Photography">Photography</option>
            <option value="Editing">Editing</option>
            <option value="Management">Management</option>
          </select>
          <div className="modal-buttons">
            <button type="submit">Update Staff</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Staff; 