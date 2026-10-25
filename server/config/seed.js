const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

dotenv.config();

const seedDatabase = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ridesync';

  try {
    await mongoose.connect(mongoURI);
    console.log('[Seed] Connected to MongoDB at:', mongoURI);

    // Clear existing sample records
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await User.deleteMany({});

    console.log('[Seed] Cleaned existing database records.');

    // 1. Create sample users
    const driverPasswordHash = await User.hashPassword('driver123');
    const riderPasswordHash = await User.hashPassword('rider123');

    const driver = await User.create({
      name: 'Ravi Teja',
      email: 'driver@ridesync.com',
      passwordHash: driverPasswordHash,
    });

    const rider1 = await User.create({
      name: 'Ananya Sharma',
      email: 'rider1@ridesync.com',
      passwordHash: riderPasswordHash,
    });

    const rider2 = await User.create({
      name: 'Karthik Rao',
      email: 'rider2@ridesync.com',
      passwordHash: riderPasswordHash,
    });

    console.log('[Seed] Created demo users:');
    console.log('   Driver:  driver@ridesync.com  / driver123');
    console.log('   Rider 1: rider1@ridesync.com  / rider123');
    console.log('   Rider 2: rider2@ridesync.com  / rider123');

    // 2. Create sample rides in India
    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // in 3 days
    futureDate1.setHours(9, 0, 0, 0);

    const futureDate2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // in 5 days
    futureDate2.setHours(14, 30, 0, 0);

    const futureDate3 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // in 7 days
    futureDate3.setHours(8, 0, 0, 0);

    const ride1 = await Ride.create({
      driverId: driver._id,
      from: {
        name: 'Benz Circle, Vijayawada, Andhra Pradesh, India',
        city: 'Vijayawada',
        state: 'Andhra Pradesh',
        latitude: 16.501,
        longitude: 80.643,
        placeId: 'vja_benz_circle',
      },
      to: {
        name: 'NTR Bus Stand, Guntur, Andhra Pradesh, India',
        city: 'Guntur',
        state: 'Andhra Pradesh',
        latitude: 16.306,
        longitude: 80.436,
        placeId: 'gtr_bus_stand',
      },
      departureDateTime: futureDate1,
      totalSeats: 4,
      availableSeats: 4,
      farePerSeat: 150,
      notes: 'Leaving sharp at 9:00 AM. Clean Honda City with AC. 2 luggage slots available.',
      status: 'ACTIVE',
    });

    const ride2 = await Ride.create({
      driverId: driver._id,
      from: {
        name: 'Hitech City, Hyderabad, Telangana, India',
        city: 'Hyderabad',
        state: 'Telangana',
        latitude: 17.4435,
        longitude: 78.3772,
        placeId: 'hyd_hitech',
      },
      to: {
        name: 'MG Road, Vijayawada, Andhra Pradesh, India',
        city: 'Vijayawada',
        state: 'Andhra Pradesh',
        latitude: 16.5062,
        longitude: 80.648,
        placeId: 'vja_mg_road',
      },
      departureDateTime: futureDate2,
      totalSeats: 3,
      availableSeats: 3,
      farePerSeat: 550,
      notes: 'Direct highway trip via NH65. Comfortable sedan.',
      status: 'ACTIVE',
    });

    const ride3 = await Ride.create({
      driverId: driver._id,
      from: {
        name: 'Indiranagar, Bengaluru, Karnataka, India',
        city: 'Bengaluru',
        state: 'Karnataka',
        latitude: 12.9784,
        longitude: 77.6408,
        placeId: 'blr_indiranagar',
      },
      to: {
        name: 'T. Nagar, Chennai, Tamil Nadu, India',
        city: 'Chennai',
        state: 'Tamil Nadu',
        latitude: 13.0418,
        longitude: 80.2341,
        placeId: 'chn_tnagar',
      },
      departureDateTime: futureDate3,
      totalSeats: 4,
      availableSeats: 4,
      farePerSeat: 700,
      notes: 'Morning departure with breakfast stop. Tolls included.',
      status: 'ACTIVE',
    });

    // 3. Create a sample pending booking on Ride 1 by Rider 1
    const sampleBooking = await Booking.create({
      rideId: ride1._id,
      riderId: rider1._id,
      seatsRequested: 1,
      status: 'PENDING',
    });

    console.log('[Seed] Created sample rides:');
    console.log(`   1. Vijayawada -> Guntur (4 seats, ₹150) [ID: ${ride1._id}]`);
    console.log(`   2. Hyderabad -> Vijayawada (3 seats, ₹550) [ID: ${ride2._id}]`);
    console.log(`   3. Bengaluru -> Chennai (4 seats, ₹700) [ID: ${ride3._id}]`);
    console.log(`[Seed] Created sample PENDING booking on Ride 1 by Ananya Sharma (Rider 1).`);

    console.log('\n[Seed] Database successfully populated!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedDatabase();
