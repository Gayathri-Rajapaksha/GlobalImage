const express = require('express');
const router = express.Router();
const adminAuth = require('./middleware');
const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllGalleries,
  deleteGallery,
  getAllServices,
  deleteService,
  getSystemInfo,
  getAnalytics,
  getAllClients,
  deleteClient,
  assignClientToStaff,
  removeClientAssignment,
  getAllStaff,
  generateClientReport,
  downloadClientReport,
  generateFeedbackReport,
  downloadFeedbackReport
} = require('./controllers');

// ==================== DASHBOARD STATISTICS ====================
router.get('/stats', adminAuth, getDashboardStats);

// ==================== USER MANAGEMENT ====================
router.get('/users', adminAuth, getAllUsers);
router.delete('/users/:id', adminAuth, deleteUser);

// ==================== CLIENT MANAGEMENT ====================
router.get('/clients', adminAuth, getAllClients);
router.get('/staff', adminAuth, getAllStaff);
router.delete('/clients/:id', adminAuth, deleteClient);
router.post('/clients/assign', adminAuth, assignClientToStaff);
router.delete('/clients/:clientId/assignment', adminAuth, removeClientAssignment);

// ==================== GALLERY MANAGEMENT ====================
router.get('/galleries', adminAuth, getAllGalleries);
router.delete('/galleries/:id', adminAuth, deleteGallery);

// ==================== SERVICE MANAGEMENT ====================
router.get('/services', adminAuth, getAllServices);
router.delete('/services/:id', adminAuth, deleteService);

// ==================== SYSTEM INFORMATION ====================
router.get('/system-info', adminAuth, getSystemInfo);

// ==================== ANALYTICS & REPORTS ====================
router.get('/analytics', adminAuth, getAnalytics);

// ==================== CLIENT REPORTS ====================
router.post('/clients/report', adminAuth, generateClientReport);
router.post('/clients/report/download', adminAuth, downloadClientReport);

// ==================== NOTIFICATIONS ====================
router.get('/notifications', adminAuth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notifications = await Notification.find({
      type: { $in: ['client_registered', 'staff_gallery_added', 'client_booking_created', 'feedback_submitted'] },
      read: false
    }).sort({ timestamp: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Admin notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin notifications' });
  }
});

router.post('/notifications/:id/read', adminAuth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notificationId = req.params.id;
    if (notificationId.match(/^[0-9a-fA-F]{24}$/)) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    } else {
      await Notification.findOneAndUpdate({ timestamp: new Date(notificationId) }, { read: true });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Mark notification error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

module.exports = router; 