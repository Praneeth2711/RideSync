const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');

/**
 * Custom error with HTTP status code
 */
class BookingServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Check if the active MongoDB connection supports multi-document transactions (Replica Set / Sharded / Atlas)
 */
function supportsTransactions() {
  try {
    const topology = mongoose.connection?.client?.topology?.description?.type;
    return topology === 'ReplicaSetWithPrimary' || topology === 'Sharded';
  } catch (err) {
    return false;
  }
}

/**
 * Create a new booking request for a rider
 */
async function createBookingRequest({ rideId, riderId, seatsRequested }) {
  const seats = parseInt(seatsRequested, 10);
  if (isNaN(seats) || seats < 1 || seats > 6) {
    throw new BookingServiceError('You must request between 1 and 6 seats.', 400);
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new BookingServiceError('The requested ride does not exist.', 404);
  }

  // Prevent driver from booking their own ride
  if (ride.driverId.toString() === riderId.toString()) {
    throw new BookingServiceError('You cannot request seats on a ride you posted.', 400);
  }

  // Check ride status
  if (ride.status === 'FULL') {
    throw new BookingServiceError('This ride is already full. No more seats are available.', 400);
  }

  if (ride.status !== 'ACTIVE') {
    throw new BookingServiceError(`Cannot request seats. Ride is currently ${ride.status}.`, 400);
  }

  // Check departure time
  if (new Date(ride.departureDateTime) <= new Date()) {
    throw new BookingServiceError('This ride has already departed or passed its scheduled departure time.', 400);
  }

  // Check available seats count
  if (seats > ride.availableSeats) {
    throw new BookingServiceError(
      `Not enough seats available. You requested ${seats} seats, but only ${ride.availableSeats} are remaining.`,
      400
    );
  }

  // Check if rider already has an existing booking request for this ride
  const existingBooking = await Booking.findOne({ rideId, riderId });
  if (existingBooking) {
    throw new BookingServiceError(
      `You already have a booking request for this ride with status: ${existingBooking.status}.`,
      400
    );
  }

  // Create booking with status PENDING (Seats remain unchanged)
  const booking = await Booking.create({
    rideId,
    riderId,
    seatsRequested: seats,
    status: 'PENDING',
  });

  const populated = await Booking.findById(booking._id)
    .populate('riderId', 'name email')
    .populate('rideId');

  return populated;
}

/**
 * Driver accepts a pending booking request with atomic seat decrement & overbooking protection
 */
async function acceptBookingRequest({ bookingId, driverId }) {
  const booking = await Booking.findById(bookingId).populate('rideId');
  if (!booking) {
    throw new BookingServiceError('Booking request not found.', 404);
  }

  const ride = booking.rideId;
  if (!ride) {
    throw new BookingServiceError('Associated ride not found.', 404);
  }

  // Verify ride ownership
  if (ride.driverId.toString() !== driverId.toString()) {
    throw new BookingServiceError('Unauthorized. Only the driver of this ride can accept requests.', 403);
  }

  // Verify booking is still PENDING
  if (booking.status !== 'PENDING') {
    throw new BookingServiceError(`This request has already been ${booking.status.toLowerCase()}.`, 400);
  }

  // Verify ride is ACTIVE and not full
  if (ride.status === 'FULL' || ride.availableSeats < booking.seatsRequested) {
    throw new BookingServiceError(
      'Insufficient seats available. Another booking has claimed the remaining seats.',
      409
    );
  }

  if (ride.status !== 'ACTIVE') {
    throw new BookingServiceError(`Ride is no longer active (Current status: ${ride.status}).`, 400);
  }

  // Verify departure has not passed
  if (new Date(ride.departureDateTime) <= new Date()) {
    throw new BookingServiceError('Cannot accept booking: departure time has already passed.', 400);
  }

  // Use MongoDB transaction if deployment is a replica set (e.g. MongoDB Atlas)
  if (supportsTransactions()) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 1. Conditional atomic update on Ride
      const updatedRide = await Ride.findOneAndUpdate(
        {
          _id: ride._id,
          status: 'ACTIVE',
          availableSeats: { $gte: booking.seatsRequested },
        },
        [
          {
            $set: {
              availableSeats: { $subtract: ['$availableSeats', booking.seatsRequested] },
              status: {
                $cond: {
                  if: { $lte: [{ $subtract: ['$availableSeats', booking.seatsRequested] }, 0] },
                  then: 'FULL',
                  else: '$status',
                },
              },
            },
          },
        ],
        { new: true, session }
      );

      if (!updatedRide) {
        await session.abortTransaction();
        await session.endSession();
        throw new BookingServiceError(
          'Insufficient seats available. Another booking may have claimed the remaining seats.',
          409
        );
      }

      // 2. Atomic update on Booking
      const updatedBooking = await Booking.findOneAndUpdate(
        { _id: booking._id, status: 'PENDING' },
        { $set: { status: 'ACCEPTED' } },
        { new: true, session }
      ).populate('riderId', 'name email');

      if (!updatedBooking) {
        await session.abortTransaction();
        await session.endSession();
        throw new BookingServiceError('Booking request status changed concurrently. Acceptance aborted.', 409);
      }

      await session.commitTransaction();
      await session.endSession();

      return { booking: updatedBooking, ride: updatedRide };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction().catch(() => {});
      }
      await session.endSession().catch(() => {});
      throw error;
    }
  } else {
    // Standalone MongoDB: conditional atomic update with strict seat check & rollback safety
    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: ride._id,
        status: 'ACTIVE',
        availableSeats: { $gte: booking.seatsRequested },
      },
      [
        {
          $set: {
            availableSeats: { $subtract: ['$availableSeats', booking.seatsRequested] },
            status: {
              $cond: {
                if: { $lte: [{ $subtract: ['$availableSeats', booking.seatsRequested] }, 0] },
                then: 'FULL',
                else: '$status',
              },
            },
          },
        },
      ],
      { new: true }
    );

    if (!updatedRide) {
      throw new BookingServiceError(
        'Insufficient seats available. Another booking may have claimed the remaining seats.',
        409
      );
    }

    // Now update booking
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'PENDING' },
      { $set: { status: 'ACCEPTED' } },
      { new: true }
    ).populate('riderId', 'name email');

    if (!updatedBooking) {
      // Revert the seat reduction if the booking update fails
      await Ride.findByIdAndUpdate(ride._id, {
        $inc: { availableSeats: booking.seatsRequested },
        $set: { status: 'ACTIVE' },
      });
      throw new BookingServiceError('Booking request is no longer pending.', 409);
    }

    return { booking: updatedBooking, ride: updatedRide };
  }
}

/**
 * Driver rejects a pending booking request
 */
async function rejectBookingRequest({ bookingId, driverId }) {
  const booking = await Booking.findById(bookingId).populate('rideId');
  if (!booking) {
    throw new BookingServiceError('Booking request not found.', 404);
  }

  const ride = booking.rideId;
  if (!ride) {
    throw new BookingServiceError('Associated ride not found.', 404);
  }

  // Verify ride ownership
  if (ride.driverId.toString() !== driverId.toString()) {
    throw new BookingServiceError('Unauthorized. Only the driver of this ride can reject requests.', 403);
  }

  // Verify booking is still PENDING
  if (booking.status !== 'PENDING') {
    throw new BookingServiceError(`This request has already been ${booking.status.toLowerCase()}.`, 400);
  }

  // Update booking status to REJECTED (availableSeats remain UNCHANGED)
  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'PENDING' },
    { $set: { status: 'REJECTED' } },
    { new: true }
  ).populate('riderId', 'name email');

  if (!updatedBooking) {
    throw new BookingServiceError('Booking was already modified.', 409);
  }

  return updatedBooking;
}

module.exports = {
  createBookingRequest,
  acceptBookingRequest,
  rejectBookingRequest,
  BookingServiceError,
};
