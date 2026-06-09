/**
 * @file Authentication & Authorization Middlewares
 * @description Provides token verification, role-based access control,
 *              and request payload validation helpers using Zod.
 */

import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH } from '../utils/constants.js';

// ──────────────────────────────────────────────
// 1. Authenticate JWT Middleware
// ──────────────────────────────────────────────

/**
 * Protects routes by verifying the JSON Web Token (JWT) sent in the Authorization header.
 * Attaches the fully loaded, active User document to `req.user`.
 *
 * Supports header format: `Authorization: Bearer <token>`
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Read Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith(`${AUTH.BEARER_PREFIX} `)) {
    // Extract token from "Bearer <token>"
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.[AUTH.REFRESH_TOKEN_COOKIE]) {
    // Optional fallback: read token from cookies if your architecture supports it
    // For this app, we strict-check Authorization headers for access tokens.
  }

  if (!token) {
    throw ApiError.unauthorized('Access denied. No token provided.');
  }

  try {
    // Verify access token
    const decoded = jwt.verify(token, config.jwt.access.secret);

    // Fetch the user from database
    const user = await User.findById(decoded._id);
    if (!user) {
      throw ApiError.unauthorized('The user belonging to this token no longer exists.');
    }

    // Attach user instance to request object
    req.user = user;
    next();
  } catch (error) {
    // Specific error mapping for user-friendly responses
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Your session has expired. Please log in again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid authentication token. Please log in again.');
    }
    throw error;
  }
});

// ──────────────────────────────────────────────
// 2. Role-Based Authorization Middleware
// ──────────────────────────────────────────────

/**
 * Restricts access to specific user roles.
 * Must be mounted AFTER `authenticate` middleware in the routing chain.
 *
 * @param {...string} roles - The allowed user roles (e.g. 'admin', 'student')
 * @returns {Function}       - Express middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Ensure user is authenticated first
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required to verify permissions.'));
    }

    // 2. Check if the user's role is in the list of allowed roles
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to perform this action.')
      );
    }

    next();
  };
};

// ──────────────────────────────────────────────
// 3. Request Body Zod Validator Middleware
// ──────────────────────────────────────────────

/**
 * Validates request payload against a Zod schema before executing route controllers.
 * Sends a structured 422 Unprocessable Entity response containing all validation faults on failure.
 *
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function}         - Express middleware
 */
export const validate = (schema) => {
  return asyncHandler(async (req, res, next) => {
    const parseResult = await schema.safeParseAsync(req.body);

    if (!parseResult.success) {
      // Structure all Zod errors to return field name and failure message
      const errors = parseResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw ApiError.unprocessable('Validation failed. Please correct your inputs.', errors);
    }

    // Reassign parsed and cleaned data (strips out unmapped fields)
    req.body = parseResult.data;
    next();
  });
};
