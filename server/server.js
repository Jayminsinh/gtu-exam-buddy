/**
 * @file Main Execution Entrypoint
 * @description Boots up the server. Establishes the database connection,
 *              listens on the configured port, and handles lifecycle signals
 *              (like uncaught exceptions, unhandled rejections, and termination
 *              signals) to ensure a graceful, zero-downtime-friendly shutdown.
 */

import app from './src/app.js';
import config from './src/config/index.js';
import connectDB from './src/config/db.js';
import mongoose from 'mongoose';

let server;

// ──────────────────────────────────────────────
// Graceful Shutdown Handler
// ──────────────────────────────────────────────

/**
 * Gracefully shuts down the HTTP server and Mongoose connection.
 * Prevents dropping active connections, and ensures resources are released properly.
 *
 * @param {string} signal - The event or signal that triggered the shutdown
 */
const gracefulShutdown = (signal) => {
  console.log(`\n🛑  Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    console.log('🔌  Closing HTTP server...');
    server.close(async () => {
      console.log('✅  HTTP server closed.');

      try {
        console.log('💾  Closing MongoDB connection...');
        await mongoose.connection.close(false);
        console.log('✅  MongoDB connection closed.');

        console.log('👋  Shutdown complete. Exiting.');
        process.exit(0);
      } catch (err) {
        console.error('❌  Error during Mongoose connection closure:', err);
        process.exit(1);
      }
    });

    // If HTTP connections take too long to close, force exit after 10s
    setTimeout(() => {
      console.error('⏳  Graceful shutdown timed out. Forcing termination.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// ──────────────────────────────────────────────
// System Event Listeners
// ──────────────────────────────────────────────

// Uncaught Exceptions: Synchronous bugs not caught by any try/catch (e.g. referencing an undefined variable)
// The process is in an unstable state and MUST be restarted.
process.on('uncaughtException', (error) => {
  console.error('\n💥  UNCAUGHT EXCEPTION! Shutting down immediately...');
  console.error(error);
  process.exit(1);
});

// Unhandled Rejections: Asynchronous promises rejected but not caught by a catch block
// Close the server and database connections cleanly before exiting.
process.on('unhandledRejection', (reason) => {
  console.error('\n💥  UNHANDLED REJECTION! Shutting down gracefully...');
  console.error(reason);

  if (server) {
    server.close(() => {
      mongoose.connection.close(false).finally(() => {
        process.exit(1);
      });
    });
  } else {
    process.exit(1);
  }
});

// SIGTERM: Sent by process managers (like PM2, Heroku, Docker) requesting a shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// SIGINT: Sent when hitting Ctrl+C in the terminal
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ──────────────────────────────────────────────
// Bootstrap / Server Startup
// ──────────────────────────────────────────────

const startServer = async () => {
  try {
    // 1. Connect to MongoDB Atlas first
    await connectDB();

    // 2. Start the Express HTTP Server
    server = app.listen(config.server.port, () => {
      console.log(
        `🚀  Server is listening on port: ${config.server.port}` +
          `\n    Mode : ${config.server.nodeEnv}` +
          `\n    URL  : http://localhost:${config.server.port}\n`
      );
    });
  } catch (error) {
    console.error(`\n❌  Failed to start server: ${error.message}\n`);
    process.exit(1);
  }
};

startServer();
