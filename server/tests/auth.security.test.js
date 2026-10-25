const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/ridesync_test';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'csrf_security_test_jwt_secret_12345';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  await User.deleteMany({ email: /@security-test\.com$/ });
  await mongoose.connection.close();
});

describe('=== TASK 1: Authentication Security & Cookie Testing ===', () => {
  let cookieHeader;
  let userEmail;

  it('should authenticate via HttpOnly cookie and issue XSRF-TOKEN cookie', async () => {
    userEmail = `cookie_${Date.now()}@security-test.com`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Cookie User',
        email: userEmail,
        password: 'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.headers['set-cookie']).toBeDefined();

    const cookies = res.headers['set-cookie'];
    const tokenCookie = cookies.find((c) => c.startsWith('token='));
    const xsrfCookie = cookies.find((c) => c.startsWith('XSRF-TOKEN='));

    // Check that session token is HttpOnly
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toMatch(/HttpOnly/i);

    // Check that XSRF-TOKEN is set and readable
    expect(xsrfCookie).toBeDefined();

    // Save cookie header for subsequent requests
    cookieHeader = tokenCookie.split(';')[0];
  });

  it('should access protected /api/auth/me using ONLY HttpOnly cookie (NO Bearer header)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookieHeader); // Send only the session cookie

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(userEmail);
  });

  it('should clear cookies on logout', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookieHeader);

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    const clearedToken = cookies.find((c) => c.startsWith('token=;'));
    expect(clearedToken).toBeDefined();
  });
});
