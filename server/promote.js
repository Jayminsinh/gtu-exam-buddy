import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/user.model.js';

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error('Please specify an email address. Example: node promote.js user@example.com');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database.');

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();
    console.log(`Successfully promoted ${email} to admin!`);
  } catch (err) {
    console.error('Error promoting user:', err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
