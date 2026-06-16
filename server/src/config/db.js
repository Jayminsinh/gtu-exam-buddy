/**
 * @file MongoDB Connection
 * @description Creates and exports a reusable function that connects to
 *              MongoDB Atlas using Mongoose. Called once at server startup.
 *
 * Usage:
 *   import connectDB from './config/db.js';
 *   await connectDB();
 *
 * The connection string comes from config/index.js (which reads MONGODB_URI
 * from .env and validates it at startup).
 */

import mongoose from 'mongoose';
import config from './index.js';

// ──────────────────────────────────────────────
// Connection Function
// ──────────────────────────────────────────────

/**
 * Establishes a connection to MongoDB Atlas.
 *
 * Mongoose handles connection pooling internally, so you only need to
 * call this once. All subsequent `mongoose.model()` calls and queries
 * reuse the same pool automatically.
 *
 * @returns {Promise<void>}
 * @throws Will log the error and exit the process if connection fails.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log(
      `\n✅  MongoDB connected successfully` +
        `\n   Host : ${conn.connection.host}` +
        `\n   DB   : ${conn.connection.name}\n`
    );
  } catch (error) {
    console.error(
      `\n❌  MongoDB connection failed` +
        `\n   Error: ${error.message}\n`
    );

    if (process.env.NODE_ENV !== 'production') {
      // Exit with failure code — there's no point running the server
      // if the database is unreachable. A process manager (PM2, Docker)
      // will automatically restart it.
      process.exit(1);
    }
  }
};

// ──────────────────────────────────────────────
// Mongoose Connection Event Listeners
// ──────────────────────────────────────────────
// These fire AFTER the initial connection and help monitor the
// connection health throughout the application's lifetime.

/** Fires when the connection is unexpectedly lost (e.g. network issue) */
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

/** Fires when Mongoose successfully reconnects after a disconnection */
mongoose.connection.on('reconnected', () => {
  console.log('🔄  MongoDB reconnected');
});

/** Fires on any connection error after the initial connect */
mongoose.connection.on('error', (err) => {
  console.error(`❌  MongoDB connection error: ${err.message}`);
});

export default connectDB;
