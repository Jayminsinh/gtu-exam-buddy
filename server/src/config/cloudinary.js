/**
 * @file Cloudinary Configuration
 * @description Configures the Cloudinary SDK with credentials from environment
 *              variables and exports the ready-to-use instance.
 *
 *              This file handles CONFIGURATION ONLY — no upload helpers,
 *              no delete functions, no transformation logic. Those belong in
 *              a dedicated service (e.g. services/cloudinaryService.js).
 *
 * Usage:
 *   import cloudinary from './config/cloudinary.js';
 *
 *   // Then use anywhere:
 *   const result = await cloudinary.uploader.upload(filePath, options);
 *
 * Prerequisites:
 *   1. npm install cloudinary
 *   2. Add the following to your .env:
 *        CLOUDINARY_CLOUD_NAME=your_cloud_name
 *        CLOUDINARY_API_KEY=your_api_key
 *        CLOUDINARY_API_SECRET=your_api_secret
 *
 * NOTE: These values are read directly from process.env because
 *       config/index.js doesn't include a cloudinary group yet.
 *       When config/index.js is updated in a future phase, switch
 *       the imports below to: import config from './index.js';
 */

import { v2 as cloudinary } from 'cloudinary';

// ──────────────────────────────────────────────
// Configure the SDK
// ──────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,

  // Use HTTPS for all generated URLs (recommended for production)
  secure: true,
});

// ──────────────────────────────────────────────
// Validate credentials (non-blocking warning)
// ──────────────────────────────────────────────
// Cloudinary is a later-phase feature, so missing credentials should
// warn — not crash — the server. This lets you develop auth, routes,
// etc. without needing Cloudinary keys right away.

const { cloud_name, api_key, api_secret } = cloudinary.config();

if (!cloud_name || !api_key || !api_secret) {
  console.warn(
    '\n⚠️  Cloudinary credentials are not configured.' +
      '\n   File uploads will not work until you add these to your .env:' +
      '\n     CLOUDINARY_CLOUD_NAME' +
      '\n     CLOUDINARY_API_KEY' +
      '\n     CLOUDINARY_API_SECRET\n'
  );
}

export default cloudinary;
