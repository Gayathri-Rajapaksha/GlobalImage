/**
 * Environment Variable Validation Utility
 * Validates critical environment variables at application startup.
 */

function checkEnv(env = process.env) {
  const errors = [];
  const warnings = [];

  // 1. Validate MONGO_URI
  if (!env.MONGO_URI) {
    errors.push('MONGO_URI is required. Please set MONGO_URI in your .env file.');
  } else if (!env.MONGO_URI.startsWith('mongodb://') && !env.MONGO_URI.startsWith('mongodb+srv://')) {
    errors.push('MONGO_URI must be a valid MongoDB connection string (starting with mongodb:// or mongodb+srv://).');
  }

  // 2. Validate JWT_SECRET
  const insecureSecrets = [
    'your_jwt_secret_key_here',
    'fallback_secret',
    'secret',
    'jwt_secret',
    'changeme'
  ];
  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET is required. Generate a strong random key (at least 32 characters) for signing authentication tokens.');
  } else if (insecureSecrets.includes(env.JWT_SECRET.trim().toLowerCase()) || env.JWT_SECRET.length < 16) {
    errors.push('JWT_SECRET is using a weak or default placeholder value. It must be at least 16 characters long and uniquely generated.');
  }

  // 3. Optional Service Warnings (Cloudinary)
  const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const hasSomeCloudinary = cloudinaryVars.some(v => env[v]);
  const hasAllCloudinary = cloudinaryVars.every(v => env[v] && !env[v].includes('your_'));

  if (hasSomeCloudinary && !hasAllCloudinary) {
    warnings.push('Cloudinary is partially configured. Provide CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to enable cloud storage.');
  } else if (!hasAllCloudinary) {
    warnings.push('Cloudinary is not configured. File uploads will fall back to local disk storage in server/uploads/.');
  }

  // 4. Optional Service Warnings (Email)
  const hasEmail = env.EMAIL_USER && env.EMAIL_PASS && 
                   !env.EMAIL_USER.includes('your_') && 
                   !env.EMAIL_PASS.includes('your_');
  if (!hasEmail) {
    warnings.push('Email service (EMAIL_USER / EMAIL_PASS) is not configured. Email notifications will run in simulation mode.');
  }

  return { errors, warnings };
}

function validateEnv(exitOnError = true) {
  const { errors, warnings } = checkEnv(process.env);

  // Display warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Environment Warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
  }

  // Handle fatal configuration errors
  if (errors.length > 0) {
    console.error('\n❌ Fatal Configuration Errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\nPlease copy server/.env.example to server/.env and fill in the required variables.\n');
    if (exitOnError) {
      process.exit(1);
    }
  }

  if (errors.length === 0) {
    console.log('✅ Environment configuration validated successfully.');
  }
}

module.exports = validateEnv;
module.exports.checkEnv = checkEnv;
