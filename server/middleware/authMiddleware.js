const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check HttpOnly cookie first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check Authorization Bearer header as fallback
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to proceed.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_test');
    
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this session no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_test');
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid token in optional auth
  }
  next();
};

module.exports = { protect, optionalProtect };
