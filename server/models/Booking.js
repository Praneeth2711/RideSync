const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride ID is required'],
      index: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rider ID is required'],
      index: true,
    },
    seatsRequested: {
      type: Number,
      required: [true, 'Number of requested seats is required'],
      min: [1, 'Must request at least 1 seat'],
      max: [6, 'Cannot request more than 6 seats'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'PENDING',
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

// One booking record per ride per rider
bookingSchema.index({ rideId: 1, riderId: 1 }, { unique: true });
bookingSchema.index({ riderId: 1, status: 1 });
bookingSchema.index({ rideId: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
