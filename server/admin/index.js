const express = require('express');
const router = express.Router();
const adminRoutes = require('./routes');
const adminAuth = require('./middleware');

// Mount admin routes
router.use('/', adminRoutes);

// Admin health check endpoint
router.get('/health', adminAuth, (req, res) => {
  res.json({
    status: 'Admin API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = {
  router,
  adminAuth
}; 