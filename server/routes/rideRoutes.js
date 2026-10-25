const express = require('express');
const { body } = require('express-validator');
const {
  createRide,
  searchRides,
  getMyRides,
  getRideById,
} = require('../controllers/rideController');
const { getRideRequests } = require('../controllers/bookingController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { validateRequest, validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

// Ride creation validation
const createRideValidation = [
  body('from')
    .notEmpty()
    .withMessage('Pickup location is required'),
  body('to')
    .notEmpty()
    .withMessage('Destination location is required'),
  body('date')
    .notEmpty()
    .withMessage('Travel date is required'),
  body('departureTime')
    .notEmpty()
    .withMessage('Departure time is required'),
  body('availableSeats')
    .isInt({ min: 1, max: 6 })
    .withMessage('Available seats must be an integer between 1 and 6'),
  body('farePerSeat')
    .isFloat({ min: 0 })
    .withMessage('Fare per seat must be a non-negative number'),
  validateRequest,
];

// Routes
router.post('/', protect, createRideValidation, createRide);
router.get('/', searchRides);
router.get('/my', protect, getMyRides);
router.get('/:id/requests', protect, validateObjectId('id'), getRideRequests);
router.get('/:id', optionalProtect, validateObjectId('id'), getRideById);

module.exports = router;
