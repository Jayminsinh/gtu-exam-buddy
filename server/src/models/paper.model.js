/**
 * @file Question Paper Model Schema
 * @description Defines the database schema for old exam question papers.
 *              Includes proper indexing for rapid search filters (by branch,
 *              semester, subject, year, and exam type) and links back to the uploader.
 */

import mongoose from 'mongoose';

// ──────────────────────────────────────────────
// Exam Types & Configurations
// ──────────────────────────────────────────────

export const EXAM_TYPES = Object.freeze({
  WINTER: 'winter',
  SUMMER: 'summer',
  REMEDIAL: 'remedial',
});

const EXAM_TYPES_LIST = Object.freeze(Object.values(EXAM_TYPES));

const paperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question paper title is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject name/code is required'],
      trim: true,
      index: true, // Facilitates searches by subject
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
      index: true, // Facilitates filtering by semester
    },
    branch: {
      type: String,
      required: [true, 'Branch (department) is required'],
      trim: true,
      index: true, // Facilitates filtering by branch (e.g., "Computer Engineering")
    },
    year: {
      type: Number,
      required: [true, 'Exam year is required'],
      min: [2000, 'Year must be valid'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
      index: true, // Facilitates filtering by exam year
    },
    examType: {
      type: String,
      required: [true, 'Exam type is required'],
      enum: {
        values: EXAM_TYPES_LIST,
        message: '{VALUE} is not a valid exam type (choose: summer, winter, remedial)',
      },
      index: true, // Facilitates filtering by exam type
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
      index: true, // Quickly trace papers uploaded by a specific user
    },
  },
  {
    timestamps: true, // Tracks when paper was uploaded or edited
  }
);

// ──────────────────────────────────────────────
// Indexes & Text Searching
// ──────────────────────────────────────────────

// Compound index to optimize the most common filter queries in the UI:
// e.g., Filter by branch, semester, and year
paperSchema.index({ branch: 1, semester: 1, year: -1 });

// Text Index for full-text search capability (e.g., searching search strings against title and subject)
paperSchema.index(
  { title: 'text', subject: 'text' },
  { weights: { title: 10, subject: 5 }, name: 'paper_text_search_index' }
);

const Paper = mongoose.model('Paper', paperSchema);

export default Paper;
export { EXAM_TYPES_LIST };
