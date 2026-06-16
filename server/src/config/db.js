import mongoose from 'mongoose';
import config from './index.js';

// Establish a connection to MongoDB Atlas
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
      process.exit(1);
    }
  }
};

// Monitor connection loss
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

// Monitor connection recovery
mongoose.connection.on('reconnected', () => {
  console.log('🔄  MongoDB reconnected');
});

// Monitor post-startup connection errors
mongoose.connection.on('error', (err) => {
  console.error(`❌  MongoDB connection error: ${err.message}`);
});

export default connectDB;
