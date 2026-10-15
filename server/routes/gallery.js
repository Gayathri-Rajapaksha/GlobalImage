const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Gallery = require('../models/Gallery');
const Notification = require('../models/Notification');
const { cloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { authenticateToken, requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for local files (fallback when Cloudinary is not configured)
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${safeBase}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage
const storage = isCloudinaryConfigured ? 
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const safeBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]/g, '_');
      return {
        folder: 'galleries',
        resource_type: 'image',
        format: 'jpg',
        quality: 'auto:good',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        public_id: `${safeBase}-${Date.now()}`
      };
    }
  }) : localStorage;

const upload = multer({ 
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB per file
    files: 50,
    fieldSize: 200 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
    }
  }
});

// POST /api/gallery/upload - Upload single image (Protected: Staff or Admin)
router.post('/upload', authenticateToken, requireStaffOrAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    let imageUrl;
    if (isCloudinaryConfigured) {
      imageUrl = req.file.path;
    } else {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    res.json({
      success: true,
      imageUrl: imageUrl
    });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

// POST /api/gallery - Add gallery (Protected: Staff or Admin)
router.post('/', authenticateToken, requireStaffOrAdmin, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'photos', maxCount: 50 }
]), async (req, res) => {
  try {
    const name = req.body.name || req.body.title;
    const description = req.body.description || '';
    const category = req.body.category;
    
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and category are required' 
      });
    }
    
    let photos = [];
    let coverImage = null;
    
    if (req.files && req.files.photos) {
      const files = req.files.photos;
      photos = files.map(file => {
        return isCloudinaryConfigured ? file.path : `/uploads/${file.filename}`;
      });
      
      if (req.files.cover && req.files.cover[0]) {
        coverImage = isCloudinaryConfigured ? req.files.cover[0].path : `/uploads/${req.files.cover[0].filename}`;
      } else {
        coverImage = photos[0];
      }
    } else if (req.body.images) {
      photos = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      coverImage = photos[0];
    }
    
    if (!photos || photos.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one photo is required' 
      });
    }
    
    const gallery = new Gallery({
      name: String(name).trim().slice(0, 150),
      description: String(description).trim().slice(0, 2000),
      category: String(category).trim(),
      cover: coverImage,
      photos: photos
    });
    
    await gallery.save();
    
    // Create notification if staff added this gallery
    if (req.user && req.user.role === 'staff') {
      const notification = new Notification({
        type: 'staff_gallery_added',
        message: `New gallery "${gallery.name}" added by staff`,
        galleryId: gallery._id,
        galleryName: gallery.name,
        category: gallery.category,
        timestamp: new Date(),
        read: false
      });
      await notification.save();
    }
    
    res.status(201).json({
      success: true,
      gallery: {
        _id: gallery._id,
        name: gallery.name,
        description: gallery.description,
        category: gallery.category,
        photoCount: photos.length
      },
      message: `Gallery "${name}" created successfully with ${photos.length} photos`
    });
  } catch (err) {
    console.error('Gallery creation error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to create gallery. Please try again.' 
    });
  }
});

// GET /api/gallery - Get all galleries (Public route)
router.get('/', async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      galleries: galleries
    });
  } catch (err) {
    console.error('Fetch galleries error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/gallery/:id - Update gallery (Protected: Staff or Admin)
router.put('/:id', authenticateToken, requireStaffOrAdmin, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'photos', maxCount: 50 }
]), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    let keepPhotos = [];
    if (req.body.keepPhotos) {
      try {
        keepPhotos = JSON.parse(req.body.keepPhotos);
      } catch (e) {
        keepPhotos = [];
      }
    }
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: 'Gallery not found' });
    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required.' });
    }
    
    gallery.name = String(name).trim().slice(0, 150);
    gallery.description = String(description).trim().slice(0, 2000);
    gallery.category = String(category).trim();
    
    if (req.files?.cover && req.files.cover[0]) {
      gallery.cover = isCloudinaryConfigured ? req.files.cover[0].path : `/uploads/${req.files.cover[0].filename}`;
    }
    
    gallery.photos = keepPhotos;
    if (req.files?.photos && req.files.photos.length > 0) {
      const newUrls = req.files.photos.map(f => isCloudinaryConfigured ? f.path : `/uploads/${f.filename}`);
      gallery.photos = gallery.photos.concat(newUrls);
    }
    
    await gallery.save();
    res.json(gallery);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// DELETE /api/gallery/:id - Delete gallery (Protected: Staff or Admin)
router.delete('/:id', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: 'Gallery not found' });
    await gallery.deleteOne();
    res.json({ message: 'Gallery deleted' });
  } catch (err) {
    console.error('Gallery delete error:', err);
    res.status(500).json({ message: 'Server error deleting gallery' });
  }
});

// Proxy download endpoint with SSRF prevention (Public)
router.get('/download', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('No url provided');
  try {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).send('Invalid URL format');
    }

    // SSRF Prevention: only allow Cloudinary CDN domain
    const isCloudinary = parsedUrl.hostname === 'res.cloudinary.com';
    if (!isCloudinary) {
      return res.status(400).send('Direct image downloads are only supported for secure Cloudinary assets');
    }

    const response = await axios.get(url, { responseType: 'stream', timeout: 15000 });
    const filename = path.basename(parsedUrl.pathname) || 'image.jpg';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    response.data.pipe(res);
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).send('Failed to download image');
  }
});

// Gallery report endpoint (Protected: Staff or Admin)
router.get('/report', authenticateToken, requireStaffOrAdmin, async (req, res) => {
  try {
    const report = await Gallery.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            category: "$category"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.category": 1 }
      }
    ]);
    res.json(report);
  } catch (err) {
    console.error('Gallery report error:', err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

// Get admin notifications (Protected: Admin Only)
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      type: 'staff_gallery_added',
      read: false 
    }).sort({ timestamp: -1 });
    
    res.json({
      success: true,
      notifications: notifications
    });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read (Protected: Admin Only)
router.post('/notifications/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notificationId = req.params.id;
    if (notificationId.match(/^[0-9a-fA-F]{24}$/)) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    } else {
      await Notification.findOneAndUpdate(
        { timestamp: new Date(notificationId) },
        { read: true }
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

module.exports = router;