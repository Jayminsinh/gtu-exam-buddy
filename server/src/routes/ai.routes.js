/**
 * @file AI Pipeline Routing registry
 * @description Registers API endpoint paths for AI services, securing authorization
 *              and parsing custom multipart file payloads.
 *
 * Prefix: /api/v1/ai
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware.js';
import { generateBlueprintPdf } from '../controllers/ai.controller.js';
import ApiError from '../utils/ApiError.js';

const router = Router();

// Local temporary file upload handler
const upload = multer({
  dest: './uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // Enforce 10 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(ApiError.unprocessable('Invalid file format. Only PDF syllabus documents are allowed.'), false);
    }
    cb(null, true);
  }
});

/**
 * @route   POST /api/v1/ai/generate-blueprint-pdf
 * @access  Private
 */
router.post(
  '/generate-blueprint-pdf',
  authenticate,
  upload.single('syllabus'),
  generateBlueprintPdf
);

export default router;
