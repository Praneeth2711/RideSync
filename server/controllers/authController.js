const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret_for_test', {
    expiresIn: '7d',
  });
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Set HttpOnly JWT Session Cookie
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
  res.cookie('token', token, cookieOptions);

  // 2. Set readable XSRF-TOKEN cookie for double-submit CSRF protection
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('XSRF-TOKEN', csrfToken, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token, // Maintained for automated test runners / CLI scripts
      csrfToken,
    },
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (rider & driver)
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    sendTokenResponse(user, 201, res, 'Account registered successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and set HttpOnly session cookie
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Clear auth cookie and log out
 * @access  Public
 */
const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  });

  res.cookie('XSRF-TOKEN', '', {
    httpOnly: false,
    expires: new Date(0),
    path: '/',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user from HttpOnly session
 * @access  Private
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

/**
 * @route   GET /api/auth/csrf
 * @desc    Get or refresh CSRF token
 * @access  Public
 */
const getCsrfToken = (req, res) => {
  let csrfToken = req.cookies && req.cookies['XSRF-TOKEN'];
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
  }

  res.status(200).json({
    success: true,
    data: { csrfToken },
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  getCsrfToken,
};
