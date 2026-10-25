const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('FATAL ERROR: MONGODB_URI environment variable is missing.');
    console.error('Please configure MONGODB_URI in server/.env (e.g., mongodb://127.0.0.1:27017/ridesync or MongoDB Atlas connection string).');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true, // Build indexes automatically in development
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error('Ensure your MongoDB server or MongoDB Atlas cluster is running and reachable.');
    process.exit(1);
  }
};

module.exports = connectDB;
