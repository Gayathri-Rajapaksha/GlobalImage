const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Service Details
  selectedService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  eventType: {
    type: String,
    required: true
  },

  // Event Information
  fullName: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  specialRequirements: {
    type: String,
    default: ''
  },

  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'advance_paid', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  advanceAmount: {
    type: Number,
    required: true
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  advancePaymentId: {
    type: String,
    required: true
  },
  paymentSlipFile: {
    type: String,
    required: true
  },

  // Admin Approval
  adminApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminApprovalDate: {
    type: Date,
    default: null
  },
  adminApprovedBy: {
    type: String,
    default: ''
  },

  // Booking Status
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  bookingId: {
    type: String,
    required: true,
    unique: true
  },

  // Transaction File Upload
  transactionFile: {
    fileName: String,
    filePath: String,
    uploadedAt: Date
  },

  // Email Notifications
  emailSent: {
    advancePayment: { type: Boolean, default: false },
    adminApproval: { type: Boolean, default: false },
    bookingConfirmation: { type: Boolean, default: false }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Admin Notes
  adminNotes: {
    type: String,
    default: ''
  },
  assignedPhotographer: {
    type: String,
    default: ''
  }
});

// Update the updatedAt field before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema); 