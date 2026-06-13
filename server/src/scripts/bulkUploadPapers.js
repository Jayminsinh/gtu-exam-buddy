/**
 * @file Bulk GTU Past Exam Papers Seeder CLI
 * @description Scans the `server/bulk_papers/` directory, extracts metadata from filenames,
 *              uploads PDF documents to Supabase storage, and inserts paper records in MongoDB.
 *
 * Usage:
 *   node src/scripts/bulkUploadPapers.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import dns from 'dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

// ─── Resolve ES Module Directory Paths ────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load Environment Variables ────────────────────────────────
dotenv.config();

import config from '../config/index.js';
import Paper from '../models/paper.model.js';
import Subject from '../models/subject.model.js';
import Branch from '../models/branch.model.js';
import Semester from '../models/semester.model.js';
import User from '../models/user.model.js';

// Initialize Supabase Storage Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const BUCKET_NAME = 'papers';

/**
 * Scrubs filenames of invalid characters for Supabase Storage keys (e.g. spaces, brackets).
 * Replaces them with underscores to keep keys safe and alphanumeric.
 */
const makeStorageKeySafe = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_');
};

// ──────────────────────────────────────────────
// Main Bulk Loader Execution
// ──────────────────────────────────────────────

const runBulkSeeder = async () => {
  console.log('\n🚀 Starting Bulk GTU Exam Papers Seeding Pipeline...');
  console.log('──────────────────────────────────────────────────');

  // 1. Establish MongoDB Connection
  try {
    await mongoose.connect(config.database.uri);
    console.log('🔌 Connected to MongoDB.');
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Fetch or Create Admin User Reference
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.findOne({});
  }
  if (!adminUser) {
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@gtu-exam-buddy.com',
      password: 'securepassword123',
      role: 'admin',
    });
    console.log('👤 Created default system admin user.');
  }
  console.log(`👤 Uploader user resolved: ${adminUser.name} (${adminUser.email})`);

  // 3. Resolve Workspace bulk_papers/ Directory
  const bulkPapersDir = path.resolve(__dirname, '../../bulk_papers');
  console.log(`📁 Target ingestion folder: ${bulkPapersDir}`);

  if (!fs.existsSync(bulkPapersDir)) {
    console.error(`❌ Ingestion directory not found at: ${bulkPapersDir}`);
    await mongoose.connection.close();
    process.exit(1);
  }

  // Read folder contents
  const files = fs.readdirSync(bulkPapersDir);
  const pdfFiles = files.filter((f) => path.extname(f).toLowerCase() === '.pdf');

  console.log(`📊 Found ${pdfFiles.length} PDF file(s) in bulk_papers/ directory.`);
  console.log('──────────────────────────────────────────────────');

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  // Query database for a fallback branch if subject is not found
  const defaultBranchDoc = await Branch.findOne({});
  const defaultBranchCode = defaultBranchDoc ? defaultBranchDoc.code : '07';

  // 4. Ingestion Loop
  for (const file of pdfFiles) {
    try {
      // Filename tokenizer regex: Matches "Subject - S2024 [3110014] [GTU Ranker].pdf"
      const match = file.match(/^(.+?)\s*-\s*([WSws])(\d{4})\s*\[(\d+)\]/i);
      if (!match) {
        console.warn(`⚠️ Warning: Filename "${file}" does not match the standard naming pattern. Skipping.`);
        skipCount++;
        continue;
      }

      const subjectName = match[1].trim();
      const seasonChar = match[2].toLowerCase();
      const year = parseInt(match[3], 10);
      const subjectCode = match[4].trim();

      // Resolve Exam Type Enum
      let examType = 'summer';
      if (seasonChar === 'w') examType = 'winter';
      if (seasonChar === 's') examType = 'summer';
      if (seasonChar === 'r') examType = 'remedial';

      // Check for duplicate paper records in database
      const existingPaper = await Paper.findOne({
        subject: { $regex: subjectCode, $options: 'i' },
        year: year,
        examType: examType,
      });

      if (existingPaper) {
        console.log(`ℹ️ Paper already initialized, skipping: "${file}"`);
        skipCount++;
        continue;
      }

      // Query database to resolve Branch & Semester attributes from Subject
      let semesterNumber = 1;
      let branchCode = defaultBranchCode;
      let subjectTitle = `${subjectName} [${subjectCode}]`;

      const subjectDoc = await Subject.findOne({ code: subjectCode })
        .populate('branch')
        .populate('semester');

      if (subjectDoc) {
        semesterNumber = subjectDoc.semester ? subjectDoc.semester.number : 1;
        branchCode = subjectDoc.branch ? subjectDoc.branch.code : defaultBranchCode;
        subjectTitle = `${subjectDoc.name} [${subjectCode}]`;
      } else {
        console.warn(
          `⚠️ Warning: Subject code "${subjectCode}" not found in database. Using fallbacks: Branch: ${branchCode}, Semester: ${semesterNumber}`
        );
      }

      // Read file buffer
      const filePath = path.join(bulkPapersDir, file);
      const fileBuffer = fs.readFileSync(filePath);

      // 5. Upload to Supabase Storage Bucket
      const storagePath = `${Date.now()}-${makeStorageKeySafe(file)}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error(`❌ Supabase upload failed for "${file}": ${uploadError.message}`);
        errorCount++;
        continue;
      }

      // Retrieve public access URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path);

      const fileUrl = urlData.publicUrl;

      // 6. Write record to MongoDB Paper collection
      await Paper.create({
        title: `${subjectName} - ${seasonChar.toUpperCase()}${year}`,
        subject: subjectTitle,
        semester: semesterNumber,
        branch: branchCode,
        year: year,
        examType: examType,
        fileUrl: fileUrl,
        publicId: uploadData.path,
        uploadedBy: adminUser._id,
      });

      console.log(`✅ Ingested successfully: "${file}"`);
      successCount++;
    } catch (itemError) {
      console.error(`❌ Error processing "${file}": ${itemError.message}`);
      errorCount++;
    }
  }

  // 7. Process Summary Output
  console.log('──────────────────────────────────────────────────');
  console.log('🏆 Ingestion completed.');
  console.log(`   Processed  : ${successCount} files`);
  console.log(`   Skipped    : ${skipCount} files`);
  console.log(`   Failed     : ${errorCount} files`);
  console.log('──────────────────────────────────────────────────');

  await mongoose.connection.close();
  console.log('🔌 Database connection closed.\n');
  process.exit(0);
};

runBulkSeeder().catch(async (err) => {
  console.error(`\n❌ Pipeline crashed unexpectedly: ${err.message}`);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
