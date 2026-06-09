/**
 * @file Authentication Controller
 * @description Processes incoming HTTP requests for authentication, triggers
 *              the core authentication service layer, manages secure refresh token
 *              cookies, and returns structured API responses.
 */

import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/user.model.js';
import authService from '../services/auth.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH, MESSAGES } from '../utils/constants.js';

// ──────────────────────────────────────────────
// Helper Configuration
// ──────────────────────────────────────────────

/**
 * Shared production-grade options for refresh token cookies.
 * Configured to mitigate cross-site scripting (XSS) and cross-site request forgery (CSRF).
 */
const cookieOptions = {
  httpOnly: true, // Prevents Javascript access (blocks XSS token stealing)
  secure: config.server.isProd, // Transmits over HTTPS only in production
  sameSite: config.server.isProd ? 'none' : 'lax', // Protects against CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matching JWT refresh lifespan)
};

// ──────────────────────────────────────────────
// Controller Endpoints
// ──────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registers a new student or user.
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Delegate database logic entirely to the service
  const { user } = await authService.registerUser({ name, email, password });

  return res
    .status(201)
    .json(new ApiResponse(201, { user }, MESSAGES.REGISTER_SUCCESS));
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticates credentials, sets refresh cookie, and returns access token.
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Delegate login verification to the service
  const { user, accessToken, refreshToken } = await authService.loginUser({
    email,
    password,
  });

  // Set the refresh token inside a secure, HTTP-only cookie
  res.cookie(AUTH.REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken }, MESSAGES.LOGIN_SUCCESS));
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clears active sessions, revokes the refresh token, and flushes the cookie.
 * @access  Private (Authenticated)
 */
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Revoke refresh token in the database
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 }, // Completely removes the field
  });

  // Clear HTTP-only cookie from browser storage
  res.clearCookie(AUTH.REFRESH_TOKEN_COOKIE, {
    ...cookieOptions,
    maxAge: 0, // Instantly expires the cookie
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, MESSAGES.LOGOUT_SUCCESS));
});

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Validates the refresh token and issues a new access/refresh token pair.
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  // Read refresh token from cookie or request body
  const incomingRefreshToken =
    req.cookies?.[AUTH.REFRESH_TOKEN_COOKIE] || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token is missing.');
  }

  try {
    // 1. Verify the signature of the incoming refresh token
    const decoded = jwt.verify(incomingRefreshToken, config.jwt.refresh.secret);

    // 2. Retrieve the user from database, including the hidden refreshToken field
    const user = await User.findById(decoded._id).select('+refreshToken');
    if (!user) {
      throw ApiError.unauthorized('Invalid refresh token.');
    }

    // 3. Confirm that the token matches the current one saved in the database
    // (prevents session hijacking or reused revoked tokens)
    if (user.refreshToken !== incomingRefreshToken) {
      throw ApiError.unauthorized('Refresh token is invalid or has expired.');
    }

    // 4. Generate new token pair
    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // 5. Rotate refresh token in database (Standard refresh token rotation security)
    user.refreshToken = newRefreshToken;
    await user.save();

    // 6. Set new refresh token inside secure cookie
    res.cookie(AUTH.REFRESH_TOKEN_COOKIE, newRefreshToken, cookieOptions);

    // Prepare clean user info
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.refreshToken;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: sanitizedUser, accessToken },
          MESSAGES.TOKEN_REFRESHED
        )
      );
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Refresh token is invalid or has expired.');
    }
    throw error;
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Retrieves the currently logged-in user profile.
 * @access  Private (Authenticated)
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user has already been verified and populated by authenticate middleware
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, 'Current user profile fetched.'));
});
