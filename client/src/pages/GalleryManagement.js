import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GalleryManagement.css';

// Add Gallery Modal Component (same as admin panel)
function AddGalleryModal({ open, onClose, onSubmit, categories }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [cover, setCover] = useState(null);
  const [category, setCategory] = useState(categories[0]?.key || '');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [coverError, setCoverError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setFiles([]);
      setCover(null);
      setCategory(categories[0]?.key || '');
      setError('');
      setCoverError('');
    }
  }, [open, categories]);

  const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalFiles = files.length + selectedFiles.length;
    
    if (totalFiles > 50) {
      setError(`You can upload a maximum of 50 photos. You currently have ${files.length} photos and trying to add ${selectedFiles.length} more.`);
      return;
    }
    
    // Show compression progress
    setError('Optimizing images for faster upload...');
    
    try {
      const compressedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          if (file.size > 2 * 1024 * 1024) { // Only compress files > 2MB
            const compressed = await compressImage(file);
            return new File([compressed], file.name, { type: 'image/jpeg' });
          }
          return file;
        })
      );
      
      setFiles(prev => [...prev, ...compressedFiles]);
      setError('');
    } catch (err) {
      console.error('Image compression error:', err);
      setFiles(prev => [...prev, ...selectedFiles]); // Fallback to original files
      setError('');
    }
  };

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

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setCover(null);
      setCoverError('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setCoverError('Please select an image file for cover');
      return;
    }
    
    // Validate landscape orientation
    const isLandscape = await validateImageOrientation(file);
    if (!isLandscape) {
      setCoverError('Cover image must be in landscape orientation (width > height)');
      return;
    }
    
    setCover(file);
    setCoverError('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
    const totalFiles = files.length + imageFiles.length;
    
    if (totalFiles > 50) {
      setError(`You can upload a maximum of 50 photos. You currently have ${files.length} photos and trying to add ${imageFiles.length} more.`);
      return;
    }
    
    setFiles(prev => [...prev, ...imageFiles]);
    setError('');
  };

  const handleRemoveFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Gallery name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!category) {
      setError('Category is required.');
      return;
    }
    if (files.length === 0) {
      setError('At least one photo is required.');
      return;
    }
    if (!cover) {
      setCoverError('Cover image is required.');
      return;
    }
    onSubmit({ name, description, category, files, cover });
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 400, maxWidth: 600, maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>&times;</button>
        <h2>Add Gallery</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Gallery Name" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 60 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}>
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Cover Image</label>
            <input type="file" accept="image/*" onChange={handleCoverChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            {coverError && <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{coverError}</div>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Photos (Max: 50)</label>
            <div 
              style={{ 
                border: '2px dashed #ccc', 
                padding: 20, 
                textAlign: 'center', 
                borderRadius: 4,
                background: dragActive ? '#f0f8ff' : '#f9f9f9',
                transition: 'background 0.3s ease'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p>Drag and drop photos here or click to select</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Maximum 50 photos per gallery</p>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ marginTop: 8 }} />
            </div>
            {files.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p>Selected files: {files.length}</p>
                {files.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 4, background: '#f0f0f0', margin: 2, borderRadius: 4 }}>
                    <span style={{ fontSize: 12 }}>{file.name}</span>
                    <button type="button" onClick={() => handleRemoveFile(idx)} style={{ background: 'red', color: 'white', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, padding: 8, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add Gallery</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 8, background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const GalleryManagement = () => {
  const [error] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [isStaff] = useState(localStorage.getItem('isStaff') === 'true');
  const navigate = useNavigate();

  useEffect(() => {
    const staffStatus = localStorage.getItem('isStaff') === 'true';
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const canAccessPortfolio = userData.canAccessPortfolio || false;
    const userRole = userData.role || 'client';
    
    console.log('Gallery Management Access Check:', {
      isStaff: staffStatus,
      isAdmin: adminStatus,
      canAccessPortfolio,
      userRole,
      userData
    });
    
    // Allow access for admin, staff (by role), or users with portfolio access
    const hasAccess = adminStatus || staffStatus || userRole === 'staff' || canAccessPortfolio;
    
    if (!hasAccess) {
      navigate('/signin');
      return;
    }
    // No need to fetch galleries since we're not displaying them
  }, [navigate]);

  const handleAddGallery = async (data) => {
    try {
      setUploadingImages(true);
      setShowAddModal(false);
      
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('cover', data.cover);
      data.files.forEach(file => {
        formData.append('photos', file);
      });

      console.log('Creating gallery with data:', {
        name: data.name,
        description: data.description,
        category: data.category,
        filesCount: data.files.length,
        hasCover: !!data.cover
      });

      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch('http://localhost:5050/api/gallery', {
        method: 'POST',
        headers: {
          ...headers
        },
        body: formData
      });
      
      console.log('Gallery API response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Gallery API error response:', errorText);
        throw new Error(`API Error: ${res.status} - ${errorText}`);
      }
      
      const result = await res.json();
      console.log('Gallery API result:', result);
      
      if (result.success) {
        alert('Gallery created successfully!');
        // No need to refresh galleries since we're not displaying them
      } else {
        throw new Error(result.message || 'Unknown error from server');
      }
    } catch (err) {
      console.error('Create gallery error:', err);
      alert('Failed to create gallery: ' + err.message);
      setShowAddModal(true); // Reopen modal on error
    } finally {
      setUploadingImages(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isStaff');
    localStorage.removeItem('isUser');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('token');
    navigate('/signin');
  };

  const handleProfileClick = () => {
    console.log('Profile clicked, current state:', showProfileDropdown);
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleBackToDashboard = () => {
    navigate('/staff');
  };

  // Removed loading check since we're not fetching galleries

  if (error) {
    return (
      <div className="gallery-management-bg">
        <div className="gallery-error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-management-bg">
      <div className="gallery-management-container">
        {/* Header */}
        <div className="gallery-management-header">
          <div className="header-content">
            <div>
              <h1>Gallery Management</h1>
              <p>Manage portfolio galleries and showcase your work</p>
            </div>
            <div className="header-actions">
              {/* Debug info for button visibility */}
              {(() => {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const showButton = isAdmin || isStaff || userData.role === 'staff' || userData.canAccessPortfolio;
                console.log('Add Gallery Button Debug:', {
                  isAdmin,
                  isStaff,
                  userRole: userData.role,
                  canAccessPortfolio: userData.canAccessPortfolio,
                  showButton,
                  userData
                });
                return null;
              })()}
              
              {/* Show Add Gallery button for admin, staff, or users with portfolio access */}
              {(isAdmin || isStaff || JSON.parse(localStorage.getItem('userData') || '{}').role === 'staff' || JSON.parse(localStorage.getItem('userData') || '{}').canAccessPortfolio) && (
                <button 
                  className="add-gallery-btn"
                  onClick={() => setShowAddModal(true)}
                >
                  <span>➕</span>
                  Add New Gallery
                </button>
              )}
              
              {/* Staff Profile Dropdown */}
              <div className="profile-dropdown-container">
                <button 
                  className="profile-btn"
                  onClick={handleProfileClick}
                  style={{ 
                    background: showProfileDropdown 
                      ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  <span>👤</span>
                  Staff Profile
                  <span className={`dropdown-arrow ${showProfileDropdown ? 'open' : ''}`}>▼</span>
                </button>
                
                {showProfileDropdown && (
                  <div className="profile-dropdown" style={{ 
                    animation: 'fadeIn 0.2s ease-out',
                    opacity: 1,
                    visibility: 'visible'
                  }}>
                    <button 
                      className="dropdown-item"
                      onClick={handleBackToDashboard}
                    >
                      <span>📊</span>
                      Staff Dashboard
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={() => navigate('/portfolio')}
                    >
                      <span>🖼️</span>
                      View Portfolio
                    </button>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <span>🚪</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Progress Indicator */}
        {uploadingImages && (
          <div className="upload-progress-overlay">
            <div className="upload-progress-content">
              <div className="loading-spinner"></div>
              <h3>Uploading Gallery...</h3>
              <p>Please wait while we process your images</p>
            </div>
          </div>
        )}

        {/* Simple message - galleries not displayed */}
        <div className="galleries-grid">
          <div className="no-galleries">
            <div className="no-galleries-icon">🖼️</div>
            <h3>Gallery Management</h3>
            <p>Use the Add New Gallery button above to create galleries.</p>
          </div>
        </div>

      </div>

      {/* Add Gallery Modal - Admin Style */}
      <AddGalleryModal 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSubmit={handleAddGallery}
        categories={[
          { key: 'Batch Party', label: 'Batch Party' },
          { key: 'Social Gatherings', label: 'Social Gatherings' },
          { key: 'Birthday Party', label: 'Birthday Party' },
          { key: 'Cultural Events', label: 'Cultural Events' },
          { key: 'Other Events', label: 'Other Events' }
        ]}
      />
    </div>
  );
};

export default GalleryManagement;
