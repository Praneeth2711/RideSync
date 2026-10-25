const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load environment variables (reloaded for MongoDB Atlas)
dotenv.config();

// Initialize express app
const app = express();

// Trust reverse proxy (required for Render / Vercel HTTPS cookie handling)
app.set('trust proxy', 1);

// Allowed origins for CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.some((allowed) => {
          try {
            return new URL(allowed).origin === new URL(origin).origin;
          } catch {
            return allowed === origin;
          }
        }) || (process.env.NODE_ENV === 'production' && origin.endsWith('.vercel.app'));

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS policy'));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'RideSync Backend API',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Import route handlers and middleware
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const locationRoutes = require('./routes/locationRoutes');
const { csrfProtection } = require('./middleware/csrfMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// CSRF Protection Middleware
app.use(csrfProtection);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/locations', locationRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Only start the server when not in test mode
const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  // Connect to Database first, then listen
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`   RideSync Server is running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log(`   MongoDB Atlas: Connected`);
      console.log(`=========================================`);
    });
  });
}

module.exports = app;
