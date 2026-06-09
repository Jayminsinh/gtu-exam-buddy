/**
 * @file Syllabus Routes Interface
 * @description Registers API endpoint paths for managing syllabi, connecting security,
 *              multipart file parsers, and validation schemas.
 *
 * Prefix: /api/v1/syllabus
 */

import { Router } from 'express';
import {
  uploadSyllabus,
  getAllSyllabus,
  getSyllabusById,
  getLatestSyllabusBySubject,
  updateSyllabus,
  deleteSyllabus,
} from '../controllers/syllabus.controller.js';
import { authenticate, authorize, validate } from '../middlewares/auth.middleware.js';
import { uploadSinglePaper } from '../middlewares/upload.middleware.js';
import { uploadSyllabusSchema, updateSyllabusSchema } from '../validators/syllabus.validator.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

// ──────────────────────────────────────────────
// Public Endpoints
// ──────────────────────────────────────────────

/**
 * @route   GET /api/v1/syllabus
 * @access  Public
 */
router.get('/', getAllSyllabus);

/**
 * @route   GET /api/v1/syllabus/latest/:subjectId
 * @access  Public
 */
router.get('/latest/:subjectId', getLatestSyllabusBySubject);

/**
 * @route   GET /api/v1/syllabus/:id
 * @access  Public
 */
router.get('/:id', getSyllabusById);

// ──────────────────────────────────────────────
// Admin Restricted Endpoints
// ──────────────────────────────────────────────

/**
 * @route   POST /api/v1/syllabus
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  uploadSinglePaper, // Parses form-data and handles file saving
  validate(uploadSyllabusSchema), // Enforces strict metadata requirements
  uploadSyllabus
);

/**
 * @route   PATCH /api/v1/syllabus/:id
 * @access  Private (Admin only)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(updateSyllabusSchema),
  updateSyllabus
);

/**
 * @route   DELETE /api/v1/syllabus/:id
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteSyllabus);

export default router;
