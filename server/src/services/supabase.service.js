/**
 * @file Supabase Storage Service
 * @description Integrates with the Supabase Storage SDK to handle secure PDF
 *              uploads and deletions in the public 'papers' bucket. Provides
 *              automated local file cleanup for both successful uploads and
 *              failures to prevent server storage leaks.
 *
 *              This is a drop-in replacement for cloudinary.service.js, returning
 *              the same { secure_url, public_id } shape so that consumer services
 *              (paper.service.js, syllabus.service.js) require zero changes.
 *
 * Usage:
 *   import supabaseService from '../services/supabase.service.js';
 *
 *   const { secure_url, public_id } = await supabaseService.uploadPDF(req.file.path);
 *   await supabaseService.deletePDF(storagePath);
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import ApiError from '../utils/ApiError.js';

// ──────────────────────────────────────────────
// Initialize Supabase Client
// ──────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const BUCKET_NAME = 'papers';

// ──────────────────────────────────────────────
// Validate credentials (non-blocking warning)
// ──────────────────────────────────────────────

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn(
    '\n⚠️  Supabase credentials are not configured.' +
      '\n   File uploads will not work until you add these to your .env:' +
      '\n     SUPABASE_URL' +
      '\n     SUPABASE_ANON_KEY\n'
  );
}

/**
 * Uploads a local file (specifically PDFs) to the Supabase Storage bucket.
 *
 * @param {string} localFilePath - Path to the temporarily saved file on disk
 * @returns {Promise<Object>}    - Contains secure_url and public_id matching
 *                                  the Cloudinary payload shape for seamless migration
 * @throws {ApiError}            - 500 Internal Error if upload fails
 */
const uploadPDF = async (localFilePath) => {
  try {
    // 1. Verify that the file actually exists locally
    if (!fs.existsSync(localFilePath)) {
      throw ApiError.internal('File not found on local server during upload phase.');
    }

    // 2. Read the file into a buffer for upload
    const fileBuffer = fs.readFileSync(localFilePath);

    // 3. Generate a unique storage key to prevent filename collisions
    const fileName = `${Date.now()}-${path.basename(localFilePath)}`;

    // 4. Upload to the public Supabase Storage bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw ApiError.internal(`Supabase upload error: ${error.message}`);
    }

    // 5. Retrieve the permanent public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    // 6. Delete the local temporary file (fire-and-forget style logging on error)
    fs.promises.unlink(localFilePath).catch((err) => {
      console.error(`⚠️  Failed to delete temporary local file: ${localFilePath}`, err);
    });

    // 7. Return resource metadata matching the Cloudinary response shape
    //    so that paper.service.js & syllabus.service.js require no changes
    return {
      secure_url: publicUrlData.publicUrl,
      public_id: data.path,
    };
  } catch (error) {
    // ──────────────────────────────────────────────
    // Error Handling & Local File Cleanup
    // ──────────────────────────────────────────────
    // If the Supabase upload fails, we must still clean up the temporary
    // file from local storage to prevent running out of server disk space.
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (cleanupError) {
        console.error(`⚠️  Failed to clean up file after upload error: ${localFilePath}`, cleanupError);
      }
    }

    // Re-throw ApiError instances as-is; wrap anything else
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal(`Supabase upload failed: ${error.message}`);
  }
};

/**
 * Deletes a PDF file from the Supabase Storage bucket.
 *
 * @param {string} storagePath - The storage path (public_id) of the file in the bucket
 * @returns {Promise<Object>}  - The API deletion result
 * @throws {ApiError}          - 500 Internal Error if deletion fails
 */
const deletePDF = async (storagePath) => {
  if (!storagePath) {
    throw ApiError.badRequest('Storage path (public_id) is required to delete resource from Supabase.');
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      throw ApiError.internal(`Supabase asset deletion failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal(`Supabase asset deletion failed: ${error.message}`);
  }
};

const supabaseService = {
  uploadPDF,
  deletePDF,
};

export default supabaseService;
