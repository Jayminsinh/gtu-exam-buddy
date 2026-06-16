/**
 * @file Centralized Configuration
 * @description Loads environment variables via dotenv and exports a single,
 *              structured config object used across the entire application.
 *
 * Usage:
 *   import config from './config/index.js';
 *   // or simply: import config from './config';
 *
 * Groups:
 *   config.server   — PORT, NODE_ENV
 *   config.database — MONGODB_URI
 *   config.jwt      — access / refresh secrets & expiry
 *   config.client   — allowed client origin (for CORS)
 */

// ──────────────────────────────────────────────
// 1. Load .env file into process.env
// ──────────────────────────────────────────────
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config(); // reads from project-root .env by default
}

// ──────────────────────────────────────────────
// 2. Validate required environment variables
// ──────────────────────────────────────────────

/**
 * List of env vars that MUST be set before the server can start.
 * If any are missing the process exits immediately with a clear message,
 * preventing hard-to-debug runtime errors later.
 */
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

/**
 * Checks that every required variable exists and is non-empty.
 * Collects ALL missing vars so the developer can fix them in one go.
 */
const missingVars = REQUIRED_ENV_VARS.filter(
  (key) => !process.env[key] || process.env[key].trim() === ''
);

if (missingVars.length > 0) {
  console.error(
    `\n❌  Missing required environment variables:\n` +
      missingVars.map((v) => `   • ${v}`).join('\n') +
      `\n\n💡  Copy .env.example to .env and fill in the values.\n`
  );
  process.exit(1);
}

// ──────────────────────────────────────────────
// 3. Build & export the config object
// ──────────────────────────────────────────────

const config = {
  /**
   * Server settings
   * - port: defaults to 5000 if PORT is not set
   * - nodeEnv: "development" | "production" | "test"
   * - isDev / isProd / isTest: convenience booleans
   */
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Handy boolean helpers used in conditionals throughout the app
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

  /**
   * Database settings
   * - uri: MongoDB Atlas connection string (validated above)
   */
  database: {
    uri: process.env.MONGODB_URI,
  },

  /**
   * JWT (JSON Web Token) settings
   * - access: short-lived token for API authorization
   * - refresh: long-lived token for silent re-authentication
   */
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

  /**
   * Client / CORS settings
   * - url: the frontend origin allowed by CORS (e.g., Vite dev server)
   */
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173',
  },
};

// Freeze top-level to prevent accidental mutation at runtime
Object.freeze(config);

export default config;
