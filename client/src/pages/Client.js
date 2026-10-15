import React, { useState, useEffect } from 'react';
import './Client.css';

const Client = () => {
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const syncAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('storage', syncAdmin);
    window.addEventListener('login', syncAdmin);
    
    if (!isAdmin) {
      window.location.href = '/signin';
      return;
    }

    fetchClients();
    
    return () => {
      window.removeEventListener('storage', syncAdmin);
      window.removeEventListener('login', syncAdmin);
    };
  }, [isAdmin]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockClients = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+94 77 123 4567',
          eventType: 'Wedding',
          eventDate: '2024-02-15',
          status: 'confirmed',
          totalBookings: 3,
          totalSpent: 150000,
          lastContact: '2024-01-10'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+94 77 234 5678',
          eventType: 'Birthday Party',
          eventDate: '2024-03-20',
          status: 'pending',
          totalBookings: 1,
          totalSpent: 50000,
          lastContact: '2024-01-12'
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          phone: '+94 77 345 6789',
          eventType: 'Corporate Event',
          eventDate: '2024-01-25',
          status: 'completed',
          totalBookings: 2,
          totalSpent: 200000,
          lastContact: '2024-01-08'
        },
        {
          id: 4,
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          phone: '+94 77 456 7890',
          eventType: 'Graduation',
          eventDate: '2024-04-10',
          status: 'confirmed',
          totalBookings: 1,
          totalSpent: 75000,
          lastContact: '2024-01-15'
        }
      ];
      
      setClients(mockClients);
    } catch (err) {
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = (clientData) => {
    const newClient = {
      id: Date.now(),
      ...clientData,
      totalBookings: 0,
      totalSpent: 0,
      lastContact: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [newClient, ...prev]);
    setShowAddModal(false);
  };

  const handleEditClient = (clientData) => {
    setClients(prev => 
      prev.map(c => c.id === editingClient.id ? { ...c, ...clientData } : c)
    );
    setEditingClient(null);
  };

  const handleDeleteClient = (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }
    setClients(prev => prev.filter(c => c.id !== clientId));
  };

  const handleStatusChange = (clientId, newStatus) => {
    setClients(prev => 
      prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c)
    );
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

  const filteredClients = filterStatus === 'all' 
    ? clients 
    : clients.filter(client => client.status === filterStatus);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="client-bg">
      <div className="client-header">
        <h1>Client Management</h1>
        <p>Manage client information and bookings</p>
        <button 
          className="client-add-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Client
        </button>
      </div>

      {loading ? (
        <div className="client-loading">Loading clients...</div>
      ) : error ? (
        <div className="client-error">{error}</div>
      ) : (
        <div className="client-container">
          <div className="client-stats">
            <div className="client-stat-card">
              <div className="client-stat-number">{clients.length}</div>
              <div className="client-stat-label">Total Clients</div>
            </div>
            <div className="client-stat-card">
              <div className="client-stat-number">
                {clients.filter(c => c.status === 'confirmed').length}
              </div>
              <div className="client-stat-label">Confirmed</div>
            </div>
            <div className="client-stat-card">
              <div className="client-stat-number">
                {clients.filter(c => c.status === 'pending').length}
              </div>
              <div className="client-stat-label">Pending</div>
            </div>
            <div className="client-stat-card">
              <div className="client-stat-number">
                LKR {clients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
              </div>
              <div className="client-stat-label">Total Revenue</div>
            </div>
          </div>

          <div className="client-filters">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="client-filter-select"
            >
              <option value="all">All Clients</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="client-list">
            {filteredClients.map(client => (
              <div key={client.id} className="client-card">
                <div className="client-header-row">
                  <div className="client-info">
                    <h3 className="client-name">{client.name}</h3>
                    <p className="client-email">{client.email}</p>
                    <p className="client-phone">{client.phone}</p>
                  </div>
                  <div className="client-status">
                    <span 
                      className="client-status-badge"
                      style={{ backgroundColor: getStatusColor(client.status) }}
                    >
                      {client.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="client-details">
                  <div className="client-detail-item">
                    <span className="client-detail-label">Event Type:</span>
                    <span className="client-detail-value">{client.eventType}</span>
                  </div>
                  <div className="client-detail-item">
                    <span className="client-detail-label">Event Date:</span>
                    <span className="client-detail-value">
                      {new Date(client.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="client-detail-item">
                    <span className="client-detail-label">Total Bookings:</span>
                    <span className="client-detail-value">{client.totalBookings}</span>
                  </div>
                  <div className="client-detail-item">
                    <span className="client-detail-label">Total Spent:</span>
                    <span className="client-detail-value">
                      LKR {client.totalSpent.toLocaleString()}
                    </span>
                  </div>
                  <div className="client-detail-item">
                    <span className="client-detail-label">Last Contact:</span>
                    <span className="client-detail-value">
                      {new Date(client.lastContact).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="client-actions">
                  <button
                    className="client-btn edit"
                    onClick={() => setEditingClient(client)}
                  >
                    Edit
                  </button>
                  <button
                    className="client-btn delete"
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    Delete
                  </button>
                  <select
                    className="client-status-select"
                    value={client.status}
                    onChange={(e) => handleStatusChange(client.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddClient}
        />
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal 
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSubmit={handleEditClient}
        />
      )}
    </div>
  );
};

// Add Client Modal Component
const AddClientModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: 'Wedding',
    eventDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add Client</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Client Name"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
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
            value={form.eventType}
            onChange={(e) => setForm({...form, eventType: e.target.value})}
          >
            <option value="Wedding">Wedding</option>
            <option value="Birthday Party">Birthday Party</option>
            <option value="Corporate Event">Corporate Event</option>
            <option value="Graduation">Graduation</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) => setForm({...form, eventDate: e.target.value})}
            required
          />
          <div className="modal-buttons">
            <button type="submit">Add Client</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Client Modal Component
const EditClientModal = ({ client, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone,
    eventType: client.eventType,
    eventDate: client.eventDate
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Client</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Client Name"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
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
            value={form.eventType}
            onChange={(e) => setForm({...form, eventType: e.target.value})}
          >
            <option value="Wedding">Wedding</option>
            <option value="Birthday Party">Birthday Party</option>
            <option value="Corporate Event">Corporate Event</option>
            <option value="Graduation">Graduation</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) => setForm({...form, eventDate: e.target.value})}
            required
          />
          <div className="modal-buttons">
            <button type="submit">Update Client</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Client; 