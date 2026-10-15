const express = require('express');
const router = express.Router();
const multer = require('multer');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { cloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');
const { createPDFHeader } = require('../utils/pdfUtils');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

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

// Configure storage provider
const storage = isCloudinaryConfigured ? 
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      const safeBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]/g, '_');
      return {
        folder: 'payment_slips',
        resource_type: 'auto',
        format: ext === 'pdf' ? 'pdf' : undefined,
        public_id: `${safeBase}-${Date.now()}`
      };
    }
  }) : localStorage;

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1,
    fieldSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'image/webp'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.webp'];

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: JPEG, PNG, GIF, WebP, PDF.`), false);
    }
  }
});

// Create a new booking with advance payment (Public / User with optional auth)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      selectedService,
      eventType,
      fullName,
      contactNumber,
      email,
      date,
      startTime,
      endTime,
      location,
      venue,
      specialRequirements,
      totalAmount,
      advanceAmount,
      remainingAmount,
      advancePaymentId,
      paymentSlipFile
    } = req.body;

    // Validate required fields
    if (!selectedService || !fullName || !contactNumber || !email || !date || !startTime || !endTime || !location || !venue) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields'
      });
    }

    // Generate unique booking ID
    const bookingId = 'BK' + Date.now().toString().slice(-6);

    const bookingData = {
      selectedService,
      eventType: eventType || 'Photography Service',
      fullName: fullName.trim(),
      contactNumber: contactNumber.trim(),
      email: email.toLowerCase().trim(),
      date,
      startTime,
      endTime,
      location,
      venue,
      specialRequirements: specialRequirements || '',
      totalAmount: Number(totalAmount) || 0,
      advanceAmount: Number(advanceAmount) || 0,
      remainingAmount: Number(remainingAmount) || 0,
      advancePaymentId: advancePaymentId || ('PAY' + Date.now()),
      paymentSlipFile,
      bookingId,
      paymentStatus: 'advance_paid',
      bookingStatus: 'pending',
      adminApprovalStatus: 'pending'
    };

    if (req.user && req.user.userId) {
      bookingData.userId = req.user.userId;
    }

    const booking = new Booking(bookingData);
    await booking.save();

    // Store notification for admin about new booking
    const notification = new Notification({
      type: 'client_booking_created',
      message: `New booking from ${booking.fullName}`,
      bookingId: booking._id,
      bookingNumber: booking.bookingId,
      clientName: booking.fullName,
      service: booking.eventType || 'Photography Service',
      eventDate: booking.date,
      timestamp: new Date(),
      read: false
    });
    
    await notification.save();

    res.status(201).json({
      success: true,
      booking: booking,
      message: 'Booking created with advance payment. Awaiting admin approval.'
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// Upload payment slip
router.post('/upload-slip', upload.single('paymentSlip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No payment slip file uploaded'
      });
    }

    let fileName;
    if (isCloudinaryConfigured) {
      fileName = req.file.path;
    } else {
      fileName = req.file.filename;
    }

    res.json({
      success: true,
      fileName: fileName,
      message: 'Payment slip uploaded successfully'
    });
  } catch (error) {
    console.error('Payment slip upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload payment slip',
      error: error.message
    });
  }
}, (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }
  res.status(400).json({
    success: false,
    message: error.message || 'File upload failed'
  });
});

// Get user notifications (fixes route shadowing bug)
router.get('/user/:userId/notifications', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({
      $or: [
        { userId: userId },
        { assignedClientId: userId },
        { userEmail: req.user?.email || '' }
      ]
    }).sort({ timestamp: -1 }).limit(20);

    res.json({
      success: true,
      notifications: notifications || []
    });
  } catch (error) {
    console.error('User notifications fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user notifications'
    });
  }
});

// Get all bookings (Protected: Admin Only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('selectedService')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings: bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// Get booking statistics (Protected: Admin Only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ bookingStatus: 'confirmed' });
    const pendingBookings = await Booking.countDocuments({ bookingStatus: 'pending' });
    const completedBookings = await Booking.countDocuments({ bookingStatus: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });

    const revenueData = await Booking.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const advanceRevenueData = await Booking.aggregate([
      { $match: { paymentStatus: 'advance_paid' } },
      { $group: { _id: null, advanceRevenue: { $sum: '$advanceAmount' } } }
    ]);
    const advanceRevenue = advanceRevenueData.length > 0 ? advanceRevenueData[0].advanceRevenue : 0;

    const recentBookings = await Booking.find()
      .populate('selectedService')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        advanceRevenue,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics'
    });
  }
});

// Get bookings by date range (Protected: Admin Only)
router.get('/stats/date-range', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('selectedService')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings: bookings
    });
  } catch (error) {
    console.error('Get bookings by date range error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings by date range'
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Bookings API is working' });
});

// Generate booking report (Protected: Admin Only)
router.post('/report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('selectedService')
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.bookingStatus === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.bookingStatus === 'pending').length;
    const completedBookings = bookings.filter(b => b.bookingStatus === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.bookingStatus === 'cancelled').length;

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const advanceRevenue = bookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0);

    const reportData = {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      advanceRevenue,
      bookings: bookings.map(b => ({
        _id: b._id,
        bookingId: b.bookingId,
        clientName: b.fullName,
        serviceName: b.selectedService?.title || 'N/A',
        eventDate: b.date,
        totalAmount: b.totalAmount,
        advanceAmount: b.advanceAmount,
        bookingStatus: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        contactNumber: b.contactNumber,
        email: b.email,
        venue: b.venue,
        location: b.location,
        createdAt: b.createdAt
      }))
    };

    res.json({ success: true, reportData });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate booking report' });
  }
});

// Download booking report (Protected: Admin Only)
router.post('/report/download', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reportData, format } = req.body;

    if (!reportData || !reportData.bookings) {
      return res.status(400).json({ success: false, message: 'Invalid report data' });
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=booking-report-${new Date().toISOString().split('T')[0]}.pdf`);
      doc.pipe(res);

      const startY = createPDFHeader(doc, 'Global Image - Booking Report', 'Booking Management Report');
      doc.y = startY;
      doc.x = 20;

      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Bookings: ${reportData.totalBookings || 0}`);
      doc.text(`Total Revenue: LKR ${(reportData.totalRevenue || 0).toLocaleString()}`);
      doc.text(`Confirmed Bookings: ${reportData.confirmedBookings || 0}`);
      doc.text(`Pending Bookings: ${reportData.pendingBookings || 0}`);
      doc.text(`Completed Bookings: ${reportData.completedBookings || 0}`);
      doc.text(`Cancelled Bookings: ${reportData.cancelledBookings || 0}`);
      doc.moveDown(2);

      doc.fontSize(16).text('Detailed Bookings', { underline: true });
      doc.moveDown();

      if (reportData.bookings && reportData.bookings.length > 0) {
        reportData.bookings.forEach((booking, index) => {
          doc.fontSize(12).text(`Booking ${index + 1}:`, { bold: true });
          doc.fontSize(10).text(`ID: ${booking.bookingId || booking._id?.slice(-6) || 'N/A'}`);
          doc.text(`Client: ${booking.clientName || 'N/A'}`);
          doc.text(`Service: ${booking.serviceName || 'N/A'}`);
          doc.text(`Date: ${booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : 'N/A'}`);
          doc.text(`Amount: LKR ${(booking.totalAmount || 0).toLocaleString()}`);
          doc.text(`Status: ${booking.bookingStatus || 'N/A'}`);
          doc.moveDown();
        });
      } else {
        doc.fontSize(12).text('No bookings found');
      }

      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Booking Report');

      worksheet.columns = [
        { header: 'Booking ID', key: 'id', width: 15 },
        { header: 'Client Name', key: 'client', width: 20 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'Event Date', key: 'date', width: 15 },
        { header: 'Total (LKR)', key: 'total', width: 15 },
        { header: 'Advance (LKR)', key: 'advance', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Payment', key: 'payment', width: 15 },
        { header: 'Contact', key: 'contact', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Venue', key: 'venue', width: 15 },
        { header: 'Location', key: 'location', width: 15 }
      ];

      reportData.bookings.forEach(b => {
        worksheet.addRow({
          id: b.bookingId || b._id,
          client: b.clientName,
          service: b.serviceName,
          date: b.eventDate ? new Date(b.eventDate).toLocaleDateString() : '',
          total: b.totalAmount,
          advance: b.advanceAmount,
          status: b.bookingStatus,
          payment: b.paymentStatus,
          contact: b.contactNumber,
          email: b.email,
          venue: b.venue,
          location: b.location
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=booking-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      await workbook.xlsx.write(res);
    } else {
      res.status(400).json({ success: false, message: 'Invalid format specified' });
    }
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ success: false, message: 'Failed to download report' });
  }
});

// Get admin booking notifications (Protected: Admin Only)
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      type: 'client_booking_created',
      read: false 
    }).sort({ timestamp: -1 });
    
    res.json({
      success: true,
      notifications: notifications
    });
  } catch (err) {
    console.error('Booking notifications fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch booking notifications' });
  }
});

// Mark booking notification as read (Protected: Admin Only)
router.post('/notifications/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark booking notification read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// Get booking by ID (Protected: Admin, Staff, or Booking Owner)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    let booking;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(req.params.id).populate('selectedService');
    } else {
      booking = await Booking.findOne({ bookingId: req.params.id }).populate('selectedService');
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isAdminOrStaff = req.user.isAdmin === true || req.user.role === 'admin' || req.user.role === 'staff';
    const isOwner = (booking.userId && String(booking.userId) === String(req.user.userId)) ||
                    (booking.email && booking.email.toLowerCase() === req.user.email?.toLowerCase());

    if (!isAdminOrStaff && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied to this booking' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

// Update booking status (Protected: Admin Only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { bookingStatus, adminNotes, assignedPhotographer } = req.body;
    const updateData = {
      bookingStatus,
      adminNotes,
      assignedPhotographer,
      updatedAt: Date.now()
    };

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('selectedService');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: booking,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking', error: error.message });
  }
});

// Admin approval for booking (Protected: Admin Only)
router.patch('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { adminApprovalStatus, adminApprovedBy, adminNotes } = req.body;
    const updateData = {
      adminApprovalStatus,
      adminApprovedBy,
      adminNotes,
      updatedAt: Date.now()
    };

    if (adminApprovalStatus === 'approved') {
      updateData.adminApprovalDate = Date.now();
      updateData.bookingStatus = 'confirmed';
      updateData.paymentStatus = 'completed';
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('selectedService');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: booking,
      message: `Booking ${adminApprovalStatus} successfully`
    });
  } catch (error) {
    console.error('Admin approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to update approval status', error: error.message });
  }
});

// Upload transaction file (Protected: Admin Only)
router.post('/:id/transaction-file', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { fileName, filePath } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        transactionFile: { fileName, filePath, uploadedAt: Date.now() },
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('selectedService');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, booking, message: 'Transaction file uploaded successfully' });
  } catch (error) {
    console.error('Transaction file upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload transaction file' });
  }
});

// Send booking confirmation email (Protected: Admin Only)
router.post('/:id/send-confirmation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sendEmailConfirmation } = req.body;
    const booking = await Booking.findById(req.params.id).populate('selectedService');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (sendEmailConfirmation) {
      const emailService = require('../services/emailService');
      const emailResult = await emailService.sendBookingConfirmation(booking);
      
      if (emailResult.success) {
        await Booking.findByIdAndUpdate(req.params.id, {
          'emailSent.bookingConfirmation': true,
          updatedAt: Date.now()
        });
        res.json({ success: true, message: 'Booking confirmation email sent successfully', emailResult });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send confirmation email', error: emailResult.error });
      }
    } else {
      res.json({ success: true, message: 'Booking confirmed without email' });
    }
  } catch (error) {
    console.error('Send confirmation error:', error);
    res.status(500).json({ success: false, message: 'Failed to send confirmation', error: error.message });
  }
});

// Delete booking (Protected: Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
});

module.exports = router;