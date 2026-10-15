const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * Admin authorization middleware.
 * Verifies JWT token and checks for administrator role.
 */
const adminAuth = [authenticateToken, requireAdmin];

module.exports = adminAuth;