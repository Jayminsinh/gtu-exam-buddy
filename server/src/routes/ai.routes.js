// AI pipeline routes — /api/v1/ai

import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middlewares/auth.middleware.js';
import { generateBlueprintPdf } from '../controllers/ai.controller.js';
import ApiError from '../utils/ApiError.js';

const router = Router();

// Writable temp directory — /tmp on Vercel, ./tmp/uploads locally
const AI_UPLOAD_DIR = process.env.VERCEL
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), 'tmp', 'uploads');

fs.mkdirSync(AI_UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: AI_UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(ApiError.unprocessable('Invalid file format. Only PDF syllabus documents are allowed.'), false);
    }
    cb(null, true);
  }
});

// POST /api/v1/ai/generate-blueprint-pdf
router.post(
  '/generate-blueprint-pdf',
  authenticate,
  upload.single('syllabus'),
  generateBlueprintPdf
);

export default router;
