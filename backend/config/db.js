/* ============================================================
   MongoDB Connection  –  config/db.js
   ============================================================
   Change your database URL in backend/.env  →  MONGO_URI=...
   ============================================================ */

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not set in backend/.env');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);
    return true;
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    throw err;
  }
}

module.exports = connectDB;
