/**
 * @file Authentication Routes
 * @description Registers endpoint paths for authentication actions, attaching
 *              body validation schema rules and enforcing route protection levels.
 *
 * Prefix: /api/v1/auth
 */

import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import { authenticate, validate } from '../middlewares/auth.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

// ──────────────────────────────────────────────
// Public Routes
// ──────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registers a new student or admin.
 * @access  Public
 */
router.post('/register', validate(registerSchema), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticates credentials and returns token set.
 * @access  Public
 */
router.post('/login', validate(loginSchema), login);

// ──────────────────────────────────────────────
// Protected Routes (Authentication Required)
// ──────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Rotates active token credentials.
 * @access  Private (Authenticated)
 */
router.post('/refresh-token', authenticate, refreshAccessToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clears active user session.
 * @access  Private (Authenticated)
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Retrieves current user profile.
 * @access  Private (Authenticated)
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
