/**
 * @file Syllabus Model Schema
 * @description Defines the Mongoose database schema for academic syllabi.
 *              Keeps track of syllabus PDFs per subject, versioning history,
 *              and manages a strict "only one latest" constraint per subject.
 */

import mongoose from 'mongoose';

const syllabusSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g. "2025-26")'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'PDF file URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary file public ID is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
      index: true,
    },
    version: {
      type: String,
      required: [true, 'Syllabus version is required (e.g. "1.0")'],
      trim: true,
    },
    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ──────────────────────────────────────────────
// Indexes & Constraints
// ──────────────────────────────────────────────

// Compound filter index for syllabus queries
syllabusSchema.index({ subject: 1, isLatest: -1 });

// Database constraint: Only ONE syllabus per subject can be flagged as "isLatest: true"
// Preents data corruption (multiple active versions) using MongoDB Partial Indexes.
syllabusSchema.index(
  { subject: 1, isLatest: 1 },
  {
    unique: true,
    partialFilterExpression: { isLatest: true },
    name: 'unique_latest_syllabus_per_subject',
  }
);

const Syllabus = mongoose.model('Syllabus', syllabusSchema);

export default Syllabus;
