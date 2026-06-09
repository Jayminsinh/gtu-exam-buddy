/**
 * @file Application Constants
 * @description A single source of truth for all magic values used across
 *              the application. Keeping them here avoids scattered literals,
 *              makes changes easy, and prevents typos.
 *
 * Usage:
 *   import { USER_ROLES, UPLOAD, PAGINATION, API } from '../utils/constants.js';
 */

// ──────────────────────────────────────────────
// 1. User Roles
// ──────────────────────────────────────────────

/**
 * Every user is assigned exactly one role.
 * These strings are stored in MongoDB and checked in auth middleware.
 *
 * STUDENT — default role on sign-up
 * ADMIN   — elevated privileges (manage users, content, etc.)
 */
export const USER_ROLES = Object.freeze({
  STUDENT: 'student',
  ADMIN: 'admin',
});

/** Array form — handy for Mongoose enum validation & Zod schemas */
export const USER_ROLES_LIST = Object.freeze(Object.values(USER_ROLES));

/** The role assigned when no role is explicitly provided */
export const DEFAULT_USER_ROLE = USER_ROLES.STUDENT;

// ──────────────────────────────────────────────
// 2. File Upload Settings
// ──────────────────────────────────────────────

/**
 * Constraints for Multer / Cloudinary file uploads.
 * Sizes are in bytes; 1 MB = 1024 * 1024 bytes.
 */
export const UPLOAD = Object.freeze({
  /** Maximum file size in bytes (10 MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** MIME types the server will accept */
  ALLOWED_MIME_TYPES: Object.freeze([
    // Documents
    'application/pdf',

    // Images (question-paper scans, profile pictures, etc.)
    'image/jpeg',
    'image/png',
    'image/webp',
  ]),

  /** Human-readable label shown in error messages */
  ALLOWED_EXTENSIONS: Object.freeze(['.pdf', '.jpg', '.jpeg', '.png', '.webp']),

  /** Max number of files per single upload request */
  MAX_FILES_PER_REQUEST: 5,
});

// ──────────────────────────────────────────────
// 3. Pagination Defaults
// ──────────────────────────────────────────────

/**
 * Default values when the client doesn't send ?page or ?limit.
 * MAX_LIMIT prevents abuse (requesting 100k records at once).
 */
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

// ──────────────────────────────────────────────
// 4. API Versioning
// ──────────────────────────────────────────────

/**
 * Prefix applied to all routes: e.g. /api/v1/auth/login
 * Bump VERSION when introducing breaking changes.
 */
export const API = Object.freeze({
  VERSION: 'v1',
  PREFIX: '/api/v1',
});

// ──────────────────────────────────────────────
// 5. Auth & Token Constants
// ──────────────────────────────────────────────

/**
 * Cookie and header names used by the auth system.
 * Centralising them avoids typos like "refreshtoken" vs "refreshToken".
 */
export const AUTH = Object.freeze({
  /** Name of the HTTP-only cookie that carries the refresh token */
  REFRESH_TOKEN_COOKIE: 'refreshToken',

  /** Expected value prefix in the Authorization header */
  BEARER_PREFIX: 'Bearer',
});

// ──────────────────────────────────────────────
// 6. Miscellaneous
// ──────────────────────────────────────────────

/**
 * Generic success / error messages reused across controllers.
 * Keeps API responses consistent and easy to update.
 */
export const MESSAGES = Object.freeze({
  // ── Auth ──
  REGISTER_SUCCESS: 'User registered successfully.',
  LOGIN_SUCCESS: 'Logged in successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  TOKEN_REFRESHED: 'Token refreshed successfully.',

  // ── Errors ──
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Validation failed. Check your input.',
  FILE_TOO_LARGE: `File size exceeds the ${UPLOAD.MAX_FILE_SIZE / (1024 * 1024)} MB limit.`,
  INVALID_FILE_TYPE: `Only ${UPLOAD.ALLOWED_EXTENSIONS.join(', ')} files are allowed.`,
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
});
