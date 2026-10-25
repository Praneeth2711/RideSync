const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/ridesync_test';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'super_secret_test_jwt_key_12345';
  await mongoose.connect(TEST_DB_URI);
  await User.deleteMany({});
  await Ride.deleteMany({});
  await Booking.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await Ride.deleteMany({});
  await Booking.deleteMany({});
  await mongoose.connection.close();
});

describe('=== RideSync Mandatory College Test Suite ===', () => {
  let driverToken, riderToken, rider2Token;
  let driverUser, riderUser, rider2User;
  let testRideId;
  let pendingBookingId;

  // ----------------------------------------------------
  // TEST 1: User Registration & Duplicate Email
  // ----------------------------------------------------
  describe('1. Authentication & User Management', () => {
    it('should register a new driver account successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Suresh Driver',
          email: 'suresh@driver.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('suresh@driver.com');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Security check
      expect(res.body.data.token).toBeDefined();

      driverToken = res.body.data.token;
      driverUser = res.body.data.user;
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Suresh Duplicate',
          email: 'suresh@driver.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should register a rider account successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Ananya Rider',
          email: 'ananya@rider.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(res.status).toBe(201);
      riderToken = res.body.data.token;
      riderUser = res.body.data.user;
    });

    it('should register a second rider account for concurrency and full ride test', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Rohan Rider2',
          email: 'rohan@rider.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(res.status).toBe(201);
      rider2Token = res.body.data.token;
      rider2User = res.body.data.user;
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'suresh@driver.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'suresh@driver.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject protected route without auth token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user info on GET /api/auth/me with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('suresh@driver.com');
    });
  });

  // ----------------------------------------------------
  // TEST 2: Ride Creation & Searching
  // ----------------------------------------------------
  describe('2. REQUIREMENT 1 & 2: Post & Search Rides', () => {
    it('should reject ride creation with past date', async () => {
      const res = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          from: { name: 'Vijayawada, AP', city: 'Vijayawada', latitude: 16.5, longitude: 80.6 },
          to: { name: 'Guntur, AP', city: 'Guntur', latitude: 16.3, longitude: 80.4 },
          date: '2020-01-01',
          departureTime: '10:00',
          availableSeats: 4,
          farePerSeat: 150,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/future/i);
    });

    it('should post a valid ride to MongoDB (Vijayawada -> Guntur, 4 seats, ₹150)', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const dateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          from: {
            name: 'Vijayawada Bus Station, Andhra Pradesh',
            city: 'Vijayawada',
            state: 'Andhra Pradesh',
            latitude: 16.5062,
            longitude: 80.648,
          },
          to: {
            name: 'Guntur Bus Stand, Andhra Pradesh',
            city: 'Guntur',
            state: 'Andhra Pradesh',
            latitude: 16.3067,
            longitude: 80.4365,
          },
          date: dateStr,
          departureTime: '09:00',
          availableSeats: 4,
          farePerSeat: 150,
          notes: 'Air conditioned car, leaving sharp at 9 AM.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ride).toBeDefined();
      expect(res.body.data.ride.from.city).toBe('Vijayawada');
      expect(res.body.data.ride.to.city).toBe('Guntur');
      expect(res.body.data.ride.totalSeats).toBe(4);
      expect(res.body.data.ride.availableSeats).toBe(4);
      expect(res.body.data.ride.farePerSeat).toBe(150);
      expect(res.body.data.ride.status).toBe('ACTIVE');

      testRideId = res.body.data.ride._id;
    });

    it('should search available rides by route and date from MongoDB', async () => {
      const res = await request(app)
        .get('/api/rides')
        .query({
          from: 'Vijayawada',
          to: 'Guntur',
          seats: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rides.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.rides[0]._id.toString()).toBe(testRideId.toString());
    });

    it('should apply Smart Ride Matching with Haversine scoring when coordinates are passed', async () => {
      const res = await request(app)
        .get('/api/rides')
        .query({
          pickupLat: 16.51,
          pickupLon: 80.64,
          destLat: 16.31,
          destLon: 80.44,
        });

      expect(res.status).toBe(200);
      const topRide = res.body.data.rides[0];
      expect(topRide).toBeDefined();
      expect(topRide.matchScore).toBeDefined();
      expect(topRide.matchScore).toBeGreaterThan(70);
      expect(topRide.isBestMatch).toBe(true);
    });

    it('should return empty list when searching an unrelated route', async () => {
      const res = await request(app)
        .get('/api/rides')
        .query({
          from: 'Mumbai',
          to: 'Delhi',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.rides.length).toBe(0);
    });
  });

  // ----------------------------------------------------
  // TEST 3: Seat Requests & Pending Status
  // ----------------------------------------------------
  describe('3. REQUIREMENT 3: Request Seats & Pending Status', () => {
    it('should prevent driver from booking their own ride', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          rideId: testRideId,
          seatsRequested: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot request seats on a ride you posted/i);
    });

    it('rider requests 2 seats -> status must be PENDING and ride seats remain 4', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          rideId: testRideId,
          seatsRequested: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('PENDING');
      expect(res.body.data.booking.seatsRequested).toBe(2);

      pendingBookingId = res.body.data.booking._id;

      // REQUIREMENT 3 CRITICAL CHECK: Driver's available seats must remain 4 while pending!
      const checkRide = await Ride.findById(testRideId);
      expect(checkRide.availableSeats).toBe(4);
    });

    it('should reject duplicate booking request from same rider', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          rideId: testRideId,
          seatsRequested: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already have a booking request/i);
    });
  });

  // ----------------------------------------------------
  // TEST 4: Accept / Reject Requests & Overbooking Prevention
  // ----------------------------------------------------
  describe('4. REQUIREMENT 4: Accept/Reject Requests & Atomic Seat Updates', () => {
    it('should prevent non-driver from accepting requests (unauthorized check)', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${pendingBookingId}/accept`)
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only the driver/i);
    });

    it('driver accepts request -> seats must atomically decrease from 4 to 2, status becomes ACCEPTED', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${pendingBookingId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('ACCEPTED');

      // CRITICAL CHECK in MongoDB:
      const checkRide = await Ride.findById(testRideId);
      expect(checkRide.availableSeats).toBe(2);
      expect(checkRide.status).toBe('ACTIVE');
    });

    it('should reject re-accepting an already ACCEPTED booking (idempotency check)', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${pendingBookingId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already been accepted/i);

      // Seats must NOT decrease again!
      const checkRide = await Ride.findById(testRideId);
      expect(checkRide.availableSeats).toBe(2);
    });

    it('second rider requests 2 remaining seats and driver accepts -> available seats become 0 and status becomes FULL', async () => {
      // Rider 2 requests 2 seats
      const reqRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${rider2Token}`)
        .send({
          rideId: testRideId,
          seatsRequested: 2,
        });

      expect(reqRes.status).toBe(201);
      const booking2Id = reqRes.body.data.booking._id;

      // Driver accepts
      const acceptRes = await request(app)
        .patch(`/api/bookings/${booking2Id}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(acceptRes.status).toBe(200);

      // CRITICAL CHECK: Ride must now be FULL and 0 available seats
      const checkRide = await Ride.findById(testRideId);
      expect(checkRide.availableSeats).toBe(0);
      expect(checkRide.status).toBe('FULL');
    });

    it('should block new requests once ride is FULL', async () => {
      // Register a third user
      const user3 = await request(app).post('/api/auth/register').send({
        name: 'Third User',
        email: 'user3@test.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${user3.body.data.token}`)
        .send({
          rideId: testRideId,
          seatsRequested: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/full/i);
    });

    it('test rejection logic: available seats remain unchanged on REJECT', async () => {
      // Create a fresh ride with 3 seats
      const futureDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
      const dateStr = futureDate.toISOString().split('T')[0];

      const newRideRes = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          from: { name: 'Hyderabad', city: 'Hyderabad', latitude: 17.38, longitude: 78.48 },
          to: { name: 'Vijayawada', city: 'Vijayawada', latitude: 16.5, longitude: 80.6 },
          date: dateStr,
          departureTime: '14:00',
          availableSeats: 3,
          farePerSeat: 400,
        });

      const rejectRideId = newRideRes.body.data.ride._id;

      // Rider 1 requests 1 seat
      const bookRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          rideId: rejectRideId,
          seatsRequested: 1,
        });

      const bookIdToReject = bookRes.body.data.booking._id;

      // Driver rejects
      const rejectRes = await request(app)
        .patch(`/api/bookings/${bookIdToReject}/reject`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.booking.status).toBe('REJECTED');

      // CRITICAL CHECK: Available seats must remain 3!
      const checkRide = await Ride.findById(rejectRideId);
      expect(checkRide.availableSeats).toBe(3);
    });
  });

  // ----------------------------------------------------
  // TEST 5: History & Dashboard
  // ----------------------------------------------------
  describe('5. REQUIREMENT 5: Ride History & Dashboard Metrics', () => {
    it('driver should see their offered rides in history (Tab 1: Rides Offered)', async () => {
      const res = await request(app)
        .get('/api/rides/my')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rides.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.rides[0].totalSeats).toBeDefined();
    });

    it('rider should see their booking requests in history (Tab 2: Rides Booked)', async () => {
      const res = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${riderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.bookings[0].status).toBeDefined();
      expect(res.body.data.bookings[0].rideId).toBeDefined();
    });

    it('dashboard stats should reflect accurate counts from MongoDB', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.ridesOffered).toBeGreaterThanOrEqual(2);
    });
  });
});
