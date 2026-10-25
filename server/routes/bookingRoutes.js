const express = require('express');
const { body } = require('express-validator');
const {
  requestSeats,
  getMyBookings,
  acceptRequest,
  rejectRequest,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest, validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

const requestSeatsValidation = [
  body('rideId')
    .notEmpty()
    .withMessage('Ride ID is required')
    .isMongoId()
    .withMessage('Invalid Ride ID format'),
  body('seatsRequested')
    .isInt({ min: 1, max: 6 })
    .withMessage('Requested seats must be between 1 and 6'),
  validateRequest,
];

router.post('/', protect, requestSeatsValidation, requestSeats);
router.get('/my', protect, getMyBookings);
router.patch('/:id/accept', protect, validateObjectId('id'), acceptRequest);
router.patch('/:id/reject', protect, validateObjectId('id'), rejectRequest);

module.exports = router;
