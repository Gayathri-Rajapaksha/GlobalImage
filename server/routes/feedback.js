const express = require('express');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Submit feedback (Public route)
router.post('/submit', async (req, res) => {
  try {
    const { name, email, subject, message, rating } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Validate rating
    const parsedRating = Number(rating);
    if (rating && (parsedRating < 1 || parsedRating > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    
    const feedback = new Feedback({
      name: String(name).trim().slice(0, 100),
      email: String(email).trim().toLowerCase().slice(0, 100),
      subject: String(subject).trim().slice(0, 200),
      message: String(message).trim().slice(0, 2000),
      rating: parsedRating || 5
    });
    
    await feedback.save();
    
    // Create notification for admin
    const notification = new Notification({
      type: 'feedback_submitted',
      message: `New feedback from ${feedback.name}: ${feedback.subject}`,
      feedbackId: feedback._id,
      userEmail: feedback.email,
      timestamp: new Date(),
      read: false
    });
    await notification.save();
    
    res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting feedback' });
  }
});

// Get reviewed feedback for public display (Public route)
router.get('/public', async (req, res) => {
  try {
    const reviewedFeedback = await Feedback.find({ 
      status: { $in: ['reviewed', 'resolved'] } 
    })
    .sort({ updatedAt: -1 })
    .limit(10);
    
    res.json(reviewedFeedback);
  } catch (err) {
    console.error('Get public feedback error:', err);
    res.status(500).json({ message: 'Server error fetching public feedback' });
  }
});

// Get all feedback (Protected: Admin Only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    console.error('Get feedback error:', err);
    res.status(500).json({ message: 'Server error fetching feedback' });
  }
});

// Update feedback status (Protected: Admin Only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;
    
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { 
        status, 
        adminResponse: adminResponse ? String(adminResponse).trim().slice(0, 2000) : '',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json({ message: 'Feedback status updated successfully', feedback });
  } catch (err) {
    console.error('Update feedback error:', err);
    res.status(500).json({ message: 'Server error updating feedback' });
  }
});

// Delete feedback (Protected: Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndDelete(id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error('Delete feedback error:', err);
    res.status(500).json({ message: 'Server error deleting feedback' });
  }
});

// Get feedback statistics (Protected: Admin Only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const total = await Feedback.countDocuments();
    const pending = await Feedback.countDocuments({ status: 'pending' });
    const reviewed = await Feedback.countDocuments({ status: 'reviewed' });
    const resolved = await Feedback.countDocuments({ status: 'resolved' });
    const avgRatingResult = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    
    res.json({
      total,
      pending,
      reviewed,
      resolved,
      avgRating: avgRatingResult[0]?.avgRating ? Number(avgRatingResult[0].avgRating.toFixed(1)) : 0
    });
  } catch (err) {
    console.error('Get feedback stats error:', err);
    res.status(500).json({ message: 'Server error fetching feedback stats' });
  }
});

// Get feedback notifications (Protected: Admin Only)
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      type: 'feedback_submitted',
      read: false 
    }).sort({ timestamp: -1 });
    
    res.json({ 
      success: true, 
      notifications 
    });
  } catch (err) {
    console.error('Get feedback notifications error:', err);
    res.status(500).json({ message: 'Server error fetching feedback notifications' });
  }
});

// Mark feedback notification as read (Protected: Admin Only)
router.post('/notifications/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark notification as read error:', err);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
});

module.exports = router;