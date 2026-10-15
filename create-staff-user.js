const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const User = require('./server/models/User');

async function createStaffUser() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/globalimage';
  const staffEmail = (process.env.INITIAL_STAFF_EMAIL || process.argv[2] || 'staff@global.com').toLowerCase().trim();
  const staffPassword = process.env.INITIAL_STAFF_PASSWORD || process.argv[3] || 'Staff@123456';

  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if staff user already exists
    const existingStaff = await User.findOne({ email: staffEmail });
    if (existingStaff) {
      console.log(`Staff user (${staffEmail}) already exists, updating role...`);
      existingStaff.role = 'staff';
      existingStaff.canAccessPortfolio = true;
      await existingStaff.save();
      console.log('✅ Staff user role updated successfully');
    } else {
      // Create new staff user
      const hashedPassword = await bcrypt.hash(staffPassword, 10);
      
      const staffUser = new User({
        firstName: 'Staff',
        lastName: 'Member',
        email: staffEmail,
        password: hashedPassword,
        role: 'staff',
        canAccessPortfolio: true
      });

      await staffUser.save();
      console.log('✅ Staff user created successfully');
    }

    console.log('\n📋 Staff Login Credentials:');
    console.log(`Email:    ${staffEmail}`);
    console.log(`Password: ${staffPassword}`);
    console.log('\nUse these credentials to sign in and access staff/gallery features.');

  } catch (error) {
    console.error('❌ Error creating staff user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createStaffUser();
