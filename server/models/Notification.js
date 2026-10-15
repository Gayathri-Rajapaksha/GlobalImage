const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['client_registered', 'feedback_submitted', 'gallery_updated', 'service_added', 'staff_assigned', 'staff_gallery_added', 'client_booking_created']
  },
  message: {
    type: String,
    required: true
  },
  // For gallery notifications
  galleryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gallery'
  },
  galleryName: String,
  category: String,
  
  // For booking notifications
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  bookingNumber: String,
  clientName: String,
  service: String,
  eventDate: Date,
  
  // For client registration notifications
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: String,
  
  // For feedback notifications
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  
  // For service notifications
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceName: String,
  serviceCategory: String,
  
  // For staff assignment notifications
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  staffName: String,
  assignedClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedClientName: String,
  
  // Common fields
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
