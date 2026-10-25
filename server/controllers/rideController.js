const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const { rankRidesWithSmartMatching } = require('../services/rideMatchingService');

/**
 * @route   POST /api/rides
 * @desc    Driver creates/posts a new ride
 * @access  Private
 */
const createRide = async (req, res, next) => {
  try {
    const { from, to, date, departureTime, availableSeats, farePerSeat, notes } = req.body;

    // Validate location objects
    if (!from || !from.name || from.latitude === undefined || from.longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid pickup location with coordinates.',
      });
    }

    if (!to || !to.name || to.latitude === undefined || to.longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid destination location with coordinates.',
      });
    }

    if (!date || !departureTime) {
      return res.status(400).json({
        success: false,
        message: 'Please specify both travel date and departure time.',
      });
    }

    const seats = parseInt(availableSeats, 10);
    if (isNaN(seats) || seats < 1 || seats > 6) {
      return res.status(400).json({
        success: false,
        message: 'Available seats must be between 1 and 6.',
      });
    }

    const fare = parseFloat(farePerSeat);
    if (isNaN(fare) || fare < 0) {
      return res.status(400).json({
        success: false,
        message: 'Fare per seat cannot be negative.',
      });
    }

    // Construct departure Date object from date and time strings
    // Format expectation: date = "YYYY-MM-DD", departureTime = "HH:mm"
    const departureDateTime = new Date(`${date}T${departureTime}:00`);
    if (isNaN(departureDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid travel date or departure time format.',
      });
    }

    if (departureDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Departure time must be in the future.',
      });
    }

    // Clean location city names
    const fromCity = from.city || from.name.split(',')[0].trim();
    const toCity = to.city || to.name.split(',')[0].trim();

    const ride = await Ride.create({
      driverId: req.user._id,
      from: {
        name: from.name,
        city: fromCity,
        state: from.state || '',
        latitude: parseFloat(from.latitude),
        longitude: parseFloat(from.longitude),
        placeId: from.placeId || '',
      },
      to: {
        name: to.name,
        city: toCity,
        state: to.state || '',
        latitude: parseFloat(to.latitude),
        longitude: parseFloat(to.longitude),
        placeId: to.placeId || '',
      },
      departureDateTime,
      totalSeats: seats,
      availableSeats: seats,
      farePerSeat: fare,
      notes: (notes || '').trim(),
      status: 'ACTIVE',
    });

    const populated = await Ride.findById(ride._id).populate('driverId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Ride published successfully',
      data: { ride: populated },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/rides
 * @desc    Search active rides by route, date, and seats with smart matching
 * @access  Public
 */
const searchRides = async (req, res, next) => {
  try {
    const {
      from,
      to,
      date,
      seats = 1,
      pickupLat,
      pickupLon,
      destLat,
      destLon,
      preferredTime,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      status: 'ACTIVE',
      availableSeats: { $gte: Math.max(1, parseInt(seats, 10) || 1) },
      departureDateTime: { $gt: new Date() },
    };

    // Location filtering: support normalized city search or address substring search
    if (from && from.trim()) {
      const fromTerm = from.trim().split(',')[0].trim();
      query.$or = [
        { 'from.city': { $regex: fromTerm, $options: 'i' } },
        { 'from.name': { $regex: fromTerm, $options: 'i' } },
      ];
    }

    if (to && to.trim()) {
      const toTerm = to.trim().split(',')[0].trim();
      const toCondition = [
        { 'to.city': { $regex: toTerm, $options: 'i' } },
        { 'to.name': { $regex: toTerm, $options: 'i' } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: toCondition }];
        delete query.$or;
      } else {
        query.$or = toCondition;
      }
    }

    // Date filtering (matches any departure on the specified calendar day)
    if (date && date.trim()) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      if (!isNaN(startOfDay.getTime())) {
        query.departureDateTime = {
          $gte: startOfDay > new Date() ? startOfDay : new Date(),
          $lte: endOfDay,
        };
      }
    }

    // Execute query
    const rides = await Ride.find(query)
      .populate('driverId', 'name email')
      .sort({ departureDateTime: 1 })
      .lean();

    // Augment with smart matching algorithm if coordinates are available
    const rankedRides = rankRidesWithSmartMatching(rides, {
      pickupLat,
      pickupLon,
      destLat,
      destLon,
      preferredTime,
    });

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const totalCount = rankedRides.length;
    const paginatedRides = rankedRides.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      success: true,
      message: 'Rides retrieved successfully',
      data: {
        rides: paginatedRides,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/rides/my
 * @desc    Get rides created by the logged in driver
 * @access  Private
 */
const getMyRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({ driverId: req.user._id })
      .sort({ departureDateTime: -1 })
      .lean();

    // Attach pending request counts for each ride
    const rideIds = rides.map((r) => r._id);
    const pendingCounts = await Booking.aggregate([
      { $match: { rideId: { $in: rideIds }, status: 'PENDING' } },
      { $group: { _id: '$rideId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    pendingCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const ridesWithCounts = rides.map((r) => ({
      ...r,
      pendingRequestsCount: countMap[r._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      message: 'My rides retrieved successfully',
      data: { rides: ridesWithCounts },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/rides/:id
 * @desc    Get ride details by ID
 * @access  Public (Optional auth for checking user booking)
 */
const getRideById = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'name email')
      .lean();

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found.',
      });
    }

    let myBooking = null;
    let isOwner = false;

    // If user is authenticated, check if they own the ride or already requested seats
    if (req.user) {
      isOwner = ride.driverId._id.toString() === req.user._id.toString();
      myBooking = await Booking.findOne({
        rideId: ride._id,
        riderId: req.user._id,
      }).lean();
    }

    res.status(200).json({
      success: true,
      data: {
        ride,
        isOwner,
        myBooking,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRide,
  searchRides,
  getMyRides,
  getRideById,
};
