/**
 * @file Subject Model Schema
 * @description Defines the Mongoose database schema for academic subjects
 *              (e.g., Database Management Systems, Operating Systems).
 *              Each subject belongs to both a specific Branch and Semester.
 */

import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      index: true, // Speeds up text searching/filtering by name
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true, // GTU subject codes are unique identifiers
      trim: true,
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
      index: true, // Speeds up search queries for subjects in a branch
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester reference is required'],
      index: true, // Speeds up queries filtering by semester
    },
    credits: {
      type: Number,
      required: [true, 'Subject credit rating is required'],
      min: [1, 'Credits must be at least 1'],
      max: [10, 'Credits cannot exceed 10'],
    },
    isActive: {
      type: Boolean,
      default: true, // Soft delete/deactivate support
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Ensure virtuals are included when converting to JSON
    toObject: { virtuals: true },
  }
);

// ──────────────────────────────────────────────
// Indexes & Constraints
// ──────────────────────────────────────────────

// Compound index to speed up filtering subjects within a specific branch and semester
subjectSchema.index({ branch: 1, semester: 1 });

// Text Index for full-text searches against name and code
subjectSchema.index(
  { name: 'text', code: 'text' },
  { weights: { name: 10, code: 5 }, name: 'subject_text_search_index' }
);

// ──────────────────────────────────────────────
// Virtual Populates
// ──────────────────────────────────────────────

/**
 * Reusable Mongoose Virtual Populate to count question papers associated with this subject.
 *
 * Depending on database schema integration:
 * - If the Paper model stores subject references as String (subject code/name), localField is 'code'
 * - If the Paper model stores subject references as ObjectId, localField is '_id'
 *
 * We support '_id' for structured relational references.
 */
subjectSchema.virtual('paperCount', {
  ref: 'Paper',
  localField: '_id',
  foreignField: 'subject',
  count: true, // Returns only the count integer instead of the array of papers
});

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
