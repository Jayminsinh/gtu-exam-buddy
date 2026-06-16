import dotenv from 'dotenv';

// run donenv
dotenv.config();

const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    get isDev() { return this.nodeEnv === 'development'; },
    get isProd() { return this.nodeEnv === 'production'; },
    get isTest() { return this.nodeEnv === 'test'; },
  },

  database: {
    uri: process.env.MONGODB_URI,
  },

  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
      expiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
      expiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
  },

  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173',
  },
};

Object.freeze(config);

export default config;