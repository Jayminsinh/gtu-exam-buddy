import dotenv from 'dotenv';

// Load environment variables locally
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Required environment variables checklist
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

// Identify missing environment variables
const missingVars = REQUIRED_ENV_VARS.filter(
  (key) => !process.env[key] || process.env[key].trim() === ''
);

// Warn or exit depending on environment if variables are missing
if (missingVars.length > 0) {
  const errorMsg = `\n❌  Missing required environment variables:\n` +
    missingVars.map((v) => `   • ${v}`).join('\n') +
    `\n\n💡  Copy .env.example to .env and fill in the values.\n`;

  if (process.env.NODE_ENV === 'production') {
    console.warn(errorMsg);
  } else {
    console.error(errorMsg);
    process.exit(1);
  }
}

// Application configuration settings object
const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Environment boolean helpers
    get isDev() {
      return this.nodeEnv === 'development';
    },
    get isProd() {
      return this.nodeEnv === 'production';
    },
    get isTest() {
      return this.nodeEnv === 'test';
    },
  },

  database: {
    uri: process.env.MONGODB_URI,
  },

  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
  },

  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173',
  },
};

// Freeze configuration object to prevent runtime mutations
Object.freeze(config);

export default config;
