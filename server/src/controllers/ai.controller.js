/**
 * @file AI Endpoint Controllers
 * @description Handles REST routes for AI features. Receives local student syllabus
 *              files, resolves course references, compiles question blueprints,
 *              and pipes PDF streams back as file downloads.
 *
 *              The AI service now throws explicit ApiError instances for all
 *              failure modes (empty inputs, missing papers, Gemini errors).
 *              This controller lets those propagate through asyncHandler to the
 *              global error handler while ensuring temp file cleanup always runs.
 */

import fs from 'fs';
import PDFDocument from 'pdfkit';
import { generateBlueprintData, compileBlueprintPdf } from '../services/ai.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/**
 * Helper: delete a temporary file if it exists (fire-and-forget logging).
 */
const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Failed to clean up temp syllabus file:', err.message);
    }
  }
};

/**
 * @route   POST /api/v1/ai/generate-blueprint-pdf
 * @desc    Analyzes custom student syllabus and outputs exam blueprint download stream.
 * @access  Private (Student/Admin authentication)
 */
export const generateBlueprintPdf = asyncHandler(async (req, res, next) => {
  const { subjectCode, subjectName, branch, semester } = req.body;

  if (!req.file) {
    throw ApiError.badRequest('Syllabus PDF document is required.');
  }

  if (!subjectCode || !subjectName) {
    cleanupTempFile(req.file.path);
    throw ApiError.badRequest('Subject code and subject name are required parameters.');
  }

  // Run the AI pipeline — service throws ApiError on any failure.
  // The finally block guarantees temp file cleanup regardless of outcome.
  let blueprintData;
  try {
    blueprintData = await generateBlueprintData(
      req.file.path,
      subjectCode,
      subjectName,
      branch,
      semester
    );
  } finally {
    cleanupTempFile(req.file.path);
  }

  // Compile and stream the PDF response
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=IMP_Blueprint_${subjectCode.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  );

  doc.pipe(res);

  compileBlueprintPdf(doc, blueprintData, {
    subjectCode,
    subjectName,
    branch,
    semester,
  });

  doc.end();
});

export default {
  generateBlueprintPdf,
};

