import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './PortfolioAdmin.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createPDFHeader } from '../utils/pdfUtils';

const baseCategories = [
  {
    key: 'batch',
    label: 'Batch Party',
    events: [
      {
        name: 'Batch 2023 Farewell',
        cover: '/GI_logo.png',
        photos: ['/GI_logo.png', '/GI_logo.png', '/GI_logo.png'],
        description: 'A memorable farewell for the 2023 batch.'
      },
      {
        name: 'Engineering Batch Bash',
        cover: '/GI_logo.png',
        photos: ['/GI_logo.png', '/GI_logo.png'],
        description: 'Celebrating the achievements of engineering graduates.'
      }
    ]
  },
  {
    key: 'social',
    label: 'Social Gatherings',
    events: [
      {
        name: 'Annual Club Meetup',
        cover: '/GI_logo.png',
        photos: ['/GI_logo.png', '/GI_logo.png', '/GI_logo.png'],
        description: 'Bringing together club members for a fun evening.'
      }
    ]
  },
  {
    key: 'birthday',
    label: 'Birthday Parties',
    events: [
      {
        name: 'Emma\'s 18th Birthday',
        cover: '/GI_logo.png',
        photos: ['/GI_logo.png', '/GI_logo.png', '/GI_logo.png', '/GI_logo.png'],
        description: 'A vibrant birthday celebration for Emma.'
      }
    ]
  },
  {
    key: 'cultural',
    label: 'Cultural Events',
    events: [
      {
        name: 'Spring Festival',
        cover: '/GI_logo.png',
        photos: ['/GI_logo.png', '/GI_logo.png'],
        description: 'A colorful festival full of tradition and joy.'
      }
    ]
  },
  {
    key: 'other',
    label: 'Other Events',
    events: [
      {
        name: 'Product Launch 2024',
        cover: '/GI_logo.png',
        photos: ['/GI_logo.png', '/GI_logo.png', '/GI_logo.png'],
        description: 'Exciting new product launch event.'
      }
    ]
  }
];

// Aggregate all events for 'All Events' category
const allEvents = baseCategories.flatMap(cat => cat.events);
const eventCategories = [
  { key: 'all', label: 'All Events', events: allEvents },
  ...baseCategories
];

// Add Gallery Modal Component
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
      setCategory('');
      setError('');
      setCoverError('');
    }
  }, [open, categories]);

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

// Update Gallery Modal Component
function UpdateGalleryModal({ open, onClose, onSubmit, event, categories }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [cover, setCover] = useState(null);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [currentCover, setCurrentCover] = useState(null);

  useEffect(() => {
    if (open && event) {
      setName(event.name || '');
      setDescription(event.description || '');
      setFiles([]);
      setCover(null);
      setCategory(event.category || categories[0]?.key || '');
      setError('');
      setCoverError('');
      setExistingPhotos(event.photos || []);
      setCurrentCover(event.cover || null);
    }
  }, [open, event, categories]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalFiles = files.length + selectedFiles.length;
    
    if (totalFiles > 50) {
      setError(`You can upload a maximum of 50 photos. You currently have ${files.length} photos and trying to add ${selectedFiles.length} more.`);
      return;
    }
    
    setFiles(prev => [...prev, ...selectedFiles]);
    setError('');
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setCover(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setCoverError('Please select an image file for cover');
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

  const handleRemoveExistingPhoto = (photoUrl) => {
    setExistingPhotos(prev => prev.filter(photo => photo !== photoUrl));
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
    onSubmit({ name, description, category, files, cover, existingPhotos, currentCover });
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 400, maxWidth: 600, maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>&times;</button>
        <h2>Update Gallery</h2>
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
            {currentCover && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Current Cover:</p>
                <div style={{ position: 'relative', display: 'inline-block', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                  <img 
                    src={currentCover.startsWith('http') ? currentCover : `http://localhost:5050${currentCover}`}
                    alt="Current cover"
                    style={{ width: '120px', height: '80px', objectFit: 'cover' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setCurrentCover(null)}
                    style={{ 
                      position: 'absolute', 
                      top: 2, 
                      right: 2, 
                      background: 'rgba(255,0,0,0.8)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '50%', 
                      width: 20, 
                      height: 20, 
                      fontSize: 12, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleCoverChange} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {currentCover ? 'Upload a new cover image to replace the current one' : 'Upload a cover image (optional)'}
            </p>
            {coverError && <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{coverError}</div>}
          </div>
          {existingPhotos.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Current Photos ({existingPhotos.length})</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 8 }}>
                {existingPhotos.map((photo, idx) => (
                  <div key={idx} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                    <img 
                      src={photo.startsWith('http') ? photo : `http://localhost:5050${photo}`} 
                      alt={`Gallery ${idx + 1}`}
                      style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                    />
                    <button 
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(photo)}
                      style={{ 
                        position: 'absolute', 
                        top: 2, 
                        right: 2, 
                        background: 'rgba(255,0,0,0.8)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: 20, 
                        height: 20, 
                        fontSize: 12, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Additional Photos (Optional - Max: 50 total)</label>
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
              <p>Drag and drop additional photos here or click to select</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Maximum 50 photos per gallery</p>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ marginTop: 8 }} />
            </div>
            {files.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p>New files to add: {files.length}</p>
                {files.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 4, background: '#f0f0f0', margin: 2, borderRadius: 4 }}>
                    <span style={{ fontSize: 12 }}>{file.name}</span>
                    <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'red', color: 'white', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ flex: 1, padding: 8, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Update Gallery</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 8, background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Gallery Confirmation Modal
function DeleteGalleryConfirm({ open, onClose, onConfirm, eventName }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, textAlign: 'center' }}>
        <h3>Delete Gallery</h3>
        <p>Are you sure you want to delete "{eventName}"?</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button onClick={onConfirm} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Helper function to get image URL
function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `http://localhost:5050${path}`;
  return path;
}

// Helper function to get Cloudinary download URL
function getCloudinaryDownloadUrl(url) {
  if (!url || !url.includes('cloudinary')) return url;
  return url.replace('/upload/', '/upload/fl_attachment/');
}

// Toast Component
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Determine toast style based on message content
  const getToastStyle = () => {
    if (message.includes('...')) {
      // Processing message
      return {
        background: '#ffc107',
        border: '1px solid #e0a800',
        color: '#212529'
      };
    } else if (message.includes('Failed') || message.includes('error')) {
      // Error message
      return {
        background: '#dc3545',
        border: '1px solid #c82333',
        color: 'white'
      };
    } else {
      // Success message
      return {
        background: '#28a745',
        border: '1px solid #1e7e34',
        color: 'white'
      };
    }
  };

  const getIcon = () => {
    if (message.includes('...')) {
      return '⏳'; // Processing
    } else if (message.includes('Failed') || message.includes('error')) {
      return '❌'; // Error
    } else {
      return '✅'; // Success
    }
  };

  const style = getToastStyle();

  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      padding: '16px 24px', 
      borderRadius: 8, 
      zIndex: 1001, 
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontSize: '14px',
      fontWeight: '500',
      animation: 'slideIn 0.3s ease-out',
      ...style
    }}>
      {getIcon()} {message}
    </div>
  );
}

const PortfolioAdmin = () => {
  const [eventCategories, setEventCategories] = useState(baseCategories);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toast, setToast] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentGallery, setCurrentGallery] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncAdmin = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('storage', syncAdmin);
    window.addEventListener('login', syncAdmin);
    
    if (!isAdmin) {
      navigate('/signin');
      return;
    }

    fetchGalleries();
    fetchNotifications();
    
    return () => {
      window.removeEventListener('storage', syncAdmin);
      window.removeEventListener('login', syncAdmin);
    };
  }, [navigate, isAdmin]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5050/api/gallery/notifications', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notifications.length > 0) {
          // Filter out notifications that have been dismissed locally
          const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
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
      console.error('Failed to fetch notifications:', err);
    }
  };

  const dismissNotification = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5050/api/gallery/notifications/${notification.timestamp}/read`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      // Store dismissed notification in localStorage
      const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      dismissedNotifications.push(notification.timestamp);
      localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedNotifications));
      
      setNotifications(prev => prev.filter(n => n.timestamp !== notification.timestamp));
      if (notifications.length <= 1) {
        setShowNotifications(false);
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const fetchGalleries = async () => {
    try {
      console.log('Fetching galleries...');
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5050/api/gallery');
      if (!res.ok) throw new Error('Failed to fetch galleries');
      const data = await res.json();
      // Ensure galleries is always an array
      const galleriesData = data.galleries || data;
      console.log('=== RAW GALLERY DATA ===');
      console.log('Galleries fetched:', Array.isArray(galleriesData) ? galleriesData.length : 0, 'galleries');
      console.log('Raw data structure:', data);
      console.log('Processed galleries data:', galleriesData);
      galleriesData.forEach((gallery, index) => {
        console.log(`Gallery ${index + 1}: "${gallery.name}" - Category: "${gallery.category}" (type: ${typeof gallery.category})`);
      });
      console.log('========================');
      setGalleries(Array.isArray(galleriesData) ? galleriesData : []);
    } catch (err) {
      console.error('Galleries fetch error:', err);
      setError('Failed to load galleries');
      setGalleries([]); // Ensure galleries is empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      // Fetch fresh data from API to include all galleries (including staff-added)
      const res = await fetch('http://localhost:5050/api/gallery');
      if (!res.ok) throw new Error('Failed to fetch galleries for report');
      const data = await res.json();
      const galleriesData = data.galleries || data;
      
      return Array.isArray(galleriesData) ? galleriesData.map(gallery => ({
        name: gallery.name,
        category: gallery.category,
        photos: gallery.photos.length,
        description: gallery.description,
        createdAt: gallery.createdAt
      })) : [];
    } catch (err) {
      console.error('Report fetch error:', err);
      throw err;
    }
  };

  // Get monthly data
  const getMonthlyData = (data) => {
    if (!selectedMonth) return data;
    
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    return data.filter(gallery => {
      const galleryDate = new Date(gallery.createdAt);
      return galleryDate >= startDate && galleryDate <= endDate;
    });
  };

  // Generate comprehensive statistics
  const generateStatistics = (data) => {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    
    // Current month data only
    const currentMonthData = data.filter(gallery => {
      const galleryDate = new Date(gallery.createdAt);
      return galleryDate.toISOString().slice(0, 7) === currentMonth;
    });
    
    const currentMonthLabel = currentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    const monthlyStats = [{
      month: currentMonthLabel,
      monthKey: currentMonth,
      count: currentMonthData.length,
      photos: currentMonthData.reduce((sum, gallery) => sum + gallery.photos, 0)
    }];
    
    // Category breakdown
    const categories = ['batch', 'social', 'birthday', 'cultural', 'other'];
    const categoryStats = categories.map(category => {
      const categoryData = data.filter(gallery => gallery.category === category);
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count: categoryData.length,
        photos: categoryData.reduce((sum, gallery) => sum + gallery.photos, 0)
      };
    });
    
    // Overall totals
    const totalGalleries = data.length;
    const totalPhotos = data.reduce((sum, gallery) => sum + gallery.photos, 0);
    
    return {
      monthlyStats,
      categoryStats,
      totalGalleries,
      totalPhotos,
      currentMonth
    };
  };

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    return options;
  };

  const openGallery = (event) => {
    setCurrentGallery(event);
    setCurrentImageIndex(0);
    setLightboxOpen(true);
  };

  const closeGallery = () => {
    setLightboxOpen(false);
    setCurrentGallery(null);
    setCurrentImageIndex(0);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!lightboxOpen || !currentGallery) return;
      
      if (e.key === 'Escape') {
        closeGallery();
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex(prev => 
          prev < currentGallery.photos.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(prev => 
          prev > 0 ? prev - 1 : currentGallery.photos.length - 1
        );
      }
    };

    if (lightboxOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen, currentGallery, currentImageIndex]);

  const handleAddGallery = async (data) => {
    try {
      // Debug: Log the category being sent
      console.log('Adding gallery with category:', data.category);
      console.log('Full gallery data:', data);
      
      // Start upload progress
      setUploading(true);
      setUploadProgress('Preparing to upload...');
      setShowAddModal(false);
      
      // Prepare form data
      setUploadProgress(`Preparing to upload ${data.files.length} photos...`);
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('category', data.category);
      if (data.cover) {
        formData.append('cover', data.cover);
      }
      data.files.forEach(file => {
        formData.append('photos', file);
      });

      setUploadProgress('Uploading gallery to server...');
      
      // Add admin flag to indicate this is an admin-created gallery
      formData.append('isAdmin', 'true');
      
      const res = await fetch('http://localhost:5050/api/gallery', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) throw new Error('Failed to add gallery');
      
      const result = await res.json();
      console.log('Gallery added successfully:', result);
      console.log('Returned gallery category:', result.gallery?.category);
      
      setUploadProgress('Gallery uploaded successfully!');
      
      // Show success message
      setTimeout(() => {
        setUploading(false);
        setToast(`Gallery "${data.name}" added successfully with ${data.files.length} photos!`);
        fetchGalleries();
      }, 1000);
      
    } catch (err) {
      console.error('Add gallery error:', err);
      setUploading(false);
      setToast('Failed to add gallery: ' + err.message);
      setShowAddModal(true);
    }
  };

  const handleUpdateGallery = async (data) => {
    try {
      // Start update progress
      setUpdating(true);
      setUpdateProgress('Preparing to update gallery...');
      setShowUpdateModal(false);
      
      // Prepare form data
      setUpdateProgress('Processing gallery data...');
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('category', data.category);
      if (data.cover) {
        formData.append('cover', data.cover);
      }
      
      // Send existing photos to keep
      if (data.existingPhotos && data.existingPhotos.length > 0) {
        formData.append('existingPhotos', JSON.stringify(data.existingPhotos));
      }
      
      // Send current cover to keep (if not replaced)
      if (data.currentCover && !data.cover) {
        formData.append('keepCurrentCover', 'true');
      }
      
      // Add progress for file processing
      if (data.files && data.files.length > 0) {
        setUpdateProgress(`Processing ${data.files.length} new photos...`);
        data.files.forEach(file => {
          formData.append('photos', file);
        });
      }
      
      setUpdateProgress('Updating gallery on server...');
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5050/api/gallery/${selectedGallery._id}`, {
        method: 'PUT',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) throw new Error('Failed to update gallery');
      
      setUpdateProgress('Gallery updated successfully!');
      
      // Show success message after brief delay
      setTimeout(() => {
        setUpdating(false);
        setToast(`Gallery "${data.name}" updated successfully!`);
        fetchGalleries();
      }, 1000);
      
    } catch (err) {
      console.error('Update gallery error:', err);
      setUpdating(false);
      setToast('Failed to update gallery: ' + err.message);
      setShowUpdateModal(true);
    }
  };

  const handleDeleteGallery = async () => {
    try {
      // Show processing message first
      setToast('Deleting gallery...');
      setShowDeleteModal(false);
      setSelectedGallery(null);
      const token = localStorage.getItem('token');
      
      const res = await fetch(`http://localhost:5050/api/gallery/${selectedGallery._id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error('Failed to delete gallery');
      
      // Show success message only after API call completes
      setToast('Gallery deleted successfully!');
      
      // Refresh galleries
      fetchGalleries();
    } catch (err) {
      console.error('Delete gallery error:', err);
      setToast('Failed to delete gallery');
      // Reopen modal if there was an error
      setShowDeleteModal(true);
      setSelectedGallery(selectedGallery);
    }
  };

  const handleProxyDownload = async () => {
    if (!currentGallery || !currentGallery.photos[currentImageIndex]) return;
    
    try {
      const imageUrl = currentGallery.photos[currentImageIndex];
      const downloadUrl = getCloudinaryDownloadUrl(imageUrl);
      
      const res = await fetch(`http://localhost:5050/api/gallery/download?url=${encodeURIComponent(downloadUrl)}`);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gallery-${currentGallery.name}-${currentImageIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setToast('Failed to download image');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isUser');
    localStorage.removeItem('token');
    window.location.reload();
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
      const startY = await createPDFHeader(doc, 'Portfolio Comprehensive Report', 'Global Image Photography');
      
      // Add overall summary
      doc.setFontSize(16);
      doc.setTextColor(25, 118, 210);
      doc.text('Overall Summary', 20, startY);
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Total Galleries: ${stats.totalGalleries}`, 20, startY + 10);
      doc.text(`Total Photos: ${stats.totalPhotos}`, 20, startY + 20);
      
      // Monthly breakdown table
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text('Current Month Breakdown', 20, startY + 40);
      
      const monthlyTableData = stats.monthlyStats.map(month => [
        month.month,
        month.count.toString(),
        month.photos.toString()
      ]);
      
      autoTable(doc, {
        head: [['Month', 'Galleries', 'Photos']],
        body: monthlyTableData,
        startY: startY + 50,
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [25, 118, 210],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 }
        }
      });
      
      // Category breakdown table
      const categoryTableY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text('Category Breakdown', 20, categoryTableY);
      
      const categoryTableData = stats.categoryStats.map(cat => [
        cat.category,
        cat.count.toString(),
        cat.photos.toString()
      ]);
      
      autoTable(doc, {
        head: [['Category', 'Galleries', 'Photos']],
        body: categoryTableData,
        startY: categoryTableY + 10,
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [25, 118, 210],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 }
        }
      });
      
      // Save the PDF
      doc.save(`portfolio-comprehensive-report-${new Date().toISOString().split('T')[0]}.pdf`);
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
      
      // Monthly breakdown sheet
      const monthlyData = stats.monthlyStats.map(month => ({
        'Month': month.month,
        'Galleries': month.count,
        'Photos': month.photos
      }));
      
      const monthlyWs = XLSX.utils.json_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(wb, monthlyWs, 'Current Month Breakdown');
      
      // Category breakdown sheet
      const categoryData = stats.categoryStats.map(cat => ({
        'Category': cat.category,
        'Galleries': cat.count,
        'Photos': cat.photos
      }));
      
      const categoryWs = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, categoryWs, 'Category Breakdown');
      
      // Overall summary sheet
      const summaryData = [
        { 'Metric': 'Total Galleries', 'Count': stats.totalGalleries },
        { 'Metric': 'Total Photos', 'Count': stats.totalPhotos }
      ];
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Auto-size columns for all sheets
      [monthlyWs, categoryWs, summaryWs].forEach(ws => {
        const colWidths = [
          { wch: 20 }, // First column
          { wch: 15 }, // Second column
          { wch: 15 }  // Third column
        ];
        ws['!cols'] = colWidths;
      });
      
      XLSX.writeFile(wb, `portfolio-comprehensive-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      setToast('Comprehensive Excel report generated successfully!');
    } catch (err) {
      console.error('Excel generation error:', err);
      setToast('Failed to generate Excel report');
    }
  };

  const categories = ['all', 'batch', 'social', 'birthday', 'cultural', 'other'];
  

  // Filter galleries by category and search term
  const filteredGalleries = galleries
    .filter(gallery => {
      if (selectedCategory === 'all') return true;
      
      console.log(`Checking gallery "${gallery.name}": category="${gallery.category}" vs selected="${selectedCategory}"`);
      console.log(`Category type: ${typeof gallery.category}, Selected type: ${typeof selectedCategory}`);
      console.log(`Exact match: ${gallery.category === selectedCategory}`);
      console.log(`Trimmed match: ${gallery.category?.trim() === selectedCategory?.trim()}`);
      
      // Try multiple matching strategies
      const categoryMatch = gallery.category === selectedCategory ||
                           gallery.category?.trim() === selectedCategory?.trim() ||
                           gallery.category?.toLowerCase() === selectedCategory?.toLowerCase();
      
      console.log(`Final match result: ${categoryMatch}`);
      return categoryMatch;
    })
    .filter(gallery => 
      gallery.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gallery.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gallery.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  console.log('=== GALLERY FILTERING DEBUG ===');
  console.log('Total galleries:', galleries.length);
  console.log('Selected category:', selectedCategory);
  console.log('All gallery categories:', galleries.map(g => `"${g.name}": "${g.category}"`));
  console.log('Filtered galleries count:', filteredGalleries.length);
  console.log('Filtered gallery names:', filteredGalleries.map(g => g.name));
  console.log('================================');

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="portfolio-admin-bg">
      {/* Staff Gallery Notifications */}
      {showNotifications && notifications.length > 0 && (
        <div className="notification-banner">
          <div className="notification-content">
            <div className="notification-header">
              <div className="notification-icon">📸</div>
              <div className="notification-title">
                <h4>Staff Gallery Updates</h4>
                <p>{notifications.length} new {notifications.length === 1 ? 'gallery' : 'galleries'} added</p>
              </div>
              <button 
                className="notification-close-all"
                onClick={() => {
                  // Store all current notifications as dismissed
                  const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
                  notifications.forEach(notification => {
                    if (!dismissedNotifications.includes(notification.timestamp)) {
                      dismissedNotifications.push(notification.timestamp);
                    }
                  });
                  localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedNotifications));
                  
                  // Mark all as read on server
                  const token = localStorage.getItem('token');
                  notifications.forEach(notification => {
                    fetch(`http://localhost:5050/api/gallery/notifications/${notification.timestamp}/read`, {
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
                <div className="notification-item-icon">🖼️</div>
                <div className="notification-item-content">
                  <span>{notification.galleryName}</span>
                  <div className="notification-item-meta">
                    {notification.category} • {new Date(notification.timestamp).toLocaleDateString()}
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

      <div className="portfolio-admin-header">
        <h1>Portfolio Management</h1>
        <p>Manage galleries and event photos</p>
        <div className="portfolio-admin-actions">
          <button 
            className="portfolio-admin-add-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Gallery
          </button>
          <div className="portfolio-admin-report-buttons">
            <button 
              className="portfolio-admin-report-btn pdf"
              onClick={handleDownloadPDF}
            >
              📄 PDF Report
            </button>
            <button 
              className="portfolio-admin-report-btn excel"
              onClick={handleDownloadExcel}
            >
              📊 Excel Report
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="portfolio-admin-loading">Loading galleries...</div>
      ) : error ? (
        <div className="portfolio-admin-error">{error}</div>
      ) : uploading ? (
        <div className="upload-progress-overlay">
          <div className="upload-progress-content">
            <div className="upload-spinner"></div>
            <h2>Uploading Gallery</h2>
            <p>{uploadProgress}</p>
            <div className="upload-progress-bar">
              <div className="upload-progress-fill"></div>
            </div>
          </div>
        </div>
      ) : updating ? (
        <div className="upload-progress-overlay">
          <div className="upload-progress-content">
            <div className="upload-spinner"></div>
            <h2>Updating Gallery</h2>
            <p>{updateProgress}</p>
            <div className="upload-progress-bar">
              <div className="upload-progress-fill"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="portfolio-admin-container">
          <div className="portfolio-admin-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search galleries by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-number">{galleries.length}</span>
                <span className="stat-label">Total Galleries</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{filteredGalleries.length}</span>
                <span className="stat-label">Filtered</span>
              </div>
            </div>
          </div>
          
          <div className="portfolio-admin-filters">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="portfolio-admin-filter-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' :
                   category === 'batch' ? 'Batch Party' :
                   category === 'social' ? 'Social Gatherings' :
                   category === 'birthday' ? 'Birthday Parties' :
                   category === 'cultural' ? 'Cultural Events' :
                   category === 'other' ? 'Other Events' :
                   category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="portfolio-admin-grid">
            {filteredGalleries.map(gallery => (
              <div key={gallery._id} className="portfolio-admin-card">
                <div className="portfolio-admin-card-image">
                  <img src={getImageUrl(gallery.cover)} alt={gallery.name} />
                  <div className="portfolio-admin-card-category">
                    {gallery.category === 'batch' ? 'Batch Party' :
                     gallery.category === 'social' ? 'Social Gatherings' :
                     gallery.category === 'birthday' ? 'Birthday Parties' :
                     gallery.category === 'cultural' ? 'Cultural Events' :
                     gallery.category === 'other' ? 'Other Events' :
                     gallery.category}
                  </div>
                  <div className="portfolio-admin-card-photo-count">{gallery.photos.length} photos</div>
                </div>
                
                <div className="portfolio-admin-card-content">
                  <h3 className="portfolio-admin-card-title">{gallery.name}</h3>
                  <p className="portfolio-admin-card-date">
                    Created: {new Date(gallery.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="portfolio-admin-card-actions">
                  <button
                    className="portfolio-admin-btn edit"
                    onClick={() => {
                      setSelectedGallery(gallery);
                      setShowUpdateModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="portfolio-admin-btn delete"
                    onClick={() => {
                      setSelectedGallery(gallery);
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="portfolio-admin-btn view"
                    onClick={() => openGallery(gallery)}
                  >
                    View Gallery
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && currentGallery && (
        <div className="portfolio-lightbox" onClick={closeGallery}>
          <div className="portfolio-lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="portfolio-lightbox-close" onClick={closeGallery}>&times;</button>
            <button 
              className="portfolio-lightbox-nav prev" 
              onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : currentGallery.photos.length - 1)}
            >
              ‹
            </button>
            <img 
              src={getImageUrl(currentGallery.photos[currentImageIndex])} 
              alt={`${currentGallery.name} - Photo ${currentImageIndex + 1}`}
              className="portfolio-lightbox-image"
            />
            <button 
              className="portfolio-lightbox-nav next" 
              onClick={() => setCurrentImageIndex(prev => prev < currentGallery.photos.length - 1 ? prev + 1 : 0)}
            >
              ›
            </button>
            <div className="portfolio-lightbox-info">
              <h3>{currentGallery.name}</h3>
              <p>Photo {currentImageIndex + 1} of {currentGallery.photos.length}</p>
              <button 
                className="portfolio-lightbox-download"
                onClick={handleProxyDownload}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      <AddGalleryModal 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSubmit={handleAddGallery}
        categories={[
          { key: 'batch', label: 'Batch Party' },
          { key: 'social', label: 'Social Gatherings' },
          { key: 'birthday', label: 'Birthday Parties' },
          { key: 'cultural', label: 'Cultural Events' },
          { key: 'other', label: 'Other Events' }
        ]}
      />
      
      <UpdateGalleryModal 
        open={showUpdateModal} 
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedGallery(null);
        }} 
        onSubmit={handleUpdateGallery}
        event={selectedGallery}
        categories={[
          { key: 'batch', label: 'Batch Party' },
          { key: 'social', label: 'Social Gatherings' },
          { key: 'birthday', label: 'Birthday Parties' },
          { key: 'cultural', label: 'Cultural Events' },
          { key: 'other', label: 'Other Events' }
        ]}
      />
      
      <DeleteGalleryConfirm 
        open={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGallery(null);
        }} 
        onConfirm={handleDeleteGallery}
        eventName={selectedGallery?.name}
      />
      
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

export default PortfolioAdmin; 