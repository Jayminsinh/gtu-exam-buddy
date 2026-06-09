/**
 * @file Authentication Service
 * @description Houses all database-related and core business logic for user
 *              registration and login. Operates entirely independently of the
 *              Express routing/HTTP layer (no req/res).
 *
 * Usage:
 *   import authService from '../services/auth.service.js';
 *
 *   const result = await authService.registerUser({ name, email, password });
 *   const credentials = await authService.loginUser({ email, password });
 */

import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Registers a new user in the system.
 *
 * @param {Object} userData          - User details payload
 * @param {string} userData.name     - Full name of the user
 * @param {string} userData.email    - Unique email address
 * @param {string} userData.password - Plain text password
 * @returns {Promise<Object>}        - The newly created and sanitized user record
 * @throws {ApiError}                - 409 Conflict if email is already in use
 */
const registerUser = async ({ name, email, password }) => {
  // 1. Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('A user with this email address already exists.');
  }

  // 2. Create the user in the database
  // Note: Password hashing happens in the Mongoose pre-save hook.
  const newUser = await User.create({
    name,
    email,
    password,
  });

  // 3. Retrieve and sanitize the newly created user
  // This ensures password & sensitive details are not loaded in the returned object.
  const user = await User.findById(newUser._id);
  if (!user) {
    throw ApiError.internal('User registration succeeded but failed to retrieve record.');
  }

  return { user };
};

/**
 * Validates user credentials and generates access & refresh tokens.
 *
 * @param {Object} credentials          - Login credentials payload
 * @param {string} credentials.email    - Email address of the user
 * @param {string} credentials.password - Plain text password
 * @returns {Promise<Object>}           - Sanitized user object, access token, and refresh token
 * @throws {ApiError}                   - 401 Unauthorized for invalid email or password
 */
const loginUser = async ({ email, password }) => {
  // 1. Find user by email and explicitly retrieve password (since select: false is on password field)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    // Return a generic error to prevent email enumeration (security best practice)
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // 2. Verify candidate password against hashed password in database
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // 3. Generate credentials
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // 4. Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save();

  // 5. Sanitize user object (convert to raw JS object and remove sensitive fields)
  const sanitizedUser = user.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.refreshToken;

  return {
    user: sanitizedUser,
    accessToken,
    refreshToken,
  };
};

const authService = {
  registerUser,
  loginUser,
};

export default authService;
