// Multer upload middleware — writes to /tmp on Vercel, local ./tmp/uploads otherwise

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError.js';
import { UPLOAD } from '../utils/constants.js';

// Writable directory: /tmp on Vercel serverless, ./tmp/uploads locally
const UPLOAD_DIR = process.env.VERCEL
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), 'tmp', 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExt)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    cb(null, `${baseName}-${uniqueSuffix}${fileExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(
      ApiError.unprocessable('Invalid file format. Only PDF files are allowed.'),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD.MAX_FILE_SIZE,
  },
});

// Express middleware — single file under the "file" form-data key
export const uploadSinglePaper = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxSizeMB = UPLOAD.MAX_FILE_SIZE / (1024 * 1024);
        return next(
          ApiError.unprocessable(
            `File size exceeds the limit. Maximum allowed size is ${maxSizeMB} MB.`
          )
        );
      }
      return next(ApiError.badRequest(err.message));
    } else if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(ApiError.badRequest('No file uploaded. Please select a PDF file.'));
    }

    next();
  });
};

// Safely delete a temp upload — call in a finally block after processing
export const cleanUpload = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.warn('[upload] Failed to clean temp file:', err.message);
  }
};

export { UPLOAD_DIR };