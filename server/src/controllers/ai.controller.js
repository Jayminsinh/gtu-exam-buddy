// AI endpoint controllers — blueprint generation and PDF streaming

import fs from 'fs';
import PDFDocument from 'pdfkit';
import { generateBlueprintData, compileBlueprintPdf } from '../services/ai.service.js';
import { cleanUpload } from '../middlewares/upload.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// POST /api/v1/ai/generate-blueprint-pdf
export const generateBlueprintPdf = asyncHandler(async (req, res, next) => {
  const { subjectCode, subjectName, branch, semester } = req.body;
  const uploadedPath = req.file?.path;

  if (!req.file) {
    throw ApiError.badRequest('Syllabus PDF document is required.');
  }

  if (!subjectCode || !subjectName) {
    cleanUpload(uploadedPath);
    throw ApiError.badRequest('Subject code and subject name are required parameters.');
  }

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
    cleanUpload(uploadedPath);
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
