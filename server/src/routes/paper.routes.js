/**
 * @file Question Paper Routes
 * @description Registers API route endpoints for question paper CRUD actions,
 *              applying authentication, authorization, file parsing, and schema validation.
 *
 * Prefix: /api/v1/papers
 */

import { Router } from 'express';
import {
  uploadPaper,
  getAllPapers,
  getPaperById,
  updatePaper,
  deletePaper,
} from '../controllers/paper.controller.js';
import { authenticate, authorize, validate } from '../middlewares/auth.middleware.js';
import { uploadSinglePaper } from '../middlewares/upload.middleware.js';
import { uploadPaperSchema, updatePaperSchema } from '../validators/paper.validator.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

// ──────────────────────────────────────────────
// Helper Request Body Coercions
// ──────────────────────────────────────────────

/**
 * Parses multi-part form parameters (which are parsed by Multer as strings)
 * into their appropriate data types before Zod validation runs.
 */
const coerceMultipartBody = (req, res, next) => {
  if (req.body.semester !== undefined && req.body.semester !== '') {
    req.body.semester = Number(req.body.semester);
  }
  if (req.body.year !== undefined && req.body.year !== '') {
    req.body.year = Number(req.body.year);
  }
  next();
};

// ──────────────────────────────────────────────
// Public Endpoints
// ──────────────────────────────────────────────

/**
 * @route   GET /api/v1/papers
 * @access  Public
 */
router.get('/', getAllPapers);

/**
 * @route   GET /api/v1/papers/:id
 * @access  Public
 */
router.get('/:id', getPaperById);

// ──────────────────────────────────────────────
// Admin Restricted Endpoints
// ──────────────────────────────────────────────

/**
 * @route   POST /api/v1/papers
 * @desc    Uploads a paper PDF, parses number strings, validates input, saves info.
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  uploadSinglePaper, // Parses form-data and handles file saving
  coerceMultipartBody, // Converts semester and year to numeric formats
  validate(uploadPaperSchema), // Enforces strict metadata requirements
  uploadPaper
);

/**
 * @route   PATCH /api/v1/papers/:id
 * @desc    Updates paper details.
 * @access  Private (Admin only)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  coerceMultipartBody,
  validate(updatePaperSchema),
  updatePaper
);

/**
 * @route   DELETE /api/v1/papers/:id
 * @desc    Removes a paper document and its physical PDF storage.
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deletePaper);

export default router;
