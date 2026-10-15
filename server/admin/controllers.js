const Gallery = require('../models/Gallery');
const Service = require('../models/Service');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { createPDFHeader } = require('../utils/pdfUtils');

// Dashboard Statistics Controller
const getDashboardStats = async (req, res) => {
  try {
    const totalGalleries = await Gallery.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Get recent galleries (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentGalleries = await Gallery.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get galleries by category
    const galleriesByCategory = await Gallery.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get services by category
    const servicesByCategory = await Service.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalGalleries,
      totalServices,
      totalUsers,
      recentGalleries,
      galleriesByCategory,
      servicesByCategory
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
};

// User Management Controllers
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('User deletion error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Gallery Management Controllers
const getAllGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.json(galleries);
  } catch (err) {
    console.error('Galleries fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch galleries' });
  }
};

const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    
    await gallery.deleteOne();
    res.json({ message: 'Gallery deleted successfully' });
  } catch (err) {
    console.error('Gallery deletion error:', err);
    res.status(500).json({ message: 'Failed to delete gallery' });
  }
};

// Service Management Controllers
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    console.error('Services fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    await service.deleteOne();
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Service deletion error:', err);
    res.status(500).json({ message: 'Failed to delete service' });
  }
};

// System Information Controller
const getSystemInfo = async (req, res) => {
  try {
    const dbStatus = 'Connected'; // You could add actual DB health check here
    
    res.json({
      adminEmail: 'admin@global.com',
      lastLogin: new Date().toISOString(),
      systemStatus: 'Active',
      database: dbStatus,
      version: '1.0.0',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (err) {
    console.error('System info error:', err);
    res.status(500).json({ message: 'Failed to fetch system information' });
  }
};

// Analytics Controller
const getAnalytics = async (req, res) => {
  try {
    // Get monthly statistics
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Gallery.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get category distribution
    const categoryDistribution = await Gallery.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      monthlyStats,
      categoryDistribution,
      totalGalleries: await Gallery.countDocuments(),
      totalServices: await Service.countDocuments(),
      totalUsers: await User.countDocuments()
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

// Client Management Controllers
const getAllClients = async (req, res) => {
  try {
    const clients = await User.find({}).select('-password');
    res.json({ clients });
  } catch (err) {
    console.error('Clients fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    await client.deleteOne();
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Client deletion error:', err);
    res.status(500).json({ message: 'Failed to delete client' });
  }
};

// Assign client to staff
const assignClientToStaff = async (req, res) => {
  try {
    const { clientId, staffId, canAccessPortfolio } = req.body;
    
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    // Update client assignment
    client.assignedStaff = staffId;
    client.isAssigned = true;
    client.canAccessPortfolio = canAccessPortfolio || false;
    
    console.log('Assigning client:', client.email, 'canAccessPortfolio:', canAccessPortfolio);
    await client.save();
    console.log('Client saved with canAccessPortfolio:', client.canAccessPortfolio);
    
    res.json({ 
      success: true,
      message: 'Client assigned to staff successfully',
      client: {
        _id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        assignedStaff: client.assignedStaff,
        isAssigned: client.isAssigned,
        canAccessPortfolio: client.canAccessPortfolio
      }
    });
  } catch (err) {
    console.error('Client assignment error:', err);
    res.status(500).json({ message: 'Failed to assign client to staff' });
  }
};

// Remove client assignment
const removeClientAssignment = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // If client was assigned to staff, remove from staff's assignedClients array
    if (client.assignedStaff) {
      const staff = await Staff.findById(client.assignedStaff);
      if (staff) {
        staff.assignedClients = staff.assignedClients.filter(
          id => id.toString() !== clientId
        );
        await staff.save();
        console.log(`Removed client ${clientId} from staff ${staff._id} assignedClients`);
      }
    }
    
    // Remove assignment from client
    client.assignedStaff = null;
    client.isAssigned = false;
    client.canAccessPortfolio = false;
    
    await client.save();
    
    res.json({ 
      success: true,
      message: 'Client assignment removed successfully',
      client: {
        _id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        assignedStaff: client.assignedStaff,
        isAssigned: client.isAssigned,
        canAccessPortfolio: client.canAccessPortfolio
      }
    });
  } catch (err) {
    console.error('Client assignment removal error:', err);
    res.status(500).json({ message: 'Failed to remove client assignment' });
  }
};

// Get all staff for assignment
const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true }).select('name position email');
    res.json({ success: true, staff });
  } catch (err) {
    console.error('Staff fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
};

// Client Report Generation
const generateClientReport = async (req, res) => {
  try {
    const { includeAllData, format, lastMonth } = req.body;

    // Get all clients
    const clients = await User.find({}).select('-password').sort({ createdAt: -1 });

    // Calculate last month date range
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get clients from last month
    const newClientsLastMonth = clients.filter(client => 
      client.createdAt >= lastMonthStart && client.createdAt <= lastMonthEnd
    ).length;

    // Get booking statistics for each client
    const clientsWithBookings = await Promise.all(
      clients.map(async (client) => {
        const bookings = await Booking.find({ 
          email: client.email 
        }).select('totalAmount bookingStatus paymentStatus createdAt');

        const totalBookings = bookings.length;
        const totalSpent = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
        const activeBookings = bookings.filter(booking => 
          ['confirmed', 'pending'].includes(booking.bookingStatus)
        ).length;

        return {
          ...client.toObject(),
          totalBookings,
          totalSpent,
          activeBookings
        };
      })
    );

    // Calculate overall statistics
    const totalClients = clients.length;
    const activeClients = clientsWithBookings.filter(client => client.totalBookings > 0).length;
    const totalBookings = clientsWithBookings.reduce((sum, client) => sum + client.totalBookings, 0);
    const totalRevenue = clientsWithBookings.reduce((sum, client) => sum + client.totalSpent, 0);
    const averageBookingsPerClient = totalClients > 0 ? (totalBookings / totalClients).toFixed(1) : 0;

    // Prepare report data
    const reportData = {
      totalClients,
      newClientsLastMonth,
      activeClients,
      totalBookings,
      totalRevenue,
      averageBookingsPerClient,
      clients: clientsWithBookings
    };

    res.json({
      success: true,
      reportData
    });
  } catch (error) {
    console.error('Generate client report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate client report'
    });
  }
};

// Download Client Report
const downloadClientReport = async (req, res) => {
  try {
    console.log('Client report download request received');
    const { reportData, format } = req.body;

    console.log('Report data received:', {
      hasReportData: !!reportData,
      hasClients: !!(reportData && reportData.clients),
      clientCount: reportData?.clients?.length || 0,
      format: format
    });

    // Validate and normalize report data
    if (!reportData) {
      console.log('No report data provided, returning 400');
      return res.status(400).json({
        success: false,
        message: 'No report data provided'
      });
    }

    // Ensure clients array exists and has required fields
    const clients = reportData.clients || [];
    if (!Array.isArray(clients)) {
      console.log('Clients data is not an array, returning 400');
      return res.status(400).json({
        success: false,
        message: 'Invalid clients data format'
      });
    }

    // Normalize client data to ensure all required fields exist
    const normalizedClients = clients.map(client => ({
      firstName: client.firstName || 'N/A',
      lastName: client.lastName || 'N/A',
      email: client.email || 'N/A',
      phone: client.phone || 'N/A',
      createdAt: client.createdAt || new Date(),
      totalBookings: client.totalBookings || 0,
      totalSpent: client.totalSpent || 0,
      activeBookings: client.activeBookings || 0
    }));

    // Normalize report statistics
    const normalizedReportData = {
      totalClients: reportData.totalClients || normalizedClients.length,
      newClientsLastMonth: reportData.newClientsLastMonth || 0,
      activeClients: reportData.activeClients || normalizedClients.filter(c => c.totalBookings > 0).length,
      totalBookings: reportData.totalBookings || normalizedClients.reduce((sum, c) => sum + c.totalBookings, 0),
      totalRevenue: reportData.totalRevenue || normalizedClients.reduce((sum, c) => sum + c.totalSpent, 0),
      averageBookingsPerClient: reportData.averageBookingsPerClient || 
        (normalizedClients.length > 0 ? (normalizedClients.reduce((sum, c) => sum + c.totalBookings, 0) / normalizedClients.length).toFixed(1) : 0),
      clients: normalizedClients
    };

    if (format === 'pdf') {
      console.log('Generating PDF report...');
      // Generate PDF
      const doc = new PDFDocument();
      
      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=client-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Pipe PDF to response
      doc.pipe(res);

            try {
        // Add header with logo and title
        console.log('Creating PDF header...');
        const startY = createPDFHeader(doc, 'Global Image - Client Report', 'Client Management Report');
        
        // Position content after header
        doc.y = startY;

        // Reset to left margin for content
        doc.x = 20;
        
        // Summary section
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total Clients: ${normalizedReportData.totalClients || 0}`);
        doc.text(`New Clients (Last Month): ${normalizedReportData.newClientsLastMonth || 0}`);
        doc.text(`Active Clients: ${normalizedReportData.activeClients || 0}`);
        doc.text(`Total Bookings: ${normalizedReportData.totalBookings || 0}`);
        doc.text(`Total Revenue: LKR ${(normalizedReportData.totalRevenue || 0).toLocaleString()}`);
        doc.text(`Average Bookings per Client: ${normalizedReportData.averageBookingsPerClient || 0}`);
        doc.moveDown(2);

        // Detailed clients
        doc.fontSize(16).text('Client Details', { underline: true });
        doc.moveDown();

        if (normalizedReportData.clients && normalizedReportData.clients.length > 0) {
          normalizedReportData.clients.forEach((client, index) => {
            doc.fontSize(12).text(`Client ${index + 1}:`, { bold: true });
            doc.fontSize(10).text(`Name: ${client.firstName} ${client.lastName}`);
            doc.text(`Email: ${client.email}`);
            doc.text(`Phone: ${client.phone || 'N/A'}`);
            doc.text(`Joined: ${new Date(client.createdAt).toLocaleDateString()}`);
            doc.text(`Total Bookings: ${client.totalBookings || 0}`);
            doc.text(`Total Spent: LKR ${(client.totalSpent || 0).toLocaleString()}`);
            doc.moveDown();
          });
        } else {
          doc.fontSize(12).text('No clients found');
        }

        console.log('PDF content added successfully, ending document...');
        doc.end();
        console.log('PDF generation completed successfully');
      } catch (headerError) {
        console.error('Error in PDF generation:', headerError);
        // Fallback: create simple PDF without header
        doc.fontSize(20).text('Global Image - Client Report', { align: 'center' });
        doc.moveDown();
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.fontSize(12).text(`Generated on: ${currentDate}`, { align: 'center' });
        doc.moveDown(2);
        
        // Add a line separator
        const pageWidth = doc.page.width;
        doc.moveTo(20, doc.y).lineTo(pageWidth - 20, doc.y).stroke();
        doc.moveDown(2);
        
        // Reset to left margin for content
        doc.x = 20;
        
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total Clients: ${normalizedReportData.totalClients || 0}`);
        doc.text(`Total Bookings: ${normalizedReportData.totalBookings || 0}`);
        doc.text(`Total Revenue: LKR ${(normalizedReportData.totalRevenue || 0).toLocaleString()}`);
        doc.end();
      }
    } else if (format === 'excel') {
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Client Report');

      // Set up headers with proper styling
      const headers = [
        'Name',
        'Email',
        'Phone',
        'Joined Date',
        'Total Bookings',
        'Total Spent (LKR)',
        'Active Bookings'
      ];

      // Add headers
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Set column widths
      worksheet.columns = [
        { width: 25 },
        { width: 30 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 20 },
        { width: 15 }
      ];

      // Add data rows
      if (normalizedReportData.clients && normalizedReportData.clients.length > 0) {
        normalizedReportData.clients.forEach(client => {
          worksheet.addRow([
            `${client.firstName} ${client.lastName}`,
            client.email,
            client.phone || 'N/A',
            new Date(client.createdAt).toLocaleDateString(),
            client.totalBookings || 0,
            client.totalSpent || 0,
            client.activeBookings || 0
          ]);
        });
      }

      // Add summary section
      worksheet.addRow([]);
      const summaryHeader = worksheet.addRow(['SUMMARY STATISTICS']);
      summaryHeader.font = { bold: true, size: 14 };
      summaryHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4E6F1' }
      };

      // Add summary data
      worksheet.addRow(['Total Clients', normalizedReportData.totalClients || 0]);
      worksheet.addRow(['New Clients (Last Month)', normalizedReportData.newClientsLastMonth || 0]);
      worksheet.addRow(['Active Clients', normalizedReportData.activeClients || 0]);
      worksheet.addRow(['Total Bookings', normalizedReportData.totalBookings || 0]);
      worksheet.addRow(['Total Revenue (LKR)', (normalizedReportData.totalRevenue || 0).toLocaleString()]);
      worksheet.addRow(['Average Bookings per Client', normalizedReportData.averageBookingsPerClient || 0]);

      // Add report metadata
      worksheet.addRow([]);
      worksheet.addRow(['Report Generated', new Date().toLocaleString()]);
      worksheet.addRow(['Global Image Photography']);

      // Set response headers for Excel
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=client-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');

      // Write Excel to response
      await workbook.xlsx.write(res);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid format specified'
      });
    }
  } catch (error) {
    console.error('Download client report error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to download client report: ${error.message}`
    });
  }
};

// Feedback Report Generation
const generateFeedbackReport = async (req, res) => {
  try {
    const { includeAllData, format, confirmedFeedbacks } = req.body;

    // Get all feedback
    const feedback = await Feedback.find({}).sort({ createdAt: -1 });

    // Calculate statistics
    const totalFeedback = feedback.length;
    const confirmedFeedbacksCount = feedback.filter(f => f.status === 'resolved').length;
    const pendingFeedbacks = feedback.filter(f => f.status === 'pending').length;
    const reviewedFeedbacks = feedback.filter(f => f.status === 'reviewed').length;
    const resolvedFeedbacks = feedback.filter(f => f.status === 'resolved').length;

    // Calculate average rating
    const totalRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0);
    const averageRating = totalFeedback > 0 ? (totalRating / totalFeedback).toFixed(1) : 0;

    // Prepare report data
    const reportData = {
      totalFeedback,
      confirmedFeedbacks: confirmedFeedbacksCount,
      pendingFeedbacks,
      reviewedFeedbacks,
      resolvedFeedbacks,
      averageRating,
      feedback: feedback.map(item => ({
        _id: item._id,
        name: item.name,
        email: item.email,
        subject: item.subject,
        message: item.message,
        rating: item.rating,
        status: item.status,
        adminResponse: item.adminResponse,
        createdAt: item.createdAt
      }))
    };

    res.json({
      success: true,
      reportData
    });
  } catch (error) {
    console.error('Generate feedback report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate feedback report'
    });
  }
};

// Download Feedback Report
const downloadFeedbackReport = async (req, res) => {
  try {
    const { reportData, format } = req.body;

    if (!reportData || !reportData.feedback) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report data'
      });
    }

    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      
      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=feedback-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Pipe PDF to response
      doc.pipe(res);

      // Add header with logo and title
      const startY = createPDFHeader(doc, 'Global Image - Feedback Report', 'Customer Feedback Report');
      
      // Position content after header
      doc.y = startY;
      
      // Reset to left margin for content
      doc.x = 20;

      // Summary section
      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Feedback: ${reportData.totalFeedback || 0}`);
      doc.text(`Confirmed Feedback: ${reportData.confirmedFeedbacks || 0}`);
      doc.text(`Pending Feedback: ${reportData.pendingFeedbacks || 0}`);
      doc.text(`Reviewed Feedback: ${reportData.reviewedFeedbacks || 0}`);
      doc.text(`Resolved Feedback: ${reportData.resolvedFeedbacks || 0}`);
      doc.text(`Average Rating: ${reportData.averageRating || 0}/5`);
      doc.moveDown(2);

      // Detailed feedback
      doc.fontSize(16).text('Detailed Feedback Information', { underline: true });
      doc.moveDown();

      if (reportData.feedback && reportData.feedback.length > 0) {
        reportData.feedback.forEach((item, index) => {
          doc.fontSize(12).text(`Feedback ${index + 1}:`, { bold: true });
          doc.fontSize(10).text(`Name: ${item.name || 'N/A'}`);
          doc.text(`Email: ${item.email || 'N/A'}`);
          doc.text(`Subject: ${item.subject || 'N/A'}`);
          doc.text(`Rating: ${item.rating || 0}/5`);
          doc.text(`Status: ${item.status || 'N/A'}`);
          doc.text(`Date: ${new Date(item.createdAt).toLocaleDateString()}`);
          doc.text(`Message: ${item.message || 'N/A'}`);
          if (item.adminResponse) {
            doc.text(`Admin Response: ${item.adminResponse}`);
          }
          doc.moveDown();
        });
      } else {
        doc.fontSize(12).text('No feedback found');
      }

      doc.end();
    } else if (format === 'excel') {
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Feedback Report');

      // Set up headers with proper styling
      const headers = [
        'Name',
        'Email',
        'Subject',
        'Rating',
        'Status',
        'Date',
        'Message',
        'Admin Response'
      ];

      // Add headers
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Set column widths
      worksheet.columns = [
        { width: 20 },
        { width: 30 },
        { width: 25 },
        { width: 10 },
        { width: 15 },
        { width: 15 },
        { width: 40 },
        { width: 40 }
      ];

      // Add data rows
      if (reportData.feedback && reportData.feedback.length > 0) {
        reportData.feedback.forEach(item => {
          worksheet.addRow([
            item.name || 'N/A',
            item.email || 'N/A',
            item.subject || 'N/A',
            item.rating || 0,
            item.status || 'N/A',
            new Date(item.createdAt).toLocaleDateString(),
            item.message || 'N/A',
            item.adminResponse || 'N/A'
          ]);
        });
      }

      // Add summary section
      worksheet.addRow([]);
      const summaryHeader = worksheet.addRow(['SUMMARY STATISTICS']);
      summaryHeader.font = { bold: true, size: 14 };
      summaryHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4E6F1' }
      };

      // Add summary data
      worksheet.addRow(['Total Feedback', reportData.totalFeedback || 0]);
      worksheet.addRow(['Confirmed Feedback', reportData.confirmedFeedbacks || 0]);
      worksheet.addRow(['Pending Feedback', reportData.pendingFeedbacks || 0]);
      worksheet.addRow(['Reviewed Feedback', reportData.reviewedFeedbacks || 0]);
      worksheet.addRow(['Resolved Feedback', reportData.resolvedFeedbacks || 0]);
      worksheet.addRow(['Average Rating', reportData.averageRating || 0]);

      // Add report metadata
      worksheet.addRow([]);
      worksheet.addRow(['Report Generated', new Date().toLocaleString()]);
      worksheet.addRow(['Global Image Photography']);

      // Set response headers for Excel
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=feedback-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');

      // Write Excel to response
      await workbook.xlsx.write(res);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid format specified'
      });
    }
  } catch (error) {
    console.error('Download feedback report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download feedback report'
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllGalleries,
  deleteGallery,
  getAllServices,
  deleteService,
  getSystemInfo,
  getAnalytics,
  getAllClients,
  deleteClient,
  assignClientToStaff,
  removeClientAssignment,
  getAllStaff,
  generateClientReport,
  downloadClientReport,
  generateFeedbackReport,
  downloadFeedbackReport
}; 