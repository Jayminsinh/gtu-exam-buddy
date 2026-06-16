import './src/utils/polyfills.js';
import dotenv from 'dotenv';
// Load environment variables at the very top for Vercel compatibility
dotenv.config(); 

import app from './src/app.js';
import config from './src/config/index.js';
import connectDB from './src/config/db.js';
import mongoose from 'mongoose';
import dns from 'dns';

// Configure custom DNS resolvers
dns.setServers(["1.1.1.1", "8.8.8.8"]);

let server;

// Root liveness health check route
app.get('/', (req, res) => {
  return res.status(200).json({ status: "healthy", message: "GTU Exam Buddy API Online" });
});

// Clean up database connections and resources on shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close(false);
        console.log('✅ Connections closed cleanly. Exiting.');
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    });
    setTimeout(() => process.exit(1), 10000);
  } else {
    process.exit(0);
  }
};

// Global handlers for process level exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error('\n💥 UNCAUGHT EXCEPTION! Shutting down...', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n💥 UNHANDLED REJECTION! Shutting down...', reason);
  if (server) {
    server.close(() => mongoose.connection.close(false).finally(() => process.exit(1)));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Server initialization and bootstrap sequence
const startServer = async () => {
  try {
    // Establish connection to MongoDB Atlas
    await connectDB();

    if (process.env.NODE_ENV !== 'production') {
      server = app.listen(config.server.port, () => {
        console.log(`🚀 Server listening on port: ${config.server.port}`);
      });
    } else {
      console.log('⚡ Running in Serverless Production Mode');
    }
  } catch (error) {
    console.error(`\n❌ Failed to start server: ${error.message}\n`);
    process.exit(1);
  }
};

startServer();

export default app;