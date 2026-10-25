const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/ridesync_test';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'concurrency_test_jwt_secret_12345';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  await User.deleteMany({ email: /@concurrency-test\.com$/ });
  await Ride.deleteMany({ notes: 'Concurrency Test Ride' });
  await Booking.deleteMany({});
  await mongoose.connection.close();
});

describe('=== RideSync Concurrency & Overbooking Prevention Test ===', () => {
  it('should prevent overbooking when two acceptance requests occur simultaneously', async () => {
    const timestamp = Date.now();

    // 1. Create 1 Driver and 2 Riders
    const driverRes = await request(app).post('/api/auth/register').send({
      name: 'Driver Concurrent',
      email: `driver_${timestamp}@concurrency-test.com`,
      password: 'password123',
      confirmPassword: 'password123',
    });
    const driverToken = driverRes.body.data.token;

    const rider1Res = await request(app).post('/api/auth/register').send({
      name: 'Rider 1 Concurrent',
      email: `rider1_${timestamp}@concurrency-test.com`,
      password: 'password123',
      confirmPassword: 'password123',
    });
    const rider1Token = rider1Res.body.data.token;

    const rider2Res = await request(app).post('/api/auth/register').send({
      name: 'Rider 2 Concurrent',
      email: `rider2_${timestamp}@concurrency-test.com`,
      password: 'password123',
      confirmPassword: 'password123',
    });
    const rider2Token = rider2Res.body.data.token;

    // 2. Driver offers a ride with ONLY 2 available seats
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const rideRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        from: { name: 'Vijayawada, AP', city: 'Vijayawada', latitude: 16.5, longitude: 80.6 },
        to: { name: 'Guntur, AP', city: 'Guntur', latitude: 16.3, longitude: 80.4 },
        date: futureDate,
        departureTime: '10:00',
        availableSeats: 2, // Total 2 seats
        farePerSeat: 150,
        notes: 'Concurrency Test Ride',
      });
    const rideId = rideRes.body.data.ride._id;

    // 3. Rider 1 requests 2 seats (claims all available seats when accepted)
    const book1Res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${rider1Token}`)
      .send({ rideId, seatsRequested: 2 });
    expect(book1Res.status).toBe(201);
    const booking1Id = book1Res.body.data.booking._id;

    // 4. Rider 2 also requests 2 seats
    const book2Res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${rider2Token}`)
      .send({ rideId, seatsRequested: 2 });
    expect(book2Res.status).toBe(201);
    const booking2Id = book2Res.body.data.booking._id;

    // Prior to acceptance, available seats must still be 2
    let currentRide = await Ride.findById(rideId);
    expect(currentRide.availableSeats).toBe(2);

    // 5. Fire TWO SIMULTANEOUS acceptance requests to test race conditions!
    const [acceptRes1, acceptRes2] = await Promise.all([
      request(app)
        .patch(`/api/bookings/${booking1Id}/accept`)
        .set('Authorization', `Bearer ${driverToken}`),
      request(app)
        .patch(`/api/bookings/${booking2Id}/accept`)
        .set('Authorization', `Bearer ${driverToken}`),
    ]);

    const statuses = [acceptRes1.status, acceptRes2.status];

    // Exactly one must succeed (200) and the other must be rejected (409 Conflict)
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    // 6. Verify database state
    currentRide = await Ride.findById(rideId);
    // Seats must be exactly 0, never negative!
    expect(currentRide.availableSeats).toBe(0);
    expect(currentRide.status).toBe('FULL');

    const b1 = await Booking.findById(booking1Id);
    const b2 = await Booking.findById(booking2Id);
    const bookingStatuses = [b1.status, b2.status];

    expect(bookingStatuses).toContain('ACCEPTED');
    expect(bookingStatuses).toContain('PENDING'); // The failed acceptance remains PENDING or unaffected
  });
});
