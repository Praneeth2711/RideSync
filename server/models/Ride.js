const mongoose = require('mongoose');

const locationPointSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location formatted address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180,
    },
    placeId: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver ID is required'],
      index: true,
    },
    from: {
      type: locationPointSchema,
      required: [true, 'Pickup location is required'],
    },
    to: {
      type: locationPointSchema,
      required: [true, 'Destination location is required'],
    },
    departureDateTime: {
      type: Date,
      required: [true, 'Departure date and time is required'],
      index: true,
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats offered is required'],
      min: [1, 'Must offer at least 1 seat'],
      max: [6, 'Cannot offer more than 6 seats'],
    },
    availableSeats: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative'],
      max: [6, 'Available seats cannot exceed 6'],
    },
    farePerSeat: {
      type: Number,
      required: [true, 'Fare per seat is required'],
      min: [0, 'Fare cannot be negative'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'FULL', 'CANCELLED', 'COMPLETED'],
        message: '{VALUE} is not a valid ride status',
      },
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for searching performance
rideSchema.index({ status: 1, departureDateTime: 1 });
rideSchema.index({ 'from.city': 1, 'to.city': 1, status: 1, departureDateTime: 1 });
rideSchema.index({ 'from.latitude': 1, 'from.longitude': 1 });
rideSchema.index({ 'to.latitude': 1, 'to.longitude': 1 });

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride;
