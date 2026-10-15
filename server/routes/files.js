const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// Helper to safely resolve a file inside UPLOADS_DIR preventing path traversal
function getSafeFilePath(filename) {
  if (!filename) return null;
  // Strip any directory paths to enforce filename only
  const sanitized = path.basename(decodeURIComponent(filename));
  // Ensure no null bytes or suspicious characters
  if (sanitized.includes('\0')) return null;
  
  const resolved = path.resolve(UPLOADS_DIR, sanitized);
  // Ensure the resolved path remains inside UPLOADS_DIR
  if (!resolved.startsWith(UPLOADS_DIR)) {
    return null;
  }
  return { sanitized, resolved };
}

// Helper to authenticate user from header or query parameter
function authenticateFileRequest(req) {
  const token = req.header('Authorization')?.replace('Bearer ', '')?.trim() || req.query.token?.trim();
  if (!token || !process.env.JWT_SECRET) {
    return null;
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Serve uploaded payment slip files (Confidential: requires admin, staff, or booking owner)
router.get('/payment-slip/:filename', async (req, res) => {
  try {
    const fileInfo = getSafeFilePath(req.params.filename);
    if (!fileInfo) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const { sanitized, resolved: filePath } = fileInfo;

    // Check authentication
    const user = authenticateFileRequest(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required to access customer payment slips.' 
      });
    }

    const isAdminOrStaff = user.isAdmin === true || user.role === 'admin' || user.role === 'staff';

    // If not admin/staff, verify if the user owns this booking
    if (!isAdminOrStaff) {
      const booking = await Booking.findOne({
        paymentSlipFile: new RegExp(sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        $or: [{ userId: user.userId }, { email: user.email }]
      });

      if (!booking) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied: You are not authorized to view this payment slip.' 
        });
      }
    }

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Payment slip not found' });
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${sanitized}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'private, no-cache');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Payment slip serving error:', error);
    res.status(500).json({ success: false, message: 'Failed to serve payment slip' });
  }
});

// Serve uploaded transaction files (Confidential: requires admin or staff)
router.get('/transaction/:filename', async (req, res) => {
  try {
    const fileInfo = getSafeFilePath(req.params.filename);
    if (!fileInfo) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const { sanitized, resolved: filePath } = fileInfo;

    // Check authentication
    const user = authenticateFileRequest(req);
    if (!user || (!user.isAdmin && user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Administrator or staff privileges required.' 
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Transaction file not found' });
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${sanitized}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'private, no-cache');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Transaction file serving error:', error);
    res.status(500).json({ success: false, message: 'Failed to serve transaction file' });
  }
});

// Serve uploaded staff images (Public profile photos, protected against path traversal)
router.get('/staff/:filename', (req, res) => {
  try {
    const fileInfo = getSafeFilePath(req.params.filename);
    if (!fileInfo) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const { sanitized, resolved: filePath } = fileInfo;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Staff image not found' });
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${sanitized}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Staff image serving error:', error);
    res.status(500).json({ success: false, message: 'Failed to serve staff image' });
  }
});

module.exports = router;