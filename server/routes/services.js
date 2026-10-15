const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const { cloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

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

const storage = isCloudinaryConfigured ? 
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const safeBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]/g, '_');
      return {
        folder: 'services',
        resource_type: 'image',
        format: 'jpg',
        public_id: `${safeBase}-${Date.now()}`
      };
    }
  }) : localStorage;

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed for service covers'), false);
    }
  }
});

// GET /api/services - Get all services (Public)
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    console.error('Fetch services error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/services - Add service (Protected: Admin Only)
router.post('/', authenticateToken, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { title, description, category, price, hours } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Service image is required' });
    }
    
    if (!title || !description || !category || price === undefined || hours === undefined) {
      return res.status(400).json({ message: 'Title, description, category, price, and hours are required.' });
    }
    
    let photoUrl;
    if (isCloudinaryConfigured) {
      photoUrl = req.file.path;
    } else {
      photoUrl = `/uploads/${req.file.filename}`;
    }
    
    const service = new Service({
      title: String(title).trim().slice(0, 100),
      description: String(description).trim().slice(0, 2000),
      category: String(category).trim(),
      price: parseFloat(price),
      hours: parseInt(hours),
      photo: photoUrl
    });
    await service.save();

    // Create notification for new service package
    try {
      const notification = new Notification({
        type: 'service_added',
        message: `New service package available: ${service.title} in ${service.category} category`,
        serviceId: service._id,
        serviceName: service.title,
        serviceCategory: service.category,
        timestamp: new Date(),
        read: false
      });
      await notification.save();
    } catch (notificationErr) {
      console.error('Failed to create service notification:', notificationErr);
    }

    res.status(201).json(service);
  } catch (err) {
    console.error('Service creation error:', err);
    res.status(500).json({ message: 'Server error creating service package' });
  }
});

// PUT /api/services/:id - Update service (Protected: Admin Only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { title, description, category, price, hours } = req.body;
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    
    if (!title || !description || !category || price === undefined || hours === undefined) {
      return res.status(400).json({ message: 'Title, description, category, price, and hours are required.' });
    }
    
    service.title = String(title).trim().slice(0, 100);
    service.description = String(description).trim().slice(0, 2000);
    service.category = String(category).trim();
    service.price = parseFloat(price);
    service.hours = parseInt(hours);
    
    if (req.file) {
      if (isCloudinaryConfigured) {
        service.photo = req.file.path;
      } else {
        service.photo = `/uploads/${req.file.filename}`;
      }
    }
    
    await service.save();
    res.json(service);
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ message: err.message || 'Server error updating service' });
  }
});

// DELETE /api/services/:id - Delete service (Protected: Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    
    await service.deleteOne();
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ message: 'Server error deleting service' });
  }
});

// Service report endpoint (Protected: Admin Only)
router.get('/report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const report = await Service.aggregate([
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
    console.error('Service report error:', err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

// GET /api/services/notifications - Get service notifications (Protected: Admin Only)
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      type: 'service_added',
      read: false 
    }).sort({ timestamp: -1 });
    
    res.json({
      success: true,
      notifications
    });
  } catch (err) {
    console.error('Failed to fetch service notifications:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications' 
    });
  }
});

// POST /api/services/notifications/:id/read - Mark service notification as read (Protected: Admin Only)
router.post('/notifications/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read' 
    });
  }
});

module.exports = router;