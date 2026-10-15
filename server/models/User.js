const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  phone:     { type: String },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  role: { 
    type: String, 
    enum: ['client', 'staff', 'admin'], 
    default: 'client' 
  },
  assignedStaff: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Staff' 
  },
  isAssigned: { 
    type: Boolean, 
    default: false 
  },
  canAccessPortfolio: { 
    type: Boolean, 
    default: false 
  }
});

module.exports = mongoose.model('User', UserSchema); 