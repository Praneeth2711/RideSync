const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const {
  createBookingRequest,
  acceptBookingRequest,
  rejectBookingRequest,
  BookingServiceError,
} = require('../services/bookingService');

/**
 * @route   POST /api/bookings
 * @desc    Rider requests seats on a ride
 * @access  Private
 */
const requestSeats = async (req, res, next) => {
  try {
    const { rideId, seatsRequested } = req.body;

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID is required.',
      });
    }

    const booking = await createBookingRequest({
      rideId,
      riderId: req.user._id,
      seatsRequested: seatsRequested || 1,
    });

    res.status(201).json({
      success: true,
      message: 'Your seat request has been sent to the driver.',
      data: { booking },
    });
  } catch (err) {
    if (err instanceof BookingServiceError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * @route   GET /api/bookings/my
 * @desc    Get all booking requests made by current rider (Ride History - Booked tab)
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ riderId: req.user._id })
      .populate({
        path: 'rideId',
        populate: {
          path: 'driverId',
          select: 'name email',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Booking history retrieved successfully',
      data: { bookings },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/rides/:id/requests
 * @desc    Get all booking requests for a specific ride (for the driver)
 * @access  Private
 */
const getRideRequests = async (req, res, next) => {
  try {
    const rideId = req.params.id;

    // Verify ride ownership
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found.',
      });
    }

    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view requests for this ride.',
      });
    }

    const requests = await Booking.find({ rideId })
      .populate('riderId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ride,
        requests,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/bookings/:id/accept
 * @desc    Driver accepts a pending booking request
 * @access  Private
 */
const acceptRequest = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const result = await acceptBookingRequest({
      bookingId,
      driverId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Booking request accepted successfully.',
      data: {
        booking: result.booking,
        ride: result.ride,
      },
    });
  } catch (err) {
    if (err instanceof BookingServiceError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * @route   PATCH /api/bookings/:id/reject
 * @desc    Driver rejects a pending booking request
 * @access  Private
 */
const rejectRequest = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const updatedBooking = await rejectBookingRequest({
      bookingId,
      driverId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Booking request rejected.',
      data: {
        booking: updatedBooking,
      },
    });
  } catch (err) {
    if (err instanceof BookingServiceError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

module.exports = {
  requestSeats,
  getMyBookings,
  getRideRequests,
  acceptRequest,
  rejectRequest,
};
