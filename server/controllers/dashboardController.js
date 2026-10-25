const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard metrics and upcoming ride schedule for the current user
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // 1. Total rides offered by user
    const ridesOfferedCount = await Ride.countDocuments({ driverId: userId });

    // 2. Rides created by user that are upcoming
    const myRides = await Ride.find({ driverId: userId }).select('_id');
    const myRideIds = myRides.map((r) => r._id);

    // 3. Pending requests waiting for this driver's approval
    const pendingDriverRequestsCount = await Booking.countDocuments({
      rideId: { $in: myRideIds },
      status: 'PENDING',
    });

    // 4. Upcoming bookings where user is the rider (ACCEPTED or PENDING)
    const upcomingBookings = await Booking.find({
      riderId: userId,
      status: { $in: ['ACCEPTED', 'PENDING'] },
    }).populate('rideId');

    const upcomingRiderBookingsCount = upcomingBookings.filter(
      (b) => b.rideId && new Date(b.rideId.departureDateTime) > now
    ).length;

    // 5. Total accepted bookings for user as a rider
    const totalAcceptedBookingsCount = await Booking.countDocuments({
      riderId: userId,
      status: 'ACCEPTED',
    });

    // 6. Recent upcoming rides offered by user
    const upcomingOfferedRides = await Ride.find({
      driverId: userId,
      departureDateTime: { $gt: now },
    })
      .sort({ departureDateTime: 1 })
      .limit(3)
      .lean();

    // 7. Recent upcoming rides booked by user
    const upcomingBookedRides = upcomingBookings
      .filter((b) => b.rideId && new Date(b.rideId.departureDateTime) > now)
      .slice(0, 3)
      .map((b) => ({
        bookingId: b._id,
        seatsRequested: b.seatsRequested,
        bookingStatus: b.status,
        ride: b.rideId,
      }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          ridesOffered: ridesOfferedCount,
          upcomingBookings: upcomingRiderBookingsCount,
          pendingRequests: pendingDriverRequestsCount,
          totalAcceptedBookings: totalAcceptedBookingsCount,
        },
        upcomingOfferedRides,
        upcomingBookedRides,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
};
