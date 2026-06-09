/**
 * @file Semester Routing Interface
 * @description Registers API endpoint paths for managing academic semesters,
 *              connecting security permissions and Zod request body validation filters.
 *
 * Prefix: /api/v1/semesters
 */

import { Router } from 'express';
import {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
} from '../controllers/semester.controller.js';
import { authenticate, authorize, validate } from '../middlewares/auth.middleware.js';
import { createSemesterSchema, updateSemesterSchema } from '../validators/semester.validator.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

// ──────────────────────────────────────────────
// Public Endpoints
// ──────────────────────────────────────────────

/**
 * @route   GET /api/v1/semesters
 * @access  Public
 */
router.get('/', getAllSemesters);

/**
 * @route   GET /api/v1/semesters/:id
 * @access  Public
 */
router.get('/:id', getSemesterById);

// ──────────────────────────────────────────────
// Admin Restricted Endpoints
// ──────────────────────────────────────────────

/**
 * @route   POST /api/v1/semesters
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(createSemesterSchema),
  createSemester
);

/**
 * @route   PATCH /api/v1/semesters/:id
 * @access  Private (Admin only)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(updateSemesterSchema),
  updateSemester
);

/**
 * @route   DELETE /api/v1/semesters/:id
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteSemester);

export default router;
