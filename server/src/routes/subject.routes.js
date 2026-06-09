/**
 * @file Subject Routing Interface
 * @description Registers API endpoint paths for managing academic subjects,
 *              connecting security permissions and Zod request body validation filters.
 *
 * Prefix: /api/v1/subjects
 */

import { Router } from 'express';
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from '../controllers/subject.controller.js';
import { authenticate, authorize, validate } from '../middlewares/auth.middleware.js';
import { createSubjectSchema, updateSubjectSchema } from '../validators/subject.validator.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

// ──────────────────────────────────────────────
// Public Endpoints
// ──────────────────────────────────────────────

/**
 * @route   GET /api/v1/subjects
 * @access  Public
 */
router.get('/', getAllSubjects);

/**
 * @route   GET /api/v1/subjects/:id
 * @access  Public
 */
router.get('/:id', getSubjectById);

// ──────────────────────────────────────────────
// Admin Restricted Endpoints
// ──────────────────────────────────────────────

/**
 * @route   POST /api/v1/subjects
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(createSubjectSchema),
  createSubject
);

/**
 * @route   PATCH /api/v1/subjects/:id
 * @access  Private (Admin only)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(updateSubjectSchema),
  updateSubject
);

/**
 * @route   DELETE /api/v1/subjects/:id
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteSubject);

export default router;
