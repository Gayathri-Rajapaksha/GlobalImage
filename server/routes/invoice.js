const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const { createPDFHeader } = require('../utils/pdfUtils');

// Helper to authenticate user from header or query parameter
function authenticateUser(req) {
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

// Generate and download invoice (Protected: Admin, Staff, or Booking Owner)
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Check authentication
    const user = authenticateUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to generate invoice.'
      });
    }

    // Find the booking
    let booking;
    if (bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(bookingId).populate('selectedService');
    } else {
      booking = await Booking.findOne({ bookingId }).populate('selectedService');
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization: Admin, Staff, or Booking Owner (by userId or email)
    const isAdminOrStaff = user.isAdmin === true || user.role === 'admin' || user.role === 'staff';
    const isOwner = (booking.userId && String(booking.userId) === String(user.userId)) ||
                    (booking.email && booking.email.toLowerCase() === user.email?.toLowerCase());

    if (!isAdminOrStaff && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this invoice.'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${booking.bookingId || booking._id}.pdf"`);

    // Pipe the PDF to response
    doc.pipe(res);

    // Add professional header with logo
    const startY = createPDFHeader(doc, 'Global Image Photography', 'Professional Photography Services');
    
    // Position content after header
    doc.y = startY;
    doc.x = 20;
    
    // Invoice header
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('INVOICE', { align: 'center' })
       .moveDown(1);

    // Company contact information
    doc.fontSize(10)
       .font('Helvetica')
       .text('123 Photography Street, Colombo, Sri Lanka', { align: 'center' })
       .text('Phone: +94 11 234 5678 | Email: info@globalimage.com', { align: 'center' })
       .moveDown(1);

    // Invoice details
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(`Invoice Number: ${booking.bookingId || booking._id}`)
       .text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`)
       .text(`Due Date: ${new Date(booking.date).toLocaleDateString()}`)
       .moveDown(1);

    // Client information
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Bill To:')
       .moveDown(0.5);

    doc.fontSize(12)
       .font('Helvetica')
       .text(booking.fullName || 'N/A')
       .text(`Email: ${booking.email || 'N/A'}`)
       .text(`Phone: ${booking.contactNumber || 'N/A'}`)
       .text(`Event Date: ${booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}`)
       .text(`Event Time: ${booking.startTime || 'N/A'} - ${booking.endTime || 'N/A'}`)
       .text(`Location: ${booking.location || 'N/A'}, ${booking.venue || 'N/A'}`)
       .moveDown(1);

    // Service details
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Service Details:')
       .moveDown(0.5);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Service: ${booking.selectedService?.title || 'Photography Service'}`)
       .text(`Event Type: ${booking.eventType || 'N/A'}`)
       .text(`Duration: ${booking.selectedService?.hours || 'N/A'} hours`)
       .moveDown(1);

    // Payment breakdown
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Payment Breakdown:')
       .moveDown(0.5);

    const startX = 50;
    let currentY = doc.y;

    // Headers
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Description', startX, currentY)
       .text('Amount', startX + 300, currentY)
       .moveDown(0.5);

    currentY = doc.y;

    // Service cost
    doc.fontSize(12)
       .font('Helvetica')
       .text('Service Cost', startX, currentY)
       .text(`LKR ${(booking.totalAmount || 0).toLocaleString()}`, startX + 300, currentY)
       .moveDown(0.5);

    currentY = doc.y;

    // Advance payment
    doc.fontSize(12)
       .font('Helvetica')
       .text('Advance Payment (10%)', startX, currentY)
       .text(`LKR ${(booking.advanceAmount || 0).toLocaleString()}`, startX + 300, currentY)
       .moveDown(0.5);

    currentY = doc.y;

    // Remaining amount
    doc.fontSize(12)
       .font('Helvetica')
       .text('Remaining Amount (90%)', startX, currentY)
       .text(`LKR ${(booking.remainingAmount || 0).toLocaleString()}`, startX + 300, currentY)
       .moveDown(1);

    // Total
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Total Amount:', startX, doc.y)
       .text(`LKR ${(booking.totalAmount || 0).toLocaleString()}`, startX + 300, doc.y)
       .moveDown(2);

    // Payment status
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Payment Status:', startX, doc.y)
       .moveDown(0.5);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Advance Payment: ${booking.paymentStatus === 'advance_paid' ? 'PAID' : 'PENDING'}`)
       .text(`Remaining Payment: Due on event date`)
       .moveDown(1);

    // Terms and conditions
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Terms and Conditions:', startX, doc.y)
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .text('• 10% advance payment is required to confirm booking', startX, doc.y)
       .text('• Remaining 90% payment is due on the event date', startX, doc.y)
       .text('• Cancellation policy: 48 hours notice required', startX, doc.y)
       .text('• Weather conditions may affect outdoor photography', startX, doc.y)
       .text('• Final photos will be delivered within 2 weeks', startX, doc.y)
       .moveDown(1);

    // Footer
    doc.fontSize(10)
       .font('Helvetica')
       .text('Thank you for choosing Global Image Photography!', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(8)
       .text('This is a computer-generated invoice. No signature required.', { align: 'center' });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Invoice generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate invoice',
        error: error.message
      });
    }
  }
});

module.exports = router;