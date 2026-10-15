const express = require('express');
const router = express.Router();
const multer = require('multer');
const Staff = require('../models/Staff');
const User = require('../models/User');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { cloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');
const { createPDFHeader } = require('../utils/pdfUtils');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

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

const storage = isCloudinaryConfigured ? 
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const safeBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]/g, '_');
      return {
        folder: 'staff',
        resource_type: 'image',
        format: 'jpg',
        public_id: `${safeBase}-${Date.now()}`
      };
    }
  }) : localStorage;

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed for staff portraits'), false);
    }
  }
});

// Get all staff members (Public: returns active team for website)
router.get('/', async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      staff: staff
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff data'
    });
  }
});

// Assign client to staff member (Protected: Admin Only)
router.post('/:staffId/assign-client', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { clientId, canAccessPortfolio } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client.assignedStaff = staff._id;
    client.isAssigned = true;
    client.canAccessPortfolio = canAccessPortfolio || false;
    await client.save();

    if (!staff.assignedClients.includes(client._id)) {
      staff.assignedClients.push(client._id);
      await staff.save();
    }

    const notification = new Notification({
      type: 'staff_assigned',
      message: `Client ${client.firstName} ${client.lastName} assigned to ${staff.name}`,
      staffId: staff._id,
      staffName: staff.name,
      assignedClientId: client._id,
      assignedClientName: `${client.firstName} ${client.lastName}`,
      timestamp: new Date(),
      read: false
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Client assigned successfully',
      staff: staff,
      client: client
    });
  } catch (error) {
    console.error('Assign client error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign client' });
  }
});

// Remove client assignment (Protected: Admin Only)
router.delete('/:staffId/remove-client/:clientId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { staffId, clientId } = req.params;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client.assignedStaff = null;
    client.isAssigned = false;
    client.canAccessPortfolio = false;
    await client.save();

    staff.assignedClients = staff.assignedClients.filter(id => id.toString() !== clientId);
    await staff.save();

    res.json({
      success: true,
      message: 'Client assignment removed successfully',
      staff: staff,
      client: client
    });
  } catch (error) {
    console.error('Remove client assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove client assignment' });
  }
});

// Get staff with assigned clients (Protected: Admin Only)
router.get('/:id/with-clients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('assignedClients', 'firstName lastName email phone canAccessPortfolio');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({ success: true, staff: staff });
  } catch (error) {
    console.error('Get staff with clients error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff with clients' });
  }
});

// Get staff assignment notifications (Protected: Admin Only)
router.get('/notifications/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      type: 'staff_assigned',
      read: false 
    }).sort({ timestamp: -1 });

    res.json({ success: true, notifications: notifications });
  } catch (error) {
    console.error('Staff notifications fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff notifications' });
  }
});

// Mark assignment notification as read (Protected: Admin Only)
router.put('/notifications/assignments/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notificationId = req.params.id;
    if (notificationId.match(/^[0-9a-fA-F]{24}$/)) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    } else {
      await Notification.findOneAndUpdate(
        { timestamp: new Date(notificationId) },
        { read: true }
      );
    }
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// Get staff member by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, staff: staff });
  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff member' });
  }
});

// Create new staff member (Protected: Admin Only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, position, email, phone, specialization, experience, bio } = req.body;
    
    if (!name || !position || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, position, email, and phone are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingStaff = await Staff.findOne({ email: normalizedEmail });
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = isCloudinaryConfigured ? req.file.path : `/uploads/${req.file.filename}`;
    }

    const newStaff = new Staff({
      name: String(name).trim().slice(0, 100),
      position: String(position).trim(),
      email: normalizedEmail,
      phone: String(phone).trim().slice(0, 30),
      specialization: specialization ? String(specialization).trim().slice(0, 150) : '',
      experience: Number(experience) || 0,
      bio: bio ? String(bio).trim().slice(0, 2000) : '',
      imageUrl
    });

    const savedStaff = await newStaff.save();
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff: savedStaff
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to create staff member', error: error.message });
  }
});

// Update staff member (Protected: Admin Only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, position, email, phone, specialization, experience, bio } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const existingStaff = await Staff.findOne({ 
      email: normalizedEmail,
      _id: { $ne: req.params.id }
    });
    
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const updateData = {
      name: String(name).trim().slice(0, 100),
      position: String(position).trim(),
      email: normalizedEmail,
      phone: String(phone).trim().slice(0, 30),
      specialization: specialization ? String(specialization).trim().slice(0, 150) : '',
      experience: Number(experience) || 0,
      bio: bio ? String(bio).trim().slice(0, 2000) : '',
      updatedAt: Date.now()
    };

    if (req.file) {
      updateData.imageUrl = isCloudinaryConfigured ? req.file.path : `/uploads/${req.file.filename}`;
    }

    const updatedStaff = await Staff.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedStaff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: updatedStaff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to update staff member', error: error.message });
  }
});

// Delete staff member (Protected: Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Unassign clients
    await User.updateMany(
      { assignedStaff: staff._id },
      { $set: { assignedStaff: null, isAssigned: false, canAccessPortfolio: false } }
    );

    await staff.deleteOne();
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete staff member' });
  }
});

// Get staff statistics (Protected: Admin Only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments({ isActive: true });
    const photographers = await Staff.countDocuments({ 
      isActive: true,
      position: { $in: ['Senior Photographer', 'Photographer', 'Assistant Photographer'] }
    });
    const editors = await Staff.countDocuments({ 
      isActive: true,
      position: 'Video Editor'
    });
    const managers = await Staff.countDocuments({ 
      isActive: true,
      position: 'Studio Manager'
    });

    res.json({
      success: true,
      stats: { totalStaff, photographers, editors, managers }
    });
  } catch (error) {
    console.error('Staff stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff statistics' });
  }
});

// Generate staff report (Protected: Admin Only)
router.post('/report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true }).sort({ createdAt: -1 });

    const totalStaff = staff.length;
    const seniorPhotographers = staff.filter(s => s.position === 'Senior Photographer').length;
    const photographers = staff.filter(s => s.position === 'Photographer').length;
    const assistantPhotographers = staff.filter(s => s.position === 'Assistant Photographer').length;
    const videoEditors = staff.filter(s => s.position === 'Video Editor').length;
    const studioManagers = staff.filter(s => s.position === 'Studio Manager').length;
    const customerService = staff.filter(s => s.position === 'Customer Service').length;
    const supportStaff = studioManagers + customerService;

    const totalExperience = staff.reduce((sum, member) => sum + (member.experience || 0), 0);
    const averageExperience = totalStaff > 0 ? Math.round(totalExperience / totalStaff) : 0;

    const reportData = {
      totalStaff,
      seniorPhotographers,
      photographers,
      assistantPhotographers,
      videoEditors,
      studioManagers,
      customerService,
      supportStaff,
      averageExperience,
      staff: staff.map(member => ({
        _id: member._id,
        name: member.name,
        position: member.position,
        email: member.email,
        phone: member.phone,
        specialization: member.specialization,
        experience: member.experience,
        bio: member.bio,
        imageUrl: member.imageUrl,
        createdAt: member.createdAt
      }))
    };

    res.json({ success: true, reportData });
  } catch (error) {
    console.error('Generate staff report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate staff report' });
  }
});

// Download staff report (Protected: Admin Only)
router.post('/report/download', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reportData, format } = req.body;

    if (!reportData || !reportData.staff) {
      return res.status(400).json({ success: false, message: 'Invalid report data' });
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=staff-report-${new Date().toISOString().split('T')[0]}.pdf`);
      doc.pipe(res);

      const startY = createPDFHeader(doc, 'Global Image - Staff Report', 'Staff Management Report');
      doc.y = startY;
      doc.x = 20;

      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Staff: ${reportData.totalStaff || 0}`);
      doc.text(`Senior Photographers: ${reportData.seniorPhotographers || 0}`);
      doc.text(`Photographers: ${reportData.photographers || 0}`);
      doc.text(`Assistant Photographers: ${reportData.assistantPhotographers || 0}`);
      doc.text(`Video Editors: ${reportData.videoEditors || 0}`);
      doc.text(`Support Staff: ${reportData.supportStaff || 0}`);
      doc.text(`Average Experience: ${reportData.averageExperience || 0} years`);
      doc.moveDown(2);

      doc.fontSize(16).text('Detailed Staff Information', { underline: true });
      doc.moveDown();

      if (reportData.staff && reportData.staff.length > 0) {
        reportData.staff.forEach((member, index) => {
          doc.fontSize(12).text(`Staff ${index + 1}:`, { bold: true });
          doc.fontSize(10).text(`Name: ${member.name || 'N/A'}`);
          doc.text(`Position: ${member.position || 'N/A'}`);
          doc.text(`Email: ${member.email || 'N/A'}`);
          doc.text(`Phone: ${member.phone || 'N/A'}`);
          doc.text(`Specialization: ${member.specialization || 'N/A'}`);
          doc.text(`Experience: ${member.experience ? `${member.experience} years` : 'N/A'}`);
          doc.moveDown();
        });
      } else {
        doc.fontSize(12).text('No staff members found');
      }

      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Staff Report');

      worksheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Position', key: 'position', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Specialization', key: 'specialization', width: 25 },
        { header: 'Experience (Years)', key: 'experience', width: 15 },
        { header: 'Bio', key: 'bio', width: 40 }
      ];

      reportData.staff.forEach(member => {
        worksheet.addRow({
          name: member.name,
          position: member.position,
          email: member.email,
          phone: member.phone,
          specialization: member.specialization,
          experience: member.experience,
          bio: member.bio
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=staff-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      await workbook.xlsx.write(res);
    } else {
      res.status(400).json({ success: false, message: 'Invalid format specified' });
    }
  } catch (error) {
    console.error('Download staff report error:', error);
    res.status(500).json({ success: false, message: 'Failed to download staff report' });
  }
});

module.exports = router;