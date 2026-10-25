const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe, getCsrfToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

// Register validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirm password does not match password');
      }
      return true;
    }),
  validateRequest,
];

// Login validation rules
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest,
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/csrf', getCsrfToken);

module.exports = router;
