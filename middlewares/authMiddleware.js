// Simple in-memory cache for user lookups (resets on server restart)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');

// Protect routes - require authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for token in cookies (if using cookies)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Check cache first
    const cached = userCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      req.user = cached.user;
      return next();
    }

    // Get user from database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'No user found with this token'
      });
    }

    // Cache the user
    userCache.set(userId, {
      user,
      timestamp: Date.now()
    });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user owns resource or is admin
const ownerOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.id === req.params.id) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this resource'
    });
  }
};

module.exports = {
  protect,
  authorize,
  ownerOrAdmin
};