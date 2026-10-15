const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    let { firstName, lastName, email, password } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      email: normalizedEmail, 
      password: hashedPassword,
      role: 'client'
    });
    await user.save();
    
    // Create notification for admin about new client registration
    const notification = new Notification({
      type: 'client_registered',
      message: `New client registered: ${firstName.trim()} ${lastName.trim()}`,
      userId: user._id,
      clientName: `${firstName.trim()} ${lastName.trim()}`,
      userEmail: normalizedEmail,
      timestamp: new Date(),
      read: false
    });
    
    await notification.save();
    
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Forgot Password - Cryptographically secure, no token leakage
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always respond with generic message to prevent email enumeration
    const genericResponse = { 
      success: true,
      message: 'If an account exists with this email, password reset instructions have been dispatched.' 
    };

    if (!user) {
      return res.json(genericResponse);
    }
    
    // Generate secure random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store SHA256 hashed token in database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    await user.save();
    
    // If email service is configured, attempt sending email
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    if (emailUser && emailPass && !emailUser.includes('your_') && !emailPass.includes('your_')) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: emailUser, pass: emailPass }
        });
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const resetLink = `${clientUrl}/reset-password/${resetToken}`;

        await transporter.sendMail({
          from: emailUser,
          to: normalizedEmail,
          subject: 'Password Reset Request - Global Image Photography',
          html: `
            <p>You requested a password reset for your Global Image Photography account.</p>
            <p>Please click the following link to reset your password (valid for 1 hour):</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>If you did not request this, please ignore this email.</p>
          `
        });
      } catch (mailErr) {
        console.error('Failed to send reset email:', mailErr.message);
      }
    } else {
      console.log(`[DEV MODE] Password reset link for ${normalizedEmail}: http://localhost:3000/reset-password/${resetToken}`);
    }
    
    return res.json(genericResponse);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error processing request' });
  }
});

// Validate Reset Token
router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }
    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ 
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (user) {
      res.json({ valid: true });
    } else {
      res.status(400).json({ valid: false, message: 'Invalid or expired reset token' });
    }
  } catch (err) {
    console.error('Token validation error:', err);
    res.status(500).json({ message: 'Server error validating token' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ 
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET environment variable is missing.');
      return res.status(500).json({ message: 'Server authentication configuration error' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isAdmin = user.role === 'admin';
    const isStaff = user.role === 'staff';
    const canAccessPortfolio = Boolean(user.canAccessPortfolio || isAdmin || isStaff);

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role, 
        isAdmin: isAdmin,
        canAccessPortfolio: canAccessPortfolio 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id,
        _id: user._id,
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        phone: user.phone,
        role: user.role,
        isAdmin: isAdmin,
        isStaff: isStaff,
        canAccessPortfolio: canAccessPortfolio,
        isAssigned: Boolean(user.isAssigned)
      },
      isAdmin: isAdmin,
      isStaff: isStaff
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get admin client registration notifications (Protected: Admin Only)
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      type: 'client_registered',
      read: false 
    }).sort({ timestamp: -1 });
    
    res.json({
      success: true,
      notifications: notifications
    });
  } catch (err) {
    console.error('Client registration notifications fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch client registration notifications' });
  }
});

// Mark client registration notification as read (Protected: Admin Only)
router.post('/notifications/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findByIdAndUpdate(
      notificationId,
      { read: true }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Mark client registration notification read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

module.exports = router;