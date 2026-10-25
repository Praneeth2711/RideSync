const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001';

async function runDemoWorkflow() {
  console.log('========================================================');
  console.log('   STARTING COMPLETE RIDESYNC LIVE DEMONSTRATION TEST   ');
  console.log('========================================================\n');

  const client1 = axios.create({ baseURL: BASE_URL, withCredentials: true });
  const client2 = axios.create({ baseURL: BASE_URL, withCredentials: true });
  const client3 = axios.create({ baseURL: BASE_URL, withCredentials: true });

  const timestamp = Date.now();
  const driverEmail = `driver_${timestamp}@demo.com`;
  const rider1Email = `rider1_${timestamp}@demo.com`;
  const rider2Email = `rider2_${timestamp}@demo.com`;

  // STEP 1: Driver Registration
  console.log('▶ STEP 1: Register Driver Account');
  const driverReg = await client1.post('/api/auth/register', {
    name: 'Ravi Teja (Driver)',
    email: driverEmail,
    password: 'password123',
    confirmPassword: 'password123',
  });
  console.log(`  Driver created: ID=${driverReg.data.data.user._id}, Name=${driverReg.data.data.user.name}`);
  const driverToken = driverReg.data.data.token;
  client1.defaults.headers.common['Authorization'] = `Bearer ${driverToken}`;

  // STEP 2: Driver Offers a Ride: Vijayawada -> Guntur, 4 seats, ₹150
  console.log('\n▶ STEP 2: Driver Offers Ride (Vijayawada -> Guntur, 4 Seats, ₹150)');
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const travelDate = nextWeek.toISOString().split('T')[0];

  const offerRes = await client1.post('/api/rides', {
    from: {
      name: 'Benz Circle, Vijayawada, Andhra Pradesh',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      latitude: 16.501,
      longitude: 80.643,
    },
    to: {
      name: 'NTR Bus Station, Guntur, Andhra Pradesh',
      city: 'Guntur',
      state: 'Andhra Pradesh',
      latitude: 16.306,
      longitude: 80.436,
    },
    date: travelDate,
    departureTime: '09:00',
    availableSeats: 4,
    farePerSeat: 150,
    notes: 'Leaving on time. Clean AC car.',
  });
  const ride = offerRes.data.data.ride;
  console.log(`  Ride published in MongoDB: ID=${ride._id}`);
  console.log(`  Status=${ride.status}, Available Seats=${ride.availableSeats}, Total Seats=${ride.totalSeats}`);

  // STEP 3: Rider 1 Registers and Searches for Ride
  console.log('\n▶ STEP 3: Rider 1 Registers and Searches for Vijayawada -> Guntur');
  const rider1Reg = await client2.post('/api/auth/register', {
    name: 'Ananya Sharma (Rider 1)',
    email: rider1Email,
    password: 'password123',
    confirmPassword: 'password123',
  });
  console.log(`  Rider 1 created: ID=${rider1Reg.data.data.user._id}`);
  const rider1Token = rider1Reg.data.data.token;
  client2.defaults.headers.common['Authorization'] = `Bearer ${rider1Token}`;

  const searchRes = await client2.get('/api/rides', {
    params: { from: 'Vijayawada', to: 'Guntur', date: travelDate, seats: 2 },
  });
  console.log(`  Found ${searchRes.data.data.rides.length} matching ride(s) in MongoDB.`);
  const matchingRide = searchRes.data.data.rides.find((r) => r._id === ride._id);
  if (!matchingRide) throw new Error('Posted ride not found in search results!');

  // STEP 4: Rider 1 Requests 2 Seats -> Status PENDING, Available Seats must remain 4
  console.log('\n▶ STEP 4: Rider 1 Requests 2 Seats');
  const bookRes = await client2.post('/api/bookings', {
    rideId: ride._id,
    seatsRequested: 2,
  });
  const booking1 = bookRes.data.data.booking;
  console.log(`  Booking request created in MongoDB: ID=${booking1._id}`);
  console.log(`  Booking status: ${booking1.status}`);

  // Verify available seats remained 4!
  const rideCheckAfterRequest = await client1.get(`/api/rides/${ride._id}`);
  console.log(`  CRITICAL CHECK: Ride available seats while PENDING = ${rideCheckAfterRequest.data.data.ride.availableSeats} (Must be 4)`);
  if (rideCheckAfterRequest.data.data.ride.availableSeats !== 4) {
    throw new Error('FAILED: Available seats changed while booking was pending!');
  }

  // STEP 5: Driver Manages Requests and ACCEPTS Rider 1
  console.log('\n▶ STEP 5: Driver ACCEPTS Request');
  const driverRequests = await client1.get(`/api/rides/${ride._id}/requests`);
  console.log(`  Driver sees ${driverRequests.data.data.requests.length} pending request(s).`);

  const acceptRes = await client1.patch(`/api/bookings/${booking1._id}/accept`);
  console.log(`  Driver accepted booking.`);
  console.log(`  Updated booking status: ${acceptRes.data.data.booking.status}`);
  console.log(`  Updated ride available seats in MongoDB: ${acceptRes.data.data.ride.availableSeats} (Decreased 4 -> 2)`);
  if (acceptRes.data.data.ride.availableSeats !== 2) {
    throw new Error('FAILED: Seats did not decrease from 4 to 2!');
  }

  // STEP 6: Verify as Rider 1 in History
  console.log('\n▶ STEP 6: Rider 1 Checks Booking History');
  const rider1History = await client2.get('/api/bookings/my');
  const rider1BookingRecord = rider1History.data.data.bookings.find((b) => b._id === booking1._id);
  console.log(`  Rider 1 history shows: Status=${rider1BookingRecord.status}, Seats=${rider1BookingRecord.seatsRequested}`);
  if (rider1BookingRecord.status !== 'ACCEPTED') {
    throw new Error('FAILED: Booking status in history is not ACCEPTED!');
  }

  // STEP 7: Second Rider Requests the Remaining 2 Seats and Driver Accepts -> Ride becomes FULL
  console.log('\n▶ STEP 7: Rider 2 Requests Remaining 2 Seats & Driver Accepts');
  const rider2Reg = await client3.post('/api/auth/register', {
    name: 'Karthik Rao (Rider 2)',
    email: rider2Email,
    password: 'password123',
    confirmPassword: 'password123',
  });
  const rider2Token = rider2Reg.data.data.token;
  client3.defaults.headers.common['Authorization'] = `Bearer ${rider2Token}`;

  const book2Res = await client3.post('/api/bookings', {
    rideId: ride._id,
    seatsRequested: 2,
  });
  const booking2 = book2Res.data.data.booking;

  const accept2Res = await client1.patch(`/api/bookings/${booking2._id}/accept`);
  console.log(`  Booking 2 accepted.`);
  console.log(`  Ride available seats: ${accept2Res.data.data.ride.availableSeats}`);
  console.log(`  Ride status: ${accept2Res.data.data.ride.status}`);
  if (accept2Res.data.data.ride.availableSeats !== 0 || accept2Res.data.data.ride.status !== 'FULL') {
    throw new Error('FAILED: Ride did not transition to FULL with 0 seats!');
  }

  // STEP 8: Test Overbooking Protection: New booking requests must be blocked
  console.log('\n▶ STEP 8: Overbooking Protection Test');
  try {
    const user4Client = axios.create({ baseURL: BASE_URL });
    const user4Reg = await user4Client.post('/api/auth/register', {
      name: 'Late Passenger',
      email: `late_${timestamp}@demo.com`,
      password: 'password123',
      confirmPassword: 'password123',
    });
    user4Client.defaults.headers.common['Authorization'] = `Bearer ${user4Reg.data.data.token}`;

    await user4Client.post('/api/bookings', {
      rideId: ride._id,
      seatsRequested: 1,
    });
    throw new Error('FAILED: Overbooking request was incorrectly permitted on a FULL ride!');
  } catch (err) {
    if (err.response && err.response.status === 400 && err.response.data.message.includes('full')) {
      console.log(`  SUCCESS: Overbooking blocked with HTTP 400: "${err.response.data.message}"`);
    } else {
      throw err;
    }
  }

  console.log('\n========================================================');
  console.log('   ALL 8 STEPS OF LIVE DEMONSTRATION COMPLETED 100%   ');
  console.log('========================================================');
}

runDemoWorkflow().catch((err) => {
  console.error('\nDEMO WORKFLOW FAILED:', err.response?.data || err.message);
  process.exit(1);
});
