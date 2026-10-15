const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT authentication token from Authorization header.
 * Attaches decoded user payload { userId, email, role, isAdmin } to req.user.
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7).trim() 
      : authHeader?.trim();

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No authentication token provided.' 
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET environment variable is missing.');
      return res.status(500).json({ 
        success: false, 
        message: 'Server authentication configuration error.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token has expired. Please log in again.' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid authentication token.' 
    });
  }
};

/**
 * Optional authentication: if a token is present, decode it into req.user,
 * otherwise proceed with req.user = null.
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7).trim() 
      : authHeader?.trim();

    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } else {
      req.user = null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

/**
 * Middleware to enforce role-based access control.
 * @param  {...string} allowedRoles Roles permitted to access the route ('admin', 'staff', 'client')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    const userRole = req.user.role || (req.user.isAdmin ? 'admin' : 'client');
    const hasRole = allowedRoles.includes(userRole) || (req.user.isAdmin && allowedRoles.includes('admin'));

    if (!hasRole) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: requires one of the following roles: [${allowedRoles.join(', ')}].` 
      });
    }

    next();
  };
};

/**
 * Shortcut for requiring admin role.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  const isAdmin = req.user.isAdmin === true || req.user.role === 'admin';
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden: Administrator privileges required.' 
    });
  }

  next();
};

/**
 * Shortcut for staff or admin privileges (e.g. portfolio/gallery management).
 */
const requireStaffOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  const isStaffOrAdmin = req.user.isAdmin === true || 
                         req.user.role === 'admin' || 
                         req.user.role === 'staff' || 
                         req.user.canAccessPortfolio === true;

  if (!isStaffOrAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden: Staff or Administrator privileges required.' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireStaffOrAdmin
};
