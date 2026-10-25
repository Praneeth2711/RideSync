const express = require('express');
const rateLimit = require('express-rate-limit');
const { getAutocomplete, getRoute } = require('../controllers/locationController');

const router = express.Router();

// Rate limiter for location autocomplete to prevent API quota exhaustion
const autocompleteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many location requests. Please wait a few seconds and try again.',
  },
});

router.get('/autocomplete', autocompleteLimiter, getAutocomplete);
router.get('/route', getRoute);

module.exports = router;
