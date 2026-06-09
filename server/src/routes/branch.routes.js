/**
 * @file Branch Routing Interface
 * @description Registers API endpoint paths for managing academic branches (departments),
 *              connecting security permissions and Zod request body validation filters.
 *
 * Prefix: /api/v1/branches
 */

import { Router } from 'express';
import {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from '../controllers/branch.controller.js';
import { authenticate, authorize, validate } from '../middlewares/auth.middleware.js';
import { createBranchSchema, updateBranchSchema } from '../validators/branch.validator.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

// ──────────────────────────────────────────────
// Public Endpoints
// ──────────────────────────────────────────────

/**
 * @route   GET /api/v1/branches
 * @access  Public
 */
router.get('/', getAllBranches);

/**
 * @route   GET /api/v1/branches/:id
 * @access  Public
 */
router.get('/:id', getBranchById);

// ──────────────────────────────────────────────
// Admin Restricted Endpoints
// ──────────────────────────────────────────────

/**
 * @route   POST /api/v1/branches
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(createBranchSchema),
  createBranch
);

/**
 * @route   PATCH /api/v1/branches/:id
 * @access  Private (Admin only)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(updateBranchSchema),
  updateBranch
);

/**
 * @route   DELETE /api/v1/branches/:id
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteBranch);

export default router;
