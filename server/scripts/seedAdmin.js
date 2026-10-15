const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/globalimage';
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`ℹ️  An administrator account already exists (${existingAdmin.email}).`);
      console.log('No new administrator was created. To reset the admin password, update the database document or use the password reset flow.');
      return;
    }

    const email = (process.env.INITIAL_ADMIN_EMAIL || 'admin@global.com').toLowerCase().trim();
    // Use env password if specified, otherwise generate a secure random password
    let password = process.env.INITIAL_ADMIN_PASSWORD;
    let isGenerated = false;

    if (!password) {
      password = crypto.randomBytes(8).toString('hex') + 'A1!'; // e.g., 16-char secure password
      isGenerated = true;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({
      firstName: 'System',
      lastName: 'Administrator',
      email: email,
      password: hashedPassword,
      role: 'admin',
      canAccessPortfolio: true
    });

    await adminUser.save();
    console.log('\n========================================');
    console.log('✅ Initial Administrator Account Created');
    console.log('========================================');
    console.log(`Email:    ${email}`);
    if (isGenerated) {
      console.log(`Password: ${password}`);
      console.log('⚠️  Store this password securely. It will not be shown again.');
    } else {
      console.log('Password: (As configured in INITIAL_ADMIN_PASSWORD)');
    }
    console.log('========================================\n');

  } catch (err) {
    console.error('❌ Error creating administrator account:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
