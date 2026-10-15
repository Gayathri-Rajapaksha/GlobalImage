const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get all clients (non-admin users)
router.get('/admin/clients', async (req, res) => {
  try {
    // Check if user is admin (you can add middleware for this)
    const clients = await User.find({}).select('-password');
    
    res.json({
      success: true,
      clients: clients
    });
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients'
    });
  }
});

// Delete a client
router.delete('/admin/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedClient = await User.findByIdAndDelete(id);
    
    if (!deletedClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client'
    });
  }
});

// Get client by ID
router.get('/admin/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await User.findById(id).select('-password');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      client: client
    });
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client'
    });
  }
});

module.exports = router; 