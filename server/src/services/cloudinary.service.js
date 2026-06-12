/**
 * @file Cloudinary Storage Service
 * @description Integrates with the Cloudinary SDK to handle secure PDF uploads
 *              and deletions. Handles automated local file cleanup for both
 *              successful uploads and failures to prevent server storage leaks.
 *
 * Usage:
 *   import cloudinaryService from '../services/cloudinary.service.js';
 *
 *   const { secure_url, public_id } = await cloudinaryService.uploadPDF(req.file.path);
 *   await cloudinaryService.deletePDF(publicId);
 */

import fs from 'fs';
import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

/**
 * Uploads a local file (specifically PDFs) to Cloudinary.
 *
 * @param {string} localFilePath - Path to the temporarily saved file on disk
 * @returns {Promise<Object>}    - Contains secure_url and public_id from Cloudinary
 * @throws {ApiError}            - 500 Internal Error if upload fails
 */
const uploadPDF = async (localFilePath) => {
  try {
    // 1. Verify that the file actually exists locally
    if (!fs.existsSync(localFilePath)) {
      throw ApiError.internal('File not found on local server during upload phase.');
    }

    // 2. Upload to Cloudinary using Unsigned Upload with the preset token
    const uploadResult = await cloudinary.uploader.unsigned_upload(
      localFilePath,
      process.env.CLOUDINARY_UPLOAD_PRESET,
      {
        resource_type: 'auto',
      }
    );

    // 3. Delete the local temporary file asynchronously (fire-and-forget style logging on error)
    fs.promises.unlink(localFilePath).catch((err) => {
      console.error(`⚠️  Failed to delete temporary local file: ${localFilePath}`, err);
    });

    // 4. Return resource metadata
    return {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
  } catch (error) {
    // ──────────────────────────────────────────────
    // Error Handling & Local File Cleanup
    // ──────────────────────────────────────────────
    // If the Cloudinary upload fails, we must still clean up the temporary
    // file from local storage to prevent running out of server disk space.
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (cleanupError) {
        console.error(`⚠️  Failed to clean up file after upload error: ${localFilePath}`, cleanupError);
      }
    }

    throw ApiError.internal(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Deletes a PDF file from Cloudinary storage.
 *
 * @param {string} publicId - The public ID of the asset on Cloudinary
 * @returns {Promise<Object>} - The API deletion result
 * @throws {ApiError}         - 500 Internal Error if deletion fails
 */
const deletePDF = async (publicId) => {
  if (!publicId) {
    throw ApiError.badRequest('Public ID is required to delete resource from Cloudinary.');
  }

  try {
    // Note: If resource_type is not specified, Cloudinary defaults to 'image'.
    // Since PDFs are uploaded as 'raw', we must specify resource_type: 'raw' to delete them.
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });

    if (result.result !== 'ok') {
      // Sometimes Cloudinary returns success with status "not found". We check for this.
      console.warn(`⚠️  Cloudinary deletion return state: ${result.result} for ID: ${publicId}`);
    }

    return result;
  } catch (error) {
    throw ApiError.internal(`Cloudinary asset deletion failed: ${error.message}`);
  }
};

const cloudinaryService = {
  uploadPDF,
  deletePDF,
};

export default cloudinaryService;
