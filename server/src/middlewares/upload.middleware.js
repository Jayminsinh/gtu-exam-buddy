// /**
//  * @file File Upload Middleware
//  * @description Configures Multer to store uploaded question papers temporarily
//  *              in a local 'uploads/' directory, filters for PDF files only, enforces
//  *              size limits from constants, and wraps errors inside ApiError.
//  */

// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import ApiError from '../utils/ApiError.js';
// import { UPLOAD } from '../utils/constants.js';

// // Ensure the local upload folder exists
// const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : './uploads';

// try {
//   if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
//   }
// } catch (err) {
//   console.warn("⚠️ Vercel read-only environment, skipping local folder creation:", err.message);
// }

// // ──────────────────────────────────────────────
// // Multer Disk Storage Configuration
// // ──────────────────────────────────────────────

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     // Generate a unique filename prefix to prevent name collisions
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     // Extract file extension cleanly
//     const fileExt = path.extname(file.originalname);
//     // Sanitize the original name: keep only letters/numbers, replace spaces with underscores
//     const baseName = path.basename(file.originalname, fileExt)
//       .replace(/[^a-zA-Z0-9]/g, '_')
//       .toLowerCase();

//     cb(null, `${baseName}-${uniqueSuffix}${fileExt}`);
//   },
// });

// // ──────────────────────────────────────────────
// // File Type Filter (PDF Only)
// // ──────────────────────────────────────────────

// const fileFilter = (req, file, cb) => {
//   // Confirm MIME type is PDF
//   if (file.mimetype !== 'application/pdf') {
//     return cb(
//       ApiError.unprocessable('Invalid file format. Only PDF files are allowed.'),
//       false
//     );
//   }
//   cb(null, true);
// };

// // ──────────────────────────────────────────────
// // Initialize Multer
// // ──────────────────────────────────────────────

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: UPLOAD.MAX_FILE_SIZE, // Max size limit (e.g. 10 MB)
//   },
// });

// // ──────────────────────────────────────────────
// // Express Middleware Wrapper
// // ──────────────────────────────────────────────

// /**
//  * Middleware to process a single file upload under the form-data key "file".
//  * Intercepts Multer limits/errors and forwards them as standardized ApiErrors.
//  */
// export const uploadSinglePaper = (req, res, next) => {
//   // We use the field name "file" for uploads
//   upload.single('file')(req, res, (err) => {
//     if (err instanceof multer.MulterError) {
//       if (err.code === 'LIMIT_FILE_SIZE') {
//         const maxSizeMB = UPLOAD.MAX_FILE_SIZE / (1024 * 1024);
//         return next(
//           ApiError.unprocessable(
//             `File size exceeds the limit. Maximum allowed size is ${maxSizeMB} MB.`
//           )
//         );
//       }
//       return next(ApiError.badRequest(err.message));
//     } else if (err) {
//       // Passes custom ApiErrors from fileFilter or general system errors to the error middleware
//       return next(err);
//     }

//     // Ensure a file was actually uploaded
//     if (!req.file) {
//       return next(ApiError.badRequest('No file uploaded. Please select a PDF file.'));
//     }

//     next();
//   });
// };



/**
 * server/src/middlewares/upload.middleware.js
 *
 * CHANGE SUMMARY
 * ──────────────
 * 1. UPLOAD_DIR now points to /tmp/uploads instead of ./uploads.
 *    Vercel's serverless filesystem is read-only except for /tmp (512 MB).
 *    fs.mkdirSync with { recursive: true } is safe on both Vercel and local.
 *
 * 2. Added cleanUpload() helper — call it after AI processing completes so
 *    temp files don't accumulate across warm Lambda invocations.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ─── Storage root ─────────────────────────────────────────────────────────────
//  /tmp  → Vercel Lambda writable space (ephemeral per cold start)
//  Falls back to a local ./tmp/uploads for dev parity
const UPLOAD_DIR = process.env.VERCEL
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), 'tmp', 'uploads');

// Create synchronously at module load — safe and idempotent
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── Multer disk storage ───────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// ─── MIME / size guard ────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB — matches client-side guard
  },
});

// ─── Cleanup helper ───────────────────────────────────────────────────────────
/**
 * Safely delete a temp upload after it has been processed.
 * Call this in your AI controller's finally block.
 *
 * @param {string | undefined} filePath  Absolute path returned by multer (req.file.path)
 */
export const cleanUpload = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    // Non-fatal: log and continue — don't let cleanup failure break the response
    console.warn('[upload] Failed to clean temp file:', err.message);
  }
};

export { UPLOAD_DIR };