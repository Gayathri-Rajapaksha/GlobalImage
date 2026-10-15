import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Services.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { createPDFHeader } from '../utils/pdfUtils';

// Add Service Modal Component
function AddServiceModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [hours, setHours] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');

  const categories = [
    'Batch Party',
    'Social Gathering', 
    'Birthday Party',
    'Cultural Event',
    'Other Event'
  ];

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setCategory('');
      setPrice('');
      setHours('');
      setPhoto(null);
      setError('');
      setPhotoError('');
    }
  }, [open]);

  const validateImageOrientation = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const isLandscape = img.width > img.height;
        resolve(isLandscape);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPhoto(null);
      setPhotoError('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file');
      return;
    }
    
    // Validate landscape orientation
    const isLandscape = await validateImageOrientation(file);
    if (!isLandscape) {
      setPhotoError('Service image must be in landscape orientation (width > height)');
      return;
    }
    
    setPhoto(file);
    setPhotoError('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Service title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!category.trim()) {
      setError('Category is required.');
      return;
    }
    if (!price || price === '' || isNaN(parseFloat(price))) {
      setError('Valid price is required.');
      return;
    }
    if (!hours || hours === '' || isNaN(parseInt(hours))) {
      setError('Valid hours is required.');
      return;
    }
    if (!photo) {
      setError('Service image is required.');
      return;
    }
    if (photoError) {
      setError('Please fix the image validation error.');
      return;
    }
    onSubmit({ title, description, category, price, hours, photo });
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>&times;</button>
        <h2>Add Service</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Service Title" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 60 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}>
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Price (LKR)</label>
            <input 
              type="number" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              placeholder="Enter price in LKR" 
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Hours</label>
            <input 
              type="number" 
              value={hours} 
              onChange={e => setHours(e.target.value)} 
              placeholder="Enter hours" 
              min="1"
              max="24"
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Service Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoChange} 
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
            />
            {photoError && <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{photoError}</div>}
          </div>
          {error && <div style={{ color: 'red', marginBottom: 8, fontSize: 14 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, padding: 8, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add Service</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 8, background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Update Service Modal Component
function UpdateServiceModal({ open, onClose, onSubmit, service }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [hours, setHours] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  const categories = [
    'Batch Party',
    'Social Gathering', 
    'Birthday Party',
    'Cultural Event',
    'Other Event'
  ];

  useEffect(() => {
    if (open && service) {
      setTitle(service.title || '');
      setDescription(service.description || '');
      setCategory(service.category || '');
      setPrice(service.price || '');
      setHours(service.hours || '');
      setPhoto(null);
      setError('');
    }
  }, [open, service]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPhoto(null);
      return;
    }
    setPhoto(file);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Service title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!category.trim()) {
      setError('Category is required.');
      return;
    }
    if (!price || price === '' || isNaN(parseFloat(price))) {
      setError('Valid price is required.');
      return;
    }
    if (!hours || hours === '' || isNaN(parseInt(hours))) {
      setError('Valid hours is required.');
      return;
    }
    onSubmit({ title, description, category, price, hours, photo });
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>&times;</button>
        <h2>Update Service</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Service Title" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 60 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}>
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Price (LKR)</label>
            <input 
              type="number" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              placeholder="Enter price in LKR" 
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Hours</label>
            <input 
              type="number" 
              value={hours} 
              onChange={e => setHours(e.target.value)} 
              placeholder="Enter hours" 
              min="1"
              max="24"
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Service Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoChange} 
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
            />
          </div>
          {error && <div style={{ color: 'red', marginBottom: 8, fontSize: 14 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, padding: 8, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Update Service</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 8, background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Service Confirmation Modal
function DeleteServiceConfirm({ open, onClose, onConfirm, serviceName }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, textAlign: 'center' }}>
        <h3>Delete Service</h3>
        <p>Are you sure you want to delete "{serviceName}"?</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button onClick={onConfirm} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Toast Component
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, background: '#28a745', color: 'white', padding: '12px 24px', borderRadius: 4, zIndex: 1001, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
      {message}
    </div>
  );
}

// Helper function to get image URL
function getImageUrl(path) {
  if (path.startsWith('http')) return path;
  return `http://localhost:5050/${path}`;
}

const ServicesAdmin = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [toast, setToast] = useState('');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const navigate = useNavigate();

  useEffect(() => {
    const syncAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('storage', syncAdmin);
    window.addEventListener('login', syncAdmin);
    
    if (!isAdmin) {
      navigate('/signin');
      return;
    }

    fetchServices();
    
    return () => {
      window.removeEventListener('storage', syncAdmin);
      window.removeEventListener('login', syncAdmin);
    };
  }, [isAdmin, navigate]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5050/api/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Services fetch error:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      // Use existing services data instead of making a separate API call
      return services.map(service => ({
        title: service.title,
        category: service.category,
        price: service.price,
        description: service.description,
        createdAt: service.createdAt
      }));
    } catch (err) {
      console.error('Report fetch error:', err);
      throw err;
    }
  };

  // Generate comprehensive statistics
  const generateStatistics = (data) => {
    // Category breakdown with detailed packages
    const categories = ['Batch Party', 'Social Gathering', 'Birthday Party', 'Cultural Event', 'Other Event'];
    const categoryStats = categories.map(category => {
      const categoryData = data.filter(service => service.category === category);
      return {
        category: category,
        count: categoryData.length,
        packages: categoryData.map(service => ({
          title: service.title,
          price: parseFloat(service.price || 0),
          description: service.description
        }))
      };
    });
    
    // Overall totals
    const totalServices = data.length;
    
    return {
      categoryStats,
      totalServices
    };
  };

  const handleAddService = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('price', data.price);
      formData.append('hours', data.hours); // Added hours to formData
      formData.append('photo', data.photo);

      const res = await fetch('http://localhost:5050/api/services', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) throw new Error('Failed to add service');
      
      setToast('Service added successfully!');
      setShowAddModal(false);
      fetchServices();
    } catch (err) {
      console.error('Add service error:', err);
      setToast('Failed to add service');
    }
  };

  const handleUpdateService = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('price', data.price);
      formData.append('hours', data.hours);
      if (data.photo) {
        formData.append('photo', data.photo);
      }

      const res = await fetch(`http://localhost:5050/api/services/${selectedService._id}`, {
        method: 'PUT',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) throw new Error('Failed to update service');
      
      setToast('Service updated successfully!');
      setShowUpdateModal(false);
      setSelectedService(null);
      fetchServices();
    } catch (err) {
      console.error('Update service error:', err);
      setToast('Failed to update service');
    }
  };

  const handleDeleteService = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5050/api/services/${selectedService._id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error('Failed to delete service');
      
      setToast('Service deleted successfully!');
      setShowDeleteModal(false);
      setSelectedService(null);
      fetchServices();
    } catch (err) {
      console.error('Delete service error:', err);
      setToast('Failed to delete service');
    }
  };

  const handleBookNow = (service) => {
    navigate('/booking', { state: { selectedService: service } });
  };



  const handleDownloadPDF = async () => {
    try {
      setToast('Generating comprehensive PDF report...');
      const allData = await fetchReport();
      const stats = generateStatistics(allData);
      
      if (!allData || allData.length === 0) {
        setToast('No data available for report');
        return;
      }

      const doc = new jsPDF();
      
      // Add header with logo and title
      const startY = await createPDFHeader(doc, 'Services Comprehensive Report', 'Global Image Photography');
      
      // Add overall summary
      doc.setFontSize(16);
      doc.setTextColor(25, 118, 210);
      doc.text('Overall Summary', 20, startY);
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Total Services: ${stats.totalServices}`, 20, startY + 10);
      
      // Detailed packages for each category
      let currentY = startY + 30;
      
      stats.categoryStats.forEach(category => {
        if (category.packages.length > 0) {
          // Category header
          doc.setFontSize(12);
          doc.setTextColor(25, 118, 210);
          doc.text(`${category.category} Packages:`, 20, currentY);
          currentY += 10;
          
          // Package details table
          const packageData = category.packages.map(pkg => [
            pkg.title,
            `LKR ${pkg.price.toLocaleString()}`,
            pkg.description.length > 40 ? pkg.description.substring(0, 40) + '...' : pkg.description
          ]);
          
          autoTable(doc, {
            head: [['Package Name', 'Price', 'Description']],
            body: packageData,
            startY: currentY,
            styles: { 
              fontSize: 9,
              cellPadding: 2
            },
            headStyles: { 
              fillColor: [70, 130, 180],
              textColor: [255, 255, 255],
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [248, 249, 250]
            },
            columnStyles: {
              0: { cellWidth: 50 },
              1: { cellWidth: 30 },
              2: { cellWidth: 70 }
            }
          });
          
          currentY = doc.lastAutoTable.finalY + 15;
        }
      });
      
      // Save the PDF
      doc.save(`services-comprehensive-report-${new Date().toISOString().split('T')[0]}.pdf`);
      setToast('Comprehensive PDF report generated successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      setToast('Failed to generate PDF report');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setToast('Generating comprehensive Excel report...');
      const allData = await fetchReport();
      const stats = generateStatistics(allData);
      
      if (!allData || allData.length === 0) {
        setToast('No data available for report');
        return;
      }

      const wb = XLSX.utils.book_new();
      
      // Detailed packages for each category
      stats.categoryStats.forEach(category => {
        if (category.packages.length > 0) {
          const packageData = category.packages.map(pkg => ({
            'Package Name': pkg.title,
            'Price': `LKR ${pkg.price.toLocaleString()}`,
            'Description': pkg.description
          }));
          
          const packageWs = XLSX.utils.json_to_sheet(packageData);
          XLSX.utils.book_append_sheet(wb, packageWs, category.category);
          
          // Auto-size columns for package sheets
          const colWidths = [
            { wch: 25 }, // Package Name
            { wch: 15 }, // Price
            { wch: 50 }  // Description
          ];
          packageWs['!cols'] = colWidths;
        }
      });
      
      // Overall summary sheet
      const summaryData = [
        { 'Metric': 'Total Services', 'Count': stats.totalServices }
      ];
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Auto-size columns for summary sheet
      const summaryColWidths = [
        { wch: 20 }, // Metric
        { wch: 20 }  // Count
      ];
      summaryWs['!cols'] = summaryColWidths;
      
      XLSX.writeFile(wb, `services-comprehensive-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      setToast('Comprehensive Excel report generated successfully!');
    } catch (err) {
      console.error('Excel generation error:', err);
      setToast('Failed to generate Excel report');
    }
  };

  const categories = ['all', 'Batch Party', 'Social Gathering', 'Birthday Party', 'Cultural Event', 'Other Event'];
  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="services-admin-bg">
      <div className="services-admin-header">
        <h1>Service Management</h1>
        <p>Manage service packages and pricing</p>
        <div className="services-admin-actions">
          <button 
            className="services-admin-add-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Service
          </button>
          <div className="services-admin-report-buttons">
            <button 
              className="services-admin-report-btn pdf"
              onClick={handleDownloadPDF}
            >
              📄 PDF Report
            </button>
            <button 
              className="services-admin-report-btn excel"
              onClick={handleDownloadExcel}
            >
              📊 Excel Report
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="services-admin-loading">Loading services...</div>
      ) : error ? (
        <div className="services-admin-error">{error}</div>
      ) : (
        <div className="services-admin-container">
          <div className="services-admin-filters">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="services-admin-filter-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div className="services-admin-grid">
            {filteredServices.map(service => (
              <div key={service._id} className="services-admin-card">
                <div className="services-admin-card-image">
                  <img src={getImageUrl(service.photo)} alt={service.title} />
                  <div className="services-admin-card-category">{service.category}</div>
                </div>
                
                <div className="services-admin-card-content">
                  <h3 className="services-admin-card-title">{service.title}</h3>
                  <div className="services-admin-card-price">LKR {service.price}</div>
                  <div className="services-admin-card-hours">{service.hours} Hours</div>
                </div>
                
                <div className="services-admin-card-actions">
                  <button
                    className="services-admin-btn edit"
                    onClick={() => {
                      setSelectedService(service);
                      setShowUpdateModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="services-admin-btn delete"
                    onClick={() => {
                      setSelectedService(service);
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddServiceModal 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSubmit={handleAddService} 
      />
      
      <UpdateServiceModal 
        open={showUpdateModal} 
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedService(null);
        }} 
        onSubmit={handleUpdateService}
        service={selectedService}
      />
      
      <DeleteServiceConfirm 
        open={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedService(null);
        }} 
        onConfirm={handleDeleteService}
        serviceName={selectedService?.title}
      />
      
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

export default ServicesAdmin; 