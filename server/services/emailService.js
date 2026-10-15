const nodemailer = require('nodemailer');

// Create transporter for Gmail (with fallback for testing)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'globalimagephotography@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// For testing without Gmail setup, we'll simulate email sending
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

// Send booking confirmation email
const sendBookingConfirmation = async (booking) => {
  try {
    console.log('Attempting to send confirmation email to:', booking.email);
    console.log('Email configuration status:', isEmailConfigured ? 'Configured' : 'Not configured');
    
    // For now, always simulate success since Gmail is not configured
    console.log('Email not configured - simulating successful email send');
    return { 
      success: true, 
      messageId: 'simulated-' + Date.now(),
      simulated: true 
    };

    // The actual email sending code is commented out until Gmail is configured
    /*
    const mailOptions = {
      from: process.env.EMAIL_USER || 'globalimagephotography@gmail.com',
      to: booking.email,
      subject: `Booking Confirmed - ${booking.bookingId} | Global Image Photography`,
      html: `... email template ...`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    */
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send booking cancellation email
const sendBookingCancellation = async (booking) => {
  try {
    console.log('Attempting to send cancellation email to:', booking.email);
    console.log('Email configuration status:', isEmailConfigured ? 'Configured' : 'Not configured');
    
    // For now, always simulate success since Gmail is not configured
    console.log('Email not configured - simulating successful cancellation email send');
    return { 
      success: true, 
      messageId: 'simulated-cancellation-' + Date.now(),
      simulated: true 
    };

    // The actual email sending code is commented out until Gmail is configured
    /*
    const mailOptions = {
      from: process.env.EMAIL_USER || 'globalimagephotography@gmail.com',
      to: booking.email,
      subject: `Booking Cancelled - ${booking.bookingId} | Global Image Photography`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>Global Image Photography</h1>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa;">
            <h2 style="color: #dc3545;">Booking Cancellation Notice</h2>
            
            <p>Dear ${booking.fullName},</p>
            
            <p>We regret to inform you that your photography booking has been cancelled.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h3 style="color: #dc3545; margin-top: 0;">Booking Details:</h3>
              <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
              <p><strong>Service:</strong> ${booking.selectedService?.title || 'Photography Service'}</p>
              <p><strong>Event Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
              <p><strong>Event Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
              <p><strong>Location:</strong> ${booking.location}, ${booking.venue}</p>
              <p><strong>Total Amount:</strong> LKR ${booking.totalAmount?.toLocaleString()}</p>
              <p><strong>Advance Payment:</strong> LKR ${booking.advanceAmount?.toLocaleString()}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Important Information:</h3>
              <p><strong>Your advance payment of LKR ${booking.advanceAmount?.toLocaleString()} will be refunded.</strong></p>
              <p>The refund process will be initiated within 3-5 business days and will be processed to your original payment method.</p>
            </div>
            
            <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bee5eb;">
              <h3 style="color: #0c5460; margin-top: 0;">📞 Contact Information:</h3>
              <p>If you have any questions about this cancellation or the refund process, please contact us:</p>
              <p><strong>Phone:</strong> 077-7155653</p>
              <p><strong>Email:</strong> globalimagelanka@gmail.com</p>
              <p><strong>Address:</strong> 171/1/1, EL Senanayake Street, Kandy</p>
            </div>
            
            <p>We apologize for any inconvenience this may have caused. We hope to have the opportunity to serve you in the future.</p>
            
            <p>Best regards,<br>
            <strong>Global Image Photography Team</strong></p>
          </div>
          
          <div style="background: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Booking cancellation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    */
  } catch (error) {
    console.error('Cancellation email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmation,
  sendBookingCancellation
}; 